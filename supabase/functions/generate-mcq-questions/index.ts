import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, count } = await req.json();
    const total = typeof count === 'number' && count > 0 ? count : 50;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const batchSize = Math.min(10, total); // smaller chunks are more reliable
    const allQuestions: any[] = [];
    const seen = new Set<string>();

    async function generateBatch(n: number) {
      const prompt = `Generate ${n} multiple-choice questions for the domain: ${domain}.

Requirements:
- Each question must be unique and relevant to ${domain}
- Exactly 4 options per question
- Mix of Easy, Medium and Hard difficulties across the set
- Cover different sub-topics within ${domain}
Return via the provided tool only.`;

      const body = {
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an MCQ question generator. Use the provided tool to return results." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_questions",
              description: `Return ${n} multiple-choice questions for ${domain}`,
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
                        options: {
                          type: "array",
                          items: { type: "string" },
                          minItems: 4,
                          maxItems: 4,
                        },
                        correctAnswer: { type: "string" },
                        domain: { type: "string" },
                        difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
                      },
                      required: ["id", "question", "options", "correctAnswer"],
                      additionalProperties: true,
                    },
                    minItems: n,
                    maxItems: n,
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
      "id": "uuid",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "One of the options"
    }
  ]
}
Generate ${n} unique, domain-relevant MCQs for ${domain}.
Exactly 4 options per question. Difficulty: mix of Easy, Medium, Hard.`;

        try {
          const resp2 = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
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

        let options: string[] = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
        if (options.length !== 4) continue;

        let correctAnswer: string = String(q.correctAnswer ?? '').trim();
        if (!options.includes(correctAnswer)) {
          // If model drifted, default to first option
          correctAnswer = options[0];
        }

        const normalized = {
          id: String(q.id ?? crypto.randomUUID()),
          question: questionText,
          options,
          correctAnswer,
          domain: String(q.domain ?? domain),
        };

        seen.add(questionText.toLowerCase());
        allQuestions.push(normalized);
        if (allQuestions.length >= total) break;
      }
    }

    // Generate in batches until we hit requested total
    while (allQuestions.length < total) {
      const need = total - allQuestions.length;
      const n = Math.min(batchSize, need);
      await generateBatch(n);
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
