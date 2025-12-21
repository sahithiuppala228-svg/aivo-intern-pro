export interface ProfileData {
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
  avatar?: string;
}

export interface ResumeTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerBg: string;
  fontFamily: string;
}

export interface ResumeSettings {
  theme: ResumeTheme;
  showPhoto: boolean;
  fontSize: 'small' | 'medium' | 'large';
  layout: 'modern' | 'classic' | 'minimal' | 'creative';
}

export const resumeThemes: ResumeTheme[] = [
  {
    id: 'royal-blue',
    name: 'Royal Blue',
    primaryColor: '#1e3a8a',
    secondaryColor: '#3b82f6',
    accentColor: '#dbeafe',
    headerBg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    fontFamily: 'Georgia, serif'
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    primaryColor: '#065f46',
    secondaryColor: '#10b981',
    accentColor: '#d1fae5',
    headerBg: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    fontFamily: 'Garamond, serif'
  },
  {
    id: 'purple-gold',
    name: 'Purple & Gold',
    primaryColor: '#581c87',
    secondaryColor: '#a855f7',
    accentColor: '#fef3c7',
    headerBg: 'linear-gradient(135deg, #581c87 0%, #a855f7 100%)',
    fontFamily: 'Palatino, serif'
  },
  {
    id: 'slate',
    name: 'Professional Slate',
    primaryColor: '#1e293b',
    secondaryColor: '#64748b',
    accentColor: '#f1f5f9',
    headerBg: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
    fontFamily: 'Arial, sans-serif'
  },
  {
    id: 'coral',
    name: 'Warm Coral',
    primaryColor: '#9a3412',
    secondaryColor: '#f97316',
    accentColor: '#ffedd5',
    headerBg: 'linear-gradient(135deg, #9a3412 0%, #f97316 100%)',
    fontFamily: 'Trebuchet MS, sans-serif'
  },
  {
    id: 'teal',
    name: 'Ocean Teal',
    primaryColor: '#115e59',
    secondaryColor: '#14b8a6',
    accentColor: '#ccfbf1',
    headerBg: 'linear-gradient(135deg, #115e59 0%, #14b8a6 100%)',
    fontFamily: 'Verdana, sans-serif'
  }
];

export const defaultSettings: ResumeSettings = {
  theme: resumeThemes[0],
  showPhoto: true,
  fontSize: 'medium',
  layout: 'modern'
};
