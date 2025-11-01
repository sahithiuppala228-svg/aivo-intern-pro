-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for practice questions dataset
CREATE TABLE IF NOT EXISTS public.practice_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public can view practice questions" 
ON public.practice_questions 
FOR SELECT 
USING (true);

-- Create policy for service role to insert
CREATE POLICY "Service role can insert practice questions" 
ON public.practice_questions 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster domain queries
CREATE INDEX idx_practice_questions_domain ON public.practice_questions(domain);

-- Create trigger for updated_at
CREATE TRIGGER update_practice_questions_updated_at
BEFORE UPDATE ON public.practice_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();