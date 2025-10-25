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

  const [code, setCode] = useState("");
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [testResults, setTestResults] = useState<Array<{ passed: boolean; message: string; input: string; expected: string; got: string; description: string }>>([]);
  const [actualOutput, setActualOutput] = useState<string>("");
  
  // Randomly select a challenge from the pool
  const [challenge] = useState<CodingChallenge>(() => {
    const pool = challengePools[domain] || challengePools["Web Development"];
    return pool[Math.floor(Math.random() * pool.length)];
  });

  useEffect(() => {
    setCode(challenge.starterCode);
  }, [challenge]);

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

  const handleSubmit = () => {
    const results: Array<{ passed: boolean; message: string; input: string; expected: string; got: string; description: string }> = [];
    
    try {
      // Simple evaluation - in production, use a sandboxed environment
      const userFunction = new Function('return ' + code)();
      
      challenge.testCases.forEach((testCase, index) => {
        try {
          const input = JSON.parse(testCase.input);
          const result = Array.isArray(input) ? userFunction(...input) : userFunction(input);
          const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
          
          if (resultStr === testCase.expected) {
            results.push({
              passed: true,
              message: `Test ${index + 1}: Passed ✓`,
              input: testCase.input,
              expected: testCase.expected,
              got: resultStr,
              description: testCase.description
            });
          } else {
            results.push({
              passed: false,
              message: `Test ${index + 1}: Failed ✗`,
              input: testCase.input,
              expected: testCase.expected,
              got: resultStr,
              description: testCase.description
            });
          }
        } catch (error) {
          results.push({
            passed: false,
            message: `Test ${index + 1}: Error`,
            input: testCase.input,
            expected: testCase.expected,
            got: `Error: ${error}`,
            description: testCase.description
          });
        }
      });
      
      setTestResults(results);
      
      const passed = results.every(r => r.passed);
      if (passed) {
        toast({
          title: "Congratulations!",
          description: "All test cases passed! Redirecting...",
        });
        setTimeout(() => navigate("/"), 2000);
      } else {
        toast({
          title: "Some tests failed",
          description: "Review the output and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Code Error",
        description: "Please check your code syntax.",
        variant: "destructive",
      });
    }
  };

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
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-hero rounded-xl shadow-glow">
                <Code2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">Coding Challenge</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{domain}</Badge>
                  <Badge variant="outline" className="text-xs">Timed Assessment</Badge>
                </div>
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
                  {challenge.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{challenge.description}</p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  Test Cases
                </h3>
                <div className="space-y-3">
                  {challenge.testCases.map((tc, i) => (
                    <div key={i} className="group p-4 bg-gradient-code rounded-lg border border-border hover:border-primary/50 hover:shadow-soft transition-all duration-200">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs font-bold text-primary">{tc.description}</p>
                        <Badge variant="outline" className="text-xs">Case {i + 1}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-mono text-muted-foreground min-w-[70px] font-semibold">Input:</span>
                          <code className="text-xs font-mono bg-background px-3 py-1.5 rounded border border-border flex-1 group-hover:border-primary/30 transition-colors">{tc.input}</code>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-mono text-muted-foreground min-w-[70px] font-semibold">Expected:</span>
                          <code className="text-xs font-mono bg-background px-3 py-1.5 rounded border border-success/30 flex-1 text-success">{tc.expected}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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

              <Button onClick={handleSubmit} variant="hero" size="lg" className="w-full mt-6 group">
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Run Tests & Submit
              </Button>
            </Card>
          </div>

          {/* Right: Output & Results */}
          <div className="space-y-6">
            <Card className="p-6 shadow-hover border-2 bg-gradient-card sticky top-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Play className="w-4 h-4 text-accent" />
                </div>
                <h3 className="font-bold text-lg">Test Results</h3>
              </div>
              
              {testResults.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 bg-muted/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Code2 className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Run your code to see results</p>
                  <p className="text-xs text-muted-foreground mt-1">Your test results will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-5 rounded-xl border-2 shadow-soft ${testResults.every(r => r.passed) ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${testResults.every(r => r.passed) ? "bg-success/20" : "bg-destructive/20"}`}>
                        {testResults.every(r => r.passed) ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <span className="font-bold">Summary</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold font-mono ${testResults.every(r => r.passed) ? "text-success" : "text-destructive"}`}>
                        {testResults.filter(r => r.passed).length} / {testResults.length}
                      </div>
                      <p className="text-xs text-muted-foreground">Tests Passed</p>
                    </div>
                  </div>
                  
                  {testResults.map((result, i) => (
                    <Card key={i} className={`group p-5 border-2 transition-all duration-200 hover:shadow-lg ${result.passed ? "border-success/30 bg-success/5 hover:border-success/50" : "border-destructive/30 bg-destructive/5 hover:border-destructive/50"}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${result.passed ? "bg-success/20" : "bg-destructive/20"}`}>
                            {result.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm mb-1">Test Case {i + 1}</h4>
                            <p className="text-xs text-muted-foreground">{result.description}</p>
                          </div>
                        </div>
                        <Badge variant={result.passed ? "default" : "destructive"} className="font-mono">
                          {result.passed ? "PASS" : "FAIL"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 text-xs font-mono">
                        <div className="p-3 bg-background/50 rounded-lg border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-muted-foreground">Input:</span>
                          </div>
                          <code className="block text-foreground">{result.input}</code>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-success/10 rounded-lg border border-success/30">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-success">Expected:</span>
                            </div>
                            <code className="block text-success break-all">{result.expected}</code>
                          </div>
                          <div className={`p-3 rounded-lg border ${result.passed ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`font-bold ${result.passed ? "text-success" : "text-destructive"}`}>Your Output:</span>
                            </div>
                            <code className={`block break-all ${result.passed ? "text-success" : "text-destructive"}`}>
                              {result.got}
                            </code>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingTest;
