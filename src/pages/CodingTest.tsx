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
  const [userInput, setUserInput] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [results, setResults] = useState<Array<{ questionIndex: number; passed: boolean; answerShown: boolean; score: number }>>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [mcqTestPassed, setMcqTestPassed] = useState(false);

  const currentChallenge = challenges[currentQuestionIndex];

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const generatedChallenges: Challenge[] = [];

      for (let i = 0; i < 5; i++) {
        try {
          const { data, error } = await supabase.functions.invoke('generate-coding-problem', {
            body: { domain }
          });

          if (error) {
            console.error(`Error generating challenge ${i + 1}:`, error);
            continue; // Skip this challenge and try the next one
          }

          if (data && data.title) {
            generatedChallenges.push(data);
          } else {
            console.error(`Invalid challenge data received for challenge ${i + 1}:`, data);
          }
        } catch (challengeError) {
          console.error(`Exception generating challenge ${i + 1}:`, challengeError);
          // Continue to next iteration
        }
      }

      if (generatedChallenges.length === 0) {
        throw new Error("Failed to generate any challenges");
      }

      setChallenges(generatedChallenges);
    } catch (error) {
      console.error('Error loading challenges:', error);
      toast({
        title: "Error",
        description: "Failed to generate coding challenges. Please try again.",
        variant: "destructive",
      });
      navigate("/assessment-intro"); // Return to assessment page on complete failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
    checkMcqTestStatus();
  }, [domain]);

  const checkMcqTestStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_test_attempts')
        .select('passed')
        .eq('user_id', user.id)
        .eq('domain', domain)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0 && data[0].passed) {
        setMcqTestPassed(true);
      }
    } catch (error) {
      console.error('Error checking MCQ test status:', error);
    }
  };

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

  if (!loading && challenges.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Challenges Available</h2>
          <p className="text-muted-foreground mb-4">Unable to generate coding challenges. Please try again.</p>
          <Button onClick={() => navigate("/assessment-intro")} variant="hero">
            Back to Assessment
          </Button>
        </Card>
      </div>
    );
  }

  if (!currentChallenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading challenge...</p>
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

            {percentage >= 60 && mcqTestPassed ? (
              <div className="space-y-4">
                <div className="p-4 bg-success/10 border-2 border-success/30 rounded-lg text-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                  <p className="font-semibold text-success">Congratulations! You passed both tests!</p>
                  <p className="text-sm text-muted-foreground mt-1">You're now ready for the AI Mock Interview</p>
                </div>
                <Button 
                  onClick={() => toast({ title: "Coming Soon!", description: "AI Mock Interview feature will be available soon." })} 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                >
                  Continue to AI Mock Interview
                </Button>
                <Button onClick={() => navigate("/assessment-intro")} variant="outline" size="lg" className="w-full">
                  Back to Assessment
                </Button>
              </div>
            ) : (
              <Button onClick={() => navigate("/assessment-intro")} variant="hero" size="lg" className="w-full">
                Back to Assessment
              </Button>
            )}
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


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Challenge Details Card */}
          <Card className="bg-gradient-to-br from-primary/5 via-card to-secondary/5 border-2 border-primary/20 shadow-hover p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  {currentChallenge.title}
                </h2>
                <Badge className="bg-gradient-hero text-primary-foreground shadow-soft">{currentChallenge.difficulty}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                Domain: {currentChallenge.domain}
              </p>
              <div className="bg-gradient-subtle p-4 rounded-lg border border-primary/10 shadow-soft">
                <p className="text-card-foreground leading-relaxed">
                  {currentChallenge.description}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <Card className="bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 p-4">
                <h3 className="font-semibold text-accent mb-2 flex items-center gap-2">
                  <span className="inline-block w-1 h-4 bg-accent rounded-full"></span>
                  Input Format
                </h3>
                <p className="text-muted-foreground text-sm">{currentChallenge.inputFormat}</p>
              </Card>
              
              <Card className="bg-gradient-to-br from-success/10 to-transparent border border-success/20 p-4">
                <h3 className="font-semibold text-success mb-2 flex items-center gap-2">
                  <span className="inline-block w-1 h-4 bg-success rounded-full"></span>
                  Output Format
                </h3>
                <p className="text-muted-foreground text-sm">{currentChallenge.outputFormat}</p>
              </Card>
              
              <Card className="bg-gradient-to-br from-secondary/20 to-transparent border border-secondary/30 p-4">
                <h3 className="font-semibold text-secondary-foreground mb-2 flex items-center gap-2">
                  <span className="inline-block w-1 h-4 bg-secondary rounded-full"></span>
                  Constraints
                </h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm ml-2">
                  {currentChallenge.constraints?.map((constraint, idx) => (
                    <li key={idx}>{constraint}</li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                Sample Test Cases
              </h3>
              {currentChallenge.testCases?.map((testCase, idx) => (
                <Card key={idx} className="bg-gradient-to-br from-muted/50 to-background border border-muted mb-3 p-4 hover:shadow-soft transition-all duration-200">
                  <p className="font-medium text-primary mb-3">Test Case {idx + 1}</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gradient-to-br from-blue-500/5 to-transparent p-3 rounded-lg border border-blue-500/20">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 block">Input</span>
                      <pre className="bg-background/80 p-2 rounded text-xs overflow-x-auto">{testCase.input}</pre>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/5 to-transparent p-3 rounded-lg border border-green-500/20">
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1 block">Output</span>
                      <pre className="bg-background/80 p-2 rounded text-xs overflow-x-auto">{testCase.output}</pre>
                    </div>
                  </div>
                  <div className="bg-gradient-subtle p-2 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Explanation:</span> {testCase.explanation}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Code Editor Card */}
          <Card className="bg-gradient-to-br from-secondary/5 via-card to-accent/5 border-2 border-secondary/20 shadow-hover p-6">
            <div className="mb-6">
              <Label htmlFor="userInput" className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-accent"></span>
                Your Input (JSON)
              </Label>
              <Textarea
                id="userInput"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder='{"input": "your test input"}'
                className="font-mono h-32 bg-gradient-subtle border-accent/20 focus:border-accent/40 transition-all duration-200"
              />
            </div>

            <div className="mb-6">
              <Label htmlFor="code" className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-primary"></span>
                Your Solution
              </Label>
              <Textarea
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Write your code here..."
                className="font-mono h-96 bg-gradient-subtle border-primary/20 focus:border-primary/40 transition-all duration-200"
              />
            </div>

            <Button onClick={handleSubmit} variant="hero" size="lg" className="w-full">
              Submit & Continue
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CodingTest;
