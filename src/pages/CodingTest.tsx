import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, XCircle, Code2, Play, Trophy, Mic, ExternalLink } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

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
}

const generateChallenges = (domain: string): Challenge[] => {
  const challengesByDomain: Record<string, Challenge[]> = {
    "Web Development": [
      {
        id: "web-1",
        title: "Array Sum Calculator",
        description: "Write a function to calculate the sum of all numbers in an array.",
        difficulty: "Easy",
        domain: "Web Development",
        problemStatement: `You are given an array of integers. Your task is to write a function that returns the sum of all elements in the array.

This is a fundamental problem that tests your understanding of array iteration and basic arithmetic operations in JavaScript/TypeScript.

Your function should handle:
- Empty arrays (return 0)
- Arrays with positive numbers
- Arrays with negative numbers
- Arrays with mixed positive and negative numbers`,
        inputFormat: "An array of integers separated by commas. Example: 1,2,3,4,5",
        outputFormat: "A single integer representing the sum of all elements.",
        constraints: [
          "Array length: 0 ≤ n ≤ 1000",
          "Each element: -10000 ≤ element ≤ 10000",
          "Time complexity should be O(n)"
        ],
        examples: [
          {
            input: "1,2,3,4,5",
            output: "15",
            explanation: "Sum of 1+2+3+4+5 = 15"
          },
          {
            input: "-1,2,-3,4",
            output: "2",
            explanation: "Sum of (-1)+2+(-3)+4 = 2"
          }
        ],
        testCases: [
          { id: 1, input: "1,2,3,4,5", expectedOutput: "15", isHidden: false },
          { id: 2, input: "10,20,30", expectedOutput: "60", isHidden: false },
          { id: 3, input: "-5,-10,15", expectedOutput: "0", isHidden: true },
          { id: 4, input: "100", expectedOutput: "100", isHidden: true },
          { id: 5, input: "0,0,0", expectedOutput: "0", isHidden: true }
        ],
        hints: ["Use the reduce() method or a simple for loop", "Handle edge case of empty array"]
      },
      {
        id: "web-2",
        title: "String Reversal",
        description: "Write a function to reverse a given string.",
        difficulty: "Easy",
        domain: "Web Development",
        problemStatement: `Given a string, write a function that returns the reversed version of the string.

For example:
- "hello" becomes "olleh"
- "JavaScript" becomes "tpircSavaJ"

You should NOT use the built-in reverse() method. Implement your own logic.`,
        inputFormat: "A single string containing alphanumeric characters.",
        outputFormat: "The reversed string.",
        constraints: [
          "String length: 1 ≤ n ≤ 1000",
          "String contains only alphanumeric characters and spaces",
          "Do not use built-in reverse method"
        ],
        examples: [
          {
            input: "hello",
            output: "olleh",
            explanation: "Characters are reversed: h-e-l-l-o becomes o-l-l-e-h"
          },
          {
            input: "world",
            output: "dlrow",
            explanation: "Characters are reversed"
          }
        ],
        testCases: [
          { id: 1, input: "hello", expectedOutput: "olleh", isHidden: false },
          { id: 2, input: "JavaScript", expectedOutput: "tpircSavaJ", isHidden: false },
          { id: 3, input: "a", expectedOutput: "a", isHidden: true },
          { id: 4, input: "racecar", expectedOutput: "racecar", isHidden: true },
          { id: 5, input: "12345", expectedOutput: "54321", isHidden: true }
        ],
        hints: ["Try using a loop from the end of the string", "You can convert string to array, work with it, then join back"]
      },
      {
        id: "web-3",
        title: "Find Maximum Element",
        description: "Write a function to find the maximum element in an array.",
        difficulty: "Easy",
        domain: "Web Development",
        problemStatement: `Given an array of integers, find and return the maximum element.

Your function should efficiently traverse the array and identify the largest number.`,
        inputFormat: "An array of integers separated by commas.",
        outputFormat: "A single integer - the maximum element.",
        constraints: [
          "Array length: 1 ≤ n ≤ 1000",
          "Each element: -10000 ≤ element ≤ 10000"
        ],
        examples: [
          {
            input: "3,7,2,9,1",
            output: "9",
            explanation: "9 is the largest among 3,7,2,9,1"
          }
        ],
        testCases: [
          { id: 1, input: "3,7,2,9,1", expectedOutput: "9", isHidden: false },
          { id: 2, input: "100,50,200,75", expectedOutput: "200", isHidden: false },
          { id: 3, input: "-5,-10,-3,-8", expectedOutput: "-3", isHidden: true },
          { id: 4, input: "42", expectedOutput: "42", isHidden: true },
          { id: 5, input: "1,1,1,1", expectedOutput: "1", isHidden: true }
        ],
        hints: ["Use Math.max() with spread operator or iterate through array"]
      }
    ],
    "Data Science": [
      {
        id: "ds-1",
        title: "Calculate Mean",
        description: "Write a function to calculate the arithmetic mean of a dataset.",
        difficulty: "Easy",
        domain: "Data Science",
        problemStatement: `Given a dataset of numerical values, calculate and return the arithmetic mean (average).

The mean is calculated by summing all values and dividing by the count of values.

Formula: mean = (sum of all values) / (count of values)`,
        inputFormat: "Numbers separated by commas. Example: 10,20,30,40,50",
        outputFormat: "The mean value rounded to 2 decimal places.",
        constraints: [
          "Dataset size: 1 ≤ n ≤ 1000",
          "Each value: -10000 ≤ value ≤ 10000",
          "Round result to 2 decimal places"
        ],
        examples: [
          {
            input: "10,20,30,40,50",
            output: "30.00",
            explanation: "(10+20+30+40+50)/5 = 150/5 = 30.00"
          }
        ],
        testCases: [
          { id: 1, input: "10,20,30,40,50", expectedOutput: "30.00", isHidden: false },
          { id: 2, input: "5,5,5,5", expectedOutput: "5.00", isHidden: false },
          { id: 3, input: "1,2,3", expectedOutput: "2.00", isHidden: true },
          { id: 4, input: "100", expectedOutput: "100.00", isHidden: true },
          { id: 5, input: "-10,10", expectedOutput: "0.00", isHidden: true }
        ],
        hints: ["Sum all values first, then divide by count", "Use toFixed(2) for formatting"]
      },
      {
        id: "ds-2",
        title: "Find Median",
        description: "Write a function to find the median of a sorted dataset.",
        difficulty: "Medium",
        domain: "Data Science",
        problemStatement: `Given a dataset, find the median value.

The median is the middle value when data is sorted:
- For odd count: the middle element
- For even count: average of two middle elements`,
        inputFormat: "Numbers separated by commas (may be unsorted).",
        outputFormat: "The median value rounded to 2 decimal places.",
        constraints: [
          "Dataset size: 1 ≤ n ≤ 1000",
          "Values may be unsorted - you need to sort them first"
        ],
        examples: [
          {
            input: "1,3,5,7,9",
            output: "5.00",
            explanation: "Middle element of sorted array [1,3,5,7,9] is 5"
          },
          {
            input: "1,2,3,4",
            output: "2.50",
            explanation: "Average of middle elements (2+3)/2 = 2.50"
          }
        ],
        testCases: [
          { id: 1, input: "1,3,5,7,9", expectedOutput: "5.00", isHidden: false },
          { id: 2, input: "1,2,3,4", expectedOutput: "2.50", isHidden: false },
          { id: 3, input: "5,2,8,1,9", expectedOutput: "5.00", isHidden: true },
          { id: 4, input: "10", expectedOutput: "10.00", isHidden: true },
          { id: 5, input: "1,1,1,1,1", expectedOutput: "1.00", isHidden: true }
        ],
        hints: ["Sort the array first", "Handle both odd and even length cases"]
      },
      {
        id: "ds-3",
        title: "Standard Deviation",
        description: "Calculate the standard deviation of a dataset.",
        difficulty: "Medium",
        domain: "Data Science",
        problemStatement: `Calculate the population standard deviation of a dataset.

Steps:
1. Calculate the mean
2. For each value, calculate (value - mean)²
3. Calculate mean of squared differences
4. Take square root of result`,
        inputFormat: "Numbers separated by commas.",
        outputFormat: "Standard deviation rounded to 2 decimal places.",
        constraints: [
          "Dataset size: 2 ≤ n ≤ 1000",
          "Use population standard deviation formula"
        ],
        examples: [
          {
            input: "2,4,4,4,5,5,7,9",
            output: "2.00",
            explanation: "Mean=5, variance=4, std dev=2.00"
          }
        ],
        testCases: [
          { id: 1, input: "2,4,4,4,5,5,7,9", expectedOutput: "2.00", isHidden: false },
          { id: 2, input: "10,10,10,10", expectedOutput: "0.00", isHidden: false },
          { id: 3, input: "1,2,3,4,5", expectedOutput: "1.41", isHidden: true },
          { id: 4, input: "5,10", expectedOutput: "2.50", isHidden: true },
          { id: 5, input: "100,200,300", expectedOutput: "81.65", isHidden: true }
        ],
        hints: ["Break down into steps: mean → squared differences → variance → sqrt"]
      }
    ],
    "Machine Learning": [
      {
        id: "ml-1",
        title: "Normalize Data",
        description: "Implement min-max normalization for a dataset.",
        difficulty: "Easy",
        domain: "Machine Learning",
        problemStatement: `Implement min-max normalization to scale values between 0 and 1.

Formula: normalized = (value - min) / (max - min)

This is a crucial preprocessing step in machine learning.`,
        inputFormat: "Numbers separated by commas.",
        outputFormat: "Normalized values separated by commas, each rounded to 2 decimal places.",
        constraints: [
          "Dataset size: 2 ≤ n ≤ 100",
          "All values should be scaled between 0 and 1"
        ],
        examples: [
          {
            input: "1,2,3,4,5",
            output: "0.00,0.25,0.50,0.75,1.00",
            explanation: "Min=1, Max=5. Each value normalized using formula."
          }
        ],
        testCases: [
          { id: 1, input: "1,2,3,4,5", expectedOutput: "0.00,0.25,0.50,0.75,1.00", isHidden: false },
          { id: 2, input: "10,20,30", expectedOutput: "0.00,0.50,1.00", isHidden: false },
          { id: 3, input: "0,100", expectedOutput: "0.00,1.00", isHidden: true },
          { id: 4, input: "5,5,5", expectedOutput: "0.00,0.00,0.00", isHidden: true },
          { id: 5, input: "2,4,6,8,10", expectedOutput: "0.00,0.25,0.50,0.75,1.00", isHidden: true }
        ],
        hints: ["Find min and max first", "Handle case where all values are same (avoid division by zero)"]
      },
      {
        id: "ml-2",
        title: "Euclidean Distance",
        description: "Calculate Euclidean distance between two points.",
        difficulty: "Easy",
        domain: "Machine Learning",
        problemStatement: `Calculate the Euclidean distance between two points in n-dimensional space.

Formula: √(Σ(x_i - y_i)²)

This is fundamental for algorithms like K-Nearest Neighbors.`,
        inputFormat: "Two lines: first point coordinates, second point coordinates (comma-separated). Use | to separate the two points.",
        outputFormat: "Distance rounded to 2 decimal places.",
        constraints: [
          "Dimensions: 1 ≤ n ≤ 100",
          "Both points must have same number of dimensions"
        ],
        examples: [
          {
            input: "0,0|3,4",
            output: "5.00",
            explanation: "√((3-0)² + (4-0)²) = √(9+16) = √25 = 5.00"
          }
        ],
        testCases: [
          { id: 1, input: "0,0|3,4", expectedOutput: "5.00", isHidden: false },
          { id: 2, input: "1,1|4,5", expectedOutput: "5.00", isHidden: false },
          { id: 3, input: "0,0,0|1,1,1", expectedOutput: "1.73", isHidden: true },
          { id: 4, input: "5,5|5,5", expectedOutput: "0.00", isHidden: true },
          { id: 5, input: "0|10", expectedOutput: "10.00", isHidden: true }
        ],
        hints: ["Parse both point arrays", "Sum squared differences, then take square root"]
      },
      {
        id: "ml-3",
        title: "Accuracy Score",
        description: "Calculate classification accuracy from predictions.",
        difficulty: "Easy",
        domain: "Machine Learning",
        problemStatement: `Given actual labels and predicted labels, calculate the accuracy score.

Accuracy = (Number of correct predictions) / (Total predictions) × 100`,
        inputFormat: "Two lines separated by |: actual labels, predicted labels (comma-separated).",
        outputFormat: "Accuracy percentage rounded to 2 decimal places.",
        constraints: [
          "Both arrays must have same length",
          "Labels are integers (0, 1, 2, etc.)"
        ],
        examples: [
          {
            input: "1,0,1,1,0|1,0,0,1,0",
            output: "80.00",
            explanation: "4 out of 5 predictions are correct = 80%"
          }
        ],
        testCases: [
          { id: 1, input: "1,0,1,1,0|1,0,0,1,0", expectedOutput: "80.00", isHidden: false },
          { id: 2, input: "1,1,1,1|1,1,1,1", expectedOutput: "100.00", isHidden: false },
          { id: 3, input: "0,0,0,0|1,1,1,1", expectedOutput: "0.00", isHidden: true },
          { id: 4, input: "1,2,3|1,2,3", expectedOutput: "100.00", isHidden: true },
          { id: 5, input: "1,0|0,1", expectedOutput: "0.00", isHidden: true }
        ],
        hints: ["Compare element by element", "Count matches and divide by total"]
      }
    ]
  };

  // Default challenges for any domain not specifically defined
  const defaultChallenges: Challenge[] = [
    {
      id: "default-1",
      title: "FizzBuzz",
      description: "Classic FizzBuzz problem",
      difficulty: "Easy",
      domain: domain,
      problemStatement: `Write a function that for numbers 1 to N:
- Prints "Fizz" for multiples of 3
- Prints "Buzz" for multiples of 5
- Prints "FizzBuzz" for multiples of both 3 and 5
- Prints the number otherwise

Return all outputs separated by commas.`,
      inputFormat: "A single integer N.",
      outputFormat: "Comma-separated outputs for 1 to N.",
      constraints: ["1 ≤ N ≤ 100"],
      examples: [
        {
          input: "15",
          output: "1,2,Fizz,4,Buzz,Fizz,7,8,Fizz,Buzz,11,Fizz,13,14,FizzBuzz",
          explanation: "Standard FizzBuzz output for 1-15"
        }
      ],
      testCases: [
        { id: 1, input: "5", expectedOutput: "1,2,Fizz,4,Buzz", isHidden: false },
        { id: 2, input: "3", expectedOutput: "1,2,Fizz", isHidden: false },
        { id: 3, input: "15", expectedOutput: "1,2,Fizz,4,Buzz,Fizz,7,8,Fizz,Buzz,11,Fizz,13,14,FizzBuzz", isHidden: true },
        { id: 4, input: "1", expectedOutput: "1", isHidden: true },
        { id: 5, input: "10", expectedOutput: "1,2,Fizz,4,Buzz,Fizz,7,8,Fizz,Buzz", isHidden: true }
      ],
      hints: ["Use modulo operator %", "Check divisibility by 15 first (both 3 and 5)"]
    },
    {
      id: "default-2",
      title: "Palindrome Check",
      description: "Check if a string is a palindrome",
      difficulty: "Easy",
      domain: domain,
      problemStatement: `Given a string, determine if it is a palindrome.

A palindrome reads the same forwards and backwards.
Ignore case and non-alphanumeric characters.`,
      inputFormat: "A single string.",
      outputFormat: "'true' if palindrome, 'false' otherwise.",
      constraints: ["1 ≤ string length ≤ 1000"],
      examples: [
        {
          input: "racecar",
          output: "true",
          explanation: "racecar reads the same forwards and backwards"
        }
      ],
      testCases: [
        { id: 1, input: "racecar", expectedOutput: "true", isHidden: false },
        { id: 2, input: "hello", expectedOutput: "false", isHidden: false },
        { id: 3, input: "A man a plan a canal Panama", expectedOutput: "true", isHidden: true },
        { id: 4, input: "a", expectedOutput: "true", isHidden: true },
        { id: 5, input: "ab", expectedOutput: "false", isHidden: true }
      ],
      hints: ["Clean the string first", "Compare with reversed version"]
    },
    {
      id: "default-3",
      title: "Count Vowels",
      description: "Count the number of vowels in a string",
      difficulty: "Easy",
      domain: domain,
      problemStatement: `Count the number of vowels (a, e, i, o, u) in a given string.

Consider both uppercase and lowercase vowels.`,
      inputFormat: "A single string.",
      outputFormat: "Integer count of vowels.",
      constraints: ["1 ≤ string length ≤ 1000"],
      examples: [
        {
          input: "hello world",
          output: "3",
          explanation: "e, o, o are the vowels = 3"
        }
      ],
      testCases: [
        { id: 1, input: "hello world", expectedOutput: "3", isHidden: false },
        { id: 2, input: "AEIOU", expectedOutput: "5", isHidden: false },
        { id: 3, input: "xyz", expectedOutput: "0", isHidden: true },
        { id: 4, input: "aEiOu", expectedOutput: "5", isHidden: true },
        { id: 5, input: "Programming", expectedOutput: "3", isHidden: true }
      ],
      hints: ["Convert to lowercase first", "Use includes() or indexOf()"]
    }
  ];

  return challengesByDomain[domain] || defaultChallenges;
};

const CodingTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const domain = location.state?.domain || "Web Development";

  const [challenges] = useState<Challenge[]>(() => generateChallenges(domain));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [code, setCode] = useState("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [allTestsPassed, setAllTestsPassed] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<Set<number>>(new Set());
  const [showHints, setShowHints] = useState(false);

  const currentChallenge = challenges[currentQuestionIndex];
  const allChallengesCompleted = completedChallenges.size === challenges.length;

  // Run tests - Demo mode: auto-pass when code is submitted
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

    // Simulate test execution with delay
    setTimeout(() => {
      // DEMO MODE: Auto-pass all tests when code is submitted
      const results: TestResult[] = currentChallenge.testCases.map((tc) => ({
        testCaseId: tc.id,
        passed: true,
        yourOutput: tc.expectedOutput,
        expectedOutput: tc.expectedOutput,
        input: tc.input,
      }));

      setTestResults(results);
      setIsRunning(false);
      setAllTestsPassed(true);
      setCompletedChallenges((prev) => new Set([...prev, currentQuestionIndex]));
      
      toast({
        title: "All Tests Passed! 🎉",
        description: `Question ${currentQuestionIndex + 1} of 3 completed!`,
      });
    }, 1500);
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

  // Navigate to AI Mock Interview
  const proceedToInterview = () => {
    window.location.href = 'https://intern-ai-coach.lovable.app';
  };

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
                  <h1 className="text-xl font-bold">Coding Challenge</h1>
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
                {completedChallenges.size}/{challenges.length} Completed
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
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
                  {testResults.map((result, idx) => {
                    const tc = currentChallenge.testCases[idx];
                    return (
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
                              {tc.isHidden && " (Hidden)"}
                            </span>
                          </div>
                          <Badge variant={result.passed ? "default" : "destructive"}>
                            {result.passed ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                        {!tc.isHidden && (
                          <div className="text-xs space-y-1">
                            <p><strong>Input:</strong> {result.input}</p>
                            <p><strong>Expected:</strong> {result.expectedOutput}</p>
                            <p><strong>Your Output:</strong> {result.yourOutput}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                  onClick={proceedToInterview}
                  disabled={!allChallengesCompleted}
                  className="flex-1"
                >
                  {allChallengesCompleted ? (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Proceed to AI Interview
                    </>
                  ) : (
                    <>Complete All Challenges</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {allChallengesCompleted && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center border-2 border-success">
            <div className="p-4 bg-success/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Coding Challenge Complete! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              You've passed all {challenges.length} coding challenges in {domain}! Now proceed to your AI Mock Interview.
            </p>
            <div className="space-y-3">
              <Button variant="hero" size="lg" className="w-full" onClick={proceedToInterview}>
                <Mic className="w-5 h-5 mr-2" />
                Start AI Mock Interview
              </Button>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <ExternalLink className="w-3 h-3" />
                You'll be redirected to the interview platform
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CodingTest;
