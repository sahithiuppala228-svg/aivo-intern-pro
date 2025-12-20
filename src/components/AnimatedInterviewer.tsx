import { useState, useEffect } from "react";
import maleInterviewerImage from "@/assets/male-interviewer.png";

interface AnimatedInterviewerProps {
  isSpeaking: boolean;
  currentText: string;
  interviewerName?: string;
}

const AnimatedInterviewer = ({ 
  isSpeaking, 
  currentText, 
  interviewerName = "Mr. James Wilson" 
}: AnimatedInterviewerProps) => {
  const [eyesBlink, setEyesBlink] = useState(false);
  const [mouthAnimation, setMouthAnimation] = useState(0);

  // Natural blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyesBlink(true);
      setTimeout(() => setEyesBlink(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Mouth animation when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthAnimation(0);
      return;
    }

    const mouthInterval = setInterval(() => {
      setMouthAnimation(Math.random());
    }, 100);

    return () => clearInterval(mouthInterval);
  }, [isSpeaking]);

  return (
    <div className="flex flex-col items-center">
      {/* Interviewer Avatar Container */}
      <div className="relative w-48 h-48 mb-4">
        {/* Main Image */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg border-2 border-primary/20">
          <img 
            src={maleInterviewerImage} 
            alt={interviewerName}
            className="w-full h-full object-cover"
          />
          
          {/* Blink overlay - subtle darkening when blinking */}
          {eyesBlink && (
            <div className="absolute inset-0 bg-black/5 pointer-events-none" />
          )}
          
          {/* Speaking indicator glow */}
          {isSpeaking && (
            <div className="absolute inset-0 ring-4 ring-primary/30 ring-offset-2 ring-offset-background rounded-2xl animate-pulse" />
          )}
        </div>
        
        {/* Speaking Indicator Bars */}
        {isSpeaking && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-1 items-end bg-background px-2 py-1 rounded-full shadow-sm border">
              {[0, 1, 2, 3, 4].map((i) => (
                <div 
                  key={i}
                  className="w-1 bg-primary rounded-full transition-all duration-100"
                  style={{ 
                    height: `${8 + Math.sin((Date.now() / 100) + i) * 6 + mouthAnimation * 4}px`,
                  }} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Name Tag */}
      <div className="bg-card border rounded-lg px-4 py-2 shadow-sm text-center">
        <p className="font-semibold text-foreground">{interviewerName}</p>
        <p className="text-xs text-muted-foreground">Senior Technical Interviewer</p>
      </div>
      
      {/* Current Speech Bubble */}
      {currentText && (
        <div className="mt-4 max-w-sm bg-muted rounded-lg p-4 relative">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-muted rotate-45" />
          <p className="text-sm text-foreground relative z-10 leading-relaxed">{currentText}</p>
        </div>
      )}
    </div>
  );
};

export default AnimatedInterviewer;
