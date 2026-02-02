import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const REQUIRED_QUESTIONS = 10;
const QUESTION_DISTRIBUTION = {
  technical: 5,
  behavioral: 3,
  "problem-solving": 2
};

interface InterviewQuestion {
  id: string;
  domain: string;
  question: string;
  category: "technical" | "behavioral" | "problem-solving";
  difficulty: "easy" | "medium" | "hard";
  expected_points: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();
    
    if (!domain) {
      return new Response(
        JSON.stringify({ error: "Domain is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching interview questions for domain: ${domain}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check existing questions count
    const { count, error: countError } = await supabase
      .from('interview_questions')
      .select('*', { count: 'exact', head: true })
      .eq('domain', domain);

    if (countError) {
      console.error('Error counting questions:', countError);
      throw countError;
    }

    console.log(`Found ${count} existing questions for ${domain}`);

    // If we have enough questions, fetch random selection
    if (count && count >= REQUIRED_QUESTIONS) {
      const questions = await fetchRandomQuestions(supabase, domain);
      return new Response(
        JSON.stringify({ questions, generated: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Need to generate questions
    console.log(`Generating interview questions for ${domain}...`);
    const newQuestions = await generateQuestions(domain);
    
    // Save to database
    const { error: insertError } = await supabase
      .from('interview_questions')
      .insert(newQuestions);

    if (insertError) {
      console.error('Error inserting questions:', insertError);
      // Don't throw - still return the generated questions
    }

    // Return the newly generated questions (already properly distributed)
    return new Response(
      JSON.stringify({ questions: newQuestions, generated: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in get-random-interview-questions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchRandomQuestions(supabase: any, domain: string): Promise<InterviewQuestion[]> {
  const questions: InterviewQuestion[] = [];

  for (const [category, count] of Object.entries(QUESTION_DISTRIBUTION)) {
    const { data, error } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('domain', domain)
      .eq('category', category)
      .limit(50);

    if (error) {
      console.error(`Error fetching ${category} questions:`, error);
      continue;
    }

    // Shuffle and take required count
    const shuffled = data.sort(() => Math.random() - 0.5);
    questions.push(...shuffled.slice(0, count));
  }

  // If we don't have enough by category, fill with any available
  if (questions.length < REQUIRED_QUESTIONS) {
    const { data: extraData } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('domain', domain)
      .limit(REQUIRED_QUESTIONS);

    if (extraData) {
      const existingIds = new Set(questions.map(q => q.id));
      for (const q of extraData) {
        if (!existingIds.has(q.id) && questions.length < REQUIRED_QUESTIONS) {
          questions.push(q);
        }
      }
    }
  }

  return questions.sort(() => Math.random() - 0.5);
}

async function generateQuestions(domain: string): Promise<Omit<InterviewQuestion, 'id'>[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const prompt = `Generate exactly 10 interview questions for a ${domain} technical interview. The questions should be a mix of:
- 5 Technical questions (domain-specific, testing knowledge of ${domain})
- 3 Behavioral questions (about teamwork, challenges, learning)
- 2 Problem-solving questions (scenario-based, testing analytical thinking)

For each question, provide:
1. The question text
2. Category (technical, behavioral, or problem-solving)
3. Difficulty (easy, medium, or hard)
4. Expected points (3-5 key points that a good answer should cover)

Distribution for difficulty: 3 easy, 4 medium, 3 hard.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "category": "technical",
    "difficulty": "medium",
    "expected_points": ["point 1", "point 2", "point 3"]
  }
]

Make the questions professional, challenging but fair, and relevant to real-world ${domain} work. No markdown, just pure JSON.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are an expert technical interviewer. Generate professional interview questions. Always respond with valid JSON only, no markdown formatting.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in AI response');
  }

  // Parse JSON from response (handle potential markdown code blocks)
  let questionsJson: string = content;
  if (content.includes('```')) {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      questionsJson = match[1].trim();
    }
  }

  const parsedQuestions = JSON.parse(questionsJson);
  
  // Add domain to each question
  return parsedQuestions.map((q: any) => ({
    domain,
    question: q.question,
    category: q.category,
    difficulty: q.difficulty,
    expected_points: q.expected_points || q.expectedPoints || []
  }));
}
