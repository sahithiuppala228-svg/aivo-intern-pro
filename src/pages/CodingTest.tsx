import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, AlertTriangle, CheckCircle2, XCircle, Code2, Play } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface CodingChallenge {
  title: string;
  description: string;
  starterCode: string;
  testCases: { input: string; expected: string; description: string }[];
}

// Multiple challenges per domain to randomize
const challengePools: Record<string, CodingChallenge[]> = {
  "Web Development": [
    {
      title: "Create a Todo List Component",
      description: "Write a function that takes an array of tasks and returns HTML markup for a todo list with proper structure.",
      starterCode: `function createTodoList(tasks) {
  // Your code here
  
}`,
      testCases: [
        { input: '["Buy milk", "Walk dog"]', expected: '<ul><li>Buy milk</li><li>Walk dog</li></ul>', description: "Basic list with 2 items" },
        { input: '["Task 1"]', expected: '<ul><li>Task 1</li></ul>', description: "Single item list" },
        { input: '[]', expected: '<ul></ul>', description: "Empty list" },
      ],
    },
    {
      title: "Button Click Counter",
      description: "Create a function that generates HTML for a button with click count display.",
      starterCode: `function createCounter(label, initialCount) {
  // Your code here
  
}`,
      testCases: [
        { input: '["Click Me", 0]', expected: '<div><button>Click Me</button><span>Count: 0</span></div>', description: "Initial counter" },
        { input: '["Submit", 5]', expected: '<div><button>Submit</button><span>Count: 5</span></div>', description: "Counter with initial value" },
      ],
    },
    {
      title: "Format User Card",
      description: "Create a function that formats user data into a card HTML structure.",
      starterCode: `function formatUserCard(user) {
  // user has: name, email, role
  
}`,
      testCases: [
        { input: '{"name": "John", "email": "john@test.com", "role": "Developer"}', expected: '<div class="user-card"><h3>John</h3><p>john@test.com</p><span>Developer</span></div>', description: "Standard user card" },
      ],
    },
  ],
  "Data Science": [
    {
      title: "Calculate Statistics",
      description: "Write a function that calculates mean, median, and mode from an array of numbers.",
      starterCode: `function calculateStats(numbers) {
  // Return object with mean, median
  
}`,
      testCases: [
        { input: '[1, 2, 3, 4, 5]', expected: '{"mean":3,"median":3}', description: "Odd length array" },
        { input: '[10, 20, 30, 40]', expected: '{"mean":25,"median":25}', description: "Even length array" },
      ],
    },
    {
      title: "Data Filtering",
      description: "Filter an array of objects based on a threshold value.",
      starterCode: `function filterData(data, threshold) {
  // Filter items where value > threshold
  
}`,
      testCases: [
        { input: '[[{"value": 10}, {"value": 20}, {"value": 5}], 8]', expected: '[{"value":10},{"value":20}]', description: "Filter by threshold" },
      ],
    },
  ],
  "Mobile Development": [
    {
      title: "Validate Input Formats",
      description: "Validate phone numbers and email addresses.",
      starterCode: `function validatePhone(phone) {
  // Return true if format is (XXX) XXX-XXXX
  
}`,
      testCases: [
        { input: '"(123) 456-7890"', expected: 'true', description: "Valid phone format" },
        { input: '"123-456-7890"', expected: 'false', description: "Invalid format" },
        { input: '"(999) 888-7777"', expected: 'true', description: "Another valid format" },
      ],
    },
    {
      title: "Screen Dimension Calculator",
      description: "Calculate aspect ratio from width and height.",
      starterCode: `function getAspectRatio(width, height) {
  // Return simplified ratio as string like "16:9"
  
}`,
      testCases: [
        { input: '[1920, 1080]', expected: '"16:9"', description: "HD resolution" },
        { input: '[1024, 768]', expected: '"4:3"', description: "Standard resolution" },
      ],
    },
  ],
};

const CodingTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const domain = location.state?.domain || "Web Development";

  // Select 5 random challenges from the pool
  const [challenges] = useState<CodingChallenge[]>(() => {
    const pool = challengePools[domain] || challengePools["Web Development"];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    // If pool has fewer than 5, repeat to get 5
    const selected = [];
    while (selected.length < 5) {
      selected.push(...shuffled.slice(0, Math.min(5 - selected.length, shuffled.length)));
    }
    return selected.slice(0, 5);
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [code, setCode] = useState("");
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [userInput, setUserInput] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [results, setResults] = useState<Array<{ questionIndex: number; passed: boolean; answerShown: boolean; score: number }>>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentChallenge = challenges[currentQuestionIndex];

  // Set starter code when question changes
  useEffect(() => {
    setCode(currentChallenge.starterCode);
    setUserInput("");
    setAnswerRevealed(false);
  }, [currentQuestionIndex, currentChallenge]);

  // Timer countdown
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
      
      // Use the first test case as reference
      const testCase = currentChallenge.testCases[0];
      try {
        parsedInput = userInput ? JSON.parse(userInput) : JSON.parse(testCase.input);
      } catch (e) {
        throw new Error("Invalid JSON in Input");
      }
      
      const result = Array.isArray(parsedInput) ? userFunction(...parsedInput) : userFunction(parsedInput);
      const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
      const expectedStr = testCase.expected;

      const passed = String(resultStr) === String(expectedStr);
      const score = passed ? (answerRevealed ? 0.5 : 1) : 0; // 50% if answer shown, 100% if solved independently

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

      // Move to next question or finish
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
          <div className="absolute -inset-1 bg-gradient-hero opacity-20 blur-3xl rounded-full"></div>
          <div className="relative">
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Challenge & Code Editor */}
          <div className="space-y-6">
            <Card className="p-6 shadow-hover border-2 hover:border-primary/30 transition-all duration-300 bg-gradient-card">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <span className="w-1 h-8 bg-gradient-hero rounded-full"></span>
                  {currentChallenge.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{currentChallenge.description}</p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  Your Input
                </h3>
                <div>
                  <label className="text-sm font-medium mb-2 block">Input (JSON)</label>
                  <Textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={`e.g., ${currentChallenge.testCases[0].input}`}
                    className="font-mono min-h-[120px] bg-gradient-code border-2 focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Leave empty to use default test input
                  </p>
                </div>
              </div>

              {answerRevealed && (
                <Card className="p-4 mb-6 border-2 border-primary bg-primary/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <p className="font-bold text-primary">Answer Revealed (50% marks)</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-mono bg-background/50 p-3 rounded border">
                      <span className="text-muted-foreground">Expected: </span>
                      <span className="text-success font-bold">{currentChallenge.testCases[0].expected}</span>
                    </p>
                  </div>
                </Card>
              )}

              <div>
                <label className="block font-semibold mb-4 flex items-center gap-2">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Code2 className="w-4 h-4 text-secondary" />
                  </div>
                  Your Solution
                </label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-hero opacity-0 group-hover:opacity-10 blur transition-opacity duration-300 rounded-lg"></div>
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="// Write your code here..."
                    className="relative font-mono min-h-[400px] bg-gradient-code border-2 focus:border-primary focus:shadow-glow transition-all duration-300 resize-none"
                    onPaste={(e) => e.preventDefault()}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                {!answerRevealed && timeLeft > 0 && (
                  <Button onClick={handleShowAnswer} variant="outline" size="lg" className="flex-1">
                    Show Answer (50% marks)
                  </Button>
                )}
                <Button onClick={handleSubmit} variant="hero" size="lg" className="flex-1 group">
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Submit & Continue
                </Button>
              </div>
            </Card>
          </div>

          {/* Right: Progress & Score */}
          <div className="space-y-6">
            <Card className="p-6 shadow-hover border-2 bg-gradient-card sticky top-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                </div>
                <h3 className="font-bold text-lg">Progress</h3>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gradient-card p-4 rounded-xl border-2">
                  <p className="text-sm text-muted-foreground mb-2">Current Score</p>
                  <div className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                    {totalScore.toFixed(1)} / 5
                  </div>
                </div>

                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => {
                    const result = results.find(r => r.questionIndex === i);
                    return (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                        i === currentQuestionIndex ? "border-primary bg-primary/5" :
                        result ? (result.passed ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5") :
                        "border-border bg-background"
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          i === currentQuestionIndex ? "bg-primary text-primary-foreground" :
                          result ? (result.passed ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground") :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {i === currentQuestionIndex ? "Current" : result ? "Completed" : "Pending"}
                          </p>
                          {result && (
                            <p className="text-xs text-muted-foreground">
                              {result.score.toFixed(1)} mark{result.score !== 1 ? 's' : ''} 
                              {result.answerShown && " (answer shown)"}
                            </p>
                          )}
                        </div>
                        {result && (
                          result.passed ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive" />
                          )
                        )}
                      </div>
                    );
                  })}
                </div>

                {answerRevealed && (
                  <Card className="p-4 border-2 border-primary bg-primary/5">
                    <p className="text-xs text-primary font-medium">
                      ⚠️ Answer revealed - You'll get 50% marks if correct
                    </p>
                  </Card>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingTest;
