

# Fix Camera Detection & Add Real-Time AI Answer Analysis

## Summary

This plan addresses two critical issues:
1. **Camera not detecting face** - Debug and fix the video element display and face detection
2. **Real-time speech-to-text with AI analysis** - Convert speech to text live, then analyze with AI for intelligent feedback

---

## Part 1: Camera & Face Detection Fix

### Current Issue
The console shows "Face detection models loaded successfully" and the model files load correctly (200 OK). The issue is likely:
- Video element not properly displaying
- Camera stream not being attached correctly
- Face detection loop not running after video starts playing

### Fixes

**1. Add video `onloadedmetadata` event handler**
Wait for the video to have actual dimensions before starting face detection.

**2. Force video element to be visible**
Add explicit width/height and ensure the video is not hidden by CSS.

**3. Add retry logic for face detection**
If face detection returns 0 faces for more than 5 seconds with an active camera, retry the detection loop.

**4. Add debug logging**
Log video dimensions, ready state, and detection results to help diagnose issues.

---

## Part 2: Real-Time Speech-to-Text with AI Analysis

### Current Problem
- Speech is converted to text only AFTER recording stops
- Answer evaluation uses a basic word-count algorithm
- Feedback is generic, not based on actual answer content

### Solution: ElevenLabs Real-Time STT + AI Answer Analysis

**Option 1: ElevenLabs Scribe (Recommended)**
Use ElevenLabs real-time speech-to-text for live transcription while speaking.

**Option 2: OpenAI Whisper (Current)**
Keep current approach but add AI-powered analysis.

### Implementation Flow

```
User speaks → Live transcription displays → 
Stop recording → AI analyzes full answer →
Interviewer gives intelligent feedback
```

---

## Technical Implementation

### Step 1: Enhance Face Detection Reliability

**File: `src/hooks/useFaceDetection.ts`**
- Add `onloadedmetadata` callback to start detection only when video is ready
- Add debug logging for video dimensions and detection results
- Add automatic retry if detection continuously fails

### Step 2: Add Live Transcription Display

**File: `src/pages/MockInterview.tsx`**
- Show transcription updating in real-time while recording
- Use a streaming approach with the STT service
- Display partial results as user speaks

### Step 3: Create AI Answer Analysis Edge Function

**New File: `supabase/functions/analyze-interview-answer/index.ts`**

This function will:
1. Receive the user's transcribed answer
2. Receive the question and expected points
3. Use Lovable AI (Gemini) to analyze the answer
4. Return structured feedback:
   - Score (0-100)
   - Level (Excellent/Good/Needs Improvement)
   - Specific strengths identified
   - Areas for improvement
   - Suggested better answer approach

**AI Prompt Structure:**
```
You are an expert technical interviewer evaluating a candidate's answer.

Question: {question}
Expected concepts to cover: {expectedPoints}
Domain: {domain}

Candidate's Answer: {answer}

Evaluate the answer and provide:
1. Score (0-100)
2. Level: "Excellent" | "Good" | "Satisfactory" | "Needs Improvement"
3. Strengths: What the candidate did well
4. Improvements: What could be better
5. Verbal Feedback: A 2-3 sentence spoken feedback for the interviewer to say
```

### Step 4: Update MockInterview.tsx Answer Flow

**Recording Flow:**
1. User clicks "Start Recording"
2. Audio is recorded AND sent to STT in chunks (if using real-time STT)
3. Live transcription displays on screen
4. User clicks "Stop Recording"
5. Full transcription is sent to AI analysis function
6. AI returns detailed feedback
7. Interviewer speaks the verbal feedback
8. Detailed scores display on screen

### Step 5: Enhanced Feedback Display

**After each answer, show:**
- Score gauge (0-100)
- Level badge (Excellent/Good/etc.)
- Strengths list with checkmarks
- Improvements list with suggestions
- Interviewer speaks personalized feedback

---

## Files to Create/Modify

### New Files:
1. **`supabase/functions/analyze-interview-answer/index.ts`**
   - AI-powered answer analysis
   - Uses Lovable AI gateway (Gemini)
   - Returns structured feedback

### Modified Files:
1. **`src/hooks/useFaceDetection.ts`**
   - Add video ready state checking
   - Improve detection reliability
   - Add debug logging

2. **`src/pages/MockInterview.tsx`**
   - Add live transcription display
   - Call new AI analysis function
   - Display detailed feedback after each answer
   - Update interviewer speech with AI-generated feedback

---

## Expected User Experience

### Camera Test:
1. Click "BEGIN CAMERA TEST"
2. Camera starts, face detection models load
3. Video displays clearly with your face
4. Badge shows "1 face detected" when face is visible
5. Green message: "Face detected! You're ready for the interview."
6. Continue button enables

### During Interview:
1. Interviewer asks question (with speech)
2. Click "Start Recording"
3. **Live text appears as you speak** (real-time transcription)
4. Click "Stop Recording"
5. "Analyzing..." appears briefly
6. Interviewer speaks: "That was an excellent answer, {name}. You covered the key concepts of {topic}. I particularly liked how you explained {specific point}. To improve, you could also mention {suggestion}."
7. Detailed feedback panel shows:
   - Score: 85/100
   - Level: Excellent
   - Strengths: [list]
   - Areas to Improve: [list]

---

## Technical Details

### ElevenLabs STT vs OpenAI Whisper

| Feature | ElevenLabs Scribe | OpenAI Whisper |
|---------|------------------|----------------|
| Real-time | Yes (streaming) | No (batch) |
| Latency | Very low | Higher |
| Cost | Uses existing API key | Uses existing API key |
| Implementation | WebSocket streaming | REST API after recording |

**Recommendation:** Start with OpenAI Whisper (already working) + add AI analysis. Add ElevenLabs real-time STT as an enhancement if needed.

### AI Model for Analysis
Use `google/gemini-2.5-flash` via Lovable AI gateway for:
- Fast response times
- Good reasoning for feedback generation
- No additional API key needed

---

## Implementation Order

1. **Fix face detection** - Add video ready state checks and logging
2. **Create analyze-interview-answer function** - AI-powered analysis
3. **Update MockInterview.tsx** - Integrate AI analysis into the flow
4. **Add live transcription display** - Show text updating while speaking
5. **Enhanced feedback UI** - Rich feedback display after each answer

This will transform the interview from basic word-counting to intelligent AI-powered analysis with meaningful, personalized feedback.

