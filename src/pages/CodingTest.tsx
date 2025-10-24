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
  testCases: { input: string; expected: string }[];
}

const challenges: Record<string, CodingChallenge> = {
  "Web Development": {
    title: "Create a Todo List Component",
    description: "Write a function that takes an array of tasks and returns HTML markup for a todo list.",
    testCases: [
      { input: '["Buy milk", "Walk dog"]', expected: '<ul><li>Buy milk</li><li>Walk dog</li></ul>' },
      { input: '["Task 1"]', expected: '<ul><li>Task 1</li></ul>' },
    ],
  },
  "Data Science": {
    title: "Calculate Mean and Median",
    description: "Write a function that takes an array of numbers and returns an object with mean and median.",
    testCases: [
      { input: '[1, 2, 3, 4, 5]', expected: '{"mean": 3, "median": 3}' },
      { input: '[10, 20, 30]', expected: '{"mean": 20, "median": 20}' },
    ],
  },
  "Mobile Development": {
    title: "Validate Phone Number",
    description: "Write a function that validates if a phone number is in the format (XXX) XXX-XXXX.",
    testCases: [
      { input: '"(123) 456-7890"', expected: 'true' },
      { input: '"123-456-7890"', expected: 'false' },
    ],
  },
};

const CodingTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const domain = location.state?.domain || "Web Development";

  const [code, setCode] = useState("");
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [testResults, setTestResults] = useState<string[]>([]);
  const challenge = challenges[domain];

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
    const results: string[] = [];
    
    try {
      // Simple evaluation - in production, use a sandboxed environment
      const userFunction = new Function('return ' + code)();
      
      challenge.testCases.forEach((testCase, index) => {
        try {
          const input = JSON.parse(testCase.input);
          const result = userFunction(input);
          const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
          
          if (resultStr === testCase.expected) {
            results.push(`Test ${index + 1}: Passed ✓`);
          } else {
            results.push(`Test ${index + 1}: Failed ✗ (Expected: ${testCase.expected}, Got: ${resultStr})`);
          }
        } catch (error) {
          results.push(`Test ${index + 1}: Error - ${error}`);
        }
      });
      
      setTestResults(results);
      
      const passed = results.every(r => r.includes("Passed"));
      if (passed) {
        toast({
          title: "Congratulations!",
          description: "You passed the coding test!",
        });
        setTimeout(() => navigate("/"), 2000);
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
      <div className="container mx-auto px-6 max-w-4xl">
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

        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">{challenge.title}</h2>
          <p className="text-muted-foreground mb-4">{challenge.description}</p>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Test Cases:</h3>
            {challenge.testCases.map((tc, i) => (
              <div key={i} className="mb-2 p-2 bg-muted rounded">
                <p className="text-sm">Input: {tc.input}</p>
                <p className="text-sm">Expected: {tc.expected}</p>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-2">Your Code:</label>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="function solution(input) { ... }"
              className="font-mono min-h-[300px]"
              onPaste={(e) => e.preventDefault()}
            />
          </div>

          <Button onClick={handleSubmit} variant="hero" className="w-full">
            Submit Solution
          </Button>
        </Card>

        {testResults.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Test Results:</h3>
            {testResults.map((result, i) => (
              <p key={i} className={`mb-2 ${result.includes("Passed") ? "text-green-500" : "text-destructive"}`}>
                {result}
              </p>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
};

export default CodingTest;
