

# Fix Security Issues (Errors + Warnings)

## Issues to Fix

### 1. ERROR: MCQ Generation Endpoint Lacks Authentication
The `generate-mcq-questions` edge function has `verify_jwt=false` and no auth checks, allowing anyone to trigger expensive AI question generation.

**Fix:** Add authentication check at the top of the function using the Authorization header and Supabase client to verify the user. This is the same pattern used in other secured functions like `speech-to-text`.

**File:** `supabase/functions/generate-mcq-questions/index.ts`
- Import `createClient` from Supabase
- Extract and validate the Authorization header
- Verify the user with `supabaseClient.auth.getUser()`
- Return 401 if unauthorized

### 2. ERROR: Interview Questions and Expected Answers Are Publicly Accessible
The `interview_questions` table has a SELECT policy with `USING (true)`, meaning anyone can read all questions and their `expected_points` (correct answer criteria). This allows candidates to study exact answers before interviews.

**Fix:** Two-part approach:
- **Database migration:** Create a secure view `interview_questions_public` that exposes only `id`, `domain`, `question`, `category`, `difficulty` (excludes `expected_points`). Change the base table's SELECT policy to `USING (false)` to block direct access.
- **Edge function update:** The `get-random-interview-questions` function already uses the service role key, so it can still read `expected_points` from the base table. The client-side code in `MockInterview.tsx` receives `expected_points` via the edge function response (not direct table access), so no frontend changes are needed.

### 3. WARNING: Leaked Password Protection Disabled
This is a platform-level setting, not a code change.

**How to enable:** Go to your project Settings, then Cloud tab, then Users, then Auth settings (gear icon). Under Email settings, enable the "Password HIBP Check" option.

### 4. WARNING: User Identity and Performance Data Could Be Exposed
The `user_test_attempts` table has RLS policies that already restrict users to viewing only their own data (`auth.uid() = user_id`). The warning is about theoretical user_id enumeration, but since users can only see their own rows, this is not exploitable. 

**Fix:** Mark this as ignored/acceptable since RLS already prevents cross-user access.

---

## Technical Details

### Database Migration (SQL)
```sql
-- Create a public view for interview questions WITHOUT expected_points
CREATE VIEW public.interview_questions_public
WITH (security_invoker = on) AS
SELECT id, domain, question, category, difficulty, created_at
FROM public.interview_questions;

-- Block direct SELECT on base table (service role bypasses RLS)
DROP POLICY IF EXISTS "Anyone can read interview questions" ON public.interview_questions;
CREATE POLICY "Block direct select on interview questions"
  ON public.interview_questions FOR SELECT
  USING (false);
```

### Edge Function: `generate-mcq-questions/index.ts`
Add authentication block after CORS check:
```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// After OPTIONS check, before processing:
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
);
const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
  authHeader.replace('Bearer ', '')
);
if (authError || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
```

### Security Finding Updates
- Delete `generate_mcq_no_auth` finding (fixed)
- Delete `interview_questions_public_access` finding (fixed)
- Ignore `user_test_attempts_user_id_exposure` (RLS already prevents cross-user access)
- Note about `SUPA_auth_leaked_password_protection` (manual platform setting)

