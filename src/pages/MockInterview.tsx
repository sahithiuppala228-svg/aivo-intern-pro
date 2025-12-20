import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  VolumeX
} from "lucide-react";
import AnimatedInterviewer from "@/components/AnimatedInterviewer";
import InterviewFeedback from "@/components/InterviewFeedback";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { supabase } from "@/integrations/supabase/client";

const INTERVIEW_TIME_LIMIT = 20 * 60; // 20 minutes in seconds

interface InterviewQuestion {
  id: number;
  question: string;
  category: "technical" | "behavioral" | "problem-solving";
  difficulty: "easy" | "medium" | "hard";
  expectedPoints: string[];
}

const getInterviewQuestions = (domain: string): InterviewQuestion[] => {
  const technicalQuestions: Record<string, InterviewQuestion[]> = {
    "Web Development": [
      { id: 1, question: "Explain the difference between var, let, and const in JavaScript. When would you use each?", category: "technical", difficulty: "easy", expectedPoints: ["scope differences", "hoisting", "mutability"] },
      { id: 2, question: "What is the Virtual DOM and how does React use it to optimize performance?", category: "technical", difficulty: "medium", expectedPoints: ["reconciliation", "diffing algorithm", "batch updates"] },
      { id: 3, question: "Describe the event loop in JavaScript. How does it handle asynchronous operations?", category: "technical", difficulty: "hard", expectedPoints: ["call stack", "callback queue", "microtasks"] },
      { id: 4, question: "What are closures in JavaScript? Give a practical example of when you'd use one.", category: "technical", difficulty: "medium", expectedPoints: ["lexical scope", "data privacy", "state preservation"] },
      { id: 5, question: "Explain CSS specificity and how the cascade works. How do you resolve conflicts?", category: "technical", difficulty: "medium", expectedPoints: ["selector weights", "!important", "inheritance"] },
    ],
    "Data Science": [
      { id: 1, question: "Explain the bias-variance tradeoff. How do you balance it in your models?", category: "technical", difficulty: "medium", expectedPoints: ["underfitting", "overfitting", "regularization"] },
      { id: 2, question: "What is cross-validation and why is it important? Describe k-fold cross-validation.", category: "technical", difficulty: "easy", expectedPoints: ["model evaluation", "data splitting", "generalization"] },
      { id: 3, question: "How would you handle missing data in a dataset? What are the pros and cons of different approaches?", category: "technical", difficulty: "medium", expectedPoints: ["imputation", "deletion", "prediction"] },
      { id: 4, question: "Explain the difference between L1 and L2 regularization. When would you use each?", category: "technical", difficulty: "hard", expectedPoints: ["sparsity", "weight shrinkage", "feature selection"] },
      { id: 5, question: "What is feature engineering? Describe techniques you've used to improve model performance.", category: "technical", difficulty: "medium", expectedPoints: ["transformation", "creation", "selection"] },
    ],
    "Machine Learning": [
      { id: 1, question: "Explain the difference between supervised and unsupervised learning with examples.", category: "technical", difficulty: "easy", expectedPoints: ["labeled data", "clustering", "classification"] },
      { id: 2, question: "What is gradient descent? Explain different variants like SGD, Adam.", category: "technical", difficulty: "medium", expectedPoints: ["optimization", "learning rate", "convergence"] },
      { id: 3, question: "How do you prevent overfitting in neural networks? Explain at least three techniques.", category: "technical", difficulty: "hard", expectedPoints: ["dropout", "regularization", "early stopping"] },
      { id: 4, question: "What are attention mechanisms? How do transformers use them?", category: "technical", difficulty: "hard", expectedPoints: ["query-key-value", "self-attention", "parallel processing"] },
      { id: 5, question: "Explain the trade-offs between precision and recall. When would you prioritize one over the other?", category: "technical", difficulty: "medium", expectedPoints: ["F1 score", "use cases", "threshold tuning"] },
    ],
    "Cloud Computing": [
      { id: 1, question: "Explain the differences between IaaS, PaaS, and SaaS with examples.", category: "technical", difficulty: "easy", expectedPoints: ["control levels", "use cases", "provider examples"] },
      { id: 2, question: "What is containerization? How does Docker differ from virtual machines?", category: "technical", difficulty: "medium", expectedPoints: ["isolation", "resource efficiency", "portability"] },
      { id: 3, question: "Describe a microservices architecture. What are its advantages and challenges?", category: "technical", difficulty: "hard", expectedPoints: ["scalability", "complexity", "communication"] },
      { id: 4, question: "How would you design a highly available and fault-tolerant system in the cloud?", category: "technical", difficulty: "hard", expectedPoints: ["redundancy", "load balancing", "failover"] },
      { id: 5, question: "Explain Kubernetes and its key components. When would you use it?", category: "technical", difficulty: "medium", expectedPoints: ["pods", "services", "orchestration"] },
    ],
    "Cybersecurity": [
      { id: 1, question: "Explain the CIA triad and its importance in information security.", category: "technical", difficulty: "easy", expectedPoints: ["confidentiality", "integrity", "availability"] },
      { id: 2, question: "What is SQL injection? How do you prevent it?", category: "technical", difficulty: "medium", expectedPoints: ["parameterized queries", "input validation", "escaping"] },
      { id: 3, question: "Describe the OWASP Top 10. Which vulnerability do you consider most critical and why?", category: "technical", difficulty: "hard", expectedPoints: ["common vulnerabilities", "mitigation", "risk assessment"] },
      { id: 4, question: "Explain the difference between symmetric and asymmetric encryption.", category: "technical", difficulty: "medium", expectedPoints: ["key management", "performance", "use cases"] },
      { id: 5, question: "How would you respond to a security incident? Walk me through your process.", category: "technical", difficulty: "hard", expectedPoints: ["detection", "containment", "recovery"] },
    ],
  };

  const behavioralQuestions: InterviewQuestion[] = [
    { id: 6, question: "Tell me about a challenging project you worked on. How did you overcome the obstacles?", category: "behavioral", difficulty: "medium", expectedPoints: ["problem description", "approach", "outcome"] },
    { id: 7, question: "Describe a situation where you had to learn a new technology quickly. How did you approach it?", category: "behavioral", difficulty: "easy", expectedPoints: ["learning strategy", "resources", "application"] },
    { id: 8, question: "How do you handle disagreements with team members about technical decisions?", category: "behavioral", difficulty: "medium", expectedPoints: ["communication", "compromise", "data-driven"] },
  ];

  const problemSolvingQuestions: InterviewQuestion[] = [
    { id: 9, question: "If you had to improve the performance of a slow application, what steps would you take?", category: "problem-solving", difficulty: "hard", expectedPoints: ["profiling", "optimization", "monitoring"] },
    { id: 10, question: "How would you design a system that handles millions of requests per second?", category: "problem-solving", difficulty: "hard", expectedPoints: ["scalability", "caching", "load distribution"] },
  ];

  const domainQuestions = technicalQuestions[domain] || technicalQuestions["Web Development"];
  return [...domainQuestions, ...behavioralQuestions, ...problemSolvingQuestions];
};

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
  
  // Interview state
  const [showInstructions, setShowInstructions] = useState(true);
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
  
  const questions = getInterviewQuestions(domain);
  const currentQuestion = questions[currentQuestionIndex];
  
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

  // Speech synthesis
  const speakText = useCallback((text: string) => {
    if (!soundEnabled) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
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

  // Speak question when it changes
  useEffect(() => {
    if (interviewStarted && currentQuestion && !showFeedback) {
      setTimeout(() => {
        speakText(currentQuestion.question);
      }, 500);
    }
  }, [currentQuestionIndex, interviewStarted, showFeedback]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartInterview = async () => {
    await startCamera();
    setShowInstructions(false);
    setInterviewStarted(true);
    
    toast({
      title: "Interview Started",
      description: "Good luck! Answer each question thoroughly.",
    });
    
    setTimeout(() => {
      speakText(`Welcome to your ${domain} technical interview. I'm Dr. Sarah Chen, your interviewer today. Let's begin with the first question.`);
    }, 1000);
  };

  const handleNextQuestion = () => {
    // Save current answer
    if (currentAnswer.trim()) {
      setAnswers(prev => ({ ...prev, [currentQuestionIndex]: currentAnswer }));
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer(answers[currentQuestionIndex + 1] || "");
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
      feedback = "Excellent answer! You covered the key points thoroughly and demonstrated deep understanding.";
    } else if (score >= 60) {
      feedback = "Good answer. You addressed the main concepts but could have elaborated more on specific details.";
    } else if (score >= 40) {
      feedback = "Partial answer. You touched on some points but missed several important concepts.";
    } else {
      feedback = "This answer needs improvement. Review the core concepts and practice explaining them clearly.";
    }
    
    return { score, feedback };
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
    
    setIsSubmitting(false);
    setShowFeedback(true);
  };

  const handleRetry = () => {
    setShowFeedback(false);
    setFeedback(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setCurrentAnswer("");
    setTimeRemaining(INTERVIEW_TIME_LIMIT);
    setShowInstructions(true);
    setInterviewStarted(false);
  };

  const handleClose = () => {
    if (feedback && feedback.overallScore >= 70) {
      navigate("/certificate", { state: { domain, score: feedback.overallScore } });
    } else {
      navigate("/practice-mode");
    }
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
                    <p><span className="font-semibold text-foreground">Camera Required:</span> Face detection is enabled for interview integrity</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">4.</span>
                    <p><span className="font-semibold text-foreground">Strict Evaluation:</span> Answers are evaluated on accuracy, depth, and communication</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">5.</span>
                    <p><span className="font-semibold text-foreground">Passing Score:</span> 70% or higher to receive certification</p>
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
                  onClick={handleStartInterview}
                  size="lg"
                  className="px-8"
                  variant="hero"
                >
                  START INTERVIEW →
                </Button>
              </div>
            </div>
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
                  className="w-full h-full object-cover mirror"
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
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here. Be thorough and specific in your response..."
                  className="min-h-[200px] resize-none"
                />
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{currentAnswer.split(/\s+/).filter(w => w).length} words</span>
                  <span>Tip: Aim for 50+ words with specific examples</span>
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
                  <Button onClick={handleNextQuestion} variant="hero">
                    Next Question
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleEndInterview} 
                    variant="hero"
                    disabled={isSubmitting}
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
