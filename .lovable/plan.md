

# Mega Feature Plan: Resume Canvas, Internship Verification, AI Career Tools

This is a large set of features. I will implement them in **3 phases** across multiple messages to keep things manageable and testable.

---

## Phase 1: Enhanced Resume Builder + More Templates

### New Resume Templates (8 total, up from 4)
Add 4 new templates to `src/components/ResumeBuilder/`:
- **Executive** — bold sidebar layout with dark header
- **Academic** — formal, serif-heavy, publications-friendly
- **TechPro** — monospace accents, code-style section headers
- **Elegant** — two-tone with gold accents, script-style name

### Resume Canvas Editor
New page `src/pages/ResumeCanvas.tsx` with:
- Drag-and-drop section reordering (education, skills, projects, experience)
- Inline text editing — click any field to edit directly
- Live preview with selected template
- AI Enhance button per section (calls Lovable AI to rewrite that section)
- Export to PDF via print

### Route Addition
Add `/resume-canvas` route in `App.tsx`, accessible from Certificate page and a new nav item.

---

## Phase 2: Internship Verification & Trust Score

### New Page: `src/pages/InternshipVerifier.tsx`
User pastes an internship listing URL or text. AI analyzes it across 5 checks:

### New Edge Function: `supabase/functions/verify-internship/index.ts`
Uses Lovable AI (gemini-3-flash-preview) to analyze the listing and return structured scores:

| Check | Points | What AI Analyzes |
|-------|--------|-----------------|
| Company Verification | 30 | Company name recognition, website existence, LinkedIn presence |
| Email Domain | 20 | Official domain vs Gmail/Yahoo/random |
| Job Description Quality | 20 | Realistic claims, professional language, clear responsibilities |
| Payment Scam Detection | 20 | Detects "pay to join", registration fees, unrealistic salary claims |
| Online Reputation | 10 | Known company vs unknown, suspicious patterns |

**Output**: Trust Score (0-100), risk level (Safe/Moderate/High Risk), detailed breakdown per check, specific red flags found.

### UI Components
- Trust score circular gauge with color coding (green >70, yellow 40-70, red <40)
- Detailed breakdown cards for each check
- Red flag list with explanations
- "Verified" / "Risky" / "Suspicious" badge

---

## Phase 3: AI Career Intelligence Tools

### 3A. Resume vs Job Description Analyzer
New section in Resume Canvas page:
- Paste job description textarea
- AI compares resume content against JD
- Returns: match %, missing skills, keyword analysis, actionable suggestions
- Edge function: `supabase/functions/analyze-resume-jd/index.ts`

### 3B. AI Skill Gap Detector + 30-Day Plan
New page: `src/pages/SkillGap.tsx`
- Pulls user's test scores from `user_test_attempts` table
- AI analyzes: DSA score, domain score, communication (from interview)
- Generates personalized 30-day learning plan with:
  - Weekly topic breakdown
  - Specific topics to learn (e.g., "Hash Maps", "Recursion")
  - YouTube video suggestions
  - Practice problem recommendations
  - Daily schedule
- Edge function: `supabase/functions/generate-skill-plan/index.ts`

### 3C. Internship Readiness Score
Added to Analytics page:
- Composite score from coding tests, MCQ scores, interview performance
- Breakdown: Coding (X/100), Communication (X/100), Projects (X/100), Overall (X/100)
- AI verdict: "Ready for startup internships" / "Need to improve X before product companies"

---

## Technical Details

### New Edge Functions (all using Lovable AI gateway)
1. `verify-internship` — analyzes internship listing text, returns trust score
2. `analyze-resume-jd` — compares resume vs job description
3. `generate-skill-plan` — creates 30-day learning plan from test scores
4. `enhance-resume-section` — AI rewrites a single resume section

### New Pages
- `src/pages/ResumeCanvas.tsx` — full canvas resume editor
- `src/pages/InternshipVerifier.tsx` — trust score checker
- `src/pages/SkillGap.tsx` — skill gap + 30-day plan

### New Components
- `src/components/ResumeBuilder/ResumeTemplateExecutive.tsx`
- `src/components/ResumeBuilder/ResumeTemplateAcademic.tsx`
- `src/components/ResumeBuilder/ResumeTemplateTechPro.tsx`
- `src/components/ResumeBuilder/ResumeTemplateElegant.tsx`
- `src/components/TrustScoreGauge.tsx`
- `src/components/SkillRadarChart.tsx`

### No Database Changes Required
All new features use existing tables (`user_test_attempts`) and Lovable AI. No new tables needed.

---

## Implementation Order
1. **Phase 1** first — 4 new templates + canvas editor + AI section enhancement
2. **Phase 2** next — internship verification with trust score
3. **Phase 3** last — resume analyzer, skill gap detector, readiness score

I will start with Phase 1 after approval.

