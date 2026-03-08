Fix Security Issues and Add Anti-Cheating Measures

## Part 1: Fix Security Scan Errors

### 1A. MCQ Test Answers Accessible via Direct Query

The `mcq_questions` table already has `USING (false)` RLS policy from a previous fix. The security finding is stale and needs to be deleted.

### 1B. Coding Test Cases Fully Exposed - Students Can Hardcode Solutions

The `coding_problems` table has `USING (true)` RLS policy, exposing ALL test cases (including hidden ones with expected outputs) to any authenticated user. Students can query the table directly and get all answers.

**Fix:**

- Change `coding_problems` RLS SELECT policy to `USING (false)` (block direct access)
- Create a `coding_problems_public` view that excludes `test_cases` (hidden answers) and `sample_output`
- Update the `get-random-coding-problems` edge function to only send visible test cases to the client (strip hidden test case expected outputs)
- Create a new edge function `validate-coding-solution` that evaluates code server-side against hidden test cases

### 1C. Test Answers Exposed - Students Can Cheat on Assessments

This is about the overall pattern. The practice_questions and interview_questions tables are already locked down. The remaining exposure is in coding_problems (addressed above).

## Part 2: Anti-Cheating Proctoring for MCQ and Coding Tests

### 2A. Create a Reusable Proctoring Hook

Build a `useProctoring` hook that handles:

- **Camera monitoring**: Uses the existing `useFaceDetection` hook to continuously monitor the camera during tests
- **Camera off detection**: If the camera stream stops or is denied, show a warning toast and a persistent warning banner
- **Multiple faces detection**: Warn if more than one person is detected
- **No face detection**: Warn if the student leaves the camera view
- **Warning counter**: Track warnings; after 3 warnings, auto-submit the test

### 2B. Add Proctoring to MCQ Test Page

- Require camera permission before starting the test
- Show a small camera preview in the corner during the test
- Display warning banners when violations are detected
- Auto-submit after repeated violations

### 2C. Add Proctoring to Coding Test Page

- Same camera monitoring as MCQ test
- Show camera preview and warning system
- Auto-submit on repeated violations

### 2D. Voice/Audio Monitoring

- Use the existing audio detection pattern (from MockInterview) to monitor for suspicious audio during MCQ and coding tests
- Detect if the student is talking to someone (potential cheating)
- Warn on sustained voice detection during written tests

## Technical Details

### Database Migration

```sql
-- Block direct access to coding_problems
DROP POLICY IF EXISTS "Anyone can read coding problems" ON public.coding_problems;
CREATE POLICY "Block direct select on coding_problems"
  ON public.coding_problems FOR SELECT
  USING (false);

-- Create public view without hidden test case data
CREATE VIEW public.coding_problems_public
WITH (security_invoker = on) AS
SELECT id, domain, title, description, difficulty,
       input_format, output_format, constraints,
       sample_input, sample_output, created_at
FROM public.coding_problems;
```

### Edge Function Changes (`get-random-coding-problems`)

- Strip `test_cases` from the response sent to client
- Only include visible test cases (first 2) with their expected outputs
- Hidden test cases: send input only (no expected output) so UI can show "Hidden Test Case" labels

### New Edge Function (`validate-coding-solution`)

- Accepts: problem_id, user_code
- Server-side: fetches full test cases from DB (using service role)
- Evaluates code against all test cases (visible + hidden)
- Returns: pass/fail results per test case (without exposing expected outputs for hidden cases)

### New Hook: `useProctoring`

```typescript
interface ProctoringConfig {
  requireCamera: boolean;
  requireAudio: boolean;
  maxWarnings: number;
  onMaxWarningsReached: () => void;
}

// Returns: warningCount, violations[], cameraPreview component, isProctoring
```

### Files to Create

- `src/hooks/useProctoring.ts` - Reusable proctoring hook
- `supabase/functions/validate-coding-solution/index.ts` - Server-side code validation

### Files to Modify

- `src/pages/MCQTest.tsx` - Add proctoring (camera + audio monitoring)
- `src/pages/CodingTest.tsx` - Add proctoring + use server-side validation
- `supabase/functions/get-random-coding-problems/index.ts` - Strip hidden test case answers

### Security Finding Updates

- Delete stale `mcq_correct_answers_exposed` finding
- Delete `coding_test_cases_exposed` finding after fix
- Delete `test_answers_exposed` finding after fix