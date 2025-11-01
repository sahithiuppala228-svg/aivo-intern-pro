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
        console.error("AI gateway error:", resp.status, t);
        throw new Error("Failed to generate questions");
      }

      const data = await resp.json();
      const choice = data.choices?.[0];

      // Try tool call first
      let questionsChunk: any[] | null = null;
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
          throw new Error("AI did not return parsable questions");
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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
