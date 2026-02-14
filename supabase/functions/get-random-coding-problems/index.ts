import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pre-seeded domains that should have problems in the database
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

const TOTAL_PROBLEMS = 10;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: 'Unauthorized', problems: [] }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Verify user authentication
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error("Auth error:", authError?.message || "User not found");
      return new Response(JSON.stringify({ error: 'Unauthorized', problems: [] }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Authenticated user:", user.id);

    // Use service key for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();

    // Validate inputs
    const { validateDomain, validateCount, validationError: valErr } = await import("../_shared/validation.ts");
    const domainCheck = validateDomain(body.domain);
    if (!domainCheck.valid) return valErr(domainCheck.error!, corsHeaders);
    const domain = domainCheck.value!;
    const count = validateCount(body.count, TOTAL_PROBLEMS, 20);

    const isPreseededDomain = PRESEEDED_DOMAINS.includes(domain);
    console.log(`Domain: ${domain}, isPreseeded: ${isPreseededDomain}, requesting ${count} problems`);

    // Get total count for this domain
    const { count: totalCount, error: countError } = await supabase
      .from('coding_problems')
      .select('*', { count: 'exact', head: true })
      .eq('domain', domain);

    if (countError) {
      console.error('Error counting problems:', countError);
      return new Response(JSON.stringify({ 
        error: 'Failed to count problems',
        problems: [],
        available: 0
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const available = totalCount || 0;
    console.log(`Domain ${domain} has ${available} problems available`);

    // Check if we have enough problems in the database
    if (available >= count) {
      console.log(`Domain ${domain} has enough problems (${available}), fetching from database`);
      const problems = await fetchProblemsFromDatabase(supabase, domain, count);
      
      return new Response(JSON.stringify({ 
        problems,
        available: problems.length,
        returned: problems.length,
        isCustomDomain: !isPreseededDomain,
        generated: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Need to generate problems
    console.log(`Domain ${domain} needs problems (have ${available}, need ${count}), generating via AI...`);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'AI generation not configured. Please contact administrator.',
        problems: [],
        isCustomDomain: !isPreseededDomain
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate problems one by one
    const problemsNeeded = count - available;
    const difficulties = ["Easy", "Easy", "Easy", "Medium", "Medium", "Medium", "Medium", "Hard", "Hard", "Hard"];
    let totalGenerated = 0;

    for (let i = 0; i < problemsNeeded; i++) {
      const difficulty = difficulties[i % difficulties.length];
      
      try {
        console.log(`Generating problem ${i + 1}/${problemsNeeded} (${difficulty})...`);
        const problem = await generateCodingProblem(LOVABLE_API_KEY, domain, difficulty);
        
        if (problem) {
          // Insert into database
          const { error: insertError } = await supabase
            .from('coding_problems')
            .insert({
              domain,
              title: problem.title,
              description: problem.description,
              difficulty: problem.difficulty,
              input_format: problem.inputFormat,
              output_format: problem.outputFormat,
              constraints: problem.constraints || [],
              test_cases: problem.testCases || [],
              sample_input: problem.sampleInput,
              sample_output: problem.sampleOutput
            });

          if (insertError) {
            console.error('Error inserting problem:', insertError);
          } else {
            totalGenerated++;
            console.log(`Problem ${i + 1} inserted successfully`);
          }
        }

        // Delay between requests to avoid rate limiting
        if (i < problemsNeeded - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.error(`Error generating problem ${i + 1}:`, err);
        // Continue with next problem
      }
    }

    console.log(`Generated ${totalGenerated} problems for domain ${domain}`);

    // Now fetch all problems
    const problems = await fetchProblemsFromDatabase(supabase, domain, count);

    return new Response(JSON.stringify({ 
      problems,
      available: problems.length,
      returned: problems.length,
      isCustomDomain: !isPreseededDomain,
      generated: true,
      generatedCount: totalGenerated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Get random problems error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, problems: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchProblemsFromDatabase(supabase: any, domain: string, count: number) {
  // Get problems with mixed difficulties
  const easyCount = Math.floor(count * 0.3);  // 30% easy
  const mediumCount = Math.floor(count * 0.4); // 40% medium
  const hardCount = count - easyCount - mediumCount; // 30% hard

  const [easyResult, mediumResult, hardResult] = await Promise.all([
    fetchRandomByDifficulty(supabase, domain, 'Easy', easyCount),
    fetchRandomByDifficulty(supabase, domain, 'Medium', mediumCount),
    fetchRandomByDifficulty(supabase, domain, 'Hard', hardCount)
  ]);

  let allProblems = [
    ...(easyResult.data || []),
    ...(mediumResult.data || []),
    ...(hardResult.data || [])
  ];

  // If we didn't get enough by difficulty, fetch more randomly
  if (allProblems.length < count) {
    const needed = count - allProblems.length;
    const existingIds = allProblems.map(p => p.id);
    
    let query = supabase
      .from('coding_problems')
      .select('*')
      .eq('domain', domain)
      .limit(needed);

    if (existingIds.length > 0) {
      query = query.not('id', 'in', `(${existingIds.join(',')})`);
    }

    const { data: moreProblems } = await query;

    if (moreProblems) {
      allProblems = [...allProblems, ...moreProblems];
    }
  }

  // Shuffle for randomness
  return shuffleArray(allProblems);
}

async function fetchRandomByDifficulty(supabase: any, domain: string, difficulty: string, count: number) {
  if (count <= 0) return { data: [] };

  const { count: difficultyCount } = await supabase
    .from('coding_problems')
    .select('*', { count: 'exact', head: true })
    .eq('domain', domain)
    .eq('difficulty', difficulty);

  const available = difficultyCount || 0;
  const toFetch = Math.min(count, available);

  if (toFetch <= 0) return { data: [] };

  const maxOffset = Math.max(0, available - toFetch);
  const randomOffset = Math.floor(Math.random() * (maxOffset + 1));

  return await supabase
    .from('coding_problems')
    .select('*')
    .eq('domain', domain)
    .eq('difficulty', difficulty)
    .range(randomOffset, randomOffset + toFetch - 1);
}

async function generateCodingProblem(apiKey: string, domain: string, difficulty: string): Promise<any> {
  const prompt = `Generate a coding problem for the domain: ${domain}.

Return a coding problem with:
- A clear, descriptive title
- A detailed description (3-5 sentences) explaining what needs to be solved
- Difficulty: ${difficulty}
- Input/output formats
- Constraints
- At least 5 test cases (first 2 visible, rest hidden)
- Sample input and output

Make it relevant to ${domain} and appropriate for ${difficulty} difficulty.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a coding problem generator. Generate high-quality coding problems." },
        { role: "user", content: prompt }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'save_problem',
          description: 'Save the generated coding problem',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Problem title' },
              description: { type: 'string', description: 'Detailed problem description' },
              difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
              inputFormat: { type: 'string', description: 'Description of input format' },
              outputFormat: { type: 'string', description: 'Description of output format' },
              constraints: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'List of constraints'
              },
              testCases: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    input: { type: 'string' },
                    output: { type: 'string' },
                    explanation: { type: 'string' }
                  },
                  required: ['input', 'output']
                }
              },
              sampleInput: { type: 'string' },
              sampleOutput: { type: 'string' }
            },
            required: ['title', 'description', 'difficulty', 'inputFormat', 'outputFormat', 'testCases']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'save_problem' } }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (!toolCall?.function?.arguments) {
    console.error('No tool call in response');
    return null;
  }

  try {
    return JSON.parse(toolCall.function.arguments);
  } catch (e) {
    console.error('Failed to parse problem:', e);
    return null;
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
