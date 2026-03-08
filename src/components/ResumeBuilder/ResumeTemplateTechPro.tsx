import { Linkedin, Github, GraduationCap, Briefcase, Code, Terminal, Award } from "lucide-react";
import { ProfileData, ResumeSettings } from "./types";

interface Props {
  profile: ProfileData;
  domain: string;
  certificateId: string;
  settings: ResumeSettings;
}

const ResumeTemplateTechPro = ({ profile, domain, certificateId, settings }: Props) => {
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const skillsArray = profile.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const interestsArray = profile.interests?.split(',').map(s => s.trim()).filter(Boolean) || [];

  const fontSizeClass = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }[settings.fontSize];

  return (
    <div className="bg-[#0d1117] text-gray-300 min-h-[900px]" style={{ fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace" }}>
      {/* Terminal-style header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="ml-3 text-gray-500 text-xs">resume.tsx — {fullName}</span>
        </div>
        
        <div className="flex items-center gap-6">
          {settings.showPhoto && profile.avatar && (
            <img src={profile.avatar} alt={fullName}
              className="w-20 h-20 rounded-lg object-cover border-2" style={{ borderColor: settings.theme.secondaryColor }} />
          )}
          <div>
            <h1 className="text-3xl font-bold" style={{ color: settings.theme.secondaryColor }}>
              {'{'} {fullName} {'}'}
            </h1>
            <p className="text-gray-400 mt-1">
              <span style={{ color: '#ff7b72' }}>const</span> role = <span style={{ color: '#a5d6ff' }}>"{domain} Developer"</span>;
            </p>
            <div className={`flex gap-4 mt-2 ${fontSizeClass}`}>
              {profile.linkedin && (
                <a href={profile.linkedin} className="hover:underline" style={{ color: settings.theme.secondaryColor }}>
                  <Linkedin className="w-3 h-3 inline mr-1" />LinkedIn
                </a>
              )}
              {profile.github && (
                <a href={profile.github} className="hover:underline" style={{ color: settings.theme.secondaryColor }}>
                  <Github className="w-3 h-3 inline mr-1" />GitHub
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* About */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold mb-2" style={{ color: settings.theme.secondaryColor }}>
            <Terminal className="w-4 h-4" /> // about.me
          </h2>
          <p className={`text-gray-400 leading-relaxed ${fontSizeClass}`}>
            <span className="text-gray-500">/**</span><br />
            &nbsp;* {profile.course} @ {profile.college} (Year {profile.year})<br />
            &nbsp;* {profile.internshipType} · {profile.availability}<br />
            &nbsp;* Passionate about {interestsArray.slice(0, 2).join(' & ') || 'building great software'}<br />
            <span className="text-gray-500">&nbsp;*/</span>
          </p>
        </section>

        {/* Skills */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold mb-3" style={{ color: settings.theme.secondaryColor }}>
            <Code className="w-4 h-4" /> // tech.stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {skillsArray.map((skill, idx) => (
              <span key={idx} className={`px-3 py-1 rounded border text-gray-300 ${fontSizeClass}`}
                style={{ borderColor: settings.theme.secondaryColor, backgroundColor: `${settings.theme.secondaryColor}15` }}>
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* Education */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold mb-2" style={{ color: settings.theme.secondaryColor }}>
            <GraduationCap className="w-4 h-4" /> // education
          </h2>
          <div className={`ml-4 pl-4 border-l-2 ${fontSizeClass}`} style={{ borderColor: settings.theme.secondaryColor }}>
            <p className="font-bold text-gray-200">{profile.course}</p>
            <p className="text-gray-400">{profile.college} · Year {profile.year}</p>
          </div>
        </section>

        {/* Certification */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold mb-2" style={{ color: settings.theme.secondaryColor }}>
            <Award className="w-4 h-4" /> // certifications
          </h2>
          <div className={`ml-4 p-3 rounded border ${fontSizeClass}`} style={{ borderColor: `${settings.theme.secondaryColor}40`, backgroundColor: `${settings.theme.secondaryColor}08` }}>
            <p className="text-gray-200 font-bold">{domain} Coding Assessment <span className="text-green-400">✓ PASSED</span></p>
            <p className="text-gray-500">ID: {certificateId}</p>
          </div>
        </section>

        {/* Domains */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold mb-2" style={{ color: settings.theme.secondaryColor }}>
            <Briefcase className="w-4 h-4" /> // domains
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.selectedDomains?.map((d, idx) => (
              <span key={idx} className={`px-2 py-1 rounded text-gray-300 ${fontSizeClass}`}
                style={{ backgroundColor: `${settings.theme.primaryColor}80` }}>
                📁 {d}
              </span>
            ))}
          </div>
        </section>

        {/* Projects */}
        {profile.projects && (
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold mb-2" style={{ color: settings.theme.secondaryColor }}>
              <Briefcase className="w-4 h-4" /> // projects
            </h2>
            <div className={`p-4 rounded bg-[#161b22] border border-gray-700 ${fontSizeClass}`}>
              <pre className="whitespace-pre-wrap text-gray-400">{profile.projects}</pre>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ResumeTemplateTechPro;
