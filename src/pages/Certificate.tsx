import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Award, FileText, Download, ExternalLink, ArrowLeft, CheckCircle2, Star, Sparkles, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import ResumeDialog from "@/components/ResumeDialog";

interface ProfileData {
  firstName: string;
  lastName: string;
  college: string;
  course: string;
  year: string;
  selectedDomains: string[];
  internshipType: string;
  availability: string;
  linkedin: string;
  github: string;
  skills: string;
  interests: string;
  projects: string;
}

const Certificate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const domain = location.state?.domain || "Web Development";
  const completedChallenges = location.state?.completedChallenges || 3;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [showResume, setShowResume] = useState(false);

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const certificateId = `CERT-${Date.now().toString(36).toUpperCase()}`;

  useEffect(() => {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      setProfile(JSON.parse(profileData));
    }
  }, []);

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : "[Your Name]";

  // SVG corner decoration as a component
  const CornerDecoration = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={`w-16 h-16 text-primary/20 ${className || ''}`}>
      <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill="currentColor" />
    </svg>
  );

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
          <div className="inline-flex items-center justify-center p-4 bg-gradient-hero rounded-full mb-4 animate-pulse">
            <Award className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Congratulations!
          </h1>
          <p className="text-muted-foreground">
            You have successfully completed the {domain} coding assessment
          </p>
        </div>

        {/* Professional Certificate Card */}
        <Card className="relative overflow-hidden mb-8 bg-gradient-to-br from-card via-background to-card border-0 shadow-2xl">
          {/* Decorative Border */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary p-[3px] rounded-xl">
            <div className="w-full h-full bg-card rounded-lg"></div>
          </div>
          
          {/* Certificate Content */}
          <div className="relative p-8 md:p-12">
            {/* Corner Decorations */}
            <div className="absolute top-4 left-4">
              <CornerDecoration />
            </div>
            <div className="absolute top-4 right-4">
              <CornerDecoration className="rotate-90" />
            </div>
            <div className="absolute bottom-4 left-4">
              <CornerDecoration className="-rotate-90" />
            </div>
            <div className="absolute bottom-4 right-4">
              <CornerDecoration className="rotate-180" />
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                <span className="text-sm font-medium tracking-[0.3em] text-muted-foreground uppercase">
                  Certificate of Achievement
                </span>
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-xl rounded-full"></div>
                <h2 className="relative text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                  Excellence in {domain}
                </h2>
              </div>
            </div>

            {/* Main Content */}
            <div className="text-center space-y-6">
              <p className="text-muted-foreground text-lg">This is to certify that</p>
              
              {/* Name with elegant styling */}
              <div className="relative py-6">
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-32 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                <h3 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-wide">
                  {fullName}
                </h3>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-32 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              </div>

              <p className="text-muted-foreground">
                has successfully completed all challenges and demonstrated exceptional proficiency in
              </p>

              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/20">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-semibold text-lg">{domain} Coding Assessment</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 my-8 py-6 border-y border-border/50">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-xl mb-2">
                  {completedChallenges}
                </div>
                <p className="text-sm text-muted-foreground">Challenges<br/>Completed</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground font-bold text-xl mb-2">
                  100%
                </div>
                <p className="text-sm text-muted-foreground">Success<br/>Rate</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground mb-2">
                  <Shield className="w-7 h-7" />
                </div>
                <p className="text-sm text-muted-foreground">Verified<br/>Certificate</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                <span>Issued: {currentDate}</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-muted/50 font-mono text-xs">
                ID: {certificateId}
              </div>
            </div>

            {/* Signature Line */}
            <div className="flex justify-center mt-8 pt-6">
              <div className="text-center">
                <div className="w-48 h-[2px] bg-gradient-to-r from-transparent via-foreground/30 to-transparent mb-2"></div>
                <p className="text-sm text-muted-foreground">Assessment Authority</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-6 border-2 hover:border-primary/50 transition-all cursor-pointer group hover:shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Download Certificate</h3>
                <p className="text-sm text-muted-foreground">PDF format with verification</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                Download
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-2 hover:border-secondary/50 transition-all cursor-pointer group hover:shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                <FileText className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Generate Resume</h3>
                <p className="text-sm text-muted-foreground">AI-powered resume builder</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowResume(true)}
                disabled={!profile}
              >
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

      {/* Resume Dialog */}
      <ResumeDialog 
        open={showResume} 
        onOpenChange={setShowResume}
        profile={profile}
        domain={domain}
        certificateId={certificateId}
      />
    </div>
  );
};

export default Certificate;
