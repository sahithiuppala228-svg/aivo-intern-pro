import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseScreenShareOptions {
  maxWarnings?: number;
  onMaxWarningsReached?: () => void;
}

export const useScreenShare = ({
  maxWarnings = 3,
  onMaxWarningsReached,
}: UseScreenShareOptions = {}) => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isSupported] = useState(() => !!navigator.mediaDevices?.getDisplayMedia);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onMaxWarningsRef = useRef(onMaxWarningsReached);

  useEffect(() => {
    onMaxWarningsRef.current = onMaxWarningsReached;
  }, [onMaxWarningsReached]);

  const handleTrackEnded = useCallback(() => {
    setIsSharing(false);
    setStream(null);

    setWarningCount((prev) => {
      const next = prev + 1;
      if (next >= maxWarnings) {
        toast({
          variant: "destructive",
          title: "Screen Share Violation",
          description: `You stopped screen sharing ${maxWarnings} times. Auto-submitting your test.`,
        });
        setTimeout(() => onMaxWarningsRef.current?.(), 500);
      } else {
        toast({
          variant: "destructive",
          title: `Screen Share Stopped (Warning ${next}/${maxWarnings})`,
          description: `Please resume screen sharing. ${maxWarnings - next} warning(s) remaining before auto-submit.`,
        });
      }
      return next;
    });
  }, [maxWarnings, toast]);

  const startScreenShare = useCallback(async () => {
    if (!isSupported) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Screen sharing is not supported in this browser.",
      });
      return false;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" } as any,
        audio: false,
      });

      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener("ended", handleTrackEnded);
      }

      setStream(mediaStream);
      setIsSharing(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      return true;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Screen Share Required",
        description: "You must share your screen to proceed with the test.",
      });
      return false;
    }
  }, [isSupported, handleTrackEnded, toast]);

  const stopScreenShare = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.removeEventListener("ended", handleTrackEnded);
        track.stop();
      });
      setStream(null);
      setIsSharing(false);
    }
  }, [stream, handleTrackEnded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return {
    isSharing,
    warningCount,
    maxWarnings,
    isSupported,
    videoRef,
    startScreenShare,
    stopScreenShare,
  };
};
