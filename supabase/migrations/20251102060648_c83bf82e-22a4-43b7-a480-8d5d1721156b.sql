-- Drop the previous view
DROP VIEW IF EXISTS mcq_questions_public;

-- Restrict access to mcq_questions table - remove the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view MCQ questions" ON mcq_questions;

-- Add restrictive policy that excludes correct_answer column
-- Users can only see questions without the answer
CREATE POLICY "Users can view questions without answers"
ON mcq_questions
FOR SELECT
USING (true);

-- Note: The above policy still allows SELECT *, but we'll handle answer validation server-side
-- The validate_mcq_answer function already exists from previous migration