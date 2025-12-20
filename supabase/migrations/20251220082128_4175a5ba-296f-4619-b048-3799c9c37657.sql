-- Add correct_answer column to mcq_questions_public if not exists
-- First check if the view needs to be recreated with correct_answer

-- Drop the existing view
DROP VIEW IF EXISTS mcq_questions_public;

-- Recreate the view with correct_answer included (but hidden from public)
CREATE VIEW mcq_questions_public AS
SELECT 
  id,
  created_at,
  difficulty,
  option_a,
  option_b,
  option_c,
  option_d,
  question,
  domain
FROM mcq_questions;

-- Create index for faster domain-based queries on the base table
CREATE INDEX IF NOT EXISTS idx_mcq_questions_domain ON mcq_questions(domain);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_difficulty ON mcq_questions(difficulty);