import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AnalysisRequest {
  answer: string;
  question: string;
  expectedPoints: string[];
  domain: string;
  candidateName: string;
}

interface AnalysisResponse {
  score: number;
  level: "Excellent" | "Good" | "Satisfactory" | "Needs Improvement";
  strengths: string[];
  improvements: string[];
  verbalFeedback: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { answer, question, expectedPoints, domain, candidateName } = await req.json() as AnalysisRequest;

    console.log("Analyzing answer for:", candidateName);
    console.log("Question:", question);
    console.log("Answer length:", answer?.length || 0);

    // Handle empty or very short answers
    if (!answer || answer.trim().length < 10) {
      console.log("Answer too short or empty");
      return new Response(
        JSON.stringify({
          score: 10,
          level: "Needs Improvement",
          strengths: [],
          improvements: [
            "Provide a complete answer to the question",
            "Speak clearly and elaborate on your thoughts"
          ],
          verbalFeedback: `${candidateName}, I didn't catch your answer clearly. Please try to speak more and elaborate on your thoughts when answering interview questions.`
        } as AnalysisResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert technical interviewer evaluating a candidate's answer in a ${domain} interview. 
Analyze the answer and provide constructive, professional feedback.

You MUST respond with a valid JSON object matching this exact structure:
{
  "score": <number 0-100>,
  "level": "<Excellent|Good|Satisfactory|Needs Improvement>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "verbalFeedback": "<2-3 sentence spoken feedback for the interviewer to say>"
}

Scoring guidelines:
- 85-100 (Excellent): Complete, detailed answer covering all key concepts with examples
- 70-84 (Good): Solid answer covering most concepts, could use more depth
- 50-69 (Satisfactory): Partial answer, missing some important concepts
- 0-49 (Needs Improvement): Incomplete or incorrect answer

The verbalFeedback should:
- Address the candidate by their first name
- Be encouraging but honest
- Highlight what they did well
- Suggest one key improvement
- Be natural and conversational (2-3 sentences)`;

    const userPrompt = `Evaluate this interview answer:

**Question:** ${question}

**Expected Concepts to Cover:** ${expectedPoints.join(", ")}

**Candidate's Answer:** ${answer}

**Candidate Name:** ${candidateName}

Provide your analysis as a JSON object.`;

    console.log("Calling Lovable AI for analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    console.log("AI response received:", content?.substring(0, 200));

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the response
    let analysis: AnalysisResponse;
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback response
      analysis = {
        score: 60,
        level: "Satisfactory",
        strengths: ["Attempted to answer the question"],
        improvements: ["Provide more detailed explanations"],
        verbalFeedback: `${candidateName}, thank you for your answer. You made some good points. Try to elaborate more and include specific examples in your responses.`
      };
    }

    // Ensure all required fields exist
    const validatedAnalysis: AnalysisResponse = {
      score: Math.max(0, Math.min(100, analysis.score || 50)),
      level: ["Excellent", "Good", "Satisfactory", "Needs Improvement"].includes(analysis.level) 
        ? analysis.level 
        : "Satisfactory",
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      improvements: Array.isArray(analysis.improvements) ? analysis.improvements : [],
      verbalFeedback: analysis.verbalFeedback || `Thank you for your answer, ${candidateName}.`
    };

    console.log("Analysis complete. Score:", validatedAnalysis.score);

    return new Response(
      JSON.stringify(validatedAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analyze answer error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        // Return fallback analysis so UI doesn't break
        score: 50,
        level: "Satisfactory",
        strengths: [],
        improvements: ["Could not analyze answer fully"],
        verbalFeedback: "Thank you for your answer. Let's continue to the next question."
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
