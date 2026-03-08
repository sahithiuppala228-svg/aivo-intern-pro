import { Linkedin, Github, GraduationCap, Briefcase, Star, Award } from "lucide-react";
import { ProfileData, ResumeSettings } from "./types";

interface Props {
  profile: ProfileData;
  domain: string;
  certificateId: string;
  settings: ResumeSettings;
}

const ResumeTemplateElegant = ({ profile, domain, certificateId, settings }: Props) => {
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const skillsArray = profile.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const interestsArray = profile.interests?.split(',').map(s => s.trim()).filter(Boolean) || [];

  const fontSizeClass = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }[settings.fontSize];

  const goldAccent = '#C5A55A';

  return (
    <div className="bg-white min-h-[900px]" style={{ fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" }}>
      {/* Elegant two-tone header */}
      <div className="relative overflow-hidden" style={{ background: settings.theme.headerBg }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, ${goldAccent} 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${goldAccent} 0%, transparent 50%)`
        }}></div>
        <div className="relative z-10 py-10 px-8 text-center text-white">
          {settings.showPhoto && profile.avatar && (
            <img src={profile.avatar} alt={fullName}
              className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 shadow-xl" style={{ borderColor: goldAccent }} />
          )}
          <h1 className="text-5xl font-light tracking-[0.1em]" style={{ fontFamily: "'Georgia', serif" }}>{fullName}</h1>
          <div className="flex justify-center mt-3 mb-2">
            <div className="w-20 h-[2px]" style={{ backgroundColor: goldAccent }}></div>
          </div>
          <p className="text-lg opacity-90 tracking-widest uppercase">{domain} Specialist</p>
        </div>
      </div>

      {/* Gold accent bar */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, transparent, ${goldAccent}, transparent)` }}></div>

      <div className="p-8 space-y-6">
        {/* Contact row */}
        <div className={`flex justify-center gap-8 ${fontSizeClass} text-gray-500`}>
          {profile.linkedin && (
            <a href={profile.linkedin} className="flex items-center gap-1 hover:text-gray-700">
              <Linkedin className="w-3 h-3" /> LinkedIn
            </a>
          )}
          {profile.github && (
            <a href={profile.github} className="flex items-center gap-1 hover:text-gray-700">
              <Github className="w-3 h-3" /> GitHub
            </a>
          )}
          <span>{profile.college}</span>
          <span>Year {profile.year}</span>
        </div>

        {/* Summary */}
        <section className="text-center max-w-2xl mx-auto">
          <p className={`text-gray-600 leading-relaxed italic ${fontSizeClass}`}>
            "{profile.course} student at {profile.college}, specializing in {domain}. 
            Seeking {profile.internshipType.toLowerCase()} opportunities with {profile.availability.toLowerCase()} availability. 
            Driven by a passion for {interestsArray.slice(0, 2).join(' and ') || 'excellence and innovation'}."
          </p>
        </section>

        <div className="flex justify-center">
          <div className="w-40 h-[1px]" style={{ backgroundColor: goldAccent }}></div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Left */}
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold tracking-widest uppercase mb-3" style={{ color: settings.theme.primaryColor }}>
                <GraduationCap className="w-4 h-4 inline mr-2" />Education
              </h2>
              <div className="pl-4 border-l-2" style={{ borderColor: goldAccent }}>
                <h4 className="font-semibold">{profile.course}</h4>
                <p className={`text-gray-500 ${fontSizeClass}`}>{profile.college}</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold tracking-widest uppercase mb-3" style={{ color: settings.theme.primaryColor }}>
                <Award className="w-4 h-4 inline mr-2" />Certification
              </h2>
              <div className="pl-4 border-l-2" style={{ borderColor: goldAccent }}>
                <h4 className="font-semibold">{domain} Assessment</h4>
                <p className={`text-gray-500 ${fontSizeClass}`}>ID: {certificateId}</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold tracking-widest uppercase mb-3" style={{ color: settings.theme.primaryColor }}>
                <Star className="w-4 h-4 inline mr-2" />Expertise
              </h2>
              <div className="space-y-1 pl-4">
                {profile.selectedDomains?.map((d, idx) => (
                  <div key={idx} className={`flex items-center gap-2 ${fontSizeClass}`}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: goldAccent }}></div>
                    <span className="text-gray-700">{d}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right */}
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold tracking-widest uppercase mb-3" style={{ color: settings.theme.primaryColor }}>
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {skillsArray.map((skill, idx) => (
                  <span key={idx} className={`px-3 py-1 rounded-full border ${fontSizeClass}`}
                    style={{ borderColor: goldAccent, color: settings.theme.primaryColor }}>
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold tracking-widest uppercase mb-3" style={{ color: settings.theme.primaryColor }}>
                Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {interestsArray.map((interest, idx) => (
                  <span key={idx} className={`px-3 py-1 rounded-full ${fontSizeClass}`}
                    style={{ backgroundColor: `${settings.theme.accentColor}`, color: settings.theme.primaryColor }}>
                    {interest}
                  </span>
                ))}
              </div>
            </section>

            {profile.projects && (
              <section>
                <h2 className="text-lg font-semibold tracking-widest uppercase mb-3" style={{ color: settings.theme.primaryColor }}>
                  <Briefcase className="w-4 h-4 inline mr-2" />Projects
                </h2>
                <p className={`whitespace-pre-wrap text-gray-700 ${fontSizeClass}`}>{profile.projects}</p>
              </section>
            )}
          </div>
        </div>
      </div>

      <div className="h-1 mt-4" style={{ background: `linear-gradient(90deg, transparent, ${goldAccent}, transparent)` }}></div>
    </div>
  );
};

export default ResumeTemplateElegant;
