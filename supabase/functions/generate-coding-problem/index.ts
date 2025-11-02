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
    const { domain } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Generate a coding problem for the domain: ${domain}.

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "id": "unique-id",
  "title": "Problem Title",
  "description": "A detailed paragraph (3-5 sentences) explaining the problem context, what needs to be solved, and why it matters. Make it engaging and clear.",
  "difficulty": "Easy/Medium/Hard",
  "domain": "${domain}",
  "inputFormat": "Description of input format",
  "outputFormat": "Description of output format",
  "constraints": ["constraint1", "constraint2"],
  "testCases": [
    {
      "input": "sample input",
      "output": "expected output",
      "explanation": "why this output"
    }
  ],
  "sampleInput": "4\\n53\\n100\\n9",
  "sampleOutput": "3\\n0\\n9\\n1"
}

Make it relevant to ${domain} and appropriate difficulty.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a coding problem generator. Always return valid JSON only, no markdown formatting." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();
      console.error("AI gateway error:", status, errorText);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: "AI gateway error", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    console.log("Raw AI response:", content);
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to extract JSON if it's embedded in text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }
    
    console.log("Cleaned content:", content);
    
    let problem;
    try {
      problem = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Content that failed to parse:", content);
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
      throw new Error(`Failed to parse AI response as JSON: ${errorMsg}`);
    }

    return new Response(JSON.stringify(problem), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error generating coding problem:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
