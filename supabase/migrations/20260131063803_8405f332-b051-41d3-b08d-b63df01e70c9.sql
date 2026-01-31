-- Create a table for storing coding problems
CREATE TABLE public.coding_problems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  input_format TEXT,
  output_format TEXT,
  constraints JSONB DEFAULT '[]'::jsonb,
  test_cases JSONB DEFAULT '[]'::jsonb,
  sample_input TEXT,
  sample_output TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coding_problems ENABLE ROW LEVEL SECURITY;

-- Allow public read access (questions don't need to be user-specific)
CREATE POLICY "Anyone can read coding problems"
ON public.coding_problems
FOR SELECT
USING (true);

-- Create index for faster domain queries
CREATE INDEX idx_coding_problems_domain ON public.coding_problems(domain);