

# Improve Mock Interview: Real-World Experience

## Changes Overview

### 1. Add Personal/Introductory Questions to Question Mix
**File: `supabase/functions/get-random-interview-questions/index.ts`**

Update the question distribution to include a new "personal" category. Change from 10 questions (5 technical, 3 behavioral, 2 problem-solving) to 12 questions:
- 2 Personal/introductory (e.g., "Tell me about yourself", "What are your hobbies?", "Describe your educational background")
- 5 Technical (domain-specific)
- 3 Behavioral
- 2 Problem-solving

The personal questions will be asked first (indices 0-1) to simulate a real interview flow where introductions come before technical depth.

Update the AI prompt to generate these personal questions as part of the set.

**File: `src/pages/MockInterview.tsx`**
- Update the `InterviewQuestion` interface to include `"personal"` as a category
- Update the intro speech to mention the interview will start with introductory questions

### 2. Replace Robotic Browser TTS with Natural AI Voice
**File: `src/pages/MockInterview.tsx`**

Replace `window.speechSynthesis` (browser TTS, robotic) with calls to the existing `text-to-speech` edge function which uses OpenAI's TTS API — this produces natural, human-like speech.

- Replace `speakText` function to call the edge function and play the returned base64 audio
- Use the "onyx" voice (deep male voice, natural sounding) to match the male interviewer persona
- Add audio queue management so speeches don't overlap

### 3. Replace Animated Interviewer with Static Realistic Image
**File: `src/components/AnimatedInterviewer.tsx`**

- Remove all animation logic (blinking overlay, mouth animation bars, pulsing ring)
- Display the interviewer image as a clean, static photo — like a real person sitting across from you
- Keep only a subtle "speaking" dot indicator (small green dot) when the interviewer is talking
- Keep the name tag and speech bubble

### Summary of Files to Modify
- `supabase/functions/get-random-interview-questions/index.ts` — Add personal question category
- `src/pages/MockInterview.tsx` — Use OpenAI TTS instead of browser speech, update question category types, reorder to ask personal questions first
- `src/components/AnimatedInterviewer.tsx` — Remove animations, make static realistic display

No database schema changes needed — the `interview_questions` table already has a flexible `category` text column.

