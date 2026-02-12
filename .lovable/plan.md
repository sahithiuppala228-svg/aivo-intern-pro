

# Fix Mock Interview Speech Recognition

## Problem
When you speak during the mock interview, your voice is not being converted to text and your answer is not being analyzed. 

**Root cause:** The app records your entire audio, converts it to a very large file, and tries to send it to a server for transcription. This file is too large and the request fails before it even reaches the server.

## Solution
Replace the server-based transcription with the **browser's built-in speech recognition**, which converts your speech to text in real-time directly on your device — no server needed. The transcribed text will then be sent to the AI for answer analysis (which is a small text request that works reliably).

## What You'll See After the Fix

- When you click the microphone button, your words will appear on screen **in real-time** as you speak
- When you stop recording, the transcribed text is sent for AI analysis
- The interviewer will then speak feedback about your answer
- You can proceed to the next question

## Technical Details

### File: `src/pages/MockInterview.tsx`

1. **Add browser Speech Recognition** using `useRef` for a `SpeechRecognition` instance:
   - Use `webkitSpeechRecognition` (Chrome/Edge) or `SpeechRecognition` (Firefox)
   - Set `continuous = true` and `interimResults = true` for real-time transcription
   - Auto-restart on `onend` if still recording (handles browser silence timeouts)

2. **Replace `startRecording`**:
   - Still request microphone access (for the audio level silence detection)
   - Initialize and start the SpeechRecognition instance
   - On `onresult`, update `currentTranscription` with interim text and `currentAnswer` with final text
   - Keep the existing silence detection timer for the "no audio detected" warning

3. **Replace `stopRecording`**:
   - Stop the SpeechRecognition instance
   - Stop the media stream
   - Take the accumulated `currentAnswer` text and send it directly to the `analyze-interview-answer` edge function (skip the `speech-to-text` function entirely)
   - This request is small (just text) and will succeed reliably

4. **Remove the base64 audio encoding and `speech-to-text` call entirely** from the recording flow

5. **Add cleanup** in the component unmount `useEffect` to stop recognition if active

### No changes needed to edge functions
The `analyze-interview-answer` function already works correctly — it just needs the transcribed text, which will now come from the browser instead of the server.

