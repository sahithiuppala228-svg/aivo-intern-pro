import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Clock, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Send,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  VolumeX,
  Square
} from "lucide-react";
import AnimatedInterviewer from "@/components/AnimatedInterviewer";
import InterviewFeedback from "@/components/InterviewFeedback";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { supabase } from "@/integrations/supabase/client";

const INTERVIEW_TIME_LIMIT = 20 * 60; // 20 minutes in seconds

interface InterviewQuestion {
  id: string;
  question: string;
  category: "technical" | "behavioral" | "problem-solving";
  difficulty: "easy" | "medium" | "hard";
  expectedPoints: string[];
}

interface FeedbackData {
  overallScore: number;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  problemSolvingScore: number;
  strengths: string[];
  improvements: string[];
  questionResults: Array<{
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }>;
  timeUsed: number;
  totalTime: number;
}

const MockInterview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const domain = location.state?.domain || "Web Development";
  
  // Get user name from localStorage
  const [userName, setUserName] = useState("Candidate");
  
  useEffect(() => {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      const profile = JSON.parse(profileData);
      if (profile.firstName) {
        setUserName(profile.firstName);
      }
    }
  }, []);
  
  // Interview state
  const [showInstructions, setShowInstructions] = useState(true);
  const [showCameraTest, setShowCameraTest] = useState(false);
  const [showAudioTest, setShowAudioTest] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(INTERVIEW_TIME_LIMIT);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeech, setCurrentSpeech] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioTestPassed, setAudioTestPassed] = useState(false);
  const [cameraTestPassed, setCameraTestPassed] = useState(false);
  const [noAudioTimer, setNoAudioTimer] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  
  // Audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  
  const currentQuestion = questions[currentQuestionIndex];
  
  // Fetch interview questions from database
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoadingQuestions(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-random-interview-questions', {
          body: { domain }
        });
        
        if (error) {
          console.error('Error fetching questions:', error);
          toast({
            variant: "destructive",
            title: "Error Loading Questions",
            description: "Failed to load interview questions. Please try again.",
          });
          return;
        }
        
        if (data?.questions && data.questions.length > 0) {
          // Transform to match expected format
          const formattedQuestions: InterviewQuestion[] = data.questions.map((q: any) => ({
            id: q.id,
            question: q.question,
            category: q.category,
            difficulty: q.difficulty,
            expectedPoints: q.expected_points || q.expectedPoints || []
          }));
          setQuestions(formattedQuestions);
          
          if (data.generated) {
            toast({
              title: "Questions Generated",
              description: `Custom interview questions generated for ${domain}.`,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching interview questions:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load interview questions.",
        });
      } finally {
        setIsLoadingQuestions(false);
      }
    };
    
    fetchQuestions();
  }, [domain, toast]);
  
  // Face detection
  const { 
    videoRef, 
    canvasRef, 
    cameraActive, 
    cameraError, 
    faceResult, 
    startCamera, 
    stopCamera 
  } = useFaceDetection();

  // Speech synthesis with personalized name
  const speakText = useCallback((text: string) => {
    if (!soundEnabled) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.9; // Slightly lower for male voice
    utterance.volume = 0.8;
    
    // Try to use a male voice
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(v => 
      v.name.toLowerCase().includes('male') || 
      v.name.toLowerCase().includes('david') ||
      v.name.toLowerCase().includes('james') ||
      v.name.toLowerCase().includes('mark')
    );
    if (maleVoice) {
      utterance.voice = maleVoice;
    }
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentSpeech(text);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentSpeech("");
    };
    
    window.speechSynthesis.speak(utterance);
  }, [soundEnabled]);

  // Timer
  useEffect(() => {
    if (!interviewStarted || showFeedback) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleEndInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [interviewStarted, showFeedback]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start camera test
  const handleStartCameraTest = async () => {
    setShowInstructions(false);
    setShowCameraTest(true);
    await startCamera();
  };

  // Camera test passed
  const handleCameraTestPassed = () => {
    setCameraTestPassed(true);
    setShowCameraTest(false);
    setShowAudioTest(true);
  };

  // Audio test state
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioDetected, setAudioDetected] = useState(false);
  const [audioTestTimeout, setAudioTestTimeout] = useState<number | null>(null);
  const [audioTestFailed, setAudioTestFailed] = useState(false);
  const audioTestIntervalRef = useRef<number | null>(null);
  const audioDetectedRef = useRef(false);
  
  const testSentence = "Hello, my name is a candidate and I am ready for this interview.";

  // Start audio test
  const startAudioTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      setIsTestingAudio(true);
      setAudioDetected(false);
      setAudioTestFailed(false);
      audioDetectedRef.current = false;
      
      // Check for audio detection
      let detectionCount = 0;
      audioTestIntervalRef.current = window.setInterval(() => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          
          // If audio level is above threshold
          if (average > 10) {
            detectionCount++;
            // Need sustained audio (at least 5 checks = ~500ms of speech)
            if (detectionCount >= 5 && !audioDetectedRef.current) {
              audioDetectedRef.current = true;
              setAudioDetected(true);
            }
          }
        }
      }, 100);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: "Please allow microphone access to continue.",
      });
    }
  };
  
  // Stop audio test and check if audio was detected
  const stopAudioTest = () => {
    if (audioTestIntervalRef.current) {
      clearInterval(audioTestIntervalRef.current);
      audioTestIntervalRef.current = null;
    }
    if (audioTestTimeout) {
      clearTimeout(audioTestTimeout);
      setAudioTestTimeout(null);
    }
    
    setIsTestingAudio(false);
    
    if (audioDetectedRef.current) {
      setAudioTestPassed(true);
      toast({
        title: "Audio Test Passed!",
        description: "Your microphone is working correctly.",
      });
    } else {
      setAudioTestFailed(true);
      toast({
        variant: "destructive",
        title: "No Audio Detected",
        description: "Please check your microphone and try again.",
      });
    }
  };
  
  // Cleanup audio test on unmount
  useEffect(() => {
    return () => {
      if (audioTestIntervalRef.current) {
        clearInterval(audioTestIntervalRef.current);
      }
      if (audioTestTimeout) {
        clearTimeout(audioTestTimeout);
      }
    };
  }, [audioTestTimeout]);

  // Start the actual interview
  const handleStartInterview = () => {
    setShowAudioTest(false);
    setInterviewStarted(true);
    
    toast({
      title: "Interview Started",
      description: "Good luck! Answer each question thoroughly.",
    });
    
    setTimeout(() => {
      speakText(`Hello ${userName}! Welcome to your ${domain} technical interview. I'm Mr. James Wilson, your interviewer today. I'll be asking you ${questions.length} questions over the next 20 minutes. Let's begin with the first question.`);
    }, 1000);
    
    // Speak first question after intro
    setTimeout(() => {
      speakText(currentQuestion.question);
    }, 8000);
  };

  // Start recording answer
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start no-audio detection timer
      let silenceCounter = 0;
      const checkAudio = setInterval(() => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          
          if (average < 5) {
            silenceCounter++;
            if (silenceCounter >= 10) { // 10 seconds of silence
              speakText(`${userName}, I didn't detect any audio. Please make sure your microphone is working and try speaking again.`);
              silenceCounter = 0;
            }
          } else {
            silenceCounter = 0;
          }
        }
      }, 1000);
      
      setNoAudioTimer(checkAudio as unknown as number);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: "Could not access microphone.",
      });
    }
  };

  // Stop recording and transcribe
  const stopRecording = async () => {
    if (noAudioTimer) {
      clearInterval(noAudioTimer);
      setNoAudioTimer(null);
    }
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert to base64 for speech-to-text
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          setIsAnalyzing(true);
          speakText("Thank you. Let me analyze your answer.");
          
          try {
            // Call speech-to-text edge function
            const { data: transcription, error: sttError } = await supabase.functions.invoke('speech-to-text', {
              body: { audio: base64Audio }
            });
            
            if (sttError) throw sttError;
            
            const transcribedText = transcription?.text || "";
            setCurrentAnswer(transcribedText);
            
            // Analyze the answer
            const evaluation = evaluateAnswer(transcribedText, currentQuestion);
            
            // Give personalized feedback
            setTimeout(() => {
              let feedbackMessage = "";
              if (evaluation.score >= 80) {
                feedbackMessage = `Excellent answer, ${userName}! You covered the key concepts very well. ${evaluation.feedback}`;
              } else if (evaluation.score >= 60) {
                feedbackMessage = `Good answer, ${userName}. You addressed the main points. ${evaluation.feedback}`;
              } else if (evaluation.score >= 40) {
                feedbackMessage = `${userName}, that was a moderate answer. ${evaluation.feedback}`;
              } else {
                feedbackMessage = `${userName}, your answer needs more depth. ${evaluation.feedback}`;
              }
              
              speakText(feedbackMessage);
              setIsAnalyzing(false);
            }, 2000);
            
          } catch (error) {
            console.error("Transcription error:", error);
            toast({
              variant: "destructive",
              title: "Transcription Error",
              description: "Could not transcribe your answer. Please type it instead.",
            });
            setIsAnalyzing(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop audio stream
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
        }
      };
    }
  };

  const evaluateAnswer = (answer: string, question: InterviewQuestion): { score: number; feedback: string } => {
    if (!answer.trim()) {
      return { score: 0, feedback: "No answer provided. This is a critical gap." };
    }
    
    const wordCount = answer.split(/\s+/).length;
    const hasExpectedPoints = question.expectedPoints.filter(point => 
      answer.toLowerCase().includes(point.toLowerCase())
    ).length;
    
    let score = 0;
    let feedback = "";
    
    // Base score from content coverage
    score += (hasExpectedPoints / question.expectedPoints.length) * 50;
    
    // Score from answer length (shows depth)
    if (wordCount >= 100) score += 20;
    else if (wordCount >= 50) score += 15;
    else if (wordCount >= 25) score += 10;
    else score += 5;
    
    // Score from technical depth (keywords)
    const technicalTerms = ["because", "therefore", "example", "specifically", "implementation", "architecture", "performance", "optimization"];
    const technicalCount = technicalTerms.filter(term => answer.toLowerCase().includes(term)).length;
    score += technicalCount * 3;
    
    // Difficulty modifier
    if (question.difficulty === "hard") score = Math.min(score * 1.2, 100);
    if (question.difficulty === "easy") score = Math.min(score * 0.9, 100);
    
    score = Math.round(Math.min(score, 100));
    
    // Generate feedback
    if (score >= 80) {
      feedback = "You demonstrated deep understanding of the concepts.";
    } else if (score >= 60) {
      feedback = "You could elaborate more on specific details.";
    } else if (score >= 40) {
      feedback = "You missed several important concepts.";
    } else {
      feedback = "Review the core concepts and practice explaining them clearly.";
    }
    
    return { score, feedback };
  };

  const handleNextQuestion = () => {
    // Save current answer
    if (currentAnswer.trim()) {
      setAnswers(prev => ({ ...prev, [currentQuestionIndex]: currentAnswer }));
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer(answers[currentQuestionIndex + 1] || "");
      
      // Speak next question
      setTimeout(() => {
        const nextQ = questions[currentQuestionIndex + 1];
        speakText(`${userName}, here's your next question. ${nextQ.question}`);
      }, 1000);
    } else {
      handleEndInterview();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentAnswer.trim()) {
      setAnswers(prev => ({ ...prev, [currentQuestionIndex]: currentAnswer }));
    }
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setCurrentAnswer(answers[currentQuestionIndex - 1] || "");
    }
  };

  const handleEndInterview = async () => {
    setIsSubmitting(true);
    window.speechSynthesis.cancel();
    stopCamera();
    
    // Save final answer
    const finalAnswers = { ...answers };
    if (currentAnswer.trim()) {
      finalAnswers[currentQuestionIndex] = currentAnswer;
    }
    
    // Evaluate all answers
    const questionResults = questions.map((q, index) => {
      const answer = finalAnswers[index] || "";
      const evaluation = evaluateAnswer(answer, q);
      return {
        question: q.question,
        answer,
        score: evaluation.score,
        feedback: evaluation.feedback
      };
    });
    
    // Calculate scores
    const technicalQuestions = questionResults.filter((_, i) => questions[i].category === "technical");
    const behavioralQuestions = questionResults.filter((_, i) => questions[i].category === "behavioral");
    const problemQuestions = questionResults.filter((_, i) => questions[i].category === "problem-solving");
    
    const technicalScore = technicalQuestions.length > 0 
      ? Math.round(technicalQuestions.reduce((sum, q) => sum + q.score, 0) / technicalQuestions.length)
      : 0;
    
    const problemSolvingScore = problemQuestions.length > 0
      ? Math.round(problemQuestions.reduce((sum, q) => sum + q.score, 0) / problemQuestions.length)
      : 0;
    
    // Communication score based on answer length and clarity
    const avgWordCount = questionResults.reduce((sum, q) => sum + q.answer.split(/\s+/).length, 0) / questions.length;
    const communicationScore = Math.min(Math.round(avgWordCount * 1.5), 100);
    
    // Confidence score based on completeness and word variety
    const completedQuestions = questionResults.filter(q => q.answer.length > 20).length;
    const confidenceScore = Math.round((completedQuestions / questions.length) * 100);
    
    const overallScore = Math.round(
      (technicalScore * 0.4) + 
      (communicationScore * 0.25) + 
      (confidenceScore * 0.15) + 
      (problemSolvingScore * 0.2)
    );
    
    // Determine level
    let level: "Beginner" | "Intermediate" | "Advanced" | "Expert" = "Beginner";
    if (overallScore >= 85) level = "Expert";
    else if (overallScore >= 70) level = "Advanced";
    else if (overallScore >= 50) level = "Intermediate";
    
    // Generate strengths and improvements
    const strengths: string[] = [];
    const improvements: string[] = [];
    
    if (technicalScore >= 70) strengths.push("Strong technical knowledge in " + domain);
    else improvements.push("Deepen your understanding of " + domain + " fundamentals");
    
    if (communicationScore >= 70) strengths.push("Clear and articulate communication");
    else improvements.push("Practice explaining technical concepts more clearly");
    
    if (confidenceScore >= 70) strengths.push("Confident approach to answering questions");
    else improvements.push("Build confidence by practicing more mock interviews");
    
    if (problemSolvingScore >= 70) strengths.push("Excellent problem-solving approach");
    else improvements.push("Work on structured problem-solving techniques");
    
    if (strengths.length === 0) strengths.push("Completed the interview - good effort!");
    if (improvements.length === 0) improvements.push("Continue practicing to maintain your skills");
    
    const timeUsed = Math.round((INTERVIEW_TIME_LIMIT - timeRemaining) / 60);
    
    setFeedback({
      overallScore,
      level,
      technicalScore,
      communicationScore,
      confidenceScore,
      problemSolvingScore,
      strengths,
      improvements,
      questionResults,
      timeUsed,
      totalTime: 20
    });
    
    setShowFeedback(true);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    navigate("/");
  };

  const handleRetry = () => {
    setShowInstructions(true);
    setShowCameraTest(false);
    setShowAudioTest(false);
    setInterviewStarted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setCurrentAnswer("");
    setTimeRemaining(INTERVIEW_TIME_LIMIT);
    setShowFeedback(false);
    setFeedback(null);
    setCameraTestPassed(false);
    setAudioTestPassed(false);
  };

  // Show feedback
  if (showFeedback && feedback) {
    return (
      <InterviewFeedback 
        feedback={feedback}
        onClose={handleClose}
        onRetry={handleRetry}
        domain={domain}
      />
    );
  }

  // Camera Test Screen
  if (showCameraTest) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-6 max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => {
              stopCamera();
              setShowCameraTest(false);
              setShowInstructions(true);
            }}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="p-8 shadow-sm border">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">Camera Test</h1>
              <p className="text-muted-foreground">Please ensure your face is clearly visible</p>
            </div>

            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {!cameraActive && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Video className="w-12 h-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
                    <p className="text-muted-foreground">Starting camera...</p>
                  </div>
                </div>
              )}
              
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center p-4">
                    <VideoOff className="w-12 h-12 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">{cameraError}</p>
                    <Button onClick={startCamera} size="sm">
                      Retry Camera
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 mb-6">
              {faceResult.faceDetected ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-medium">{faceResult.message}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="text-yellow-600">{faceResult.message}</span>
                </>
              )}
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={handleCameraTestPassed}
                disabled={!cameraActive}
                variant="hero"
                size="lg"
              >
                Continue to Audio Test →
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Audio Test Screen
  if (showAudioTest) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-6 max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => {
              stopAudioTest();
              setShowAudioTest(false);
              setShowCameraTest(true);
            }}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="p-8 shadow-sm border">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">Audio Test</h1>
              <p className="text-muted-foreground">Please read the sentence below aloud to test your microphone</p>
            </div>

            <div className="flex flex-col items-center gap-6 mb-8">
              {/* Test sentence display */}
              <div className="bg-muted/50 border-2 border-dashed border-primary/30 rounded-lg p-6 w-full text-center">
                <p className="text-sm text-muted-foreground mb-2">Read this sentence aloud:</p>
                <p className="text-lg font-medium text-foreground italic">"{testSentence}"</p>
              </div>
              
              <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                audioTestPassed 
                  ? 'bg-green-100' 
                  : audioTestFailed
                    ? 'bg-destructive/20'
                    : isTestingAudio 
                      ? audioDetected 
                        ? 'bg-green-100 animate-pulse' 
                        : 'bg-primary/20 animate-pulse' 
                      : 'bg-muted'
              }`}>
                {audioTestPassed ? (
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                ) : audioTestFailed ? (
                  <MicOff className="w-16 h-16 text-destructive" />
                ) : (
                  <Mic className={`w-16 h-16 ${
                    isTestingAudio 
                      ? audioDetected 
                        ? 'text-green-500' 
                        : 'text-primary' 
                      : 'text-muted-foreground'
                  }`} />
                )}
              </div>

              {/* Audio detection indicator during test */}
              {isTestingAudio && (
                <div className={`text-sm font-medium ${audioDetected ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {audioDetected ? '✓ Audio detected!' : 'Waiting for audio...'}
                </div>
              )}

              {!audioTestPassed ? (
                <div className="flex flex-col items-center gap-3">
                  {!isTestingAudio ? (
                    <>
                      <Button onClick={startAudioTest} size="lg">
                        <Mic className="w-4 h-4 mr-2" />
                        {audioTestFailed ? 'Try Again' : 'Start Audio Test'}
                      </Button>
                      {audioTestFailed && (
                        <p className="text-destructive text-sm font-medium">No audio detected. Please check your microphone.</p>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-primary font-medium animate-pulse">Listening... Read the sentence above</p>
                      <Button onClick={stopAudioTest} variant="default" size="lg" className="bg-red-500 hover:bg-red-600">
                        <Square className="w-4 h-4 mr-2" />
                        Stop Recording
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-green-600 font-medium">✓ Audio detected! Microphone is working correctly.</p>
              )}
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={handleStartInterview}
                disabled={!audioTestPassed}
                variant="hero"
                size="lg"
              >
                Start Interview →
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Instructions Screen
  if (showInstructions) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-6 max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/coding-test")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="p-8 shadow-sm border">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-hero rounded-lg">
                  <Mic className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{domain} Mock Interview</h1>
                  <p className="text-muted-foreground">AI-Powered Technical Interview</p>
                </div>
              </div>
            </div>

            {isLoadingQuestions ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading interview questions for {domain}...</p>
                <p className="text-sm text-muted-foreground mt-2">This may take a moment for new domains</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Failed to load interview questions</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Interview Guidelines:</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <div className="flex gap-3">
                      <span className="font-semibold text-foreground min-w-[24px]">1.</span>
                      <p><span className="font-semibold text-foreground">Time Limit:</span> 20 minutes to complete the interview</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-semibold text-foreground min-w-[24px]">2.</span>
                      <p><span className="font-semibold text-foreground">Questions:</span> {questions.length} questions covering technical, behavioral, and problem-solving</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-semibold text-foreground min-w-[24px]">3.</span>
                      <p><span className="font-semibold text-foreground">Camera & Audio:</span> Both will be tested before the interview starts</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-semibold text-foreground min-w-[24px]">4.</span>
                      <p><span className="font-semibold text-foreground">Voice Recording:</span> Click the mic button to record your answer, click again to stop</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-semibold text-foreground min-w-[24px]">5.</span>
                      <p><span className="font-semibold text-foreground">AI Feedback:</span> The interviewer will analyze and give feedback on each answer</p>
                    </div>
                  </div>
                </div>

                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-destructive mb-1">Strict Interview Mode</h3>
                      <p className="text-sm text-muted-foreground">
                        This is a professional technical interview simulation. Answer thoroughly and professionally. 
                        Incomplete or vague answers will significantly impact your score.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-center">
                  <Button 
                    onClick={handleStartCameraTest}
                    size="lg"
                    className="px-8"
                    variant="hero"
                  >
                    BEGIN CAMERA TEST →
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
  const timeWarning = timeRemaining < 300; // Less than 5 minutes

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {domain}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} / {questions.length}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                timeWarning ? 'bg-destructive/20 text-destructive' : 'bg-muted'
              }`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-1 mt-2" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Interviewer */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <AnimatedInterviewer 
                isSpeaking={isSpeaking}
                currentText={currentSpeech}
                interviewerName="Mr. James Wilson"
              />
            </Card>
          </div>

          {/* Right: Question & Answer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Camera Feed */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {cameraActive ? (
                    <Video className="w-4 h-4 text-green-500" />
                  ) : (
                    <VideoOff className="w-4 h-4 text-destructive" />
                  )}
                  <span className="text-sm font-medium">Your Camera</span>
                </div>
                <div className="flex items-center gap-2">
                  {faceResult.faceDetected ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-xs text-muted-foreground">{faceResult.message}</span>
                </div>
              </div>
              
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="text-center p-4">
                      <VideoOff className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{cameraError}</p>
                      <Button onClick={startCamera} size="sm" className="mt-2">
                        Retry Camera
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Question */}
            <Card className="p-6">
              <div className="flex items-start gap-2 mb-4">
                <Badge variant={
                  currentQuestion.difficulty === "hard" ? "destructive" :
                  currentQuestion.difficulty === "medium" ? "secondary" : "outline"
                }>
                  {currentQuestion.difficulty}
                </Badge>
                <Badge variant="outline">{currentQuestion.category}</Badge>
              </div>
              
              <h2 className="text-xl font-semibold mb-4">
                {currentQuestion.question}
              </h2>
              
              <div className="space-y-4">
                {/* Recording Button */}
                <div className="flex items-center justify-center gap-4 py-4">
                  <Button
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isAnalyzing}
                    className="gap-2"
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-5 h-5" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        Start Recording
                      </>
                    )}
                  </Button>
                  
                  {isRecording && (
                    <div className="flex items-center gap-2 text-destructive">
                      <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Recording...</span>
                    </div>
                  )}
                  
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-primary">
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Analyzing...</span>
                    </div>
                  )}
                </div>
                
                {/* Transcribed Answer Display */}
                {currentAnswer && (
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Your Answer:</p>
                    <p className="text-foreground">{currentAnswer}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{currentAnswer.split(/\s+/).filter(w => w).length} words</span>
                  <span>Tip: Speak clearly and thoroughly</span>
                </div>
              </div>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous Question
              </Button>
              
              <div className="flex gap-2">
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button onClick={handleNextQuestion} variant="hero" disabled={isRecording || isAnalyzing}>
                    Next Question
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleEndInterview} 
                    variant="hero"
                    disabled={isSubmitting || isRecording || isAnalyzing}
                  >
                    {isSubmitting ? "Evaluating..." : "Submit Interview"}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockInterview;
