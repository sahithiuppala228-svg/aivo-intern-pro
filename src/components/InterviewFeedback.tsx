import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  TrendingUp, 
  MessageSquare, 
  Shield, 
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Star
} from "lucide-react";

interface FeedbackData {
  overallScore: number;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  problemSolvingScore: number;
  strengths: string[];
  improvements: string[];
  questionResults: Array<{
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }>;
  timeUsed: number;
  totalTime: number;
}

interface InterviewFeedbackProps {
  feedback: FeedbackData;
  onClose: () => void;
  onRetry: () => void;
  domain: string;
}

const InterviewFeedback = ({ feedback, onClose, onRetry, domain }: InterviewFeedbackProps) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-red-500";
      case "Intermediate": return "bg-yellow-500";
      case "Advanced": return "bg-green-500";
      case "Expert": return "bg-primary";
      default: return "bg-muted";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const passed = feedback.overallScore >= 70;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex p-4 rounded-full mb-4 ${passed ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {passed ? (
              <Trophy className="w-12 h-12 text-green-500" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-red-500" />
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {passed ? "Congratulations!" : "Interview Complete"}
          </h1>
          <p className="text-muted-foreground">
            {passed 
              ? "You've demonstrated strong skills in this interview!" 
              : "Here's your detailed feedback to help you improve."}
          </p>
        </div>

        {/* Overall Score Card */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Overall Performance</h2>
              <div className="flex items-center gap-2">
                <Badge className={`${getLevelColor(feedback.level)} text-white`}>
                  {feedback.level} Level
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {feedback.timeUsed} / {feedback.totalTime} min used
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                {feedback.overallScore}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
            </div>
          </div>
        </Card>

        {/* Skill Breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Technical Skills */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Technical Knowledge</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Domain Expertise ({domain})</span>
                <span className={getScoreColor(feedback.technicalScore)}>{feedback.technicalScore}%</span>
              </div>
              <Progress value={feedback.technicalScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {feedback.technicalScore >= 70 
                  ? "Strong technical understanding demonstrated"
                  : "Need to strengthen core technical concepts"}
              </p>
            </div>
          </Card>

          {/* Problem Solving */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold">Problem Solving</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Analytical Thinking</span>
                <span className={getScoreColor(feedback.problemSolvingScore)}>{feedback.problemSolvingScore}%</span>
              </div>
              <Progress value={feedback.problemSolvingScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {feedback.problemSolvingScore >= 70 
                  ? "Excellent approach to problem solving"
                  : "Practice breaking down complex problems"}
              </p>
            </div>
          </Card>

          {/* Communication */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Communication Skills</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Clarity & Articulation</span>
                <span className={getScoreColor(feedback.communicationScore)}>{feedback.communicationScore}%</span>
              </div>
              <Progress value={feedback.communicationScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {feedback.communicationScore >= 70 
                  ? "Clear and effective communication"
                  : "Work on explaining concepts more clearly"}
              </p>
            </div>
          </Card>

          {/* Confidence */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold">Confidence Level</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Self-Assurance</span>
                <span className={getScoreColor(feedback.confidenceScore)}>{feedback.confidenceScore}%</span>
              </div>
              <Progress value={feedback.confidenceScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {feedback.confidenceScore >= 70 
                  ? "Confident and composed throughout"
                  : "Build confidence through more practice"}
              </p>
            </div>
          </Card>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <Card className="p-6 border-green-500/30 bg-green-500/5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-green-700 dark:text-green-400">Your Strengths</h3>
            </div>
            <ul className="space-y-2">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Star className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Areas for Improvement */}
          <Card className="p-6 border-orange-500/30 bg-orange-500/5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-orange-700 dark:text-orange-400">Areas to Improve</h3>
            </div>
            <ul className="space-y-2">
              {feedback.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Question-by-Question Breakdown */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4">Question-by-Question Analysis</h3>
          <div className="space-y-4">
            {feedback.questionResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.score >= 70 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : result.score >= 40 ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium">Q{index + 1}</span>
                  </div>
                  <Badge variant={result.score >= 70 ? "default" : "secondary"}>
                    {result.score}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{result.question}</p>
                <p className="text-xs bg-muted rounded p-2">{result.feedback}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {passed ? (
            <Button onClick={onClose} variant="hero" size="lg">
              Continue to Certificate
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <>
              <Button onClick={onRetry} variant="outline" size="lg">
                Retry Interview
              </Button>
              <Button onClick={onClose} variant="hero" size="lg">
                Practice More
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewFeedback;
