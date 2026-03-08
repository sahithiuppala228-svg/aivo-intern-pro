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
  return (
    <div className="flex flex-col items-center">
      {/* Interviewer Photo */}
      <div className="relative w-48 h-48 mb-4">
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg border-2 border-border">
          <img 
            src={maleInterviewerImage} 
            alt={interviewerName}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Speaking indicator dot */}
        {isSpeaking && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
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
