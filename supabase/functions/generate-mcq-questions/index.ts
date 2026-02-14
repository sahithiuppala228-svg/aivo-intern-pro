import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateDomain, validateCount, validationError } from "../_shared/validation.ts";

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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Authenticated user:", user.id);

    const body = await req.json();

    const domainCheck = validateDomain(body.domain);
    if (!domainCheck.valid) return validationError(domainCheck.error!, corsHeaders);

    const domain = domainCheck.value!;
    const total = validateCount(body.count, 50, 50);

    console.log(`Generating ${total} MCQ questions for domain: ${domain}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const batchSize = Math.min(6, total);
    const allQuestions: any[] = [];
    const seen = new Set<string>();

    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
    
    async function generateBatch(n: number) {
      const prompt = `Generate ${n} multiple-choice questions specifically about "${domain}".

IMPORTANT REQUIREMENTS:
- Questions MUST be directly related to ${domain} concepts, terminology, tools, and best practices
- Include technical details, frameworks, libraries, and real-world scenarios specific to ${domain}
- Mix difficulty levels: Easy (basic concepts), Medium (intermediate applications), Hard (advanced scenarios)
- Each question must have exactly 4 distinct options (A, B, C, D)
- Only ONE option should be correct
- Questions should test practical knowledge a professional in ${domain} would need

Examples of good domain-specific questions:
- For "React": Questions about hooks, component lifecycle, state management, JSX
- For "Python": Questions about data structures, libraries like pandas/numpy, syntax
- For "Machine Learning": Questions about algorithms, training, evaluation metrics
- For "Data Science": Questions about statistics, data analysis, visualization

Return the questions using the provided tool.`;

      const body = {
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `You are an expert MCQ question generator specializing in ${domain}. Generate technically accurate, domain-specific questions that test real knowledge. Always use the provided tool to return structured results.` },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_questions",
              description: `Return ${n} domain-specific multiple-choice questions for ${domain}`,
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        question: { type: "string" },
                        option_a: { type: "string" },
                        option_b: { type: "string" },
                        option_c: { type: "string" },
                        option_d: { type: "string" },
                        correct_answer: { type: "string", enum: ["A", "B", "C", "D"] },
                        difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
                      },
                      required: ["id", "question", "option_a", "option_b", "option_c", "option_d", "correct_answer", "difficulty"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_questions" } },
      } as any;

      let questionsChunk: any[] | null = null;
      let useFallback = false;

      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!resp.ok) {
          const t = await resp.text();
          console.error("AI gateway tool-call error:", resp.status, t);
          
          // Handle rate limiting and payment errors specifically
          if (resp.status === 429) {
            throw new Error("RATE_LIMITED");
          }
          if (resp.status === 402) {
            throw new Error("PAYMENT_REQUIRED");
          }
          
          useFallback = true;
        } else {
          const data = await resp.json();
          const choice = data.choices?.[0];

          // Try tool call first
          try {
            const tc = choice?.message?.tool_calls?.[0];
            if (tc?.function?.arguments) {
              const args = tc.function.arguments;
              const parsed = typeof args === 'string' ? JSON.parse(args) : args;
              if (parsed?.questions && Array.isArray(parsed.questions)) {
                questionsChunk = parsed.questions;
              }
            }
          } catch (e) {
            console.warn("Tool call parse failed, will try content fallback:", e);
          }

          // Fallback: parse content as JSON (clean code fences)
          if (!questionsChunk) {
            try {
              let content = choice?.message?.content?.trim?.() ?? "";
              content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const parsed = JSON.parse(content);
              questionsChunk = Array.isArray(parsed) ? parsed : parsed?.questions;
            } catch (e) {
              console.error("Content parse failed:", e);
              useFallback = true;
            }
          }
        }
      } catch (err) {
        console.error("Primary AI call failed:", err);
        useFallback = true;
      }

      // Second attempt without tools: ask for strict JSON only
      if (!questionsChunk && useFallback) {
        const fallbackPrompt = `Return EXACT JSON with this shape, no prose, no code fences:
{
  "questions": [
    {
      "id": "unique-id",
      "question": "Question text about ${domain}",
      "option_a": "First option",
      "option_b": "Second option", 
      "option_c": "Third option",
      "option_d": "Fourth option",
      "correct_answer": "A",
      "difficulty": "Medium"
    }
  ]
}
Generate ${n} unique MCQs specifically about ${domain}.
Questions must be technically accurate and test real ${domain} knowledge.
correct_answer must be exactly one of: A, B, C, D
difficulty must be exactly one of: Easy, Medium, Hard`;

        try {
          const resp2 = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                { role: "system", content: "You return ONLY strict JSON conforming to the schema." },
                { role: "user", content: fallbackPrompt },
              ],
            }),
          });

          if (!resp2.ok) {
            const t = await resp2.text();
            console.error("AI gateway fallback error:", resp2.status, t);
            
            // Handle rate limiting and payment errors specifically
            if (resp2.status === 429) {
              throw new Error("RATE_LIMITED");
            }
            if (resp2.status === 402) {
              throw new Error("PAYMENT_REQUIRED");
            }
            
            throw new Error("Failed to generate questions");
          }

          const data2 = await resp2.json();
          let content2 = data2.choices?.[0]?.message?.content ?? "";
          content2 = String(content2).replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed2 = JSON.parse(content2);
          questionsChunk = Array.isArray(parsed2) ? parsed2 : parsed2?.questions;
        } catch (e) {
          console.error("Fallback parsing failed:", e);
          // If the fallback failed due to rate limits or payment, propagate that specific error
          if (e instanceof Error && (e.message === "RATE_LIMITED" || e.message === "PAYMENT_REQUIRED")) {
            throw e;
          }
          throw new Error("Failed to generate questions");
        }
      }

      if (!questionsChunk || !Array.isArray(questionsChunk)) {
        throw new Error("Invalid questions payload");
      }

      // Normalize and validate
      for (const q of questionsChunk) {
        const questionText = String(q.question ?? '').trim();
        if (!questionText || seen.has(questionText.toLowerCase())) continue;

        // Handle both formats: option_a/b/c/d OR options array
        let option_a: string, option_b: string, option_c: string, option_d: string;
        let correct_answer: string;

        if (q.option_a && q.option_b && q.option_c && q.option_d) {
          // New format with option_a, option_b, etc.
          option_a = String(q.option_a).trim();
          option_b = String(q.option_b).trim();
          option_c = String(q.option_c).trim();
          option_d = String(q.option_d).trim();
          correct_answer = String(q.correct_answer ?? 'A').toUpperCase().trim();
        } else if (Array.isArray(q.options) && q.options.length >= 4) {
          // Old format with options array
          option_a = String(q.options[0]).trim();
          option_b = String(q.options[1]).trim();
          option_c = String(q.options[2]).trim();
          option_d = String(q.options[3]).trim();
          
          // Map correctAnswer to letter
          const correctAnswerText = String(q.correctAnswer ?? '').trim();
          const options = [option_a, option_b, option_c, option_d];
          const idx = options.findIndex((o) => o === correctAnswerText);
          correct_answer = idx >= 0 ? ['A', 'B', 'C', 'D'][idx] : 'A';
        } else {
          continue; // Skip invalid question
        }

        // Validate correct_answer is A, B, C, or D
        if (!['A', 'B', 'C', 'D'].includes(correct_answer)) {
          correct_answer = 'A';
        }

        const normalized = {
          id: String(q.id ?? crypto.randomUUID()),
          question: questionText,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium',
          domain: String(q.domain ?? domain),
        };

        seen.add(questionText.toLowerCase());
        allQuestions.push(normalized);
        if (allQuestions.length >= total) break;
      }
    }

    // Generate in batches until we hit requested total
    let rateLimitTries = 0;
    while (allQuestions.length < total) {
      const need = total - allQuestions.length;
      const n = Math.min(batchSize, need);
      try {
        await generateBatch(n);
        rateLimitTries = 0;
        if (allQuestions.length < total) await sleep(350); // minimal spacing
      } catch (e) {
        if (e instanceof Error && e.message === "RATE_LIMITED") {
          rateLimitTries++;
          if (rateLimitTries > 4) throw e;
          const backoff = Math.min(8000, 1000 * Math.pow(2, rateLimitTries)) + Math.floor(Math.random() * 400);
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
    console.error("Error generating MCQ questions:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Return specific status codes for rate limiting and payment errors
    if (errorMessage === "RATE_LIMITED") {
      return new Response(
        JSON.stringify({ 
          error: "RATE_LIMITED",
          message: "Too many requests. Please wait a moment and try again, or upgrade for higher limits."
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (errorMessage === "PAYMENT_REQUIRED") {
      return new Response(
        JSON.stringify({ 
          error: "PAYMENT_REQUIRED",
          message: "AI credits depleted. Please add credits to your workspace to continue."
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
