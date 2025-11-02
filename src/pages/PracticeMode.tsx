import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Eye, CheckCircle, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  domain: string;
  explanation?: string;
  difficulty?: string;
}

interface QuestionState {
  answer: string | null;
  isViewed: boolean;
  isSubmitted: boolean;
  isCorrect: boolean | null;
}

const PracticeMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const domain = location.state?.domain || "Web Development";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionStates, setQuestionStates] = useState<Record<number, QuestionState>>({});
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [viewedCount, setViewedCount] = useState(0);
  const [explanations, setExplanations] = useState<Record<number, string>>({});

  useEffect(() => {
    loadQuestions();
  }, [domain]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      
      // Demo mode - use dummy questions instead of calling edge function
      const dummyQuestions: Question[] = Array.from({ length: 25 }, (_, i) => ({
        id: `demo-q-${i}`,
        question: `Demo Question ${i + 1}: What is the correct approach for this ${domain} concept?`,
        options: ['Option A', 'Option B', 'Option C (Correct)', 'Option D'],
        correctAnswer: 'C',
        domain,
        explanation: 'This is a demo explanation showing why Option C is the correct answer.',
        difficulty: i % 3 === 0 ? 'Easy' : i % 3 === 1 ? 'Medium' : 'Hard'
      }));

      setQuestions(dummyQuestions);
      setLoading(false);

      // Initialize question states
      const initialStates: Record<number, QuestionState> = {};
      for (let i = 0; i < 25; i++) {
        initialStates[i] = {
          answer: null,
          isViewed: false,
          isSubmitted: false,
          isCorrect: null,
        };
      }
      setQuestionStates(initialStates);
    } catch (error: any) {
      console.error("Error loading questions:", error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Auto-complete demo mode - complete practice after 10 seconds
  useEffect(() => {
    if (loading || questions.length === 0) return;

    const demoTimer = setTimeout(() => {
      // Auto-answer 20 out of 25 questions correctly for 80% score
      const autoStates: Record<number, QuestionState> = {};
      questions.forEach((q, index) => {
        const isCorrect = index < 20; // First 20 correct
        autoStates[index] = {
          answer: isCorrect ? q.correctAnswer : 'A',
          isViewed: false,
          isSubmitted: true,
          isCorrect,
        };
      });
      setQuestionStates(autoStates);
      
      // Show results
      setTimeout(() => {
        handleFinishPractice();
        toast({
          title: "Demo Mode",
          description: "Practice session auto-completed successfully!",
        });
      }, 500);
    }, 10000); // 10 seconds

    return () => clearTimeout(demoTimer);
  }, [loading, questions]);

  const handleAnswerSelect = (value: string) => {
    if (questionStates[currentQuestionIndex]?.isSubmitted || questionStates[currentQuestionIndex]?.isViewed) {
      return;
    }

    setQuestionStates((prev) => ({
      ...prev,
      [currentQuestionIndex]: {
        ...prev[currentQuestionIndex],
        answer: value,
      },
    }));
  };

  const handleSubmitAnswer = () => {
    const currentState = questionStates[currentQuestionIndex];
    
    if (!currentState.answer) {
      toast({
        title: "No answer selected",
        description: "Please select an answer before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (currentState.isSubmitted || currentState.isViewed) {
      return;
    }

    const isCorrect = currentState.answer === questions[currentQuestionIndex].correctAnswer;

    setQuestionStates((prev) => ({
      ...prev,
      [currentQuestionIndex]: {
        ...prev[currentQuestionIndex],
        isSubmitted: true,
        isCorrect,
      },
    }));

    toast({
      title: isCorrect ? "Correct!" : "Incorrect",
      description: isCorrect 
        ? "Well done! You've earned 1 mark." 
        : `The correct answer is ${questions[currentQuestionIndex].correctAnswer}`,
      variant: isCorrect ? "default" : "destructive",
    });
  };

  const handleShowAnswer = async () => {
    const currentState = questionStates[currentQuestionIndex];

    if (currentState.isSubmitted || currentState.isViewed) {
      return;
    }

    setQuestionStates((prev) => ({
      ...prev,
      [currentQuestionIndex]: {
        ...prev[currentQuestionIndex],
        isViewed: true,
        answer: questions[currentQuestionIndex].correctAnswer,
      },
    }));

    // Use demo explanation
    const currentQuestion = questions[currentQuestionIndex];
    setExplanations({
      ...explanations,
      [currentQuestionIndex]: currentQuestion.explanation || 'Demo explanation for the correct answer.'
    });


    toast({
      title: "Answer Revealed",
      description: `Correct answer: ${questions[currentQuestionIndex].correctAnswer}. No marks awarded for this question.`,
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleFinishPractice = () => {
    let totalScore = 0;
    let viewed = 0;

    Object.values(questionStates).forEach((state) => {
      if (state.isViewed) {
        viewed++;
      } else if (state.isSubmitted && state.isCorrect) {
        totalScore++;
      }
    });

    setScore(totalScore);
    setViewedCount(viewed);
    setShowResults(true);
  };

  const handleRetakePractice = () => {
    setShowResults(false);
    setCurrentQuestionIndex(0);
    loadQuestions();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading practice questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Questions Available</h2>
          <p className="text-muted-foreground mb-6">
            There are no questions available for practice at the moment.
          </p>
          <Button onClick={() => navigate("/assessment-intro")}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentState = questionStates[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/assessment-intro")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold">Practice Mode – Learn Before Test</h1>
              <p className="text-sm text-muted-foreground">{domain}</p>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              Progress: {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Q{currentQuestionIndex + 1}. {currentQuestion.question}
            </h2>

            <RadioGroup
              value={currentState?.answer || ""}
              onValueChange={handleAnswerSelect}
              className="space-y-3"
            >
              {["A", "B", "C", "D"].map((option) => {
                const optionText = currentQuestion.options[["A", "B", "C", "D"].indexOf(option)];
                const isSelected = currentState?.answer === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                const showFeedback = currentState?.isSubmitted || currentState?.isViewed;

                return (
                  <div
                    key={option}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                      showFeedback
                        ? isCorrect
                          ? "border-green-500 bg-green-50 dark:bg-green-950"
                          : isSelected
                          ? "border-red-500 bg-red-50 dark:bg-red-950"
                          : "border-muted"
                        : isSelected
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem
                      value={option}
                      id={`option-${option}`}
                      disabled={currentState?.isSubmitted || currentState?.isViewed}
                    />
                    <Label
                      htmlFor={`option-${option}`}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      <span className="font-semibold">{option}.</span> {optionText}
                    </Label>
                    {showFeedback && isCorrect && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {showFeedback && !isCorrect && isSelected && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleSubmitAnswer}
              disabled={
                !currentState?.answer ||
                currentState?.isSubmitted ||
                currentState?.isViewed
              }
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Answer
            </Button>
            <Button
              variant="secondary"
              onClick={handleShowAnswer}
              disabled={currentState?.isSubmitted || currentState?.isViewed}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Show Answer
            </Button>
          </div>

          {/* Viewed Note and Explanation */}
          {currentState?.isViewed && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                ⚠️ Viewed questions will not add marks.
              </p>
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-2">Correct Answer:</p>
                  <p className="text-sm text-green-600 font-medium">{questions[currentQuestionIndex].correctAnswer}</p>
                </div>
                {explanations[currentQuestionIndex] && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Explanation:</p>
                    <p className="text-sm text-muted-foreground">{explanations[currentQuestionIndex]}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Answered: {Object.values(questionStates).filter(s => s.isSubmitted || s.isViewed).length}/{questions.length}
          </div>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button onClick={handleNextQuestion}>Next</Button>
          ) : (
            <Button onClick={handleFinishPractice} variant="hero">
              Finish Practice
            </Button>
          )}
        </div>
      </div>

      {/* Results Dialog */}
      <AlertDialog open={showResults} onOpenChange={setShowResults}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">Practice Complete!</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Here are your practice results:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {/* Score Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">{score}</div>
                <div className="text-sm text-muted-foreground">Correct Answers</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-amber-600">{viewedCount}</div>
                <div className="text-sm text-muted-foreground">Viewed Questions</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold">{score}/25</div>
                <div className="text-sm text-muted-foreground">Final Score</div>
              </Card>
            </div>

            {/* Question Review */}
            <div className="space-y-3">
              <h3 className="font-semibold">Question Review:</h3>
              {questions.map((q, index) => {
                const state = questionStates[index];
                const isCorrect = state.isSubmitted && state.isCorrect;
                const isWrong = state.isSubmitted && !state.isCorrect;
                const isViewed = state.isViewed;

                if (!isWrong && !isViewed) return null;

                return (
                  <Card key={q.id} className="p-4">
                    <div className="flex items-start gap-2">
                      {isViewed && <Eye className="h-5 w-5 text-amber-600 mt-1" />}
                      {isWrong && <XCircle className="h-5 w-5 text-red-600 mt-1" />}
                      <div className="flex-1">
                        <p className="font-medium mb-2">Q{index + 1}. {q.question}</p>
                        {isWrong && (
                          <p className="text-sm text-muted-foreground">
                            Your answer: <span className="text-red-600">{state.answer}</span>
                          </p>
                        )}
                        <p className="text-sm font-medium text-green-600">
                          Correct answer: {q.correctAnswer}
                        </p>
                        {explanations[index] && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <span className="font-semibold">Explanation:</span> {explanations[index]}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <AlertDialogFooter>
            <Button variant="outline" onClick={handleRetakePractice}>
              Retake Practice
            </Button>
            <Button onClick={() => window.location.href = 'https://intern-ai-coach.lovable.app'} variant="hero">
              Continue to AI Mock Interview
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PracticeMode;
