import { useState, useEffect, useRef, useCallback } from "react";

interface FaceDetectionResult {
  faceDetected: boolean;
  faceConfidence: number;
  message: string;
}

export const useFaceDetection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceResult, setFaceResult] = useState<FaceDetectionResult>({
    faceDetected: false,
    faceConfidence: 0,
    message: "Initializing camera..."
  });

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setFaceResult({ faceDetected: false, faceConfidence: 0, message: "Requesting camera access..." });
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setFaceResult({ faceDetected: false, faceConfidence: 0, message: "Camera active. Looking for face..." });
        startFaceDetection();
      }
    } catch (error) {
      console.error("Camera error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to access camera";
      setCameraError(errorMessage);
      setFaceResult({ faceDetected: false, faceConfidence: 0, message: `Camera error: ${errorMessage}` });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
    setFaceResult({ faceDetected: false, faceConfidence: 0, message: "Camera stopped" });
  }, []);

  const startFaceDetection = useCallback(() => {
    const detectFace = () => {
      if (!videoRef.current || !canvasRef.current || !cameraActive) {
        animationFrameRef.current = requestAnimationFrame(detectFace);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (!ctx || video.videoWidth === 0) {
        animationFrameRef.current = requestAnimationFrame(detectFace);
        return;
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);
      
      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple face detection using skin color detection
      // This is a basic heuristic - in production you'd use a proper ML model
      let skinPixels = 0;
      let totalPixels = 0;
      
      // Focus on the center region where face is likely to be
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const regionWidth = canvas.width * 0.5;
      const regionHeight = canvas.height * 0.6;
      
      for (let y = Math.floor(centerY - regionHeight / 2); y < centerY + regionHeight / 2; y++) {
        for (let x = Math.floor(centerX - regionWidth / 2); x < centerX + regionWidth / 2; x++) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Skin color detection (works for various skin tones)
          const isSkinColor = 
            r > 60 && r < 255 &&
            g > 40 && g < 220 &&
            b > 20 && b < 180 &&
            r > g && r > b &&
            Math.abs(r - g) > 15 &&
            r - b > 15;
          
          if (isSkinColor) skinPixels++;
          totalPixels++;
        }
      }
      
      const skinRatio = skinPixels / totalPixels;
      const faceDetected = skinRatio > 0.15 && skinRatio < 0.7; // Reasonable face coverage
      const confidence = Math.min(skinRatio / 0.4, 1) * 100;
      
      let message = "";
      if (!faceDetected && skinRatio < 0.15) {
        message = "No face detected. Please position your face in the center.";
      } else if (!faceDetected && skinRatio >= 0.7) {
        message = "Too close to camera. Please move back slightly.";
      } else if (faceDetected && confidence < 50) {
        message = "Face detected but unclear. Improve lighting.";
      } else if (faceDetected) {
        message = "Face detected! You're ready for the interview.";
      }
      
      setFaceResult({
        faceDetected,
        faceConfidence: Math.round(confidence),
        message
      });
      
      animationFrameRef.current = requestAnimationFrame(detectFace);
    };

    animationFrameRef.current = requestAnimationFrame(detectFace);
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    cameraActive,
    cameraError,
    faceResult,
    startCamera,
    stopCamera
  };
};
