import { Linkedin, Github, GraduationCap, Briefcase, Code, Star, Award } from "lucide-react";
import { ProfileData, ResumeSettings } from "./types";

interface Props {
  profile: ProfileData;
  domain: string;
  certificateId: string;
  settings: ResumeSettings;
}

const ResumeTemplateAcademic = ({ profile, domain, certificateId, settings }: Props) => {
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const skillsArray = profile.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const interestsArray = profile.interests?.split(',').map(s => s.trim()).filter(Boolean) || [];

  const fontSizeClass = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }[settings.fontSize];

  return (
    <div className="bg-white p-10" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* Header - centered, formal */}
      <div className="text-center mb-8 border-b-2 pb-6" style={{ borderColor: settings.theme.primaryColor }}>
        {settings.showPhoto && profile.avatar && (
          <img src={profile.avatar} alt={fullName}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2" style={{ borderColor: settings.theme.primaryColor }} />
        )}
        <h1 className="text-4xl font-bold tracking-wide" style={{ color: settings.theme.primaryColor }}>{fullName}</h1>
        <p className="text-lg italic mt-1 text-gray-600">{profile.course} — {profile.college}</p>
        <div className={`flex justify-center gap-6 mt-3 ${fontSizeClass} text-gray-600`}>
          {profile.linkedin && (
            <a href={profile.linkedin} className="flex items-center gap-1 hover:underline">
              <Linkedin className="w-3 h-3" /> LinkedIn
            </a>
          )}
          {profile.github && (
            <a href={profile.github} className="flex items-center gap-1 hover:underline">
              <Github className="w-3 h-3" /> GitHub
            </a>
          )}
          <span>Year {profile.year}</span>
        </div>
      </div>

      {/* Research Interests / Summary */}
      <section className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-widest mb-2" style={{ color: settings.theme.primaryColor }}>
          Research Interests & Objective
        </h2>
        <div className="h-[1px] mb-3" style={{ backgroundColor: settings.theme.secondaryColor }}></div>
        <p className={`text-gray-700 leading-relaxed ${fontSizeClass}`}>
          Dedicated {profile.course} scholar at {profile.college} with focused expertise in {domain}. 
          Pursuing {profile.internshipType.toLowerCase()} research and internship opportunities with {profile.availability.toLowerCase()} commitment. 
          Areas of interest include {interestsArray.slice(0, 3).join(', ') || 'technology and innovation'}.
        </p>
      </section>

      {/* Education */}
      <section className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-widest mb-2" style={{ color: settings.theme.primaryColor }}>Education</h2>
        <div className="h-[1px] mb-3" style={{ backgroundColor: settings.theme.secondaryColor }}></div>
        <div className="flex justify-between items-baseline">
          <div>
            <h4 className="font-bold">{profile.course}</h4>
            <p className={`text-gray-600 ${fontSizeClass}`}>{profile.college}</p>
          </div>
          <span className={`text-gray-500 italic ${fontSizeClass}`}>Year {profile.year}</span>
        </div>
      </section>

      {/* Certifications */}
      <section className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-widest mb-2" style={{ color: settings.theme.primaryColor }}>Certifications & Awards</h2>
        <div className="h-[1px] mb-3" style={{ backgroundColor: settings.theme.secondaryColor }}></div>
        <div className="flex justify-between items-baseline">
          <div>
            <h4 className="font-bold">{domain} Coding Assessment — InternAI Platform</h4>
            <p className={`text-gray-500 ${fontSizeClass}`}>Certificate ID: {certificateId}</p>
          </div>
          <span className={`text-gray-500 italic ${fontSizeClass}`}>Verified ✓</span>
        </div>
      </section>

      {/* Technical Proficiency */}
      <section className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-widest mb-2" style={{ color: settings.theme.primaryColor }}>Technical Proficiency</h2>
        <div className="h-[1px] mb-3" style={{ backgroundColor: settings.theme.secondaryColor }}></div>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {skillsArray.map((skill, idx) => (
            <span key={idx} className={`text-gray-700 ${fontSizeClass}`}>• {skill}</span>
          ))}
        </div>
      </section>

      {/* Domains of Expertise */}
      <section className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-widest mb-2" style={{ color: settings.theme.primaryColor }}>Domains of Expertise</h2>
        <div className="h-[1px] mb-3" style={{ backgroundColor: settings.theme.secondaryColor }}></div>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {profile.selectedDomains?.map((d, idx) => (
            <span key={idx} className={`text-gray-700 ${fontSizeClass}`}>• {d}</span>
          ))}
        </div>
      </section>

      {/* Projects */}
      {profile.projects && (
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase tracking-widest mb-2" style={{ color: settings.theme.primaryColor }}>Projects & Publications</h2>
          <div className="h-[1px] mb-3" style={{ backgroundColor: settings.theme.secondaryColor }}></div>
          <p className={`whitespace-pre-wrap text-gray-700 ${fontSizeClass}`}>{profile.projects}</p>
        </section>
      )}

      {/* Footer line */}
      <div className="mt-8 pt-4 border-t text-center" style={{ borderColor: settings.theme.primaryColor }}>
        <p className="text-xs text-gray-400 italic">Curriculum Vitae — {fullName}</p>
      </div>
    </div>
  );
};

export default ResumeTemplateAcademic;
