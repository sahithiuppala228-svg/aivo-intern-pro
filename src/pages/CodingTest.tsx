import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, XCircle, Code2, Play, Trophy, Mic, ExternalLink, Clock, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  domain: string;
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
  testCases: TestCase[];
  hints: string[];
}

interface TestResult {
  testCaseId: number;
  passed: boolean;
  yourOutput: string;
  expectedOutput: string;
  input: string;
  isHidden: boolean;
}

interface ChallengeScore {
  questionIndex: number;
  visiblePassed: number;
  visibleTotal: number;
  hiddenPassed: number;
  hiddenTotal: number;
  totalPassed: number;
  totalTestCases: number;
}

const TOTAL_QUESTIONS = 10;
const PASSING_PERCENTAGE = 80;

// Helper to convert API response to Challenge format
const convertApiResponseToChallenge = (apiProblem: any, index: number, difficulty: string): Challenge => {
  const testCases: TestCase[] = [];
  
  // Create visible test cases from API response
  if (apiProblem.testCases && Array.isArray(apiProblem.testCases)) {
    apiProblem.testCases.forEach((tc: any, i: number) => {
      testCases.push({
        id: i + 1,
        input: tc.input || '',
        expectedOutput: tc.output || tc.expectedOutput || '',
        isHidden: i >= 2 // First 2 visible, rest hidden
      });
    });
  }
  
  // Ensure minimum test cases
  if (testCases.length < 3) {
    for (let i = testCases.length; i < 5; i++) {
      testCases.push({
        id: i + 1,
        input: `test_input_${i}`,
        expectedOutput: `expected_${i}`,
        isHidden: i >= 2
      });
    }
  }

  return {
    id: apiProblem.id || `challenge-${index + 1}`,
    title: apiProblem.title || `Challenge ${index + 1}`,
    description: apiProblem.description || '',
    difficulty: difficulty as "Easy" | "Medium" | "Hard",
    domain: apiProblem.domain || '',
    problemStatement: apiProblem.description || '',
    inputFormat: apiProblem.inputFormat || 'Input as specified in the problem',
    outputFormat: apiProblem.outputFormat || 'Output the result as specified',
    constraints: Array.isArray(apiProblem.constraints) ? apiProblem.constraints : [],
    examples: apiProblem.testCases?.slice(0, 2).map((tc: any) => ({
      input: tc.input || '',
      output: tc.output || tc.expectedOutput || '',
      explanation: tc.explanation || ''
    })) || [],
    testCases,
    hints: [
      "Break down the problem into smaller steps",
      "Consider edge cases like empty inputs",
      difficulty === "Hard" ? "Think about optimization" : "Use built-in methods where helpful"
    ]
  };
};

const CodingTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const domain = location.state?.domain || "Web Development";
  const mcqScore = location.state?.mcqScore;
  const mcqTotal = location.state?.mcqTotal;

  const [showInstructions, setShowInstructions] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [code, setCode] = useState("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [allTestsPassed, setAllTestsPassed] = useState(false);
  const [challengeScores, setChallengeScores] = useState<ChallengeScore[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [totalScore, setTotalScore] = useState({ passed: 0, total: 0 });
  const [passed, setPassed] = useState(false);

  const currentChallenge = challenges[currentQuestionIndex];
  const completedChallenges = new Set(challengeScores.map(s => s.questionIndex));
  const allChallengesCompleted = challengeScores.length === challenges.length;

  // Fetch coding challenges from Gemini API
  const fetchChallenges = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to take the coding test.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const difficulties = ["Easy", "Easy", "Easy", "Medium", "Medium", "Medium", "Medium", "Hard", "Hard", "Hard"];
      const fetchedChallenges: Challenge[] = [];

      // Fetch challenges one by one from the API
      for (let i = 0; i < TOTAL_QUESTIONS; i++) {
        const difficulty = difficulties[i];
        
        try {
          const { data, error } = await supabase.functions.invoke('generate-coding-problem', {
            body: { domain, difficulty }
          });

          if (error) {
            console.error(`Error fetching challenge ${i + 1}:`, error);
            // Create a fallback challenge
            fetchedChallenges.push(createFallbackChallenge(domain, i, difficulty));
          } else if (data) {
            fetchedChallenges.push(convertApiResponseToChallenge(data, i, difficulty));
          }
        } catch (err) {
          console.error(`Failed to fetch challenge ${i + 1}:`, err);
          fetchedChallenges.push(createFallbackChallenge(domain, i, difficulty));
        }

        // Small delay between requests to avoid rate limiting
        if (i < TOTAL_QUESTIONS - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setChallenges(fetchedChallenges);
      
      if (fetchedChallenges.length < TOTAL_QUESTIONS) {
        toast({
          title: "Some challenges couldn't be loaded",
          description: "Using fallback challenges for some questions.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
      toast({
        title: "Error loading challenges",
        description: "Could not load coding challenges. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [domain, toast, navigate]);

  // Create fallback challenge if API fails
  const createFallbackChallenge = (domain: string, index: number, difficulty: string): Challenge => {
    const fallbackProblems = [
      { title: "Array Sum", desc: "Write a function that takes an array of numbers and returns their sum." },
      { title: "String Reversal", desc: "Write a function that reverses a given string without using built-in reverse methods." },
      { title: "Maximum Element", desc: "Write a function that finds the maximum element in an array of numbers." },
      { title: "Palindrome Check", desc: "Write a function that checks if a given string is a palindrome." },
      { title: "Remove Duplicates", desc: "Write a function that removes duplicate values from an array." },
      { title: "Second Largest", desc: "Write a function that finds the second largest number in an array." },
      { title: "Character Frequency", desc: "Write a function that counts the frequency of each character in a string." },
      { title: "Pair Sum", desc: "Write a function that finds all pairs in an array that sum to a target value." },
      { title: "Binary Search", desc: "Write a function that implements binary search on a sorted array." },
      { title: "Merge Arrays", desc: "Write a function that merges two sorted arrays into one sorted array." }
    ];

    const problem = fallbackProblems[index] || fallbackProblems[0];
    
    return {
      id: `challenge-${index + 1}`,
      title: problem.title,
      description: problem.desc,
      difficulty: difficulty as "Easy" | "Medium" | "Hard",
      domain,
      problemStatement: problem.desc,
      inputFormat: "Input as specified in the problem",
      outputFormat: "Output the result as specified",
      constraints: ["Array length: 1 ≤ n ≤ 1000", "Time complexity should be optimal"],
      examples: [{ input: "sample", output: "result", explanation: "Example" }],
      testCases: [
        { id: 1, input: "test1", expectedOutput: "result1", isHidden: false },
        { id: 2, input: "test2", expectedOutput: "result2", isHidden: false },
        { id: 3, input: "test3", expectedOutput: "result3", isHidden: true },
        { id: 4, input: "test4", expectedOutput: "result4", isHidden: true },
        { id: 5, input: "test5", expectedOutput: "result5", isHidden: true }
      ],
      hints: ["Break down the problem", "Consider edge cases", "Think about optimization"]
    };
  };

  const handleStartTest = async () => {
    setShowInstructions(false);
    await fetchChallenges();
  };

  // Run tests
  const runTests = () => {
    if (!code.trim()) {
      toast({
        title: "No Code",
        description: "Please write your solution before running tests.",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    // Simulate test execution
    setTimeout(() => {
      // Simulate test results - in real implementation, this would evaluate code
      const results: TestResult[] = currentChallenge.testCases.map((tc) => {
        // Simulate passing based on code length and structure (demo mode)
        const hasValidCode = code.length > 20 && (code.includes('return') || code.includes('=>') || code.includes('function'));
        const randomPass = Math.random() > 0.3; // 70% pass rate for demo
        const passed = hasValidCode && randomPass;
        
        return {
          testCaseId: tc.id,
          passed,
          yourOutput: passed ? tc.expectedOutput : "incorrect_output",
          expectedOutput: tc.expectedOutput,
          input: tc.input,
          isHidden: tc.isHidden
        };
      });

      setTestResults(results);
      setIsRunning(false);

      const visibleResults = results.filter(r => !r.isHidden);
      const hiddenResults = results.filter(r => r.isHidden);
      
      const visiblePassed = visibleResults.filter(r => r.passed).length;
      const hiddenPassed = hiddenResults.filter(r => r.passed).length;
      const totalPassed = results.filter(r => r.passed).length;
      
      const allPassed = totalPassed === results.length;
      setAllTestsPassed(allPassed);

      // Record score for this challenge
      const newScore: ChallengeScore = {
        questionIndex: currentQuestionIndex,
        visiblePassed,
        visibleTotal: visibleResults.length,
        hiddenPassed,
        hiddenTotal: hiddenResults.length,
        totalPassed,
        totalTestCases: results.length
      };

      setChallengeScores(prev => {
        const filtered = prev.filter(s => s.questionIndex !== currentQuestionIndex);
        return [...filtered, newScore];
      });

      if (allPassed) {
        toast({
          title: "All Tests Passed! 🎉",
          description: `Question ${currentQuestionIndex + 1} completed perfectly!`,
        });
      } else {
        toast({
          title: `${totalPassed}/${results.length} Tests Passed`,
          description: `Visible: ${visiblePassed}/${visibleResults.length}, Hidden: ${hiddenPassed}/${hiddenResults.length}`,
          variant: totalPassed >= results.length * 0.5 ? "default" : "destructive",
        });
      }
    }, 2000);
  };

  const goToNextChallenge = () => {
    if (currentQuestionIndex < challenges.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setCode("");
      setTestResults([]);
      setAllTestsPassed(false);
      setShowHints(false);
    }
  };

  const goToPreviousChallenge = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setCode("");
      setTestResults([]);
      setAllTestsPassed(false);
      setShowHints(false);
    }
  };

  const handleSubmitAllChallenges = () => {
    // Calculate total score
    let totalPassedTests = 0;
    let totalTests = 0;
    
    challengeScores.forEach(score => {
      totalPassedTests += score.totalPassed;
      totalTests += score.totalTestCases;
    });

    // Add scores for unattempted challenges as 0
    const attemptedIndexes = new Set(challengeScores.map(s => s.questionIndex));
    challenges.forEach((c, idx) => {
      if (!attemptedIndexes.has(idx)) {
        totalTests += c.testCases.length;
      }
    });

    const percentage = totalTests > 0 ? (totalPassedTests / totalTests) * 100 : 0;
    const testPassed = percentage >= PASSING_PERCENTAGE;

    setTotalScore({ passed: totalPassedTests, total: totalTests });
    setPassed(testPassed);
    setShowResults(true);
  };

  const handleResultsClose = () => {
    if (passed) {
      navigate("/mock-interview", { state: { domain } });
    } else {
      // Reset for retry
      setShowResults(false);
      setShowInstructions(true);
      setCurrentQuestionIndex(0);
      setCode("");
      setTestResults([]);
      setAllTestsPassed(false);
      setChallengeScores([]);
      setChallenges([]);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating {TOTAL_QUESTIONS} coding challenges for {domain}...</p>
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
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-hero rounded-lg">
                  <Code2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{domain} Coding Test</h1>
                  <p className="text-muted-foreground">Practical coding challenges</p>
                </div>
              </div>
              
              {mcqScore !== undefined && (
                <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-4">
                  <p className="text-success font-medium">
                    ✓ MCQ Test Passed: {mcqScore}/{mcqTotal} ({((mcqScore/mcqTotal)*100).toFixed(0)}%)
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">1.</span>
                    <p><span className="font-semibold text-foreground">Number of Questions:</span> {TOTAL_QUESTIONS} coding challenges</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">2.</span>
                    <p><span className="font-semibold text-foreground">Difficulty Levels:</span> Easy, Medium, and Hard problems</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">3.</span>
                    <p><span className="font-semibold text-foreground">Test Cases:</span> Each problem has <span className="text-primary">visible</span> and <span className="text-warning">hidden</span> test cases</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">4.</span>
                    <p>You must achieve <span className="font-semibold text-primary">≥{PASSING_PERCENTAGE}%</span> overall test case pass rate to proceed</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">5.</span>
                    <p>You can navigate between questions and submit solutions multiple times</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-foreground min-w-[24px]">6.</span>
                    <p>After completing all challenges, you'll proceed to the <span className="font-semibold text-primary">AI Interview Round</span></p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Test Case Types:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Visible Test Cases</p>
                      <p className="text-muted-foreground">You can see input/output</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium">Hidden Test Cases</p>
                      <p className="text-muted-foreground">Only pass/fail shown</p>
                    </div>
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
                  START CODING TEST →
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentChallenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading challenges...</p>
        </Card>
      </div>
    );
  }

  const overallProgress = (challengeScores.length / challenges.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/assessment-intro")}
                className="hover:bg-muted/80"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-hero rounded-lg">
                  <Code2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Coding Challenge {currentQuestionIndex + 1}/{TOTAL_QUESTIONS}</h1>
                  <p className="text-xs text-muted-foreground">{domain}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {challenges.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                      completedChallenges.has(idx)
                        ? "bg-success text-success-foreground"
                        : idx === currentQuestionIndex
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setCode("");
                      setTestResults([]);
                      setAllTestsPassed(false);
                    }}
                  >
                    {completedChallenges.has(idx) ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                ))}
              </div>
              <Badge variant="outline" className="text-sm">
                {challengeScores.length}/{challenges.length} Attempted
              </Badge>
            </div>
          </div>
          <Progress value={overallProgress} className="h-1 mt-3" />
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
          {/* Left Panel - Problem Description */}
          <div className="overflow-y-auto pr-2">
            <Card className="p-6 border-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge className={`mb-2 ${
                    currentChallenge.difficulty === "Easy" ? "bg-success" :
                    currentChallenge.difficulty === "Medium" ? "bg-warning" : "bg-destructive"
                  }`}>
                    {currentChallenge.difficulty}
                  </Badge>
                  <h2 className="text-2xl font-bold">{currentChallenge.title}</h2>
                </div>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="bg-muted/50 p-4 rounded-lg mb-6">
                  <p className="text-foreground whitespace-pre-line">{currentChallenge.problemStatement}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">Input Format</h3>
                    <p className="text-muted-foreground">{currentChallenge.inputFormat}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-success mb-2">Output Format</h3>
                    <p className="text-muted-foreground">{currentChallenge.outputFormat}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-secondary-foreground mb-2">Constraints</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      {currentChallenge.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Examples</h3>
                    {currentChallenge.examples.map((ex, i) => (
                      <Card key={i} className="p-4 mb-3 bg-muted/30">
                        <div className="grid grid-cols-2 gap-4 mb-2">
                          <div>
                            <span className="text-xs font-semibold text-primary">Input:</span>
                            <pre className="bg-background p-2 rounded mt-1 text-sm overflow-x-auto">{ex.input}</pre>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-success">Output:</span>
                            <pre className="bg-background p-2 rounded mt-1 text-sm overflow-x-auto">{ex.output}</pre>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <strong>Explanation:</strong> {ex.explanation}
                        </p>
                      </Card>
                    ))}
                  </div>

                  {/* Test case info */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold mb-2">Test Cases for this Problem:</h3>
                    <div className="flex gap-4 text-sm">
                      <span className="text-success">
                        Visible: {currentChallenge.testCases.filter(t => !t.isHidden).length}
                      </span>
                      <span className="text-warning">
                        Hidden: {currentChallenge.testCases.filter(t => t.isHidden).length}
                      </span>
                    </div>
                  </div>

                  {showHints && (
                    <div className="bg-warning/10 border border-warning/30 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-warning mb-2">Hints</h3>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        {currentChallenge.hints.map((hint, i) => (
                          <li key={i}>{hint}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHints(!showHints)}
                  >
                    {showHints ? "Hide Hints" : "Show Hints"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel - Code Editor & Results */}
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Code Editor */}
            <Card className="flex-1 p-4 border-2 flex flex-col min-h-0">
              <Label className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                Your Solution
              </Label>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`// Write your ${domain} solution here...\n// Example:\nfunction solve(input) {\n  // Your code here\n  return result;\n}`}
                className="flex-1 font-mono text-sm bg-muted/30 border-primary/20 resize-none min-h-[200px]"
              />
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={runTests}
                  disabled={isRunning}
                  variant="hero"
                  className="flex-1"
                >
                  {isRunning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run All Tests
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Test Results */}
            <Card className="p-4 border-2 max-h-[300px] overflow-y-auto">
              <h3 className="font-semibold mb-3">Test Results</h3>
              {testResults.length === 0 ? (
                <p className="text-muted-foreground text-sm">Run tests to see results...</p>
              ) : (
                <div className="space-y-2">
                  {testResults.map((result, idx) => (
                    <div
                      key={result.testCaseId}
                      className={`p-3 rounded-lg border ${
                        result.passed
                          ? "bg-success/10 border-success/30"
                          : "bg-destructive/10 border-destructive/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                          <span className="font-medium">
                            Test Case {result.testCaseId}
                          </span>
                          {result.isHidden && (
                            <Badge variant="outline" className="text-xs border-warning text-warning">
                              Hidden
                            </Badge>
                          )}
                        </div>
                        <Badge variant={result.passed ? "default" : "destructive"}>
                          {result.passed ? "Passed" : "Failed"}
                        </Badge>
                      </div>
                      {!result.isHidden && (
                        <div className="text-xs space-y-1">
                          <p><strong>Input:</strong> {result.input}</p>
                          <p><strong>Expected:</strong> {result.expectedOutput}</p>
                          <p><strong>Your Output:</strong> {result.yourOutput}</p>
                        </div>
                      )}
                      {result.isHidden && !result.passed && (
                        <p className="text-xs text-muted-foreground">Hidden test case failed. Check edge cases.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Navigation */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={goToPreviousChallenge}
                disabled={currentQuestionIndex === 0}
                className="flex-1"
              >
                Previous
              </Button>
              {currentQuestionIndex < challenges.length - 1 ? (
                <Button
                  variant="outline"
                  onClick={goToNextChallenge}
                  className="flex-1"
                >
                  Next Challenge
                </Button>
              ) : (
                <Button
                  variant="hero"
                  onClick={handleSubmitAllChallenges}
                  className="flex-1"
                >
                  Submit All & View Results
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Dialog */}
      <AlertDialog open={showResults} onOpenChange={setShowResults}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              {passed ? (
                <div className="p-4 bg-success/20 rounded-full">
                  <Trophy className="w-12 h-12 text-success" />
                </div>
              ) : (
                <div className="p-4 bg-destructive/20 rounded-full">
                  <XCircle className="w-12 h-12 text-destructive" />
                </div>
              )}
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              {passed ? "Coding Test Passed! 🎉" : "Test Not Passed"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-4">
                <div>
                  <p className="text-4xl font-bold text-foreground mb-2">
                    {totalScore.passed}/{totalScore.total}
                  </p>
                  <p className="text-lg">
                    Test Cases Passed ({((totalScore.passed / totalScore.total) * 100).toFixed(0)}%)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Required: {PASSING_PERCENTAGE}%
                  </p>
                </div>

                {/* Score breakdown */}
                <div className="bg-muted/50 rounded-lg p-4 text-left">
                  <h3 className="font-semibold mb-2">Score Breakdown:</h3>
                  <div className="space-y-2 text-sm">
                    {challengeScores.map((score, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>Challenge {score.questionIndex + 1}</span>
                        <span className={score.totalPassed === score.totalTestCases ? "text-success" : "text-warning"}>
                          {score.totalPassed}/{score.totalTestCases} 
                          ({score.visiblePassed}/{score.visibleTotal} visible, {score.hiddenPassed}/{score.hiddenTotal} hidden)
                        </span>
                      </div>
                    ))}
                    {challenges.map((_, idx) => {
                      if (!challengeScores.find(s => s.questionIndex === idx)) {
                        return (
                          <div key={`unattempted-${idx}`} className="flex justify-between text-destructive">
                            <span>Challenge {idx + 1}</span>
                            <span>Not Attempted</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>

                <p>
                  {passed
                    ? "Excellent work! You've passed both MCQ and Coding tests. Proceed to the AI Interview!"
                    : `You need at least ${PASSING_PERCENTAGE}% to pass. Review and try again.`}
                </p>

                <Button variant="hero" onClick={handleResultsClose} className="w-full" size="lg">
                  {passed ? (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Proceed to AI Interview
                    </>
                  ) : (
                    "Retry Coding Test"
                  )}
                </Button>

                {passed && (
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    You'll be redirected to the interview platform
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CodingTest;
