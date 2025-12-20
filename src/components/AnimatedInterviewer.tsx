import { useState, useEffect, useRef } from "react";
import { User, Volume2, VolumeX } from "lucide-react";

interface AnimatedInterviewerProps {
  isSpeaking: boolean;
  currentText: string;
  interviewerName?: string;
}

const AnimatedInterviewer = ({ 
  isSpeaking, 
  currentText, 
  interviewerName = "Dr. Sarah Chen" 
}: AnimatedInterviewerProps) => {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [eyesBlink, setEyesBlink] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);

  // Animate mouth when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(false);
      return;
    }

    const mouthInterval = setInterval(() => {
      setMouthOpen(prev => !prev);
    }, 150);

    return () => clearInterval(mouthInterval);
  }, [isSpeaking]);

  // Natural blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyesBlink(true);
      setTimeout(() => setEyesBlink(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Subtle head movement when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setHeadTilt(0);
      return;
    }

    const tiltInterval = setInterval(() => {
      setHeadTilt(Math.sin(Date.now() / 500) * 2);
    }, 50);

    return () => clearInterval(tiltInterval);
  }, [isSpeaking]);

  return (
    <div className="flex flex-col items-center">
      {/* Interviewer Avatar */}
      <div 
        className="relative w-48 h-48 mb-4"
        style={{ transform: `rotate(${headTilt}deg)` }}
      >
        {/* Head/Face Container */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100 to-amber-200 rounded-full shadow-lg overflow-hidden">
          {/* Hair */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-gray-800 to-gray-700 rounded-t-full" />
          
          {/* Face */}
          <div className="absolute inset-4 top-16 flex flex-col items-center">
            {/* Eyes Container */}
            <div className="flex gap-8 mb-4">
              {/* Left Eye */}
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 bg-white rounded-full" />
                <div 
                  className={`absolute inset-1 bg-gray-800 rounded-full transition-all duration-75 ${
                    eyesBlink ? 'scale-y-0' : 'scale-y-100'
                  }`}
                >
                  <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </div>
              
              {/* Right Eye */}
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 bg-white rounded-full" />
                <div 
                  className={`absolute inset-1 bg-gray-800 rounded-full transition-all duration-75 ${
                    eyesBlink ? 'scale-y-0' : 'scale-y-100'
                  }`}
                >
                  <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </div>
            </div>
            
            {/* Nose */}
            <div className="w-3 h-4 mb-2">
              <div className="w-full h-full bg-amber-300 rounded-full opacity-50" />
            </div>
            
            {/* Mouth */}
            <div 
              className={`bg-red-400 rounded-full transition-all duration-100 ${
                mouthOpen && isSpeaking 
                  ? 'w-8 h-5' 
                  : 'w-10 h-2'
              }`}
            />
          </div>
        </div>
        
        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-1 items-end">
              <div className="w-1 bg-primary rounded animate-pulse" style={{ height: '8px', animationDelay: '0ms' }} />
              <div className="w-1 bg-primary rounded animate-pulse" style={{ height: '14px', animationDelay: '100ms' }} />
              <div className="w-1 bg-primary rounded animate-pulse" style={{ height: '10px', animationDelay: '200ms' }} />
              <div className="w-1 bg-primary rounded animate-pulse" style={{ height: '16px', animationDelay: '300ms' }} />
              <div className="w-1 bg-primary rounded animate-pulse" style={{ height: '8px', animationDelay: '400ms' }} />
            </div>
          </div>
        )}
        
        {/* Professional attire - collar */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32">
          <div className="h-8 bg-gray-700 rounded-t-lg relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[16px] border-l-transparent border-r-transparent border-b-white" />
          </div>
        </div>
      </div>
      
      {/* Name Tag */}
      <div className="bg-card border rounded-lg px-4 py-2 shadow-sm">
        <p className="font-semibold text-foreground">{interviewerName}</p>
        <p className="text-xs text-muted-foreground">Senior Technical Interviewer</p>
      </div>
      
      {/* Current Speech Bubble */}
      {currentText && (
        <div className="mt-4 max-w-md bg-muted rounded-lg p-4 relative">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-muted rotate-45" />
          <p className="text-sm text-foreground relative z-10">{currentText}</p>
        </div>
      )}
    </div>
  );
};

export default AnimatedInterviewer;
