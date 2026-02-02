

# Fix Camera Display and Face Detection

## Root Cause Identified

The investigation reveals that:
1. Models load successfully (200 OK network responses)
2. Camera stream is obtained (no errors logged)
3. Face detection loop runs (console logs show repeated detection attempts)
4. BUT detection always returns 0 faces

**The actual problem**: Looking at the screenshot, the video area shows a crossed-out camera placeholder instead of the actual video feed. This means the `<video>` element is not displaying the camera stream, even though the stream was obtained successfully.

The issue is a **React ref connection problem** - the `videoRef` from the `useFaceDetection` hook is losing its connection to the actual DOM video element, likely due to:
1. The video element being conditionally rendered
2. The ref not being properly attached when the stream is set
3. The video not auto-playing correctly

---

## Solution

### Step 1: Fix Video Element Display in useFaceDetection.ts

**Problem**: The hook sets `videoRef.current.srcObject = stream` but the video may not be playing or displaying.

**Fixes**:
1. Add `muted` attribute programmatically (required for autoplay)
2. Ensure `play()` is called after srcObject is set
3. Add explicit video element styles to ensure visibility
4. Add a polling mechanism to re-attach stream if video goes blank

### Step 2: Fix Video Element Rendering in MockInterview.tsx

**Problem**: The video element may be losing its ref when the component re-renders.

**Fixes**:
1. Ensure the video element has explicit `width` and `height` attributes
2. Add a fallback UI when video stream is not active
3. Add error handling for video play failures

### Step 3: Add Robust Stream Re-attachment

**Problem**: If the video loses its srcObject, face detection will fail.

**Fixes**:
1. Periodically check if video.srcObject matches the stored stream
2. Re-attach if needed
3. Re-trigger play() if video is paused

---

## Technical Changes

### File: `src/hooks/useFaceDetection.ts`

**Changes**:

1. **Ensure video plays correctly**:
   - Set `video.muted = true` before playing (required for autoplay)
   - Set `video.playsInline = true` 
   - Call `play()` with proper error handling

2. **Add stream health monitoring**:
   - Check if video tracks are still active
   - Re-attach stream if video element loses connection
   - Log video state for debugging

3. **Improve detection loop**:
   - Add check for video.paused and auto-resume
   - Add check for video.srcObject and re-attach if null
   - Increase detection reliability with better error handling

### File: `src/pages/MockInterview.tsx`

**Changes**:

1. **Video element attributes**:
   - Add explicit `width="640"` and `height="480"` attributes
   - Ensure `muted` is set (required for autoplay without user gesture)
   - Add `onLoadedData` event to confirm video is playing

2. **Add video status indicator**:
   - Show "Camera starting..." while waiting for video
   - Show actual video dimensions for debugging (can be removed later)
   - Add visual indicator when video stream is active vs inactive

---

## Implementation Details

### Key Code Changes in useFaceDetection.ts

**In `startCamera` function**:
```typescript
// After getting stream
if (videoRef.current) {
  // CRITICAL: Set muted BEFORE setting srcObject for autoplay to work
  videoRef.current.muted = true;
  videoRef.current.playsInline = true;
  videoRef.current.srcObject = stream;
  
  // Wait for video to be ready
  await new Promise<void>((resolve) => {
    if (videoRef.current) {
      videoRef.current.onloadeddata = () => {
        console.log("Video loaded, dimensions:", 
          videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
        resolve();
      };
    }
  });
  
  // Play with retry
  try {
    await videoRef.current.play();
  } catch (playError) {
    console.error("Play failed, retrying:", playError);
    // Retry after short delay
    setTimeout(async () => {
      try {
        await videoRef.current?.play();
      } catch (e) {
        console.error("Play retry failed:", e);
      }
    }, 100);
  }
}
```

**Add video health check in detection loop**:
```typescript
const detectFace = async () => {
  const video = videoRef.current;
  
  // Check if video is actually playing with content
  if (!video || !video.srcObject) {
    // Re-attach stream if available
    if (streamRef.current && video) {
      video.srcObject = streamRef.current;
      video.play().catch(() => {});
    }
    // Continue loop
    setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(detectFace);
    }, 100);
    return;
  }
  
  // Resume if paused
  if (video.paused) {
    video.play().catch(() => {});
  }
  
  // ... rest of detection logic
};
```

### Key Code Changes in MockInterview.tsx

**Video element improvements**:
```tsx
<video
  ref={videoRef}
  autoPlay
  playsInline
  muted
  width={640}
  height={480}
  className="w-full h-full object-cover"
  style={{ transform: 'scaleX(-1)' }}
  onLoadedData={() => console.log("Video element loaded data")}
/>
```

---

## Expected Behavior After Fix

1. **Camera test starts**: User clicks "Begin Camera Test"
2. **Camera permission**: Browser requests camera access
3. **Stream obtained**: Video stream is captured
4. **Video displays**: User sees themselves in the video (mirrored)
5. **Face detection runs**: face-api.js detects faces in the video
6. **Result shown**: 
   - "No face detected" if face not in frame
   - "1 face detected" with green checkmark if face is centered
   - "Multiple faces detected" with red warning if more than one person
7. **Continue enabled**: Button becomes clickable when exactly 1 face is detected

---

## Files to Modify

1. **`src/hooks/useFaceDetection.ts`**
   - Add muted/playsInline attributes
   - Improve play() error handling
   - Add stream health monitoring
   - Add video re-attachment logic

2. **`src/pages/MockInterview.tsx`**
   - Add explicit width/height to video element
   - Add onLoadedData event handler
   - Improve loading state display

---

## Testing Steps

After implementation:
1. Go to Mock Interview page
2. Click "Begin Camera Test"
3. Allow camera permission when prompted
4. Verify video shows your face (not a placeholder icon)
5. Verify face detection badge appears showing "1 face detected"
6. Verify green checkmark and success message appears
7. Verify "Continue to Audio Test" button becomes enabled
8. Test with multiple people in frame to verify warning appears

