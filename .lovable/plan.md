
# Domain-Based Assessment System - Complete Pre-Seeding & UI Enhancement

## Summary

This plan addresses three key improvements:

1. **Pre-seed coding problems** for all 10 standard domains (currently only 5 domains have problems)
2. **Pre-seed interview questions** for all 10 standard domains (currently only Web Development has questions)
3. **Update instruction pages** to clearly display the selected domain and domain-specific context

---

## Current State

| Component | Database Content | Required |
|-----------|-----------------|----------|
| MCQ Questions | 7-10 domains seeded (30-60 each) | ✅ Complete |
| Coding Problems | 5 domains (10-4 problems each) | ❌ Need 10 problems × 10 domains |
| Interview Questions | 1 domain (20 questions) | ❌ Need 10 questions × 10 domains |

### Missing Domains for Coding Problems:
- DevOps (0 problems)
- Cloud Computing (0 problems)
- Cybersecurity (0 problems)
- Blockchain (0 problems)
- Game Development (0 problems)
- Data Science, ML, Mobile Dev, UI/UX need 6 more each

### Missing Domains for Interview Questions:
- Data Science, Machine Learning, Mobile Development, UI/UX Design
- DevOps, Cloud Computing, Cybersecurity, Blockchain, Game Development

---

## Implementation Plan

### Part 1: Pre-Seed Coding Problems (Database Population)

Trigger the `get-random-coding-problems` edge function for each domain to generate and store 10 problems per domain.

**Domains to seed:**
```text
1. DevOps (0 → 10)
2. Cloud Computing (0 → 10)
3. Cybersecurity (0 → 10)
4. Blockchain (0 → 10)
5. Game Development (0 → 10)
6. Data Science (4 → 10, need 6 more)
7. Machine Learning (4 → 10, need 6 more)
8. Mobile Development (4 → 10, need 6 more)
9. UI/UX Design (4 → 10, need 6 more)
```

---

### Part 2: Pre-Seed Interview Questions (Database Population)

Trigger the `get-random-interview-questions` edge function for each domain to generate and store 10+ questions per domain.

**Domains to seed (9 domains):**
```text
1. Data Science
2. Machine Learning
3. Mobile Development
4. UI/UX Design
5. DevOps
6. Cloud Computing
7. Cybersecurity
8. Blockchain
9. Game Development
```

---

### Part 3: Enhance Instruction Pages with Domain Context

#### 3a. Update AssessmentIntro.tsx

**Changes:**
- Display the selected domain prominently in the header
- Show domain badge/tag near the "Start MCQ Test" button
- Update card descriptions to include domain name

**Before:**
```text
Ready for Your Assessment?
Complete our two-part assessment...
```

**After:**
```text
Ready for Your Web Development Assessment?
Complete the Web Development assessment to verify your skills...
```

---

#### 3b. Update CodingTest.tsx (Instructions View)

**Changes:**
- Already shows domain in title ✅
- Add domain-specific tip or context in the instructions
- Show what types of problems to expect based on domain

**Enhancements:**
- Add section: "What to Expect" with domain-specific problem types
- Example: "Web Development challenges may include: DOM manipulation, API integration, async programming"

---

#### 3c. Update MockInterview.tsx (Instructions View)

**Changes:**
- Already shows domain in greeting ✅
- Add domain context in the instruction card
- Show expected question categories for the domain

**Enhancements:**
- Update instruction text to mention domain-specific topics
- Add "Interview Topics" section showing what areas will be covered

---

## Technical Details

### Domain-Specific Context Mapping

Create a utility that provides context for each domain:

```typescript
const DOMAIN_CONTEXT = {
  "Web Development": {
    codingTopics: ["DOM manipulation", "API integration", "async programming", "state management"],
    interviewTopics: ["Frontend frameworks", "HTTP/REST", "Performance optimization", "Security"]
  },
  "Data Science": {
    codingTopics: ["Data cleaning", "Statistical analysis", "Pandas/NumPy operations", "Visualization"],
    interviewTopics: ["ML fundamentals", "Feature engineering", "Model evaluation", "Data pipelines"]
  },
  // ... other domains
};
```

### Files to Modify

1. **src/pages/AssessmentIntro.tsx**
   - Add domain to header and descriptions
   - Show domain badge on assessment cards
   - Display domain in button text

2. **src/pages/CodingTest.tsx** (Instructions section only)
   - Add "What to Expect" section with domain-specific problem types
   - Add domain context to loading message

3. **src/pages/MockInterview.tsx** (Instructions section only)
   - Add domain-specific interview topics preview
   - Enhance instruction text with domain context

4. **src/lib/domainContext.ts** (New file)
   - Create utility with domain-specific context data
   - Export functions to get coding topics and interview topics by domain

---

## Implementation Sequence

1. **Create domain context utility** - New helper file with domain-specific data
2. **Update AssessmentIntro.tsx** - Add domain to UI
3. **Update CodingTest.tsx** - Add domain context to instructions
4. **Update MockInterview.tsx** - Add domain context to instructions
5. **Trigger seeding for coding problems** - Populate database for all 10 domains
6. **Trigger seeding for interview questions** - Populate database for all 10 domains

---

## Expected User Experience After Implementation

| Step | Before | After |
|------|--------|-------|
| Assessment Intro | Generic "Ready for Your Assessment?" | "Ready for Your **Web Development** Assessment?" |
| MCQ Test | Shows domain ✅ | No change needed |
| Coding Test Instructions | "Coding Test" with domain in subtitle | "Web Development Coding Test" + "Expect: DOM, APIs, async..." |
| Mock Interview Instructions | Domain in greeting | Domain + "Topics: Frontend frameworks, HTTP/REST..." |
| Question Loading | Generates on-demand | Instant load from pre-seeded database |

---

## Seeding Time Estimate

Due to Gemini API rate limits:
- **Coding Problems**: ~5-10 minutes for all domains (with pauses between batches)
- **Interview Questions**: ~5-10 minutes for all domains

Seeding can be done incrementally or in one session with appropriate delays.
