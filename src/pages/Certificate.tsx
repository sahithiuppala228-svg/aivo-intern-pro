import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Award, FileText, Download, ExternalLink, ArrowLeft, CheckCircle2 } from "lucide-react";
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

  const certificateId = `INTR-2025-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

  useEffect(() => {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      setProfile(JSON.parse(profileData));
    }
  }, []);

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : "Your Name";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-8">
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
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full mb-4">
            <Award className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Congratulations!
          </h1>
          <p className="text-slate-600">
            You have successfully completed the {domain} Internship Assessment
          </p>
        </div>

        {/* Professional Certificate Card - InternAI Style */}
        <div className="relative mb-8" id="certificate-container">
          {/* Outer decorative border */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-2xl p-1">
            <div className="w-full h-full bg-white rounded-xl"></div>
          </div>
          
          {/* Certificate Content */}
          <div className="relative bg-white rounded-xl p-8 md:p-12 shadow-2xl">
            {/* Decorative corner elements */}
            <div className="absolute top-6 left-6 w-20 h-20 border-l-4 border-t-4 border-blue-600/30 rounded-tl-lg"></div>
            <div className="absolute top-6 right-6 w-20 h-20 border-r-4 border-t-4 border-blue-600/30 rounded-tr-lg"></div>
            <div className="absolute bottom-6 left-6 w-20 h-20 border-l-4 border-b-4 border-blue-600/30 rounded-bl-lg"></div>
            <div className="absolute bottom-6 right-6 w-20 h-20 border-r-4 border-b-4 border-blue-600/30 rounded-br-lg"></div>

            {/* Background watermark pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none overflow-hidden rounded-xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[200px] font-bold text-blue-600 rotate-[-15deg]">InternAI</span>
              </div>
            </div>

            {/* Main Content */}
            <div className="relative text-center space-y-8 py-8">
              {/* Header */}
              <div>
                <h2 className="text-3xl md:text-4xl font-serif tracking-[0.2em] text-slate-700 uppercase">
                  Certificate of Completion
                </h2>
                <div className="mt-4 flex justify-center">
                  <div className="w-32 h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent"></div>
                </div>
              </div>

              {/* Body text */}
              <div className="space-y-6">
                <p className="text-lg text-slate-600 italic">This is to certify that</p>
                
                {/* Name - prominently displayed */}
                <div className="py-4">
                  <h3 className="text-4xl md:text-5xl font-serif font-bold text-blue-600 tracking-wide">
                    {fullName}
                  </h3>
                  <div className="mt-2 flex justify-center">
                    <div className="w-48 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                  </div>
                </div>

                <p className="text-lg text-slate-600 italic">has successfully completed</p>

                {/* Domain/Internship */}
                <div className="py-2">
                  <h4 className="text-2xl md:text-3xl font-serif font-semibold text-slate-800">
                    the {domain} Internship
                  </h4>
                </div>

                <p className="text-slate-600">
                  and demonstrated excellence as evaluated by{" "}
                  <span className="font-semibold text-blue-600">InternAI Platform</span>
                </p>
              </div>

              {/* Seal/Badge */}
              <div className="flex justify-center py-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                      <Award className="w-10 h-10 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with date, ID, and signature */}
              <div className="pt-8 grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-slate-800">{currentDate}</div>
                  <div className="text-slate-500 text-xs mt-1 uppercase tracking-wider">Date</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-semibold text-slate-800">{certificateId}</div>
                  <div className="text-slate-500 text-xs mt-1 uppercase tracking-wider">Certificate ID</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-600 italic">InternAI Platform</div>
                  <div className="text-slate-500 text-xs mt-1 uppercase tracking-wider">Authorized Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-6 border-2 hover:border-blue-500/50 transition-all cursor-pointer group hover:shadow-lg bg-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">Download Certificate</h3>
                <p className="text-sm text-slate-500">PDF format with verification</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.print()}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Download
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-2 hover:border-cyan-500/50 transition-all cursor-pointer group hover:shadow-lg bg-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-100 rounded-lg group-hover:bg-cyan-200 transition-colors">
                <FileText className="w-6 h-6 text-cyan-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">Generate Resume</h3>
                <p className="text-sm text-slate-500">AI-powered resume builder</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowResume(true)}
                disabled={!profile}
                className="border-cyan-600 text-cyan-600 hover:bg-cyan-50"
              >
                Generate
              </Button>
            </div>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="p-6 border-2 bg-gradient-to-r from-blue-50 to-cyan-50">
          <h3 className="font-semibold mb-4 text-lg text-slate-800">Next Steps</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-slate-700">Coding Assessment Completed</span>
            </div>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white"
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

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-container, #certificate-container * {
            visibility: visible;
          }
          #certificate-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Certificate;
