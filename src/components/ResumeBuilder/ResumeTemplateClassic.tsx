import { Linkedin, Github, GraduationCap, Briefcase, Code, Star } from "lucide-react";
import { ProfileData, ResumeSettings } from "./types";

interface Props {
  profile: ProfileData;
  domain: string;
  certificateId: string;
  settings: ResumeSettings;
}

const ResumeTemplateClassic = ({ profile, domain, certificateId, settings }: Props) => {
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const skillsArray = profile.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const interestsArray = profile.interests?.split(',').map(s => s.trim()).filter(Boolean) || [];

  const fontSizeClass = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }[settings.fontSize];

  return (
    <div className="bg-white p-8" style={{ fontFamily: settings.theme.fontFamily }}>
      {/* Header - Classic Centered */}
      <div className="text-center border-b-4 pb-6 mb-6" style={{ borderColor: settings.theme.primaryColor }}>
        {settings.showPhoto && profile.avatar && (
          <img 
            src={profile.avatar} 
            alt={fullName}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4"
            style={{ borderColor: settings.theme.secondaryColor }}
          />
        )}
        <h1 className="text-4xl font-bold mb-2" style={{ color: settings.theme.primaryColor }}>
          {fullName}
        </h1>
        <p className="text-xl mb-2" style={{ color: settings.theme.secondaryColor }}>
          {domain} Specialist
        </p>
        <div className={`flex justify-center gap-6 ${fontSizeClass} text-gray-600`}>
          <span>{profile.college}</span>
          <span>•</span>
          <span>{profile.course} - Year {profile.year}</span>
        </div>
        <div className={`flex justify-center gap-4 mt-3 ${fontSizeClass}`}>
          {profile.linkedin && (
            <a href={profile.linkedin} className="flex items-center gap-1 hover:underline" style={{ color: settings.theme.secondaryColor }}>
              <Linkedin className="w-4 h-4" /> LinkedIn
            </a>
          )}
          {profile.github && (
            <a href={profile.github} className="flex items-center gap-1 hover:underline" style={{ color: settings.theme.secondaryColor }}>
              <Github className="w-4 h-4" /> GitHub
            </a>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Objective */}
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider border-b-2 pb-2 mb-3" style={{ color: settings.theme.primaryColor, borderColor: settings.theme.accentColor }}>
              Objective
            </h2>
            <p className={`text-gray-700 ${fontSizeClass}`}>
              Seeking a {profile.internshipType.toLowerCase()} internship in {domain} with {profile.availability.toLowerCase()} availability 
              to apply my skills and contribute to innovative projects.
            </p>
          </div>

          {/* Education */}
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider border-b-2 pb-2 mb-3" style={{ color: settings.theme.primaryColor, borderColor: settings.theme.accentColor }}>
              <GraduationCap className="w-5 h-5 inline mr-2" />
              Education
            </h2>
            <div>
              <h4 className="font-semibold">{profile.course}</h4>
              <p className={`text-gray-600 ${fontSizeClass}`}>{profile.college}</p>
              <p className={`text-gray-500 ${fontSizeClass}`}>Current Year: {profile.year}</p>
            </div>
          </div>

          {/* Certification */}
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider border-b-2 pb-2 mb-3" style={{ color: settings.theme.primaryColor, borderColor: settings.theme.accentColor }}>
              Certification
            </h2>
            <div>
              <h4 className="font-semibold">{domain} Coding Assessment</h4>
              <p className={`text-gray-600 ${fontSizeClass}`}>InternAI Platform - Certified</p>
              <p className={`text-gray-500 ${fontSizeClass}`}>ID: {certificateId}</p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Skills */}
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider border-b-2 pb-2 mb-3" style={{ color: settings.theme.primaryColor, borderColor: settings.theme.accentColor }}>
              <Code className="w-5 h-5 inline mr-2" />
              Technical Skills
            </h2>
            <ul className={`list-disc list-inside space-y-1 ${fontSizeClass}`}>
              {skillsArray.length > 0 ? skillsArray.map((skill, idx) => (
                <li key={idx}>{skill}</li>
              )) : (
                <li className="text-gray-500">Skills to be added</li>
              )}
            </ul>
          </div>

          {/* Areas of Expertise */}
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider border-b-2 pb-2 mb-3" style={{ color: settings.theme.primaryColor, borderColor: settings.theme.accentColor }}>
              Areas of Expertise
            </h2>
            <ul className={`list-disc list-inside space-y-1 ${fontSizeClass}`}>
              {profile.selectedDomains?.map((d, idx) => (
                <li key={idx}>{d}</li>
              ))}
            </ul>
          </div>

          {/* Interests */}
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider border-b-2 pb-2 mb-3" style={{ color: settings.theme.primaryColor, borderColor: settings.theme.accentColor }}>
              <Star className="w-5 h-5 inline mr-2" />
              Interests
            </h2>
            <ul className={`list-disc list-inside space-y-1 ${fontSizeClass}`}>
              {interestsArray.length > 0 ? interestsArray.map((interest, idx) => (
                <li key={idx}>{interest}</li>
              )) : (
                <li className="text-gray-500">Interests to be added</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Projects - Full Width */}
      {profile.projects && (
        <div className="mt-6 pt-6 border-t" style={{ borderColor: settings.theme.accentColor }}>
          <h2 className="text-lg font-bold uppercase tracking-wider border-b-2 pb-2 mb-3" style={{ color: settings.theme.primaryColor, borderColor: settings.theme.accentColor }}>
            <Briefcase className="w-5 h-5 inline mr-2" />
            Projects & Experience
          </h2>
          <p className={`text-gray-700 whitespace-pre-wrap ${fontSizeClass}`}>{profile.projects}</p>
        </div>
      )}
    </div>
  );
};

export default ResumeTemplateClassic;
