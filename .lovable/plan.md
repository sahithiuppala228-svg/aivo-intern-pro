

# Add Screen Share Monitoring to Mock Interview, MCQ Test, and Coding Test

## Overview
Add a screen sharing requirement to all three test pages. Students must share their screen before starting, and if they stop sharing, they get warnings (similar to proctoring). This prevents tab-switching, looking up answers, or using external tools.

## Implementation

### 1. Create Reusable Hook: `src/hooks/useScreenShare.ts`
- `startScreenShare()` — calls `navigator.mediaDevices.getDisplayMedia()` to request screen share
- Listens to the `ended` event on the video track (fires when user clicks "Stop sharing")
- Tracks: `isSharing`, `warningCount`, `stream`
- On share stopped: increments warning count, shows toast warning, calls `onMaxWarnings` callback after 3 violations
- `stopScreenShare()` — cleanup on test completion
- Small screen share preview component (thumbnail in corner showing what's being shared)

### 2. Modify `src/pages/MockInterview.tsx`
- Add screen share requirement to the pre-interview setup (alongside camera/mic test)
- Show screen share preview thumbnail in bottom corner during interview
- If screen share stops mid-interview: warning toast + re-prompt; after 3 stops, auto-end interview
- Add `Monitor` icon import from lucide-react

### 3. Modify `src/pages/MCQTest.tsx`
- Add screen share step in the instructions/start phase before test begins
- Show small preview during test
- Warning system: 3 violations = auto-submit

### 4. Modify `src/pages/CodingTest.tsx`
- Same pattern: require screen share before starting
- Show preview, warning system, auto-submit on repeated violations

### Technical Details
- Uses standard `getDisplayMedia` API — works in all modern browsers
- The `ended` event on `MediaStreamTrack` detects when user stops sharing
- No backend changes needed — this is purely client-side monitoring
- Graceful fallback: if browser doesn't support screen sharing, show a warning but allow proceeding

### Files to Create
- `src/hooks/useScreenShare.ts`

### Files to Modify
- `src/pages/MockInterview.tsx`
- `src/pages/MCQTest.tsx`
- `src/pages/CodingTest.tsx`

