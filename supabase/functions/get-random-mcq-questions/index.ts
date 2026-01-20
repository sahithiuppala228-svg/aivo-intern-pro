import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    console.log(`Fetching ${count} random questions for domain: ${domain} (user: ${user.id})`);

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

    // If we don't have enough questions, generate more using AI
    if (available < count) {
      console.log(`Need to generate ${count - available} more questions for ${domain}`);
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (LOVABLE_API_KEY) {
        const questionsNeeded = count - available;
        const generatedQuestions = await generateQuestionsWithAI(LOVABLE_API_KEY, domain, questionsNeeded);
        
        if (generatedQuestions.length > 0) {
          // Insert generated questions into database
          const { error: insertError } = await supabase
            .from('mcq_questions')
            .insert(generatedQuestions.map(q => ({
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
            console.error('Error inserting generated questions:', insertError);
          } else {
            console.log(`Successfully inserted ${generatedQuestions.length} generated questions`);
          }
        }
      }
    }

    // Now fetch questions (including any newly generated ones)
    const requestedCount = count;
    
    // Get questions with mixed difficulties
    const easyCount = Math.floor(requestedCount * 0.3);  // 30% easy
    const mediumCount = Math.floor(requestedCount * 0.4); // 40% medium
    const hardCount = requestedCount - easyCount - mediumCount; // 30% hard

    const [easyResult, mediumResult, hardResult] = await Promise.all([
      fetchRandomByDifficulty(supabase, domain, 'Easy', easyCount),
      fetchRandomByDifficulty(supabase, domain, 'Medium', mediumCount),
      fetchRandomByDifficulty(supabase, domain, 'Hard', hardCount)
    ]);

    let allQuestions = [
      ...(easyResult.data || []),
      ...(mediumResult.data || []),
      ...(hardResult.data || [])
    ];

    // If we didn't get enough questions by difficulty, fetch more randomly
    if (allQuestions.length < requestedCount) {
      const needed = requestedCount - allQuestions.length;
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
    allQuestions = shuffleArray(allQuestions);

    console.log(`Returning ${allQuestions.length} questions for domain ${domain}`);

    return new Response(JSON.stringify({ 
      questions: allQuestions,
      available: allQuestions.length,
      returned: allQuestions.length
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

async function generateQuestionsWithAI(apiKey: string, domain: string, count: number): Promise<any[]> {
  const allQuestions: any[] = [];
  const batchSize = 10;
  const batches = Math.ceil(count / batchSize);

  for (let batch = 0; batch < batches; batch++) {
    const batchCount = Math.min(batchSize, count - allQuestions.length);
    const difficulty = ['Easy', 'Medium', 'Hard'][batch % 3];

    console.log(`Generating batch ${batch + 1}/${batches} with ${batchCount} ${difficulty} questions`);

    const prompt = `Generate exactly ${batchCount} unique multiple-choice questions about ${domain}.

Requirements:
- Questions must be specifically about ${domain} concepts, technologies, tools, and best practices
- Each question should have exactly 4 options (A, B, C, D)
- All questions should be ${difficulty} difficulty
- Include a clear explanation for why the correct answer is right
- Make questions practical and test real-world knowledge`;

    try {
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
              content: `You are an expert question generator for ${domain}. Generate high-quality MCQ questions.`
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
                        question: { type: 'string' },
                        option_a: { type: 'string' },
                        option_b: { type: 'string' },
                        option_c: { type: 'string' },
                        option_d: { type: 'string' },
                        correct_answer: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
                        difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
                        explanation: { type: 'string' }
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
        console.error('AI API error:', response.status);
        continue;
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        const questions = parsed.questions || [];
        
        const validQuestions = questions.filter((q: any) => 
          q.question && 
          q.option_a && q.option_b && q.option_c && q.option_d && 
          ['A', 'B', 'C', 'D'].includes(q.correct_answer?.toUpperCase())
        ).map((q: any) => ({
          ...q,
          correct_answer: q.correct_answer.toUpperCase(),
          difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : difficulty,
          explanation: q.explanation || 'No explanation provided.'
        }));

        allQuestions.push(...validQuestions);
        console.log(`Batch ${batch + 1}: Generated ${validQuestions.length} questions`);
      }
    } catch (e) {
      console.error(`Error generating batch ${batch + 1}:`, e);
    }

    // Small delay between batches
    if (batch < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return allQuestions;
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

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
