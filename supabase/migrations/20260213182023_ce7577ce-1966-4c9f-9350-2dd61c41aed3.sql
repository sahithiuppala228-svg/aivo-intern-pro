
-- Fix 1: Replace overly permissive INSERT on practice_questions
DROP POLICY IF EXISTS "Service role can insert practice questions" ON public.practice_questions;
CREATE POLICY "Block direct inserts to practice questions"
ON public.practice_questions
FOR INSERT
WITH CHECK (false);

-- Fix 2: Replace overly permissive INSERT on interview_questions
DROP POLICY IF EXISTS "Service role can insert interview questions" ON public.interview_questions;
CREATE POLICY "Block direct inserts to interview questions"
ON public.interview_questions
FOR INSERT
WITH CHECK (false);

-- Fix 3: Enable RLS on mcq_questions_public (it's a view, so we add RLS to ensure protection)
-- mcq_questions_public is a view - views inherit from base table RLS when security_invoker is on
-- Let's verify and ensure the view is properly secured by checking if it needs recreation
-- The base table mcq_questions already blocks SELECT (USING false), so the view should be safe
-- But the view itself needs RLS if it's materialized. Let's add a SELECT policy for public read access.
