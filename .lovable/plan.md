

# Fix: Face Detection Not Working in MCQ & Coding Tests

## Root Cause

The `<video>` element with `ref={cameraVideoRef}` is **only rendered after `cameraReady` is true** (conditional rendering). But `cameraReady` is set to `true` **after** `startCamera()` completes. Inside `startCamera()`, when it tries `videoRef.current.srcObject = stream`, the ref is `null` because the video element doesn't exist in the DOM yet. So the camera stream is obtained but never attached to the video, and face detection never starts.

Additionally, `startCamera` calls `await loadModels()` before `getUserMedia`, which can break the user gesture chain in some browsers.

## Fix

### 1. `src/pages/MCQTest.tsx` and `src/pages/CodingTest.tsx`
- **Always render the video element** (hidden when camera not ready) so the ref is available when `startCamera` runs
- Move `setCameraReady(true)` call to be set alongside camera activation, not blocking the ref

### 2. `src/hooks/useFaceDetection.ts`
- Call `getUserMedia` **first** (directly in the click handler chain) before `loadModels()`, so the user gesture is preserved
- Then load models and start detection after stream is already attached

### Files to Modify
- `src/hooks/useFaceDetection.ts` — reorder: getUserMedia first, then loadModels
- `src/pages/MCQTest.tsx` — always render video element (hidden when not active)
- `src/pages/CodingTest.tsx` — same video element fix

