import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, FileText, Download, ExternalLink, ArrowLeft, CheckCircle2 } from "lucide-react";

const Certificate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const domain = location.state?.domain || "Web Development";
  const completedChallenges = location.state?.completedChallenges || 3;
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const certificateId = `CERT-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8">
      <div className="container mx-auto px-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/assessment-intro")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assessments
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-hero rounded-full mb-4">
            <Award className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Congratulations!</h1>
          <p className="text-muted-foreground">
            You've successfully completed the {domain} coding assessment
          </p>
        </div>

        {/* Certificate Card */}
        <Card className="p-8 border-4 border-primary/30 bg-gradient-to-br from-card via-background to-card mb-8 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-hero opacity-10 rounded-br-full"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-hero opacity-10 rounded-tl-full"></div>
          
          <div className="relative text-center">
            <div className="mb-6">
              <Badge variant="secondary" className="mb-4 text-sm">
                Certificate of Completion
              </Badge>
              <h2 className="text-3xl font-bold mb-1">Certificate of Achievement</h2>
              <p className="text-muted-foreground">This is to certify that</p>
            </div>

            <div className="py-6 border-y border-border/50 mb-6">
              <p className="text-2xl font-bold text-primary mb-2">[Your Name]</p>
              <p className="text-muted-foreground">
                has successfully completed the
              </p>
              <p className="text-xl font-semibold mt-2">{domain} Coding Assessment</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{completedChallenges}</p>
                <p className="text-xs text-muted-foreground">Challenges Completed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-success">100%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
              <div className="text-center">
                <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Date: {currentDate}</span>
              <span>ID: {certificateId}</span>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-6 border-2 hover:border-primary/50 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Download Certificate</h3>
                <p className="text-sm text-muted-foreground">PDF format with verification</p>
              </div>
              <Button variant="outline" size="sm">
                Download
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-2 hover:border-primary/50 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <FileText className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Generate Resume</h3>
                <p className="text-sm text-muted-foreground">AI-powered resume builder</p>
              </div>
              <Button variant="outline" size="sm">
                Generate
              </Button>
            </div>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="p-6 border-2 bg-gradient-to-r from-primary/5 to-secondary/5">
          <h3 className="font-semibold mb-4 text-lg">Next Steps</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span>Coding Assessment Completed</span>
            </div>
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={() => window.location.href = 'https://intern-ai-coach.lovable.app'}
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Continue to AI Mock Interview
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Certificate;
