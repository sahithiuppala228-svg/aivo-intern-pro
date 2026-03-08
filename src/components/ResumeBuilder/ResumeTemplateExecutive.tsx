import { Linkedin, Github, GraduationCap, Briefcase, Code, Star, Award, Mail } from "lucide-react";
import { ProfileData, ResumeSettings } from "./types";

interface Props {
  profile: ProfileData;
  domain: string;
  certificateId: string;
  settings: ResumeSettings;
}

const ResumeTemplateExecutive = ({ profile, domain, certificateId, settings }: Props) => {
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const skillsArray = profile.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const interestsArray = profile.interests?.split(',').map(s => s.trim()).filter(Boolean) || [];

  const fontSizeClass = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }[settings.fontSize];

  return (
    <div className="bg-white" style={{ fontFamily: settings.theme.fontFamily }}>
      {/* Dark top bar */}
      <div className="h-3" style={{ background: settings.theme.headerBg }}></div>
      
      <div className="flex">
        {/* Dark sidebar */}
        <div className="w-[280px] min-h-[900px] p-6 text-white" style={{ backgroundColor: settings.theme.primaryColor }}>
          {settings.showPhoto && profile.avatar && (
            <img src={profile.avatar} alt={fullName}
              className="w-36 h-36 rounded-lg object-cover mx-auto mb-6 border-2 border-white/20 shadow-lg" />
          )}

          <div className="mb-8">
            <h3 className={`uppercase tracking-[0.2em] mb-3 font-bold border-b border-white/30 pb-2 ${fontSizeClass}`}>Contact</h3>
            <div className={`space-y-2 ${fontSizeClass}`}>
              {profile.linkedin && (
                <a href={profile.linkedin} className="flex items-center gap-2 opacity-90 hover:opacity-100">
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </a>
              )}
              {profile.github && (
                <a href={profile.github} className="flex items-center gap-2 opacity-90 hover:opacity-100">
                  <Github className="w-4 h-4" /> GitHub
                </a>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h3 className={`uppercase tracking-[0.2em] mb-3 font-bold border-b border-white/30 pb-2 ${fontSizeClass}`}>Core Skills</h3>
            <div className="space-y-2">
              {skillsArray.map((skill, idx) => (
                <div key={idx} className={`flex items-center gap-2 ${fontSizeClass}`}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: settings.theme.secondaryColor }}></div>
                  {skill}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className={`uppercase tracking-[0.2em] mb-3 font-bold border-b border-white/30 pb-2 ${fontSizeClass}`}>Expertise</h3>
            <div className="space-y-2">
              {profile.selectedDomains?.map((d, idx) => (
                <div key={idx} className={`flex items-center gap-2 ${fontSizeClass}`}>
                  <Star className="w-3 h-3" style={{ color: settings.theme.secondaryColor }} /> {d}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className={`uppercase tracking-[0.2em] mb-3 font-bold border-b border-white/30 pb-2 ${fontSizeClass}`}>Interests</h3>
            <div className="flex flex-wrap gap-2">
              {interestsArray.map((interest, idx) => (
                <span key={idx} className={`px-2 py-1 rounded border border-white/30 ${fontSizeClass}`}>{interest}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: settings.theme.primaryColor }}>{fullName}</h1>
            <p className="text-xl mt-1" style={{ color: settings.theme.secondaryColor }}>{domain} Specialist</p>
            <div className="w-16 h-1 mt-3" style={{ backgroundColor: settings.theme.secondaryColor }}></div>
          </div>

          <div className="mb-6">
            <p className={`text-gray-700 leading-relaxed ${fontSizeClass}`}>
              Results-driven {profile.course} student at {profile.college} specializing in {domain}. 
              Seeking {profile.internshipType.toLowerCase()} opportunities with {profile.availability.toLowerCase()} availability.
              Proven track record of delivering high-quality solutions with strong analytical and problem-solving skills.
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider mb-3 pb-1 border-b-2" style={{ color: settings.theme.primaryColor, borderColor: settings.theme.secondaryColor }}>
              <GraduationCap className="w-5 h-5 inline mr-2" />Education
            </h2>
            <div className="ml-2">
              <h4 className="font-bold">{profile.course}</h4>
              <p className={`text-gray-600 ${fontSizeClass}`}>{profile.college}</p>
              <p className={`text-gray-500 ${fontSizeClass}`}>Year {profile.year}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider mb-3 pb-1 border-b-2" style={{ color: settings.theme.primaryColor, borderColor: settings.theme.secondaryColor }}>
              <Award className="w-5 h-5 inline mr-2" />Certification
            </h2>
            <div className="ml-2 p-4 rounded-lg" style={{ backgroundColor: `${settings.theme.accentColor}80` }}>
              <h4 className="font-bold" style={{ color: settings.theme.primaryColor }}>{domain} Coding Assessment</h4>
              <p className={`text-gray-600 ${fontSizeClass}`}>InternAI Platform — Certificate ID: {certificateId}</p>
            </div>
          </div>

          {profile.projects && (
            <div className="mb-6">
              <h2 className="text-lg font-bold uppercase tracking-wider mb-3 pb-1 border-b-2" style={{ color: settings.theme.primaryColor, borderColor: settings.theme.secondaryColor }}>
                <Briefcase className="w-5 h-5 inline mr-2" />Projects & Experience
              </h2>
              <div className="ml-2 p-4 bg-gray-50 rounded-lg">
                <p className={`whitespace-pre-wrap text-gray-700 ${fontSizeClass}`}>{profile.projects}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeTemplateExecutive;
