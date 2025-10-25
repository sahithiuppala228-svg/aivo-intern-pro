import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
      <div className="container mx-auto px-6 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/assessment-intro")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Coding Test</h1>
          <p className="text-muted-foreground">Domain: {domain}</p>
        </div>

        {copyAttempts > 0 && (
          <Card className="p-4 mb-6 border-destructive bg-destructive/10">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-semibold">
                Copy-Paste Attempts Detected: {copyAttempts}
              </p>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Challenge & Code Editor */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">{challenge.title}</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">{challenge.description}</p>
              
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Test Cases
                </h3>
                <div className="space-y-3">
                  {challenge.testCases.map((tc, i) => (
                    <div key={i} className="p-4 bg-muted/50 rounded-lg border border-border">
                      <p className="text-xs font-semibold text-primary mb-2">{tc.description}</p>
                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-mono text-muted-foreground min-w-[60px]">Input:</span>
                          <code className="text-xs font-mono bg-background px-2 py-1 rounded flex-1">{tc.input}</code>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-mono text-muted-foreground min-w-[60px]">Expected:</span>
                          <code className="text-xs font-mono bg-background px-2 py-1 rounded flex-1">{tc.expected}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Your Solution
                </label>
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Write your code here..."
                  className="font-mono min-h-[400px] bg-background border-2 focus:border-primary transition-colors"
                  onPaste={(e) => e.preventDefault()}
                />
              </div>

              <Button onClick={handleSubmit} variant="hero" size="lg" className="w-full mt-4">
                Run Tests & Submit
              </Button>
            </Card>
          </div>

          {/* Right: Output & Results */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                Test Results
              </h3>
              
              {testResults.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">Run your code to see results here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <span className="font-semibold">Summary</span>
                    <span className={`text-sm font-mono ${testResults.every(r => r.passed) ? "text-success" : "text-destructive"}`}>
                      {testResults.filter(r => r.passed).length} / {testResults.length} Passed
                    </span>
                  </div>
                  
                  {testResults.map((result, i) => (
                    <Card key={i} className={`p-4 border-2 ${result.passed ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Test Case {i + 1}</h4>
                          <p className="text-xs text-muted-foreground">{result.description}</p>
                        </div>
                        <span className={`text-lg font-bold ${result.passed ? "text-success" : "text-destructive"}`}>
                          {result.passed ? "✓" : "✗"}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-xs font-mono">
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-muted-foreground">Input:</span>
                          <code className="bg-background px-2 py-1 rounded">{result.input}</code>
                        </div>
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-muted-foreground">Expected:</span>
                          <code className="bg-background px-2 py-1 rounded text-success">{result.expected}</code>
                        </div>
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-muted-foreground">Your Output:</span>
                          <code className={`bg-background px-2 py-1 rounded ${result.passed ? "text-success" : "text-destructive"}`}>
                            {result.got}
                          </code>
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
