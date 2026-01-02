import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Award, FileText, Download, ExternalLink, ArrowLeft, CheckCircle2, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import { ResumeBuilder, ProfileData } from "@/components/ResumeBuilder";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/assessment-intro")}
          className="mb-6 text-blue-800 hover:text-blue-900 hover:bg-blue-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assessments
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 rounded-full mb-4">
            <Award className="w-12 h-12 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-800 via-blue-600 to-blue-800 bg-clip-text text-transparent">
            Congratulations!
          </h1>
          <p className="text-blue-700">
            You have successfully completed the {domain} Internship Assessment
          </p>
        </div>

        {/* Horizontal Certificate - Royal Blue & Gold Design */}
        <div className="relative mb-8 overflow-x-auto" id="certificate-container">
          <div className="min-w-[900px] mx-auto">
            {/* Outer decorative border */}
            <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 p-3 rounded-lg shadow-2xl">
              {/* Inner gold border */}
              <div className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 p-1 rounded-md">
                {/* Main certificate background */}
                <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-md relative overflow-hidden">
                  
                  {/* Corner decorations */}
                  <div className="absolute top-0 left-0 w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path d="M0,0 L100,0 L100,15 L15,15 L15,100 L0,100 Z" fill="url(#blueGold1)" />
                      <path d="M20,0 L100,0 L100,8 L28,8 L28,100 L20,100 Z" fill="#1e3a8a" opacity="0.6" />
                      <defs>
                        <linearGradient id="blueGold1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#D4AF37" />
                          <stop offset="50%" stopColor="#FFD700" />
                          <stop offset="100%" stopColor="#D4AF37" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 rotate-90">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path d="M0,0 L100,0 L100,15 L15,15 L15,100 L0,100 Z" fill="url(#blueGold2)" />
                      <path d="M20,0 L100,0 L100,8 L28,8 L28,100 L20,100 Z" fill="#1e3a8a" opacity="0.6" />
                      <defs>
                        <linearGradient id="blueGold2" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#D4AF37" />
                          <stop offset="50%" stopColor="#FFD700" />
                          <stop offset="100%" stopColor="#D4AF37" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 -rotate-90">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path d="M0,0 L100,0 L100,15 L15,15 L15,100 L0,100 Z" fill="url(#blueGold3)" />
                      <path d="M20,0 L100,0 L100,8 L28,8 L28,100 L20,100 Z" fill="#1e3a8a" opacity="0.6" />
                      <defs>
                        <linearGradient id="blueGold3" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#D4AF37" />
                          <stop offset="50%" stopColor="#FFD700" />
                          <stop offset="100%" stopColor="#D4AF37" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="absolute bottom-0 right-0 w-32 h-32 rotate-180">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path d="M0,0 L100,0 L100,15 L15,15 L15,100 L0,100 Z" fill="url(#blueGold4)" />
                      <path d="M20,0 L100,0 L100,8 L28,8 L28,100 L20,100 Z" fill="#1e3a8a" opacity="0.6" />
                      <defs>
                        <linearGradient id="blueGold4" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#D4AF37" />
                          <stop offset="50%" stopColor="#FFD700" />
                          <stop offset="100%" stopColor="#D4AF37" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Decorative side borders */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 h-[60%] w-2 bg-gradient-to-b from-transparent via-blue-600 to-transparent opacity-30"></div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 h-[60%] w-2 bg-gradient-to-b from-transparent via-blue-600 to-transparent opacity-30"></div>

                  {/* Horizontal Layout Content */}
                  <div className="flex items-center py-10 px-16">
                    {/* Left Section - Seal */}
                    <div className="flex-shrink-0 mr-10">
                      <div className="relative">
                        <div className="w-36 h-36 rounded-full bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 flex items-center justify-center shadow-xl border-4 border-yellow-400">
                          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-50 to-white flex items-center justify-center border-2 border-yellow-500">
                            <div className="text-center">
                              <Award className="w-10 h-10 text-blue-800 mx-auto mb-1" />
                              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Certified</span>
                            </div>
                          </div>
                        </div>
                        {/* Decorative ribbon */}
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-8 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-800 rounded-b-lg shadow-md flex items-center justify-center">
                          <span className="text-yellow-400 text-xs font-bold">★ ★ ★</span>
                        </div>
                      </div>
                    </div>

                    {/* Center Section - Main Content */}
                    <div className="flex-1 text-center">
                      <h2 className="text-3xl font-serif tracking-[0.15em] text-blue-900 uppercase mb-2">
                        Certificate of Completion
                      </h2>
                      <div className="flex justify-center mb-4">
                        <div className="w-48 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
                      </div>
                      
                      <p className="text-blue-700 italic text-lg mb-3">This is to certify that</p>
                      
                      {/* Name prominently displayed */}
                      <div className="relative py-3 mb-3">
                        <h3 className="text-4xl font-serif font-bold text-blue-900 tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                          {fullName}
                        </h3>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-64 h-[2px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
                      </div>

                      <p className="text-blue-700 italic text-lg mb-2">has successfully completed</p>
                      
                      <h4 className="text-2xl font-serif font-semibold text-blue-900 mb-3">
                        The {domain} Internship
                      </h4>
                      
                      <p className="text-blue-600 text-sm">
                        and demonstrated excellence as evaluated by{" "}
                        <span className="font-bold text-blue-800">InternAI Platform</span>
                      </p>
                    </div>

                    {/* Right Section - Details */}
                    <div className="flex-shrink-0 ml-10 text-center space-y-6">
                      <div>
                        <div className="text-lg font-semibold text-blue-900">{currentDate}</div>
                        <div className="text-xs text-blue-600 uppercase tracking-widest mt-1">Date Issued</div>
                      </div>
                      
                      <div className="w-20 h-[1px] bg-yellow-500 mx-auto"></div>
                      
                      <div>
                        <div className="font-mono text-sm font-bold text-blue-900">{certificateId}</div>
                        <div className="text-xs text-blue-600 uppercase tracking-widest mt-1">Certificate ID</div>
                      </div>
                      
                      <div className="w-20 h-[1px] bg-yellow-500 mx-auto"></div>
                      
                      <div>
                        <div className="font-serif italic text-blue-800 font-semibold">InternAI</div>
                        <div className="text-xs text-blue-600 uppercase tracking-widest mt-1">Authorized</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-6 border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer group hover:shadow-lg bg-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Download className="w-6 h-6 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Download Certificate</h3>
                <p className="text-sm text-blue-600">PDF format with verification</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.print()}
                className="border-blue-600 text-blue-700 hover:bg-blue-50"
              >
                Download
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-2 border-yellow-300 hover:border-yellow-500 transition-all cursor-pointer group hover:shadow-lg bg-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                <FileText className="w-6 h-6 text-yellow-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800">Generate Resume</h3>
                <p className="text-sm text-yellow-600">AI-powered resume builder</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowResume(true)}
                disabled={!profile}
                className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
              >
                Generate
              </Button>
            </div>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="p-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-slate-50">
          <h3 className="font-semibold mb-4 text-lg text-blue-900">Next Steps</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-blue-800">Coding Assessment Completed</span>
            </div>
            
            {/* View Top Internships Button */}
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 hover:from-green-700 hover:via-emerald-700 hover:to-green-800 text-white"
              onClick={() => navigate("/internships", { state: { domain } })}
            >
              <Briefcase className="w-5 h-5 mr-2" />
              View Top 5 Internships For You →
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full border-blue-600 text-blue-700 hover:bg-blue-50"
              onClick={() => window.location.href = 'https://intern-ai-coach.lovable.app'}
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Continue to AI Mock Interview
            </Button>
          </div>
        </Card>
      </div>

      {/* Resume Builder */}
      <ResumeBuilder 
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
