import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, CheckCircle, XCircle, List, Bookmark } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

const MCQTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const domain = location.state?.domain || "Web Development";

  const [showInstructions, setShowInstructions] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(2700); // 45 minutes in seconds
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [explanations, setExplanations] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadQuestions();
  }, [domain]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleSubmitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const loadQuestions = async () => {
    try {
      setLoading(true);

      // Fetch exactly 25 questions from the fixed dataset for this domain
      const { data, error } = await supabase
        .from('mcq_questions')
        .select('*')
        .eq('domain', domain)
        .limit(25);

      if (error || !data || data.length === 0) {
        toast({
          title: 'Error',
          description: 'No questions available for this domain. Please try another domain.',
          variant: 'destructive',
        });
        return;
      }

      // Questions are already in the correct format from the database
      setQuestions(data);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate questions. Please try again shortly.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmitTest = async () => {
    let correctCount = 0;

    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correctCount++;
      }
    });

    const testPassed = (correctCount / questions.length) >= 0.6; // 60% passing score
    setScore(correctCount);
    setPassed(testPassed);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: attemptData, error: attemptError } = await supabase
          .from("user_test_attempts")
          .insert({
            user_id: user.id,
            domain,
            score: correctCount,
            total_questions: questions.length,
            passed: testPassed,
          })
          .select()
          .single();

        if (attemptError) throw attemptError;

        const answersToInsert = questions.map((question, index) => ({
          attempt_id: attemptData.id,
          question_id: question.id,
          user_answer: selectedAnswers[index] || "",
          is_correct: selectedAnswers[index] === question.correct_answer,
        }));

        const { error: answersError } = await supabase
          .from("user_answers")
          .insert(answersToInsert);

        if (answersError) throw answersError;
      }

      // Generate AI explanations for all incorrect questions
      const incorrectQuestions = questions
        .map((question, index) => ({
          ...question,
          user_answer: selectedAnswers[index],
          index,
        }))
        .filter((q, index) => selectedAnswers[index] !== q.correct_answer);

      if (incorrectQuestions.length > 0) {
        const { data: explanationData } = await supabase.functions.invoke('generate-explanations', {
          body: { failedQuestions: incorrectQuestions }
        });

        if (explanationData?.explanations) {
          setExplanations(explanationData.explanations);
        }
      }
    } catch (error: any) {
      console.error("Error saving test results:", error);
    }

    setShowResults(true);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResultsClose = () => {
    if (passed) {
      navigate("/coding-test", { state: { domain } });
    } else {
      // Reset the test for retry
      setShowResults(false);
      setShowInstructions(true);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setTimeLeft(2700);
      setScore(0);
      setPassed(false);
      setExplanations([]);
      setLoading(true);
      loadQuestions();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading questions...</p>
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
                    <p><span className="font-semibold text-foreground">Number of Questions:</span> {questions.length}</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">2.</span>
                    <p><span className="font-semibold text-foreground">Types of Questions:</span> Multiple Choice Questions (MCQs)</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">3.</span>
                    <div>
                      <p><span className="font-semibold text-foreground">Marking Scheme:</span> All questions have equal weightage. Every correct response gets +1 mark.</p>
                      <p className="mt-1">There is no negative marking.</p>
                    </div>
                  </div>
                   <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">4.</span>
                    <p>You must score <span className="font-semibold text-foreground">≥60%</span> (at least 15 correct answers) to pass this test.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">5.</span>
                    <p><span className="font-semibold text-foreground">Time Limit:</span> 45 minutes</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-center">
                <Button 
                  onClick={() => setShowInstructions(false)}
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

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Preview Page
  if (showPreview) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Question Overview</h1>
            <Button onClick={() => setShowPreview(false)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Test
            </Button>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex gap-6 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-sm">Answered ({Object.keys(selectedAnswers).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500"></div>
                <span className="text-sm">Marked ({markedQuestions.size})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-white border-2"></div>
                <span className="text-sm">Not Attempted ({questions.length - Object.keys(selectedAnswers).length})</span>
              </div>
            </div>
            
            <div className="grid grid-cols-10 gap-2">
              {questions.map((_, index) => {
                const status = getQuestionStatus(index);
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setShowPreview(false);
                    }}
                    className={`
                      w-12 h-12 rounded font-semibold transition-all hover:scale-105
                      ${status === 'answered' ? 'bg-green-500 text-white' : ''}
                      ${status === 'marked' ? 'bg-orange-500 text-white' : ''}
                      ${status === 'unattempted' ? 'bg-white border-2 border-border text-foreground' : ''}
                    `}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="flex justify-between">
            <Button onClick={() => setShowPreview(false)} variant="outline" size="lg">
              Continue Test
            </Button>
            <Button 
              onClick={handleSubmitTest}
              disabled={Object.keys(selectedAnswers).length < questions.length}
              size="lg"
            >
              Submit Test
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
              <p className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</p>
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
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
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
                <div key={option} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value={option} id={`option-${option}`} />
                  <Label
                    htmlFor={`option-${option}`}
                    className="flex-1 cursor-pointer text-base"
                  >
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
              className={markedQuestions.has(currentQuestionIndex) ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}
            >
              <Bookmark className="w-4 h-4 mr-2" />
              {markedQuestions.has(currentQuestionIndex) ? 'Unmark' : 'Mark'}
            </Button>
            
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmitTest}
                disabled={Object.keys(selectedAnswers).length < questions.length}
                size="lg"
                className="px-8"
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
            Answered: {Object.keys(selectedAnswers).length}/{questions.length}
          </p>
        </div>
      </div>

      {/* Results Dialog */}
      <AlertDialog open={showResults} onOpenChange={setShowResults}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              {passed ? (
                <CheckCircle className="w-16 h-16 text-green-500" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500" />
              )}
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              {passed ? "Congratulations! 🎉" : "Test Not Passed"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4">
              <div>
                <p className="text-4xl font-bold text-foreground mb-2">
                  {score}/{questions.length}
                </p>
                <p className="text-lg">
                  You scored {((score / questions.length) * 100).toFixed(0)}%
                </p>
              </div>
              <p>
                {passed
                  ? "You've passed the MCQ test! You can now proceed to the coding test."
                  : "You need at least 60% to pass. Review and retry the exam with new questions."}
              </p>

              {explanations.length > 0 && (
                <div className="text-left space-y-4 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold text-foreground">Review Incorrect Answers:</h3>
                  {explanations.map((exp, index) => (
                    <div key={index} className="p-4 bg-muted rounded-lg">
                      <p className="font-semibold text-sm mb-2">{exp.question}</p>
                      <p className="text-sm text-destructive mb-1">Your answer: {exp.user_answer}</p>
                      <p className="text-sm text-green-600 mb-2">Correct answer: {exp.correct_answer}</p>
                      <p className="text-sm">{exp.explanation}</p>
                    </div>
                  ))}
                </div>
              )}

              <Button variant="hero" onClick={handleResultsClose} className="w-full" size="lg">
                {passed ? "Continue to Coding Test" : "Retry Test"}
              </Button>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MCQTest;
