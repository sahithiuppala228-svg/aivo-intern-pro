import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pre-seeded domains that must have questions in the database
const PRESEEDED_DOMAINS = [
  "Web Development",
  "Data Science",
  "Machine Learning",
  "Mobile Development",
  "UI/UX Design",
  "DevOps",
  "Cloud Computing",
  "Cybersecurity",
  "Blockchain",
  "Game Development"
];

const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 1500; // 1.5 seconds

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: 'Unauthorized', questions: [] }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use anon key client to verify user authentication
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error("Auth error:", authError?.message || "User not found");
      return new Response(JSON.stringify({ error: 'Unauthorized', questions: [] }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Authenticated user:", user.id);

    // Use service key for database operations (to bypass RLS for reading questions)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { domain, count = 50 } = await req.json();

    if (!domain) {
      return new Response(JSON.stringify({ error: 'Domain is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isPreseededDomain = PRESEEDED_DOMAINS.includes(domain);
    console.log(`Domain: ${domain}, isPreseeded: ${isPreseededDomain}, requesting ${count} questions`);

    // Get total count for this domain
    const { count: totalCount, error: countError } = await supabase
      .from('mcq_questions')
      .select('*', { count: 'exact', head: true })
      .eq('domain', domain);

    if (countError) {
      console.error('Error counting questions:', countError);
      return new Response(JSON.stringify({ 
        error: 'Failed to count questions',
        questions: [],
        available: 0
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const available = totalCount || 0;
    console.log(`Domain ${domain} has ${available} questions available`);

    // Check if we have enough questions in the database
    if (available >= count) {
      console.log(`Domain ${domain} has enough questions (${available}), fetching from database`);
      const questions = await fetchQuestionsFromDatabase(supabase, domain, count);
      
      return new Response(JSON.stringify({ 
        questions,
        available: questions.length,
        returned: questions.length,
        isCustomDomain: !isPreseededDomain,
        generated: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Need to generate questions (for both pre-seeded domains without enough questions and custom domains)
    console.log(`Domain ${domain} needs questions (have ${available}, need ${count}), generating via AI...`);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'AI generation not configured. Please contact administrator.',
        questions: [],
        isCustomDomain: !isPreseededDomain
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate questions
    const questionsNeeded = count - available;
    const batchesNeeded = Math.ceil(questionsNeeded / BATCH_SIZE);
    let totalGenerated = 0;

    for (let batch = 0; batch < batchesNeeded && totalGenerated < questionsNeeded; batch++) {
      const remaining = questionsNeeded - totalGenerated;
      const batchCount = Math.min(BATCH_SIZE, remaining);

      console.log(`Generating batch ${batch + 1}/${batchesNeeded}, ${batchCount} questions...`);

      try {
        const questions = await generateQuestionBatch(LOVABLE_API_KEY, domain, batchCount, batch);
        
        if (questions.length > 0) {
          // Insert into database
          const { error: insertError } = await supabase
            .from('mcq_questions')
            .insert(questions.map(q => ({
              domain,
              question: q.question,
              option_a: q.option_a,
              option_b: q.option_b,
              option_c: q.option_c,
              option_d: q.option_d,
              correct_answer: q.correct_answer,
              difficulty: q.difficulty,
              explanation: q.explanation || null
            })));

          if (insertError) {
            console.error('Error inserting batch:', insertError);
          } else {
            totalGenerated += questions.length;
            console.log(`Batch ${batch + 1} inserted: ${questions.length} questions`);
          }
        }

        // Delay between batches to avoid rate limiting
        if (batch < batchesNeeded - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      } catch (batchError) {
        console.error(`Error in batch ${batch + 1}:`, batchError);
        // Continue with next batch even if this one fails
      }
    }

    console.log(`Generated ${totalGenerated} questions for domain ${domain}`);

    // Now fetch all questions (existing + newly generated)
    const questions = await fetchQuestionsFromDatabase(supabase, domain, count);

    return new Response(JSON.stringify({ 
      questions,
      available: questions.length,
      returned: questions.length,
      isCustomDomain: !isPreseededDomain,
      generated: true,
      generatedCount: totalGenerated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Get random questions error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, questions: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchQuestionsFromDatabase(supabase: any, domain: string, count: number) {
  // Get questions with mixed difficulties
  const easyCount = Math.floor(count * 0.3);  // 30% easy
  const mediumCount = Math.floor(count * 0.4); // 40% medium
  const hardCount = count - easyCount - mediumCount; // 30% hard

  const [easyResult, mediumResult, hardResult] = await Promise.all([
    fetchRandomByDifficulty(supabase, domain, 'easy', easyCount),
    fetchRandomByDifficulty(supabase, domain, 'medium', mediumCount),
    fetchRandomByDifficulty(supabase, domain, 'hard', hardCount)
  ]);

  let allQuestions = [
    ...(easyResult.data || []),
    ...(mediumResult.data || []),
    ...(hardResult.data || [])
  ];

  // If we didn't get enough questions by difficulty, fetch more randomly
  if (allQuestions.length < count) {
    const needed = count - allQuestions.length;
    const existingIds = allQuestions.map(q => q.id);
    
    let query = supabase
      .from('mcq_questions')
      // SECURITY: Do NOT include correct_answer - this protects test integrity
      .select('id, question, option_a, option_b, option_c, option_d, difficulty, explanation')
      .eq('domain', domain)
      .limit(needed);

    if (existingIds.length > 0) {
      query = query.not('id', 'in', `(${existingIds.join(',')})`);
    }

    const { data: moreQuestions } = await query;

    if (moreQuestions) {
      allQuestions = [...allQuestions, ...moreQuestions];
    }
  }

  // Shuffle the questions for randomness
  return shuffleArray(allQuestions);
}

async function fetchRandomByDifficulty(supabase: any, domain: string, difficulty: string, count: number) {
  if (count <= 0) return { data: [] };

  // Get count for this difficulty
  const { count: difficultyCount } = await supabase
    .from('mcq_questions')
    .select('*', { count: 'exact', head: true })
    .eq('domain', domain)
    .eq('difficulty', difficulty);

  const available = difficultyCount || 0;
  const toFetch = Math.min(count, available);

  if (toFetch <= 0) return { data: [] };

  // Use random offset for better distribution
  const maxOffset = Math.max(0, available - toFetch);
  const randomOffset = Math.floor(Math.random() * (maxOffset + 1));

  return await supabase
    .from('mcq_questions')
    // SECURITY: Do NOT include correct_answer - this protects test integrity
    .select('id, question, option_a, option_b, option_c, option_d, difficulty, explanation')
    .eq('domain', domain)
    .eq('difficulty', difficulty)
    .range(randomOffset, randomOffset + toFetch - 1);
}

async function generateQuestionBatch(apiKey: string, domain: string, count: number, batchNumber: number): Promise<any[]> {
  const difficulties = ['easy', 'medium', 'hard'];
  const difficultyMix = difficulties[batchNumber % 3]; // Rotate through difficulties

  const prompt = `Generate exactly ${count} unique multiple-choice questions about ${domain}.

Requirements:
- Questions must be specifically about ${domain} concepts, technologies, tools, and best practices
- Include technical details, real-world scenarios, and practical knowledge
- Each question should have exactly 4 options (A, B, C, D)
- All questions should be ${difficultyMix} difficulty
- Questions should be unique and not repeat common patterns
- Cover different aspects: fundamentals, advanced concepts, tools, frameworks, best practices
- IMPORTANT: Include a clear explanation for why the correct answer is right

Batch ${batchNumber + 1} - Focus on different subtopics to ensure variety.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { 
          role: 'system', 
          content: `You are an expert question generator for ${domain}. Generate high-quality MCQ questions that test real knowledge. Always include a clear explanation for each answer.`
        },
        { role: 'user', content: prompt }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'save_questions',
          description: 'Save the generated questions',
          parameters: {
            type: 'object',
            properties: {
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string', description: 'The question text' },
                    option_a: { type: 'string', description: 'Option A' },
                    option_b: { type: 'string', description: 'Option B' },
                    option_c: { type: 'string', description: 'Option C' },
                    option_d: { type: 'string', description: 'Option D' },
                    correct_answer: { type: 'string', enum: ['A', 'B', 'C', 'D'], description: 'The correct answer letter' },
                    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'], description: 'Question difficulty (lowercase)' },
                    explanation: { type: 'string', description: 'Explanation of why the correct answer is right' }
                  },
                  required: ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'difficulty', 'explanation']
                }
              }
            },
            required: ['questions']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'save_questions' } }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (!toolCall?.function?.arguments) {
    console.error('No tool call in response');
    return [];
  }

  try {
    const parsed = JSON.parse(toolCall.function.arguments);
    const questions = parsed.questions || [];
    
    // Validate and normalize questions
    return questions.filter((q: any) => 
      q.question && 
      q.option_a && q.option_b && q.option_c && q.option_d && 
      ['A', 'B', 'C', 'D'].includes(q.correct_answer?.toUpperCase())
    ).map((q: any) => ({
      ...q,
      correct_answer: q.correct_answer.toUpperCase(),
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty?.toLowerCase()) ? q.difficulty.toLowerCase() : difficultyMix,
      explanation: q.explanation || 'No explanation provided.'
    }));
  } catch (e) {
    console.error('Failed to parse questions:', e);
    return [];
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
