import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuthClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();

    // Validate inputs
    const { validateDomain, validateCount, validationError: valErr } = await import("../_shared/validation.ts");
    const domainCheck = validateDomain(body.domain);
    if (!domainCheck.valid) return valErr(domainCheck.error!, corsHeaders);
    const domain = domainCheck.value!;
    const total = validateCount(body.count, 25, 50);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if we have enough questions in the database for this domain
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('practice_questions')
      .select('*')
      .eq('domain', domain)
      .limit(total);

    if (!fetchError && existingQuestions && existingQuestions.length >= total) {
      // Return existing questions from database
      console.log(`Returning ${existingQuestions.length} existing questions for ${domain}`);
      const formattedQuestions = existingQuestions.map(q => ({
        id: q.id,
        question: q.question,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        correctAnswer: q.correct_answer,
        domain: q.domain,
        explanation: q.explanation,
        difficulty: q.difficulty
      }));
      return new Response(JSON.stringify(formattedQuestions), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate new questions using OpenAI
    console.log(`Generating ${total} new questions for ${domain} using OpenAI`);
    
    const batchSize = 10;
    const allQuestions: any[] = [];
    const seen = new Set<string>();

    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

    async function generateBatch(n: number) {
      const prompt = `Generate ${n} multiple-choice questions for ${domain}. 
Mix difficulty levels (Easy, Medium, Hard). Each question must have:
- A clear, specific question
- Exactly 4 distinct options
- One correct answer
- A detailed explanation

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": "unique-id",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "A",
      "domain": "${domain}",
      "difficulty": "Easy|Medium|Hard",
      "explanation": "Detailed explanation"
    }
  ]
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You generate educational MCQ questions. Return ONLY valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 2000
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", response.status, errorText);
        
        if (response.status === 429) {
          throw new Error("RATE_LIMITED");
        }
        throw new Error("Failed to generate questions");
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content ?? "";
      
      // Clean markdown formatting
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        console.error("JSON parse error:", e, "Content:", content);
        throw new Error("Invalid JSON response from AI");
      }

      const questionsChunk = Array.isArray(parsed) ? parsed : parsed?.questions;
      
      if (!questionsChunk || !Array.isArray(questionsChunk)) {
        throw new Error("Invalid questions payload");
      }

      // Process and store questions
      for (const q of questionsChunk) {
        const questionText = String(q.question ?? '').trim();
        if (!questionText || seen.has(questionText.toLowerCase())) continue;

        const options: string[] = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
        if (options.length !== 4) continue;

        // Normalize correct answer to letter A-D
        let correctAnswerText: string = String(q.correctAnswer ?? '').trim();
        let correctAnswer = correctAnswerText;
        
        // If correctAnswer is full text, find matching option
        if (!['A', 'B', 'C', 'D'].includes(correctAnswerText)) {
          const idx = options.findIndex(opt => String(opt).trim() === correctAnswerText);
          correctAnswer = ['A', 'B', 'C', 'D'][Math.max(0, idx)] ?? 'A';
        }

        const normalized = {
          id: String(q.id ?? crypto.randomUUID()),
          question: questionText,
          options,
          correctAnswer,
          domain: String(q.domain ?? domain),
          difficulty: q.difficulty || 'Medium',
          explanation: q.explanation || ''
        };

        seen.add(questionText.toLowerCase());
        allQuestions.push(normalized);

        // Store in database
        const { error: insertError } = await supabase
          .from('practice_questions')
          .insert({
            domain: normalized.domain,
            question: normalized.question,
            option_a: normalized.options[0],
            option_b: normalized.options[1],
            option_c: normalized.options[2],
            option_d: normalized.options[3],
            correct_answer: normalized.correctAnswer,
            explanation: normalized.explanation,
            difficulty: normalized.difficulty
          });

        if (insertError) {
          console.error("Error storing question:", insertError);
        }

        if (allQuestions.length >= total) break;
      }
    }

    // Generate in batches
    let rateLimitTries = 0;
    while (allQuestions.length < total) {
      const need = total - allQuestions.length;
      const n = Math.min(batchSize, need);
      try {
        await generateBatch(n);
        rateLimitTries = 0;
        if (allQuestions.length < total) await sleep(500);
      } catch (e) {
        if (e instanceof Error && e.message === "RATE_LIMITED") {
          rateLimitTries++;
          if (rateLimitTries > 3) throw e;
          const backoff = Math.min(10000, 2000 * Math.pow(2, rateLimitTries));
          await sleep(backoff);
          continue;
        }
        throw e;
      }
    }

    return new Response(JSON.stringify(allQuestions.slice(0, total)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error generating practice questions:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage === "RATE_LIMITED") {
      return new Response(
        JSON.stringify({ 
          error: "RATE_LIMITED",
          message: "Too many requests. Please wait a moment and try again."
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
