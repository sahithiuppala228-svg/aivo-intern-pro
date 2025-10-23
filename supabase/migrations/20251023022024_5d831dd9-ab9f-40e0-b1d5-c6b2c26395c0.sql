-- Create mcq_questions table
CREATE TABLE public.mcq_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_test_attempts table
CREATE TABLE public.user_test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  domain TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_answers table
CREATE TABLE public.user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.user_test_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.mcq_questions(id),
  user_answer TEXT CHECK (user_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.mcq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mcq_questions (everyone can read)
CREATE POLICY "Anyone can view MCQ questions"
  ON public.mcq_questions
  FOR SELECT
  USING (true);

-- RLS Policies for user_test_attempts
CREATE POLICY "Users can view their own test attempts"
  ON public.user_test_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own test attempts"
  ON public.user_test_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_answers
CREATE POLICY "Users can view their own answers"
  ON public.user_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_test_attempts
      WHERE user_test_attempts.id = user_answers.attempt_id
      AND user_test_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own answers"
  ON public.user_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_test_attempts
      WHERE user_test_attempts.id = user_answers.attempt_id
      AND user_test_attempts.user_id = auth.uid()
    )
  );

-- Insert sample MCQ questions for different domains
INSERT INTO public.mcq_questions (domain, question, option_a, option_b, option_c, option_d, correct_answer, difficulty) VALUES
-- Web Development Questions
('Web Development', 'What does HTML stand for?', 'Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language', 'A', 'easy'),
('Web Development', 'Which CSS property is used to change the text color?', 'text-color', 'color', 'font-color', 'text-style', 'B', 'easy'),
('Web Development', 'What is the correct syntax for referring to an external JavaScript file?', '<script href="app.js">', '<script name="app.js">', '<script src="app.js">', '<script file="app.js">', 'C', 'medium'),
('Web Development', 'Which HTTP method is used to submit form data?', 'GET', 'POST', 'PUT', 'DELETE', 'B', 'medium'),
('Web Development', 'What does CSS stand for?', 'Creative Style Sheets', 'Cascading Style Sheets', 'Computer Style Sheets', 'Colorful Style Sheets', 'B', 'easy'),
('Web Development', 'Which tag is used for the largest heading in HTML?', '<h6>', '<h1>', '<head>', '<header>', 'B', 'easy'),
('Web Development', 'What is the purpose of the alt attribute in img tags?', 'Alternative text for images', 'Alignment of images', 'Animation settings', 'Automatic loading', 'A', 'medium'),
('Web Development', 'Which symbol is used for id selectors in CSS?', '.', '#', '@', '$', 'B', 'easy'),
('Web Development', 'What does API stand for?', 'Application Programming Interface', 'Advanced Programming Interface', 'Automated Program Interaction', 'Application Process Integration', 'A', 'medium'),
('Web Development', 'Which property is used to change font size in CSS?', 'text-size', 'font-style', 'font-size', 'text-style', 'C', 'easy'),

-- Data Science Questions
('Data Science', 'What does SQL stand for?', 'Structured Query Language', 'Simple Question Language', 'Structured Question Language', 'Simple Query Language', 'A', 'easy'),
('Data Science', 'Which Python library is primarily used for data manipulation?', 'NumPy', 'Pandas', 'Matplotlib', 'Scikit-learn', 'B', 'medium'),
('Data Science', 'What is the purpose of a confusion matrix?', 'To confuse analysts', 'To evaluate classification models', 'To store data', 'To visualize time series', 'B', 'medium'),
('Data Science', 'Which algorithm is used for classification?', 'Linear Regression', 'K-Means', 'Decision Tree', 'PCA', 'C', 'medium'),
('Data Science', 'What does CSV stand for?', 'Comma Separated Values', 'Character Separated Values', 'Column Separated Values', 'Cell Separated Values', 'A', 'easy'),
('Data Science', 'Which measure is used to find the central tendency?', 'Range', 'Mean', 'Variance', 'Standard Deviation', 'B', 'easy'),
('Data Science', 'What is overfitting in machine learning?', 'Model performs well on training data but poorly on test data', 'Model performs poorly on all data', 'Model is too simple', 'Model has too few features', 'A', 'medium'),
('Data Science', 'Which visualization is best for showing distribution?', 'Pie chart', 'Histogram', 'Line chart', 'Scatter plot', 'B', 'medium'),
('Data Science', 'What does AI stand for?', 'Artificial Intelligence', 'Automated Information', 'Advanced Integration', 'Application Interface', 'A', 'easy'),
('Data Science', 'Which type of learning uses labeled data?', 'Unsupervised Learning', 'Reinforcement Learning', 'Supervised Learning', 'Deep Learning', 'C', 'easy'),

-- Mobile Development Questions
('Mobile Development', 'Which language is primarily used for Android development?', 'Swift', 'Kotlin', 'Python', 'Ruby', 'B', 'easy'),
('Mobile Development', 'What does SDK stand for?', 'Software Development Kit', 'System Development Kit', 'Software Design Kit', 'Standard Development Kit', 'A', 'easy'),
('Mobile Development', 'Which framework is used for cross-platform mobile development?', 'Django', 'React Native', 'Laravel', 'Spring', 'B', 'medium'),
('Mobile Development', 'What is the main layout file format in Android?', 'HTML', 'XML', 'JSON', 'YAML', 'B', 'medium'),
('Mobile Development', 'Which company develops iOS?', 'Google', 'Microsoft', 'Apple', 'Samsung', 'C', 'easy'),
('Mobile Development', 'What is an APK?', 'Application Package Kit', 'Android Package Kit', 'Application Processing Key', 'Android Processing Kit', 'B', 'easy'),
('Mobile Development', 'Which IDE is commonly used for Android development?', 'Xcode', 'Android Studio', 'Visual Studio', 'Eclipse', 'B', 'easy'),
('Mobile Development', 'What does UI stand for?', 'User Interface', 'Universal Interface', 'User Integration', 'Unified Interface', 'A', 'easy'),
('Mobile Development', 'Which programming language is used for iOS development?', 'Java', 'Kotlin', 'Swift', 'C#', 'C', 'easy'),
('Mobile Development', 'What is the purpose of Gradle in Android?', 'Build automation tool', 'Database management', 'UI design', 'Testing framework', 'A', 'medium');