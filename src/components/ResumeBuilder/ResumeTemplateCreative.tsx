import { Linkedin, Github, GraduationCap, Briefcase, Code, Star, Award } from "lucide-react";
import { ProfileData, ResumeSettings } from "./types";

interface Props {
  profile: ProfileData;
  domain: string;
  certificateId: string;
  settings: ResumeSettings;
}

const ResumeTemplateCreative = ({ profile, domain, certificateId, settings }: Props) => {
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
      {/* Creative Sidebar Layout */}
      <div className="flex">
        {/* Sidebar */}
        <div 
          className="w-1/3 min-h-[800px] p-6 text-white"
          style={{ background: settings.theme.headerBg }}
        >
          {/* Photo */}
          {settings.showPhoto && profile.avatar && (
            <div className="mb-6">
              <img 
                src={profile.avatar} 
                alt={fullName}
                className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white/30 shadow-xl"
              />
            </div>
          )}

          {/* Name */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-1">{fullName}</h1>
            <p className="opacity-80">{domain}</p>
          </div>

          {/* Contact */}
          <div className="mb-6">
            <h3 className={`font-bold uppercase tracking-wider mb-3 opacity-70 ${fontSizeClass}`}>Contact</h3>
            <div className={`space-y-2 ${fontSizeClass}`}>
              {profile.linkedin && (
                <a href={profile.linkedin} className="flex items-center gap-2 hover:opacity-80">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              )}
              {profile.github && (
                <a href={profile.github} className="flex items-center gap-2 hover:opacity-80">
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <h3 className={`font-bold uppercase tracking-wider mb-3 opacity-70 ${fontSizeClass}`}>Skills</h3>
            <div className="space-y-2">
              {skillsArray.slice(0, 6).map((skill, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/80 rounded-full"
                      style={{ width: `${85 - idx * 10}%` }}
                    ></div>
                  </div>
                  <span className={fontSizeClass}>{skill}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="mb-6">
            <h3 className={`font-bold uppercase tracking-wider mb-3 opacity-70 ${fontSizeClass}`}>Interests</h3>
            <div className="flex flex-wrap gap-2">
              {interestsArray.map((interest, idx) => (
                <span 
                  key={idx} 
                  className={`px-3 py-1 rounded-full bg-white/20 ${fontSizeClass}`}
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Domains */}
          <div>
            <h3 className={`font-bold uppercase tracking-wider mb-3 opacity-70 ${fontSizeClass}`}>Expertise</h3>
            <div className="space-y-2">
              {profile.selectedDomains?.map((d, idx) => (
                <div key={idx} className={`flex items-center gap-2 ${fontSizeClass}`}>
                  <Star className="w-3 h-3" />
                  {d}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 space-y-6">
          {/* Profile Summary */}
          <div className="mb-8">
            <h2 
              className="text-2xl font-bold mb-4 pb-2 border-b-2"
              style={{ color: settings.theme.primaryColor, borderColor: settings.theme.secondaryColor }}
            >
              Profile
            </h2>
            <p className={`text-gray-700 leading-relaxed ${fontSizeClass}`}>
              Dynamic and motivated {profile.course} student at {profile.college} with a passion for {domain}. 
              Actively seeking {profile.internshipType.toLowerCase()} internship opportunities with {profile.availability.toLowerCase()} availability. 
              Committed to continuous learning and applying innovative solutions to real-world challenges.
            </p>
          </div>

          {/* Education */}
          <div>
            <h2 
              className="text-xl font-bold mb-4 pb-2 border-b-2 flex items-center gap-2"
              style={{ color: settings.theme.primaryColor, borderColor: settings.theme.secondaryColor }}
            >
              <GraduationCap className="w-5 h-5" />
              Education
            </h2>
            <div className="relative pl-6 border-l-2" style={{ borderColor: settings.theme.accentColor }}>
              <div 
                className="absolute -left-2 top-0 w-4 h-4 rounded-full"
                style={{ backgroundColor: settings.theme.secondaryColor }}
              ></div>
              <h4 className="font-bold">{profile.course}</h4>
              <p className={`text-gray-600 ${fontSizeClass}`}>{profile.college}</p>
              <p className={`text-gray-500 ${fontSizeClass}`}>Year: {profile.year}</p>
            </div>
          </div>

          {/* Certification */}
          <div>
            <h2 
              className="text-xl font-bold mb-4 pb-2 border-b-2 flex items-center gap-2"
              style={{ color: settings.theme.primaryColor, borderColor: settings.theme.secondaryColor }}
            >
              <Award className="w-5 h-5" />
              Certification
            </h2>
            <div 
              className="p-4 rounded-lg border-l-4"
              style={{ backgroundColor: settings.theme.accentColor, borderColor: settings.theme.secondaryColor }}
            >
              <h4 className="font-bold" style={{ color: settings.theme.primaryColor }}>
                {domain} Coding Assessment
              </h4>
              <p className={`text-gray-600 ${fontSizeClass}`}>InternAI Platform - Verified</p>
              <p className={`text-gray-500 ${fontSizeClass}`}>Certificate ID: {certificateId}</p>
            </div>
          </div>

          {/* Projects */}
          {profile.projects && (
            <div>
              <h2 
                className="text-xl font-bold mb-4 pb-2 border-b-2 flex items-center gap-2"
                style={{ color: settings.theme.primaryColor, borderColor: settings.theme.secondaryColor }}
              >
                <Briefcase className="w-5 h-5" />
                Projects
              </h2>
              <div className="p-4 rounded-lg bg-gray-50">
                <p className={`text-gray-700 whitespace-pre-wrap ${fontSizeClass}`}>{profile.projects}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeTemplateCreative;
