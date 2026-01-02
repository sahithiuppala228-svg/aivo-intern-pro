import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, CheckCircle, XCircle, List, Bookmark, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty: "Easy" | "Medium" | "Hard";
  explanation?: string;
}

const TOTAL_QUESTIONS = 50;
const EXAM_DURATION_SECONDS = 90 * 60; // 1 hour 30 minutes = 5400 seconds
const PASSING_PERCENTAGE = 80;

const MCQTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const domain = location.state?.domain || "Web Development";

  const [showInstructions, setShowInstructions] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SECONDS);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<{question: string; yourAnswer: string; correctAnswer: string; explanation?: string}[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [testStarted, setTestStarted] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // Generate questions - get from database only (no fallback to mock/AI)
  const generateQuestions = useCallback(async () => {
    setGeneratingQuestions(true);
    setLoading(true);
    
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to take the MCQ test.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Get questions from the database for the selected domain
      console.log(`Fetching random questions for domain: ${domain}`);
      const { data: dbData, error: dbError } = await supabase.functions.invoke('get-random-mcq-questions', {
        body: { domain, count: TOTAL_QUESTIONS }
      });

      if (dbError) {
        console.error('Error fetching questions:', dbError);
        throw dbError;
      }

      if (dbData?.questions && dbData.questions.length > 0) {
        console.log(`Got ${dbData.questions.length} questions from database for ${domain}`);
        setQuestions(dbData.questions);
        
        if (dbData.questions.length < TOTAL_QUESTIONS) {
          toast({
            title: "Limited questions available",
            description: `Only ${dbData.questions.length} questions available for ${domain}. Complete these to proceed.`,
          });
        }
      } else {
        toast({
          title: "No questions available",
          description: `No questions found for ${domain}. Please contact administrator to add questions.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      toast({
        title: "Error loading questions",
        description: "Could not load questions from database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingQuestions(false);
      setLoading(false);
    }
  }, [domain, toast, navigate]);


  // Timer effect - only runs when test has started
  useEffect(() => {
    if (!testStarted || showResults) return;

    if (timeLeft === 0) {
      handleSubmitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, testStarted, showResults]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answer,
    });
  };

  const toggleMarkQuestion = () => {
    const newMarked = new Set(markedQuestions);
    if (newMarked.has(currentQuestionIndex)) {
      newMarked.delete(currentQuestionIndex);
    } else {
      newMarked.add(currentQuestionIndex);
    }
    setMarkedQuestions(newMarked);
  };

  const getQuestionStatus = (index: number) => {
    if (selectedAnswers[index]) return 'answered';
    if (markedQuestions.has(index)) return 'marked';
    return 'unattempted';
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleStartTest = async () => {
    setShowInstructions(false);
    await generateQuestions();
    setTestStarted(true);
  };

  const handleSubmitTest = async () => {
    setLoading(true);
    let correctCount = 0;
    const incorrectAnswers: {question: string; yourAnswer: string; correctAnswer: string; explanation?: string}[] = [];

    try {
      // Validate answers server-side using the secure RPC function
      for (let index = 0; index < questions.length; index++) {
        const q = questions[index];
        const userAnswer = selectedAnswers[index];
        
        if (userAnswer) {
          // Use the secure server-side validation function
          const { data: isCorrect, error } = await supabase.rpc('validate_mcq_answer', {
            question_id: q.id,
            user_answer: userAnswer
          });

          if (error) {
            console.error('Error validating answer:', error);
            // Skip this question if validation fails
            continue;
          }

          if (isCorrect) {
            correctCount++;
          } else {
            incorrectAnswers.push({
              question: q.question,
              yourAnswer: userAnswer,
              correctAnswer: "Check explanation below", // Don't expose correct answer
              explanation: q.explanation,
            });
          }
        } else {
          // Not answered
          incorrectAnswers.push({
            question: q.question,
            yourAnswer: "Not answered",
            correctAnswer: "Check explanation below",
            explanation: q.explanation,
          });
        }
      }

      const percentage = (correctCount / questions.length) * 100;
      const testPassed = percentage >= PASSING_PERCENTAGE;

      setScore(correctCount);
      setPassed(testPassed);
      setWrongAnswers(incorrectAnswers);
      setShowResults(true);
      setTestStarted(false);

      if (testPassed) {
        toast({
          title: "Congratulations! 🎉",
          description: `You scored ${percentage.toFixed(0)}% and passed the MCQ test!`,
        });
      } else {
        toast({
          title: "Test Not Passed",
          description: `You scored ${percentage.toFixed(0)}%. You need at least ${PASSING_PERCENTAGE}% to pass.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast({
        title: "Error",
        description: "Failed to submit test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResultsClose = () => {
    if (passed) {
      navigate("/coding-test", { state: { domain, mcqScore: score, mcqTotal: questions.length } });
    } else {
      // Reset for retry
      setShowResults(false);
      setShowInstructions(true);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setTimeLeft(EXAM_DURATION_SECONDS);
      setScore(0);
      setPassed(false);
      setWrongAnswers([]);
      setQuestions([]);
      setMarkedQuestions(new Set());
    }
  };

  // Loading state
  if (loading || generatingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating {TOTAL_QUESTIONS} questions for {domain}...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
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
            onClick={() => navigate("/assessment-intro")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="p-8 shadow-sm border">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{domain} MCQ Test</h1>
              <p className="text-muted-foreground">Please read the instructions carefully before starting</p>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">1.</span>
                    <p><span className="font-semibold text-foreground">Number of Questions:</span> {TOTAL_QUESTIONS} questions</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">2.</span>
                    <p><span className="font-semibold text-foreground">Difficulty Levels:</span> Easy, Medium, and Hard questions mixed</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">3.</span>
                    <p><span className="font-semibold text-foreground">Time Limit:</span> 1 Hour 30 Minutes (90 minutes)</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">4.</span>
                    <div>
                      <p><span className="font-semibold text-foreground">Marking Scheme:</span> All questions have equal weightage. Every correct response gets +1 mark.</p>
                      <p className="mt-1">There is <span className="text-success font-medium">no negative marking</span>.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">5.</span>
                    <p>You must score <span className="font-semibold text-primary">≥{PASSING_PERCENTAGE}%</span> (at least {Math.ceil(TOTAL_QUESTIONS * PASSING_PERCENTAGE / 100)} correct answers) to pass this test.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">6.</span>
                    <p>The test will <span className="font-semibold text-destructive">auto-submit</span> when time runs out.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">7.</span>
                    <p>Questions are generated based on your selected domain: <span className="font-semibold text-primary">{domain}</span></p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">8.</span>
                    <p>If you don't pass, you'll see which questions you got wrong and can retry.</p>
                  </div>
                </div>
              </div>

              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-warning mb-1">Important</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Ensure you have a stable internet connection</li>
                      <li>• Do not refresh or close the browser during the test</li>
                      <li>• You can mark questions to review later</li>
                      <li>• Use the Preview button to see all questions status</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-center">
                <Button 
                  onClick={handleStartTest}
                  size="lg"
                  className="px-8"
                  variant="hero"
                >
                  START TEST →
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Check if questions loaded
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No questions available. Please try again.</p>
          <Button onClick={() => setShowInstructions(true)}>Go Back</Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Preview Page
  if (showPreview) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Question Overview</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">{formatTime(timeLeft)}</span>
              </div>
              <Button onClick={() => setShowPreview(false)} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Test
              </Button>
            </div>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex gap-6 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success"></div>
                <span className="text-sm">Answered ({Object.keys(selectedAnswers).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-warning"></div>
                <span className="text-sm">Marked ({markedQuestions.size})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted border-2 border-border"></div>
                <span className="text-sm">Not Attempted ({questions.length - Object.keys(selectedAnswers).length})</span>
              </div>
            </div>
            
            <div className="grid grid-cols-10 gap-2">
              {questions.map((q, index) => {
                const status = getQuestionStatus(index);
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setShowPreview(false);
                    }}
                    className={`
                      w-12 h-12 rounded font-semibold transition-all hover:scale-105 relative
                      ${status === 'answered' ? 'bg-success text-success-foreground' : ''}
                      ${status === 'marked' ? 'bg-warning text-warning-foreground' : ''}
                      ${status === 'unattempted' ? 'bg-muted border-2 border-border text-foreground' : ''}
                    `}
                  >
                    {index + 1}
                    {q.difficulty === 'Hard' && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-destructive rounded-full"></span> Hard Question
              </span>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button onClick={() => setShowPreview(false)} variant="outline" size="lg">
              Continue Test
            </Button>
            <Button 
              onClick={handleSubmitTest}
              size="lg"
              variant="hero"
            >
              Submit Test ({Object.keys(selectedAnswers).length}/{questions.length} Answered)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{domain} MCQ Test</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
                {currentQuestion?.difficulty && (
                  <Badge 
                    variant="outline" 
                    className={`ml-2 ${
                      currentQuestion.difficulty === 'Easy' ? 'border-success text-success' :
                      currentQuestion.difficulty === 'Medium' ? 'border-warning text-warning' :
                      'border-destructive text-destructive'
                    }`}
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setShowPreview(true)}
                variant="outline"
                size="sm"
              >
                <List className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeLeft < 300 ? 'bg-destructive/20 text-destructive' : 'bg-muted'
              }`}>
                <Clock className={`w-5 h-5 ${timeLeft < 300 ? 'text-destructive animate-pulse' : 'text-primary'}`} />
                <span className="text-lg font-semibold">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="p-8 mb-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-8 leading-relaxed">{currentQuestion?.question}</h2>

          <RadioGroup
            value={selectedAnswers[currentQuestionIndex] || ""}
            onValueChange={(value) => handleAnswerSelect(value)}
            className="space-y-4"
          >
            {["A", "B", "C", "D"].map((option) => {
              const optionText = currentQuestion?.[`option_${option.toLowerCase()}` as keyof Question];
              return (
                <div 
                  key={option} 
                  className={`flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer ${
                    selectedAnswers[currentQuestionIndex] === option ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <RadioGroupItem value={option} id={`option-${option}`} />
                  <Label
                    htmlFor={`option-${option}`}
                    className="flex-1 cursor-pointer text-base"
                  >
                    <span className="font-semibold mr-2">{option}.</span>
                    {optionText}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            size="lg"
          >
            ← Previous
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={toggleMarkQuestion}
              size="lg"
              className={markedQuestions.has(currentQuestionIndex) ? 'bg-warning text-warning-foreground hover:bg-warning/90' : ''}
            >
              <Bookmark className="w-4 h-4 mr-2" />
              {markedQuestions.has(currentQuestionIndex) ? 'Unmark' : 'Mark for Review'}
            </Button>
            
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmitTest}
                size="lg"
                className="px-8"
                variant="hero"
              >
                Submit Test
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                size="lg"
                className="px-8"
              >
                Next →
              </Button>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Answered: {Object.keys(selectedAnswers).length}/{questions.length} | 
            Marked: {markedQuestions.size} | 
            Remaining: {questions.length - Object.keys(selectedAnswers).length}
          </p>
        </div>
      </div>

      {/* Results Dialog */}
      <AlertDialog open={showResults} onOpenChange={setShowResults}>
        <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              {passed ? (
                <CheckCircle className="w-16 h-16 text-success" />
              ) : (
                <XCircle className="w-16 h-16 text-destructive" />
              )}
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              {passed ? "Congratulations! 🎉" : "Test Not Passed"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-4">
                <div>
                  <p className="text-4xl font-bold text-foreground mb-2">
                    {score}/{questions.length}
                  </p>
                  <p className="text-lg">
                    You scored {((score / questions.length) * 100).toFixed(0)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Required: {PASSING_PERCENTAGE}% ({Math.ceil(questions.length * PASSING_PERCENTAGE / 100)} correct answers)
                  </p>
                </div>
                
                <p>
                  {passed
                    ? "You've passed the MCQ test! You can now proceed to the coding test."
                    : `You need at least ${PASSING_PERCENTAGE}% to pass. Review your wrong answers below and retry.`}
                </p>

                {!passed && wrongAnswers.length > 0 && (
                  <div className="text-left space-y-4 max-h-96 overflow-y-auto mt-4">
                    <h3 className="font-semibold text-foreground text-lg">
                      Questions You Got Wrong ({wrongAnswers.length}):
                    </h3>
                    {wrongAnswers.map((wa, index) => (
                      <div key={index} className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <p className="font-semibold text-sm mb-2">{wa.question}</p>
                        <div className="flex flex-col gap-2 text-sm">
                          <div className="flex gap-4">
                            <p className="text-destructive">
                              <span className="font-medium">Your Answer:</span> {wa.yourAnswer}
                            </p>
                            <p className="text-success">
                              <span className="font-medium">Correct:</span> {wa.correctAnswer}
                            </p>
                          </div>
                          {wa.explanation && (
                            <p className="text-muted-foreground bg-muted/50 p-2 rounded text-xs">
                              <span className="font-medium text-foreground">Explanation:</span> {wa.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button variant="hero" onClick={handleResultsClose} className="w-full mt-4" size="lg">
                  {passed ? "Continue to Coding Test →" : "Retry Test"}
                </Button>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MCQTest;
