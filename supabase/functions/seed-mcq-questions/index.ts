import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, targetCount = 50 } = await req.json();

    if (!domain) {
      return new Response(JSON.stringify({ error: 'Domain is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting seed for domain: ${domain}, target: ${targetCount} questions`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current question count for this domain
    const { count: existingCount, error: countError } = await supabase
      .from('mcq_questions')
      .select('*', { count: 'exact', head: true })
      .eq('domain', domain);

    if (countError) {
      console.error('Error counting existing questions:', countError);
      return new Response(JSON.stringify({ error: 'Failed to count existing questions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentCount = existingCount || 0;
    const questionsNeeded = Math.max(0, targetCount - currentCount);

    console.log(`Domain ${domain}: ${currentCount} existing, need ${questionsNeeded} more`);

    if (questionsNeeded <= 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Domain already has ${currentCount} questions`,
        generated: 0,
        total: currentCount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let totalGenerated = 0;
    const batchesNeeded = Math.ceil(questionsNeeded / BATCH_SIZE);

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

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Generated ${totalGenerated} questions for ${domain}`,
      generated: totalGenerated,
      total: currentCount + totalGenerated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Seed error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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
