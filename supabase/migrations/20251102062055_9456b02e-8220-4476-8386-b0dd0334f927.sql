-- Create a view that excludes correct_answer from mcq_questions
CREATE VIEW mcq_questions_public AS
SELECT id, created_at, difficulty, option_a, option_b, option_c, option_d, question, domain
FROM mcq_questions;

-- Grant access to the view
GRANT SELECT ON mcq_questions_public TO authenticated, anon;

-- Drop the old permissive policy
DROP POLICY IF EXISTS "Users can view questions without answers" ON mcq_questions;

-- Create a restrictive policy that blocks direct table access
CREATE POLICY "Block direct access to mcq_questions"
ON mcq_questions FOR SELECT
USING (false);