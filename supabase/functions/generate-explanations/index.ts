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
    const { failedQuestions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const explanations = [];

    // Process all questions in parallel for instant results
    const explanationPromises = failedQuestions.map(async (question: any) => {
      const prompt = `Explain why the correct answer to this question is "${question.correct_answer}":

Question: ${question.question}
A) ${question.option_a}
B) ${question.option_b}
C) ${question.option_c}
D) ${question.option_d}

User selected: ${question.user_answer || 'Not answered'}
Correct answer: ${question.correct_answer}

Provide a clear, educational explanation in 2-3 sentences.`;

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "You are a helpful tutor explaining quiz answers clearly and concisely." },
              { role: "user", content: prompt }
            ],
            max_tokens: 200,
          }),
        });

        if (!response.ok) {
          console.error("Lovable AI error:", response.status, await response.text());
          return {
            question: question.question,
            correct_answer: question.correct_answer,
            user_answer: question.user_answer,
            explanation: "Unable to generate explanation at this time.",
          };
        }

        const result = await response.json();
        return {
          question: question.question,
          correct_answer: question.correct_answer,
          user_answer: question.user_answer,
          explanation: result.choices[0].message.content,
        };
      } catch (error) {
        console.error("Error generating explanation:", error);
        return {
          question: question.question,
          correct_answer: question.correct_answer,
          user_answer: question.user_answer,
          explanation: "Unable to generate explanation at this time.",
        };
      }
    });

    const results = await Promise.all(explanationPromises);
    explanations.push(...results);

    return new Response(JSON.stringify({ explanations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
