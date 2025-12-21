import { Linkedin, Github, Calendar, GraduationCap, Briefcase, Code, Star, Mail, MapPin } from "lucide-react";
import { ProfileData, ResumeSettings } from "./types";

interface Props {
  profile: ProfileData;
  domain: string;
  certificateId: string;
  settings: ResumeSettings;
}

const ResumeTemplateModern = ({ profile, domain, certificateId, settings }: Props) => {
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const skillsArray = profile.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const interestsArray = profile.interests?.split(',').map(s => s.trim()).filter(Boolean) || [];

  const fontSizeClass = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }[settings.fontSize];

  const headingSize = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl'
  }[settings.fontSize];

  return (
    <div className="bg-white print:shadow-none" style={{ fontFamily: settings.theme.fontFamily }}>
      {/* Header */}
      <div 
        className="p-8 text-white relative overflow-hidden"
        style={{ background: settings.theme.headerBg }}
      >
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative z-10 flex items-center gap-6">
          {settings.showPhoto && profile.avatar && (
            <img 
              src={profile.avatar} 
              alt={fullName}
              className="w-28 h-28 rounded-full object-cover border-4 border-white/30 shadow-lg"
            />
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{fullName}</h1>
            <p className="text-xl opacity-90 mb-4">{domain} Specialist</p>
            <div className={`flex flex-wrap gap-4 ${fontSizeClass} opacity-90`}>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4" />
                {profile.college}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {profile.course} - Year {profile.year}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {profile.internshipType} | {profile.availability}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 p-6">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Contact */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: settings.theme.accentColor }}>
            <h3 className={`font-semibold uppercase tracking-wider mb-3 ${fontSizeClass}`} style={{ color: settings.theme.primaryColor }}>
              Contact
            </h3>
            <div className={`space-y-2 ${fontSizeClass}`}>
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                  <Linkedin className="w-4 h-4" style={{ color: settings.theme.secondaryColor }} />
                  LinkedIn Profile
                </a>
              )}
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                  <Github className="w-4 h-4" />
                  GitHub Profile
                </a>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: settings.theme.accentColor }}>
            <h3 className={`font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${fontSizeClass}`} style={{ color: settings.theme.primaryColor }}>
              <Code className="w-4 h-4" />
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {skillsArray.length > 0 ? skillsArray.map((skill, idx) => (
                <span 
                  key={idx} 
                  className={`px-2 py-1 rounded-full font-medium ${fontSizeClass}`}
                  style={{ backgroundColor: settings.theme.secondaryColor, color: 'white' }}
                >
                  {skill}
                </span>
              )) : (
                <span className={`text-gray-500 ${fontSizeClass}`}>No skills listed</span>
              )}
            </div>
          </div>

          {/* Interests */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: settings.theme.accentColor }}>
            <h3 className={`font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${fontSizeClass}`} style={{ color: settings.theme.primaryColor }}>
              <Star className="w-4 h-4" />
              Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {interestsArray.length > 0 ? interestsArray.map((interest, idx) => (
                <span 
                  key={idx} 
                  className={`px-2 py-1 rounded-full border ${fontSizeClass}`}
                  style={{ borderColor: settings.theme.secondaryColor, color: settings.theme.primaryColor }}
                >
                  {interest}
                </span>
              )) : (
                <span className={`text-gray-500 ${fontSizeClass}`}>No interests listed</span>
              )}
            </div>
          </div>

          {/* Domains */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: settings.theme.accentColor }}>
            <h3 className={`font-semibold uppercase tracking-wider mb-3 ${fontSizeClass}`} style={{ color: settings.theme.primaryColor }}>
              Expertise
            </h3>
            <div className="space-y-1">
              {profile.selectedDomains?.map((d, idx) => (
                <div key={idx} className={`flex items-center gap-2 ${fontSizeClass}`}>
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: settings.theme.secondaryColor }}
                  ></div>
                  {d}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-2 space-y-5">
          {/* Certification */}
          <div 
            className="p-5 rounded-xl border-2"
            style={{ borderColor: settings.theme.secondaryColor, backgroundColor: `${settings.theme.accentColor}50` }}
          >
            <h3 className={`font-bold ${headingSize} mb-3`} style={{ color: settings.theme.primaryColor }}>
              🏆 Certified Achievement
            </h3>
            <div className="flex items-start gap-4">
              <div 
                className="p-3 rounded-lg"
                style={{ background: settings.theme.headerBg }}
              >
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold">{domain} Coding Assessment</h4>
                <p className={`text-gray-600 ${fontSizeClass}`}>Successfully completed all coding challenges</p>
                <p className={`text-gray-500 mt-1 ${fontSizeClass}`}>Certificate ID: {certificateId}</p>
              </div>
            </div>
          </div>

          {/* Education */}
          <div>
            <h3 className={`font-bold ${headingSize} mb-4 flex items-center gap-2`} style={{ color: settings.theme.primaryColor }}>
              <GraduationCap className="w-5 h-5" />
              Education
            </h3>
            <div className="border-l-2 pl-4 ml-2" style={{ borderColor: settings.theme.secondaryColor }}>
              <div className="relative">
                <div 
                  className="absolute -left-[22px] top-1 w-3 h-3 rounded-full"
                  style={{ backgroundColor: settings.theme.secondaryColor }}
                ></div>
                <h4 className="font-semibold">{profile.course}</h4>
                <p className="text-gray-600">{profile.college}</p>
                <p className={`text-gray-500 ${fontSizeClass}`}>Year: {profile.year}</p>
              </div>
            </div>
          </div>

          {/* Projects */}
          {profile.projects && (
            <div>
              <h3 className={`font-bold ${headingSize} mb-4 flex items-center gap-2`} style={{ color: settings.theme.primaryColor }}>
                <Briefcase className="w-5 h-5" />
                Projects & Experience
              </h3>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className={`whitespace-pre-wrap ${fontSizeClass}`}>{profile.projects}</p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: settings.theme.accentColor }}>
            <h3 className={`font-bold ${headingSize} mb-2`} style={{ color: settings.theme.primaryColor }}>
              Professional Summary
            </h3>
            <p className={`text-gray-700 leading-relaxed ${fontSizeClass}`}>
              Motivated {profile.course} student at {profile.college} with expertise in {domain}. 
              Seeking a {profile.internshipType.toLowerCase()} internship opportunity with {profile.availability.toLowerCase()} availability. 
              Passionate about {interestsArray.slice(0, 2).join(' and ') || 'technology and innovation'}. 
              Certified in {domain} development with proven problem-solving skills.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeTemplateModern;
