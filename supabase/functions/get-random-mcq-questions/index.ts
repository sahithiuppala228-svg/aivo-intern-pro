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

    // Check if we have enough questions - return error if not enough
    if (available < count) {
      console.error(`Insufficient questions for ${domain}: have ${available}, need ${count}`);
      return new Response(JSON.stringify({ 
        error: `Insufficient questions for ${domain}. Available: ${available}, Required: ${count}. Please seed questions first.`,
        questions: [],
        available,
        required: count
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Now fetch questions (including any newly generated ones)
    const requestedCount = count;
    
    // Get questions with mixed difficulties
    const easyCount = Math.floor(requestedCount * 0.3);  // 30% easy
    const mediumCount = Math.floor(requestedCount * 0.4); // 40% medium
    const hardCount = requestedCount - easyCount - mediumCount; // 30% hard

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
