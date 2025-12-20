-- Add explanation column to mcq_questions
ALTER TABLE public.mcq_questions 
ADD COLUMN IF NOT EXISTS explanation text;

-- Create index for faster random queries by domain and difficulty
CREATE INDEX IF NOT EXISTS idx_mcq_questions_domain_difficulty 
ON public.mcq_questions(domain, difficulty);

-- Create index for faster counting
CREATE INDEX IF NOT EXISTS idx_mcq_questions_domain 
ON public.mcq_questions(domain);