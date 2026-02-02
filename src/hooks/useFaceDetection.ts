import { useState, useEffect, useRef, useCallback } from "react";
import * as faceapi from "face-api.js";

interface FaceDetectionResult {
  faceDetected: boolean;
  faceCount: number;
  faceConfidence: number;
  message: string;
  singlePersonValidated: boolean;
}

export const useFaceDetection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const modelsLoadedRef = useRef(false);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceResult, setFaceResult] = useState<FaceDetectionResult>({
    faceDetected: false,
    faceCount: 0,
    faceConfidence: 0,
    message: "Initializing camera...",
    singlePersonValidated: false
  });

  // Load face-api.js models
  const loadModels = useCallback(async () => {
    if (modelsLoadedRef.current) return true;
    
    setModelsLoading(true);
    setFaceResult(prev => ({ ...prev, message: "Loading face detection models..." }));
    
    try {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      modelsLoadedRef.current = true;
      setModelsLoaded(true);
      setModelsLoading(false);
      console.log("Face detection models loaded successfully");
      return true;
    } catch (error) {
      console.error("Error loading face detection models:", error);
      setModelsLoading(false);
      setFaceResult(prev => ({ 
        ...prev, 
        message: "Failed to load face detection. Using fallback detection." 
      }));
      return false;
    }
  }, []);

  // Start face detection loop using face-api.js
  const startFaceDetection = useCallback(() => {
    const detectFace = async () => {
      if (!videoRef.current || !modelsLoadedRef.current) {
        animationFrameRef.current = requestAnimationFrame(detectFace);
        return;
      }

      const video = videoRef.current;
      
      if (video.readyState < 2 || video.videoWidth === 0) {
        animationFrameRef.current = requestAnimationFrame(detectFace);
        return;
      }

      try {
        // Detect all faces in the frame
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.5
          })
        );

        const faceCount = detections.length;
        const highestConfidence = faceCount > 0 
          ? Math.max(...detections.map(d => d.score)) * 100 
          : 0;

        let message = "";
        let faceDetected = false;
        let singlePersonValidated = false;

        if (faceCount === 0) {
          message = "No face detected. Please position your face in the center.";
          faceDetected = false;
          singlePersonValidated = false;
        } else if (faceCount === 1) {
          faceDetected = true;
          singlePersonValidated = true;
          if (highestConfidence >= 70) {
            message = "Face detected! You're ready for the interview.";
          } else {
            message = "Face detected but unclear. Try better lighting.";
          }
        } else {
          // Multiple faces detected
          faceDetected = true;
          singlePersonValidated = false;
          message = `Multiple people detected (${faceCount})! Only you should be visible for the interview.`;
        }

        setFaceResult({
          faceDetected,
          faceCount,
          faceConfidence: Math.round(highestConfidence),
          message,
          singlePersonValidated
        });

      } catch (error) {
        console.error("Face detection error:", error);
      }

      // Run detection at ~10 FPS for performance
      setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(detectFace);
      }, 100);
    };

    animationFrameRef.current = requestAnimationFrame(detectFace);
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
    setFaceResult({ 
      faceDetected: false, 
      faceCount: 0,
      faceConfidence: 0, 
      message: "Camera stopped",
      singlePersonValidated: false
    });
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setFaceResult({ 
        faceDetected: false, 
        faceCount: 0,
        faceConfidence: 0, 
        message: "Requesting camera access...",
        singlePersonValidated: false
      });
      
      // Load models first
      const modelsReady = await loadModels();
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
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
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.log("Video play error, will retry:", playError);
        }
      }
      
      setCameraActive(true);
      
      if (modelsReady) {
        setFaceResult({ 
          faceDetected: false, 
          faceCount: 0,
          faceConfidence: 0, 
          message: "Camera active. Looking for face...",
          singlePersonValidated: false
        });
        startFaceDetection();
      } else {
        // Fallback message if models didn't load
        setFaceResult({ 
          faceDetected: false, 
          faceCount: 0,
          faceConfidence: 0, 
          message: "Camera active. Face detection unavailable.",
          singlePersonValidated: false
        });
      }
    } catch (error) {
      console.error("Camera error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to access camera";
      setCameraError(errorMessage);
      setFaceResult({ 
        faceDetected: false, 
        faceCount: 0,
        faceConfidence: 0, 
        message: `Camera error: ${errorMessage}`,
        singlePersonValidated: false
      });
    }
  }, [loadModels, startFaceDetection]);

  // Re-attach stream to video on re-renders
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      const checkVideo = setInterval(() => {
        if (videoRef.current && streamRef.current) {
          if (!videoRef.current.srcObject || videoRef.current.srcObject !== streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(() => {});
          }
        }
      }, 500);
      return () => clearInterval(checkVideo);
    }
  }, [cameraActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    cameraActive,
    cameraError,
    faceResult,
    modelsLoading,
    modelsLoaded,
    startCamera,
    stopCamera
  };
};
