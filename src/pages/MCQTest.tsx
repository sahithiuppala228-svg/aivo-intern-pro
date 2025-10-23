import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
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
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      // For now, load Web Development questions - later we'll get domain from profile
      const { data, error } = await supabase
        .from("mcq_questions")
        .select("*")
        .eq("domain", "Web Development")
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        setQuestions(data);
      } else {
        toast({
          title: "No questions available",
          description: "Please contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading questions:", error);
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
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

  const handleSubmit = async () => {
    // Calculate score
    let correctCount = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correctCount++;
      }
    });

    const finalScore = correctCount;
    const testPassed = correctCount >= 8; // 80% pass rate

    setScore(finalScore);
    setPassed(testPassed);

    // Save test attempt to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: attemptData, error: attemptError } = await supabase
          .from("user_test_attempts")
          .insert({
            user_id: user.id,
            domain: "Web Development",
            score: finalScore,
            total_questions: questions.length,
            passed: testPassed,
          })
          .select()
          .single();

        if (attemptError) throw attemptError;

        // Save individual answers
        const answers = questions.map((question, index) => ({
          attempt_id: attemptData.id,
          question_id: question.id,
          user_answer: selectedAnswers[index] || "",
          is_correct: selectedAnswers[index] === question.correct_answer,
        }));

        const { error: answersError } = await supabase
          .from("user_answers")
          .insert(answers);

        if (answersError) throw answersError;
      }
    } catch (error) {
      console.error("Error saving test results:", error);
    }

    setShowResults(true);
  };

  const handleResultsClose = () => {
    if (passed) {
      // Navigate to next page (coding test)
      toast({
        title: "Congratulations!",
        description: "Proceeding to coding test...",
      });
      navigate("/assessment-intro"); // Will be changed to coding test page later
    } else {
      // Navigate back to assessment intro
      navigate("/assessment-intro");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">No Questions Available</h2>
          <p className="text-muted-foreground mb-6">
            There are no questions available for this domain yet.
          </p>
          <Button onClick={() => navigate("/assessment-intro")}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/assessment-intro")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">MCQ Test</h1>
            <div className="text-sm text-muted-foreground">
              {answeredCount}/{questions.length} answered
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6">{currentQuestion.question}</h2>

          <div className="space-y-4">
            {["A", "B", "C", "D"].map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswers[currentQuestionIndex] === option
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="font-bold text-primary flex-shrink-0">
                    {option}.
                  </span>
                  <span className="flex-1">
                    {currentQuestion[`option_${option.toLowerCase()}` as keyof Question] as string}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                variant="hero"
                onClick={handleSubmit}
                disabled={answeredCount < questions.length}
              >
                Submit Test
              </Button>
            ) : (
              <Button variant="hero" onClick={handleNext}>
                Next Question
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results Dialog */}
      <AlertDialog open={showResults} onOpenChange={setShowResults}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              {passed ? (
                <CheckCircle className="w-16 h-16 text-green-500" />
              ) : (
                <XCircle className="w-16 h-16 text-destructive" />
              )}
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              {passed ? "Congratulations!" : "Test Not Passed"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4">
              <p className="text-4xl font-bold text-foreground">
                {score}/{questions.length}
              </p>
              <p className="text-lg">
                You scored {Math.round((score / questions.length) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">
                {passed
                  ? "You've passed the MCQ test! Ready for the next challenge?"
                  : "You need 80% (8/10) to pass. Please try again."}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={handleResultsClose} className="w-full">
              {passed ? "Continue to Next Stage" : "Back to Assessment Intro"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MCQTest;
