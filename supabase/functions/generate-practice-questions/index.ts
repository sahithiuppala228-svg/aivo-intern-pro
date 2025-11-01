import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase credentials not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // First, check if we have questions in the database for this domain
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('practice_questions')
      .select('*')
      .eq('domain', domain)
      .limit(25);

    if (fetchError) {
      console.error('Error fetching existing questions:', fetchError);
    }

    // If we have enough questions, return them
    if (existingQuestions && existingQuestions.length >= 25) {
      console.log(`Returning ${existingQuestions.length} existing questions for ${domain}`);
      return new Response(JSON.stringify(existingQuestions.slice(0, 25)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If we don't have enough, generate new ones with OpenAI
    const needed = 500 - (existingQuestions?.length || 0);
    console.log(`Generating ${needed} new questions for ${domain}`);

    const prompt = `Generate ${Math.min(needed, 50)} multiple choice questions for ${domain}. 
Each question must have exactly 4 options (A, B, C, D) and include a detailed explanation.
Mix difficulty levels: Easy, Medium, and Hard.

Return ONLY a JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_answer": "A",
    "explanation": "Detailed explanation of why this is the correct answer",
    "difficulty": "Medium"
  }
]

Make sure:
- Questions are relevant to ${domain}
- Each question is unique and tests different concepts
- Explanations are clear and educational
- correct_answer is always one of: "A", "B", "C", or "D"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: 'You are an expert educational content creator. Return ONLY valid JSON arrays, no additional text.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Clean up markdown code fences
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const generatedQuestions = JSON.parse(content);

    if (!Array.isArray(generatedQuestions)) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Insert new questions into database
    const questionsToInsert = generatedQuestions.map((q: any) => ({
      domain,
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty || 'Medium',
    }));

    const { error: insertError } = await supabase
      .from('practice_questions')
      .insert(questionsToInsert);

    if (insertError) {
      console.error('Error inserting questions:', insertError);
    } else {
      console.log(`Successfully inserted ${questionsToInsert.length} questions`);
    }

    // Return the first 25 questions (existing + new)
    const allQuestions = [...(existingQuestions || []), ...questionsToInsert];
    return new Response(JSON.stringify(allQuestions.slice(0, 25)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-practice-questions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
