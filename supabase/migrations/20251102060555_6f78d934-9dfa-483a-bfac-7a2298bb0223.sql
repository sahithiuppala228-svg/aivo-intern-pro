-- Create view for MCQ questions without correct answers (for public consumption)
CREATE VIEW mcq_questions_public AS 
SELECT id, question, option_a, option_b, option_c, option_d, domain, difficulty, created_at 
FROM mcq_questions;

-- Create security definer function to validate answers server-side
CREATE OR REPLACE FUNCTION validate_mcq_answer(question_id uuid, user_answer text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT correct_answer = user_answer FROM mcq_questions WHERE id = question_id;
$$;

-- Grant execute permission on the validation function
GRANT EXECUTE ON FUNCTION validate_mcq_answer(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_mcq_answer(uuid, text) TO anon;