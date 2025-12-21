import { Linkedin, Github, GraduationCap, Briefcase, Mail, Phone } from "lucide-react";
import { ProfileData, ResumeSettings } from "./types";

interface Props {
  profile: ProfileData;
  domain: string;
  certificateId: string;
  settings: ResumeSettings;
}

const ResumeTemplateMinimal = ({ profile, domain, certificateId, settings }: Props) => {
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const skillsArray = profile.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const interestsArray = profile.interests?.split(',').map(s => s.trim()).filter(Boolean) || [];

  const fontSizeClass = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }[settings.fontSize];

  return (
    <div className="bg-white p-10" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header - Minimal Clean */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-6">
          {settings.showPhoto && profile.avatar && (
            <img 
              src={profile.avatar} 
              alt={fullName}
              className="w-20 h-20 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-light tracking-tight" style={{ color: settings.theme.primaryColor }}>
              {fullName}
            </h1>
            <p className={`mt-1 ${fontSizeClass}`} style={{ color: settings.theme.secondaryColor }}>
              {domain} • {profile.course}
            </p>
          </div>
        </div>
        <div className={`text-right ${fontSizeClass} text-gray-500 space-y-1`}>
          {profile.linkedin && (
            <a href={profile.linkedin} className="block hover:underline">LinkedIn ↗</a>
          )}
          {profile.github && (
            <a href={profile.github} className="block hover:underline">GitHub ↗</a>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="col-span-2 space-y-8">
          {/* Summary */}
          <div>
            <h2 className={`font-medium uppercase tracking-widest mb-3 ${fontSizeClass}`} style={{ color: settings.theme.secondaryColor }}>
              About
            </h2>
            <p className={`text-gray-700 leading-relaxed ${fontSizeClass}`}>
              {profile.course} student at {profile.college} specializing in {domain}. 
              Looking for {profile.internshipType.toLowerCase()} opportunities with {profile.availability.toLowerCase()} availability.
              {interestsArray.length > 0 && ` Passionate about ${interestsArray.slice(0, 2).join(' and ')}.`}
            </p>
          </div>

          {/* Education */}
          <div>
            <h2 className={`font-medium uppercase tracking-widest mb-3 ${fontSizeClass}`} style={{ color: settings.theme.secondaryColor }}>
              Education
            </h2>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{profile.course}</p>
                <p className={`text-gray-600 ${fontSizeClass}`}>{profile.college}</p>
              </div>
              <span className={`text-gray-500 ${fontSizeClass}`}>Year {profile.year}</span>
            </div>
          </div>

          {/* Certification */}
          <div>
            <h2 className={`font-medium uppercase tracking-widest mb-3 ${fontSizeClass}`} style={{ color: settings.theme.secondaryColor }}>
              Certification
            </h2>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{domain} Assessment</p>
                <p className={`text-gray-600 ${fontSizeClass}`}>InternAI Platform</p>
              </div>
              <span className={`text-gray-500 ${fontSizeClass}`}>{certificateId}</span>
            </div>
          </div>

          {/* Projects */}
          {profile.projects && (
            <div>
              <h2 className={`font-medium uppercase tracking-widest mb-3 ${fontSizeClass}`} style={{ color: settings.theme.secondaryColor }}>
                Projects
              </h2>
              <p className={`text-gray-700 whitespace-pre-wrap ${fontSizeClass}`}>{profile.projects}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8 border-l border-gray-100 pl-8">
          {/* Skills */}
          <div>
            <h2 className={`font-medium uppercase tracking-widest mb-3 ${fontSizeClass}`} style={{ color: settings.theme.secondaryColor }}>
              Skills
            </h2>
            <div className="space-y-1">
              {skillsArray.length > 0 ? skillsArray.map((skill, idx) => (
                <p key={idx} className={`text-gray-700 ${fontSizeClass}`}>{skill}</p>
              )) : (
                <p className={`text-gray-400 ${fontSizeClass}`}>—</p>
              )}
            </div>
          </div>

          {/* Expertise */}
          <div>
            <h2 className={`font-medium uppercase tracking-widest mb-3 ${fontSizeClass}`} style={{ color: settings.theme.secondaryColor }}>
              Expertise
            </h2>
            <div className="space-y-1">
              {profile.selectedDomains?.map((d, idx) => (
                <p key={idx} className={`text-gray-700 ${fontSizeClass}`}>{d}</p>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <h2 className={`font-medium uppercase tracking-widest mb-3 ${fontSizeClass}`} style={{ color: settings.theme.secondaryColor }}>
              Interests
            </h2>
            <div className="space-y-1">
              {interestsArray.length > 0 ? interestsArray.map((interest, idx) => (
                <p key={idx} className={`text-gray-700 ${fontSizeClass}`}>{interest}</p>
              )) : (
                <p className={`text-gray-400 ${fontSizeClass}`}>—</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeTemplateMinimal;
