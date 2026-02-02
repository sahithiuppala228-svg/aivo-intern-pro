-- Create interview questions table
CREATE TABLE public.interview_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  question TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'behavioral', 'problem-solving')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  expected_points JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster domain lookups
CREATE INDEX idx_interview_questions_domain ON public.interview_questions(domain);

-- Enable RLS
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- Allow public read access (questions are not sensitive)
CREATE POLICY "Anyone can read interview questions"
ON public.interview_questions
FOR SELECT
USING (true);

-- Allow service role to insert (for edge function seeding)
CREATE POLICY "Service role can insert interview questions"
ON public.interview_questions
FOR INSERT
WITH CHECK (true);