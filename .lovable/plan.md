

## Remove Practice Page & Add Domain-Based Interview Questions

### Summary
This plan covers three main changes:
1. **Remove Practice Mode page** - The page is no longer needed in the assessment flow
2. **Pre-seed coding problems** - Complete seeding for all 10 domains (currently partially seeded)
3. **Create domain-based interview questions system** - Store and fetch interview questions from database based on domain, with AI generation for custom domains

---

### Current State

| Component | Status |
|-----------|--------|
| Practice Mode | Exists but uses dummy data, not integrated into main flow |
| Coding Problems | 5 domains partially seeded (Web Dev: 10, others: 4 each) |
| Interview Questions | Hardcoded in `getInterviewQuestions()` function in MockInterview.tsx |

---

### Changes Overview

#### Part 1: Remove Practice Mode Page

**Files to modify:**
- `src/App.tsx` - Remove route and import
- `src/pages/Analytics.tsx` - Remove link to practice mode
- `src/pages/PracticeMode.tsx` - Delete file

**Changes:**
- Remove `/practice-mode` route from App.tsx
- Remove the "Practice Mode" button from Analytics.tsx
- Delete the PracticeMode.tsx file

---

#### Part 2: Seed Coding Problems for All Domains

The coding problem infrastructure is already in place. Currently:
- Web Development: 10 problems (complete)
- Data Science, ML, Mobile Dev, UI/UX: 4 each (incomplete)
- DevOps, Cloud Computing, Cybersecurity, Blockchain, Game Development: 0 problems

**Action:** Use the existing `get-random-coding-problems` edge function to trigger generation for remaining domains. This will happen automatically when users access those domains, or can be triggered manually.

---

#### Part 3: Interview Questions Database System

Create a similar pattern to MCQ and coding questions for interview questions.

**Database Changes:**
Create new `interview_questions` table:
```sql
CREATE TABLE public.interview_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  question TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'behavioral', 'problem-solving')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  expected_points JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_interview_questions_domain ON public.interview_questions(domain);
```

**New Edge Function: `get-random-interview-questions`**
- Similar to get-random-mcq-questions
- Fetches 10 interview questions per domain
- Distribution: 5 technical, 3 behavioral, 2 problem-solving
- Falls back to AI generation for custom domains

**Frontend Changes: `MockInterview.tsx`**
- Replace hardcoded `getInterviewQuestions()` function with database fetch
- Add loading state for fetching/generating questions
- Pass domain to edge function

---

### Technical Implementation Details

#### Interview Questions Edge Function Logic

```text
Request with domain
       ↓
Check database for interview questions
       ↓
Found >= 10 questions? → Return random selection
       ↓ No
Generate via Gemini AI
       ↓
Save to database
       ↓
Return questions
```

**Question Distribution:**
- 5 Technical questions (domain-specific)
- 3 Behavioral questions
- 2 Problem-solving questions

**AI Generation Prompt Structure:**
- Generate domain-specific technical questions
- Include expected points for evaluation
- Mix difficulty levels (easy, medium, hard)

---

### Files to Modify

1. **`src/App.tsx`** - Remove PracticeMode import and route

2. **`src/pages/Analytics.tsx`** - Remove practice mode button

3. **`src/pages/PracticeMode.tsx`** - Delete file

4. **New: `supabase/functions/get-random-interview-questions/index.ts`**
   - Create edge function for fetching/generating interview questions
   - Include AI generation logic for custom domains

5. **`supabase/config.toml`** - Add new edge function config

6. **`src/pages/MockInterview.tsx`**
   - Replace `getInterviewQuestions()` with database fetch
   - Add loading state during question fetch
   - Update question interface to match database schema

---

### Expected Behavior After Implementation

| Scenario | User Action | System Response |
|----------|-------------|-----------------|
| Standard domain interview | Start "Web Development" interview | Fetch 10 questions from DB instantly |
| Custom domain interview | Start "Quantum Computing" interview | Generate 10 questions via AI (~10-20 sec), save to DB |
| Repeat custom domain | Start same custom domain again | Fetch from DB (previously generated) |

---

### Migration Script for Seeding Standard Domains

After table creation, seed interview questions for all 10 standard domains using the existing pattern from MCQ seeding.

