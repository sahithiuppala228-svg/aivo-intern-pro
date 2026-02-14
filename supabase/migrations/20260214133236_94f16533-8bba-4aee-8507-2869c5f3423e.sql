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