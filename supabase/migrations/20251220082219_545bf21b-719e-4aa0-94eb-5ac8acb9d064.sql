-- Fix Security Definer View issue by setting security_invoker = true
DROP VIEW IF EXISTS mcq_questions_public;

-- Recreate view with SECURITY INVOKER (respects caller's permissions)
CREATE VIEW mcq_questions_public 
WITH (security_invoker = true)
AS
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