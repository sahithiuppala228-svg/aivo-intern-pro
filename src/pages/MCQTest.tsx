import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";
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

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [explanations, setExplanations] = useState<any[]>([]);

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

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("mcq_questions")
        .select("*")
        .eq("domain", domain)
        .limit(10);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No questions found",
          description: `No questions available for ${domain}. Using Web Development questions.`,
          variant: "destructive",
        });
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("mcq_questions")
          .select("*")
          .eq("domain", "Web Development")
          .limit(10);

        if (fallbackError) throw fallbackError;
        setQuestions(fallbackData || []);
      } else {
        setQuestions(data);
      }
    } catch (error: any) {
      toast({
        title: "Error loading questions",
        description: error.message,
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

  const handleSubmitTest = async () => {
    let correctCount = 0;

    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correctCount++;
      }
    });

    const testPassed = correctCount >= 8;
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

      // Generate AI explanations for failed questions
      if (!testPassed) {
        const failedQuestions = questions
          .map((question, index) => ({
            ...question,
            user_answer: selectedAnswers[index],
          }))
          .filter((q, index) => selectedAnswers[index] !== q.correct_answer);

        const { data: explanationData } = await supabase.functions.invoke('generate-explanations', {
          body: { failedQuestions }
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
      navigate("/assessment-intro");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/assessment-intro")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assessment Intro
          </Button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">MCQ Test</h1>
              <p className="text-muted-foreground">Domain: {domain}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="w-5 h-5" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>Answered: {answeredCount}/{questions.length}</span>
            </div>
            <Progress value={progress} />
          </div>
        </div>

        {/* Question Card */}
        <Card className="p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6">{currentQuestion?.question}</h2>

          <div className="space-y-3">
            {["A", "B", "C", "D"].map((option) => {
              const optionText = currentQuestion?.[`option_${option.toLowerCase()}` as keyof Question];
              const isSelected = selectedAnswers[currentQuestionIndex] === option;

              return (
                <button
                  key={option}
                  onClick={() => handleAnswerSelect(option)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {option}
                    </div>
                    <span>{optionText}</span>
                  </div>
                </button>
              );
            })}
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
                onClick={handleSubmitTest}
                disabled={answeredCount < questions.length}
              >
                Submit Test
              </Button>
            ) : (
              <Button variant="default" onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">Quick Navigation:</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                  currentQuestionIndex === index
                    ? "bg-primary text-primary-foreground"
                    : selectedAnswers[index]
                    ? "bg-primary/20 text-primary"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Dialog */}
      <AlertDialog open={showResults} onOpenChange={setShowResults}>
        <AlertDialogContent>
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
                  : "You need at least 8 correct answers to pass. Review the explanations below."}
              </p>

              {!passed && explanations.length > 0 && (
                <div className="text-left space-y-4 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold text-foreground">AI-Generated Explanations:</h3>
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

              <Button variant="hero" onClick={handleResultsClose} className="w-full">
                {passed ? "Continue to Coding Test" : "Back to Assessment"}
              </Button>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MCQTest;
