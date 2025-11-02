-- Fix security definer view by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS mcq_questions_public;

CREATE VIEW mcq_questions_public 
WITH (security_invoker = true) AS
SELECT id, created_at, difficulty, option_a, option_b, option_c, option_d, question, domain
FROM mcq_questions;

GRANT SELECT ON mcq_questions_public TO authenticated, anon;