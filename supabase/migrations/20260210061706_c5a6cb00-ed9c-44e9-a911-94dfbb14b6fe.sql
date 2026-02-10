
-- Create a public view for practice_questions that hides correct_answer and explanation
CREATE OR REPLACE VIEW public.practice_questions_public
WITH (security_invoker=on) AS
  SELECT id, created_at, updated_at, domain, question, option_a, option_b, option_c, option_d, difficulty
  FROM public.practice_questions;

-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Public can view practice questions" ON public.practice_questions;

-- Block direct SELECT access to the base table
CREATE POLICY "Block direct access to practice_questions"
  ON public.practice_questions FOR SELECT
  USING (false);

-- Create a server-side function to validate practice question answers
CREATE OR REPLACE FUNCTION public.validate_practice_answer(question_id uuid, user_answer text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT correct_answer = user_answer FROM practice_questions WHERE id = question_id;
$$;
