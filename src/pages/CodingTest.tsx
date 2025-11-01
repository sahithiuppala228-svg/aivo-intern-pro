import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Code2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  domain: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  testCases: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
  sampleInput: string;
  sampleOutput: string;
}

const CodingTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const domain = location.state?.domain || "Web Development";

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [code, setCode] = useState("");
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [userInput, setUserInput] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [results, setResults] = useState<Array<{ questionIndex: number; passed: boolean; answerShown: boolean; score: number }>>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentChallenge = challenges[currentQuestionIndex];

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const generatedChallenges: Challenge[] = [];

      for (let i = 0; i < 5; i++) {
        const { data, error } = await supabase.functions.invoke('generate-coding-problem', {
          body: { domain }
        });

        if (error) throw error;
        generatedChallenges.push(data);
      }

      setChallenges(generatedChallenges);
    } catch (error) {
      console.error('Error loading challenges:', error);
      toast({
        title: "Error",
        description: "Failed to generate coding challenges. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, [domain]);

  useEffect(() => {
    if (!currentChallenge) return;
    setCode("");
    setUserInput("");
    setAnswerRevealed(false);
  }, [currentQuestionIndex, currentChallenge]);

  useEffect(() => {
    if (timeLeft <= 0 || isFinished) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setAnswerRevealed(true);
          toast({
            title: "Time's Up!",
            description: "Answer revealed. You'll get 50% marks if correct.",
            variant: "destructive",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setCopyAttempts(prev => prev + 1);
      toast({
        title: "Copy-Paste Disabled",
        description: "Please type your code manually.",
        variant: "destructive",
      });
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setCopyAttempts(prev => prev + 1);
      toast({
        title: "Copy-Paste Disabled",
        description: "Please type your code manually.",
        variant: "destructive",
      });
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, [toast]);

  const handleShowAnswer = () => {
    setAnswerRevealed(true);
    toast({
      title: "Answer Revealed",
      description: "You'll get 50% marks if you answer correctly now.",
    });
  };

  const handleSubmit = () => {
    try {
      const userFunction = new Function('return ' + code)();
      let parsedInput: any;
      
      const testCase = currentChallenge.testCases[0];
      try {
        parsedInput = userInput ? JSON.parse(userInput) : JSON.parse(testCase.input);
      } catch (e) {
        throw new Error("Invalid JSON in Input");
      }
      
      const result = Array.isArray(parsedInput) ? userFunction(...parsedInput) : userFunction(parsedInput);
      const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
      const expectedStr = testCase.output;

      const passed = String(resultStr) === String(expectedStr);
      const score = passed ? (answerRevealed ? 0.5 : 1) : 0;

      setResults(prev => [...prev, {
        questionIndex: currentQuestionIndex,
        passed,
        answerShown: answerRevealed,
        score,
      }]);

      toast({
        title: passed ? "Correct!" : "Incorrect",
        description: passed 
          ? `You earned ${score} mark${score !== 1 ? 's' : ''}!` 
          : "Try the next question!",
        variant: passed ? "default" : "destructive",
      });

      if (currentQuestionIndex < challenges.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    } catch (error: any) {
      toast({
        title: "Run Error",
        description: error?.message || "Please check your code and input.",
        variant: "destructive",
      });
    }
  };

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const percentage = isFinished ? (totalScore / 5) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating coding challenges...</p>
        </Card>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          <Card className="p-8 shadow-hover border-2">
            <div className="text-center mb-8">
              <div className="p-4 bg-gradient-hero rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Test Completed!</h1>
              <p className="text-muted-foreground">Here's how you performed</p>
            </div>

            <div className="bg-gradient-card p-6 rounded-xl border-2 mb-6">
              <div className="text-center">
                <div className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
                  {totalScore.toFixed(1)} / 5
                </div>
                <p className="text-muted-foreground">Total Score ({percentage.toFixed(0)}%)</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {results.map((result, i) => (
                <Card key={i} className={`p-4 border-2 ${result.passed ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${result.passed ? "bg-success/20" : "bg-destructive/20"}`}>
                        {result.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold">Question {i + 1}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.answerShown ? "Answer was shown (50% marks)" : "Solved independently"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{result.score.toFixed(1)}</div>
                      <p className="text-xs text-muted-foreground">mark{result.score !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button onClick={() => navigate("/assessment-intro")} variant="hero" size="lg" className="w-full">
              Back to Assessment
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8">
      <div className="container mx-auto px-6 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/assessment-intro")}
          className="mb-6 hover:bg-muted/80 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assessment
        </Button>

        <div className="mb-8 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-hero rounded-xl shadow-glow">
                <Code2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">Coding Challenge</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{domain}</Badge>
                  <Badge variant="outline" className="text-xs">Question {currentQuestionIndex + 1} of 5</Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold font-mono ${timeLeft < 300 ? "text-destructive" : "text-foreground"}`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-xs text-muted-foreground">Time Remaining</p>
            </div>
          </div>
        </div>

        {copyAttempts > 0 && (
          <Card className="p-4 mb-6 border-2 border-destructive bg-destructive/5 shadow-lg animate-pulse">
            <div className="flex items-center gap-3 text-destructive">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">Anti-Cheat Detection</p>
                <p className="text-sm text-destructive/80">
                  Copy-Paste Attempts: {copyAttempts}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="bg-card rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-card-foreground">
                {currentChallenge.title}
              </h2>
              <Badge variant="outline">{currentChallenge.difficulty}</Badge>
            </div>
            <p className="text-muted-foreground mb-2">
              Domain: {currentChallenge.domain}
            </p>
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <p className="text-card-foreground leading-relaxed">
                {currentChallenge.description}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Input Format</h3>
              <p className="text-muted-foreground">{currentChallenge.inputFormat}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Output Format</h3>
              <p className="text-muted-foreground">{currentChallenge.outputFormat}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Constraints</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {currentChallenge.constraints?.map((constraint, idx) => (
                  <li key={idx}>{constraint}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-card-foreground mb-3">Sample Test Cases</h3>
            {currentChallenge.testCases?.map((testCase, idx) => (
              <div key={idx} className="bg-muted/30 p-4 rounded-lg mb-3">
                <p className="font-medium text-card-foreground mb-2">{idx + 1}:</p>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Input</span>
                    <pre className="bg-background p-2 rounded mt-1 text-sm">{testCase.input}</pre>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Output</span>
                    <pre className="bg-background p-2 rounded mt-1 text-sm">{testCase.output}</pre>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Explanation:</span> {testCase.explanation}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <Label htmlFor="userInput">Your Input (JSON)</Label>
            <Textarea
              id="userInput"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder='{"input": "your test input"}'
              className="font-mono h-32"
            />
          </div>

          {answerRevealed && (
            <Card className="p-4 mb-6 border-2 border-primary bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <p className="font-bold text-primary">Answer Revealed (50% marks)</p>
              </div>
            </Card>
          )}

          <div className="mb-6">
            <Label htmlFor="code">Your Solution</Label>
            <Textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Write your code here..."
              className="font-mono h-64"
            />
          </div>

          <div className="flex gap-4">
            {!answerRevealed && (
              <Button onClick={handleShowAnswer} variant="outline" className="flex-1">
                Show Answer (50% marks)
              </Button>
            )}
            <Button onClick={handleSubmit} variant="default" className="flex-1">
              Submit & Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingTest;
