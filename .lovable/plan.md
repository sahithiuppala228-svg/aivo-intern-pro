
## MCQ Questions: Domain-Specific Loading with Custom Domain Support

### Summary
Implement a system where MCQ questions are loaded based on the domain selected in the profile page:
- **Pre-seeded domains** (Web Development, Data Science, Mobile Development, etc.): Fetch 50 questions from the database
- **Custom domains** (user-created): Generate 50 questions on-the-fly using AI

---

### Current State Analysis

| Aspect | Current Behavior |
|--------|------------------|
| Database | 50 questions for Web Development, 10 each for Data Science and Mobile Development |
| Domain source | Passed from ProfileSetup → AssessmentIntro → MCQTest via navigation state |
| Pre-defined domains | 10 domains defined in ProfileSetup.tsx |
| Custom domains | Users can add custom domains via input field |
| Question fetching | `get-random-mcq-questions` only fetches from DB, returns error if < 50 available |

---

### Changes Required

#### 1. Update `get-random-mcq-questions` Edge Function
**Purpose:** Handle both pre-seeded and custom domains intelligently

**Logic:**
```text
+-------------------+
|  Receive domain   |
+---------+---------+
          |
          v
+-------------------+
| Check if domain   |
| has >= 50 questions|
| in database       |
+---------+---------+
          |
    +-----+-----+
    |           |
    v           v
  >= 50       < 50
    |           |
    v           v
Fetch from   Generate 50
database     via AI
    |           |
    +-----+-----+
          |
          v
   Return questions
```

**Changes:**
- Add a list of "pre-seeded domains" that must have questions in DB
- If domain is pre-seeded and has < 50 questions, return an error (admin must seed)
- If domain is NOT pre-seeded (custom), generate questions using AI on-the-fly
- For custom domains, use the existing `seed-mcq-questions` AI generation logic inline

#### 2. Update `MCQTest.tsx`
**Purpose:** Better handle custom domain generation with appropriate loading messages

**Changes:**
- Detect if the domain is a "custom domain" vs "pre-seeded domain"
- Show different loading messages:
  - Pre-seeded: "Loading questions..."
  - Custom: "Generating questions for [domain]... This may take a moment."
- Handle the `isCustomDomain` flag in the response

#### 3. Add Pre-seeded Domain Constants
**Purpose:** Create a shared list of domains that should have pre-seeded questions

**New constant in edge function:**
```typescript
const PRESEEDED_DOMAINS = [
  "Web Development",
  "Data Science",
  "Machine Learning",
  "Mobile Development",
  "UI/UX Design",
  "DevOps",
  "Cloud Computing",
  "Cybersecurity",
  "Blockchain",
  "Game Development"
];
```

---

### Technical Implementation

#### Edge Function Changes (`get-random-mcq-questions/index.ts`)

1. Define `PRESEEDED_DOMAINS` array
2. Check if incoming domain is in the pre-seeded list
3. If pre-seeded domain:
   - Fetch from database
   - Return error if insufficient questions
4. If custom domain:
   - Check database first (in case it was previously generated)
   - If < 50 available, generate using Lovable AI API
   - Save generated questions to database for future use
   - Return the questions

#### Frontend Changes (`MCQTest.tsx`)

1. Add `isCustomDomain` check based on `availableDomains` constant
2. Update loading message based on domain type
3. Handle longer generation times for custom domains gracefully

---

### Database Impact

- **Pre-seeded domains**: No change, questions fetched from existing pool
- **Custom domains**: Questions are generated and stored for reuse
- New questions for custom domains will be saved with the custom domain name

---

### Files to Modify

1. **`supabase/functions/get-random-mcq-questions/index.ts`**
   - Add PRESEEDED_DOMAINS constant
   - Add AI generation logic for custom domains
   - Save generated questions to database

2. **`src/pages/MCQTest.tsx`**
   - Add availableDomains constant (or import from shared location)
   - Update loading messages for custom domains

---

### Expected Behavior After Implementation

| Scenario | User Action | System Response |
|----------|-------------|-----------------|
| Pre-seeded domain with 50+ questions | Select "Web Development" | Fetch 50 random questions from DB instantly |
| Pre-seeded domain with < 50 questions | Select "Machine Learning" | Show error: "Please contact admin to seed questions" |
| Custom domain (first time) | Add "Artificial Intelligence" | Generate 50 questions via AI (~30-60 seconds), save to DB |
| Custom domain (repeat) | Select "Artificial Intelligence" again | Fetch from DB (already generated) |
