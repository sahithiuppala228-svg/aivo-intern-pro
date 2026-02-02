
# Fix Domain-Based Question Fetching + Pre-Seed All Domains

## Problem Identified

The navigation flow correctly passes the domain from Profile → MCQ → Coding → Interview. However, the database is missing questions for most domains:

| Domain | MCQ Questions | Coding Problems | Interview Questions |
|--------|---------------|-----------------|---------------------|
| Web Development | 30+ | 10 | 20 |
| Data Science | 30+ | 4 | 0 |
| Machine Learning | 30+ | 4 | 0 |
| Mobile Development | 30+ | 4 | 0 |
| UI/UX Design | 30+ | 4 | 0 |
| DevOps | 30+ | 0 | 0 |
| Cloud Computing | 30+ | 0 | 0 |
| Cybersecurity | 30+ | 0 | 0 |
| Blockchain | 30+ | 0 | 0 |
| Game Development | 30+ | 0 | 0 |

When you select a domain like "Cloud Computing", the system tries to fetch questions but finds none, causing delays or failures.

---

## Solution

### Part 1: Pre-Seed All 10 Standard Domains

Trigger the edge functions to generate and store questions for all domains:

**Coding Problems (need 10 per domain):**
- DevOps: Generate 10 problems
- Cloud Computing: Generate 10 problems
- Cybersecurity: Generate 10 problems
- Blockchain: Generate 10 problems
- Game Development: Generate 10 problems
- Data Science: Generate 6 more problems (currently has 4)
- Machine Learning: Generate 6 more problems (currently has 4)
- Mobile Development: Generate 6 more problems (currently has 4)
- UI/UX Design: Generate 6 more problems (currently has 4)

**Interview Questions (need 10 per domain):**
- Data Science: Generate 10 questions
- Machine Learning: Generate 10 questions
- Mobile Development: Generate 10 questions
- UI/UX Design: Generate 10 questions
- DevOps: Generate 10 questions
- Cloud Computing: Generate 10 questions
- Cybersecurity: Generate 10 questions
- Blockchain: Generate 10 questions
- Game Development: Generate 10 questions

---

### Part 2: Improve Edge Function Error Handling

Update `get-random-coding-problems` and `get-random-interview-questions` to:
1. Show clearer loading messages ("Generating Cloud Computing challenges...")
2. Handle generation failures gracefully
3. Ensure domain parameter is used correctly

---

## Implementation Steps

1. **Deploy updated edge functions** (if needed)
2. **Seed Interview Questions** - Call `get-random-interview-questions` for each of the 9 missing domains
3. **Seed Coding Problems** - Call `get-random-coding-problems` for each of the 9 incomplete domains
4. **Verify** - Check database to confirm all domains have sufficient questions

---

## Seeding Process

Due to API rate limits, seeding will be done in batches:

**Batch 1: Interview Questions (9 domains)**
- Call edge function for: Data Science, Machine Learning, Mobile Development, UI/UX Design, DevOps

**Batch 2: Interview Questions (continued)**
- Call edge function for: Cloud Computing, Cybersecurity, Blockchain, Game Development

**Batch 3: Coding Problems (5 domains with 0 problems)**
- Call edge function for: DevOps, Cloud Computing, Cybersecurity, Blockchain, Game Development

**Batch 4: Coding Problems (4 domains needing 6 more each)**
- Call edge function for: Data Science, Machine Learning, Mobile Development, UI/UX Design

---

## Expected Result After Implementation

| Domain | MCQ Questions | Coding Problems | Interview Questions |
|--------|---------------|-----------------|---------------------|
| Web Development | 30+ | 10 | 20 |
| Data Science | 30+ | 10 | 10 |
| Machine Learning | 30+ | 10 | 10 |
| Mobile Development | 30+ | 10 | 10 |
| UI/UX Design | 30+ | 10 | 10 |
| DevOps | 30+ | 10 | 10 |
| Cloud Computing | 30+ | 10 | 10 |
| Cybersecurity | 30+ | 10 | 10 |
| Blockchain | 30+ | 10 | 10 |
| Game Development | 30+ | 10 | 10 |

All domains will load questions instantly from the database without AI generation delays.

---

## Technical Notes

- The existing edge functions (`get-random-coding-problems`, `get-random-interview-questions`) already support domain-based fetching and AI generation fallback
- Seeding is done by calling these functions with each domain name
- Generated questions are automatically stored in the database for future use
- Rate limiting between API calls prevents Gemini API throttling
