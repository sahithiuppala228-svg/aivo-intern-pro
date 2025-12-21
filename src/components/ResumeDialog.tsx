import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Linkedin, Github, Calendar, GraduationCap, Briefcase, Code, Star } from "lucide-react";
import { useRef } from "react";

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

interface ResumeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData | null;
  domain: string;
  certificateId: string;
}

const ResumeDialog = ({ open, onOpenChange, profile, domain, certificateId }: ResumeDialogProps) => {
  const resumeRef = useRef<HTMLDivElement>(null);

  if (!profile) return null;

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const skillsArray = profile.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const interestsArray = profile.interests?.split(',').map(s => s.trim()).filter(Boolean) || [];

  const handleDownload = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Professional Resume</span>
            <Button onClick={handleDownload} size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Resume Content */}
        <div ref={resumeRef} className="p-8 bg-background print:p-0">
          {/* Header Section */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary via-primary/90 to-secondary p-8 text-primary-foreground mb-6">
            <div className="absolute inset-0 opacity-50" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-2">{fullName}</h1>
              <p className="text-xl opacity-90 mb-4">{domain} Specialist</p>
              <div className="flex flex-wrap gap-4 text-sm opacity-90">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  {profile.college}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {profile.course} - {profile.year}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {profile.internshipType} | {profile.availability}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Contact */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Contact</h3>
                <div className="space-y-2 text-sm">
                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                      <Linkedin className="w-4 h-4 text-primary" />
                      LinkedIn Profile
                    </a>
                  )}
                  {profile.github && (
                    <a href={profile.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                      <Github className="w-4 h-4 text-foreground" />
                      GitHub Profile
                    </a>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                  <Code className="w-4 h-4 inline mr-2" />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillsArray.length > 0 ? (
                    skillsArray.map((skill, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No skills listed</span>
                  )}
                </div>
              </div>

              {/* Interests */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                  <Star className="w-4 h-4 inline mr-2" />
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {interestsArray.length > 0 ? (
                    interestsArray.map((interest, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs rounded-full bg-secondary/10 text-secondary font-medium">
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No interests listed</span>
                  )}
                </div>
              </div>

              {/* Domains */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Expertise Areas</h3>
                <div className="space-y-1">
                  {profile.selectedDomains?.map((d, idx) => (
                    <div key={idx} className="text-sm flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary"></div>
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-2 space-y-6">
              {/* Certification */}
              <div className="p-6 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
                <h3 className="font-bold text-lg mb-3 text-primary">🏆 Certified Achievement</h3>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-secondary">
                    <GraduationCap className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{domain} Coding Assessment</h4>
                    <p className="text-sm text-muted-foreground">Successfully completed all coding challenges</p>
                    <p className="text-xs text-muted-foreground mt-1">Certificate ID: {certificateId}</p>
                  </div>
                </div>
              </div>

              {/* Education */}
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Education
                </h3>
                <div className="border-l-2 border-primary/30 pl-4 ml-2">
                  <div className="relative">
                    <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-primary"></div>
                    <h4 className="font-semibold">{profile.course}</h4>
                    <p className="text-muted-foreground">{profile.college}</p>
                    <p className="text-sm text-muted-foreground">Year: {profile.year}</p>
                  </div>
                </div>
              </div>

              {/* Projects */}
              {profile.projects && (
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Projects & Experience
                  </h3>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-sm whitespace-pre-wrap">{profile.projects}</p>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border border-border">
                <h3 className="font-bold text-lg mb-2">Professional Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Motivated {profile.course} student at {profile.college} with expertise in {domain}. 
                  Seeking a {profile.internshipType.toLowerCase()} internship opportunity with {profile.availability.toLowerCase()} availability. 
                  Passionate about {interestsArray.slice(0, 2).join(' and ') || 'technology and innovation'}. 
                  Certified in {domain} development with proven problem-solving skills.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeDialog;
