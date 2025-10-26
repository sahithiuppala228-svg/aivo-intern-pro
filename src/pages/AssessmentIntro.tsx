import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, FileText, Code, AlertCircle, ArrowLeft } from "lucide-react";
import assessmentIcon from "@/assets/assessment-icon.jpg";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AssessmentIntro = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const domain = location.state?.domain || "Web Development";
  
  const assessmentFlow = [
    {
      icon: <FileText className="w-6 h-6 text-primary" />,
      title: "MCQ Test",
      description: "10 multiple choice questions",
      duration: "12 minutes",
      passingScore: "80%"
    },
    {
      icon: <Code className="w-6 h-6 text-secondary" />,
      title: "Practical Task",
      description: "1 real-world coding/problem task",
      duration: "45 minutes",
      passingScore: "80%"
    }
  ];

  const requirements = [
    "Stable internet connection",
    "Quiet environment",
    "Microphone & camera (for future mock interview)",
    "Screen sharing enabled"
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-6">
      <div className="container mx-auto max-w-4xl space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img src={assessmentIcon} alt="Assessment" className="w-24 h-24 rounded-2xl shadow-soft" />
          </div>
          <h1 className="text-4xl font-bold">Ready for Your Assessment?</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete our two-part assessment to verify your skills and unlock personalized learning
          </p>
        </div>

        {/* Assessment Flow */}
        <div className="grid md:grid-cols-2 gap-6">
          {assessmentFlow.map((step, idx) => (
            <Card key={idx} className="shadow-soft border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-muted">
                      {step.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                      <CardDescription className="mt-1">{step.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Step {idx + 1}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Duration: <span className="font-medium text-foreground">{step.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4" />
                  Passing Score: <span className="font-medium text-foreground">{step.passingScore}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Requirements */}
        <Card className="shadow-soft bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Before You Start
            </CardTitle>
            <CardDescription>Make sure you have these ready</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3 h-3 text-success" />
                  </div>
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="shadow-soft border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Important Notes:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>You must score <strong className="text-foreground">≥80%</strong> to pass each section</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>If you don't pass, we'll provide personalized AI lessons to help you improve</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>You can retake the assessment up to 3 times after completing lessons</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Your AI mentor is available anytime during the assessment</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* FAQ Link */}
        <Card className="shadow-soft hover:shadow-hover transition-all cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Why do we test?</h3>
                <p className="text-sm text-muted-foreground">
                  Learn about our assessment methodology and how it benefits you
                </p>
              </div>
              <Button variant="ghost">
                Learn More →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="hero" 
            size="lg" 
            className="sm:min-w-[200px]"
            onClick={() => navigate("/mcq-test", { state: { domain } })}
          >
            Start MCQ Test
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="sm:min-w-[200px]"
            onClick={() => {
              toast({
                title: "Practice Mode",
                description: "Practice module coming soon...",
              });
            }}
          >
            Practice Mode (Free)
          </Button>
        </div>

        <p className="text-sm text-center text-muted-foreground">
          Need help? Your AI mentor is just a click away!
        </p>
      </div>
    </div>
  );
};

export default AssessmentIntro;
