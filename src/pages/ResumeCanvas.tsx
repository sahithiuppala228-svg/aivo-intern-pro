import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Sparkles, GripVertical, Palette, LayoutGrid, Type, Image, Upload, X, RefreshCw, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProfileData, ResumeSettings, ResumeTheme, resumeThemes, defaultSettings } from "@/components/ResumeBuilder/types";
import ResumeTemplateModern from "@/components/ResumeBuilder/ResumeTemplateModern";
import ResumeTemplateClassic from "@/components/ResumeBuilder/ResumeTemplateClassic";
import ResumeTemplateMinimal from "@/components/ResumeBuilder/ResumeTemplateMinimal";
import ResumeTemplateCreative from "@/components/ResumeBuilder/ResumeTemplateCreative";
import ResumeTemplateExecutive from "@/components/ResumeBuilder/ResumeTemplateExecutive";
import ResumeTemplateAcademic from "@/components/ResumeBuilder/ResumeTemplateAcademic";
import ResumeTemplateTechPro from "@/components/ResumeBuilder/ResumeTemplateTechPro";
import ResumeTemplateElegant from "@/components/ResumeBuilder/ResumeTemplateElegant";

type SectionKey = 'summary' | 'education' | 'skills' | 'projects' | 'interests' | 'certification';

interface Section {
  key: SectionKey;
  label: string;
  visible: boolean;
}

const DEFAULT_SECTIONS: Section[] = [
  { key: 'summary', label: 'Professional Summary', visible: true },
  { key: 'education', label: 'Education', visible: true },
  { key: 'skills', label: 'Skills', visible: true },
  { key: 'projects', label: 'Projects & Experience', visible: true },
  { key: 'interests', label: 'Interests', visible: true },
  { key: 'certification', label: 'Certification', visible: true },
];

const ALL_LAYOUTS = ['modern', 'classic', 'minimal', 'creative', 'executive', 'academic', 'techpro', 'elegant'] as const;
type LayoutType = typeof ALL_LAYOUTS[number];

const ResumeCanvas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [settings, setSettings] = useState<ResumeSettings>({ ...defaultSettings, layout: 'modern' as any });
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [enhancingSection, setEnhancingSection] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const domain = "Web Development";
  const certificateId = `INTR-2025-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

  useEffect(() => {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      setProfile(JSON.parse(profileData));
    } else {
      setProfile({
        firstName: 'John', lastName: 'Doe', college: 'MIT', course: 'B.Tech Computer Science',
        year: '3', selectedDomains: ['Web Development', 'AI/ML'], internshipType: 'Remote',
        availability: 'Full-time', linkedin: '', github: '', skills: 'JavaScript, React, Python, Node.js',
        interests: 'AI, Web Development, Open Source', projects: ''
      });
    }
  }, []);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
  };

  const toggleSection = (index: number) => {
    const newSections = [...sections];
    newSections[index].visible = !newSections[index].visible;
    setSections(newSections);
  };

  const handleAIEnhance = async (field: string) => {
    if (!profile) return;
    setEnhancingSection(field);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-resume-section', {
        body: { section: field, content: (profile as any)[field] || '', domain, profile }
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      if (data?.enhanced) {
        setProfile(prev => prev ? { ...prev, [field]: data.enhanced } : prev);
        toast({ title: "AI Enhanced!", description: `${field} section has been improved.` });
      }
    } catch (e) {
      console.error('AI enhance error:', e);
      // Fallback enhancement
      const fallbacks: Record<string, string> = {
        skills: `${profile.skills || 'JavaScript, React'}, Problem Solving, Team Collaboration, Agile Development`,
        projects: `• Built a full-stack ${domain} application with modern architecture\n• Implemented CI/CD pipeline and automated testing\n• Collaborated with cross-functional teams on production-grade solutions`,
        interests: `${profile.interests || 'Technology'}, Open Source Contribution, System Design, Innovation`
      };
      if (fallbacks[field]) {
        setProfile(prev => prev ? { ...prev, [field]: fallbacks[field] } : prev);
        toast({ title: "Enhanced!", description: "Added suggested content." });
      }
    } finally {
      setEnhancingSection(null);
    }
  };

  const updateProfile = (field: string, value: string) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCustomPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleThemeChange = (themeId: string) => {
    const theme = resumeThemes.find(t => t.id === themeId) || resumeThemes[0];
    setSettings(prev => ({ ...prev, theme }));
  };

  if (!profile) return null;

  const profileWithPhoto = { ...profile, avatar: customPhoto || profile.avatar };

  const renderTemplate = () => {
    const props = { profile: profileWithPhoto, domain, certificateId, settings };
    const layout = (settings.layout as LayoutType);
    switch (layout) {
      case 'classic': return <ResumeTemplateClassic {...props} />;
      case 'minimal': return <ResumeTemplateMinimal {...props} />;
      case 'creative': return <ResumeTemplateCreative {...props} />;
      case 'executive': return <ResumeTemplateExecutive {...props} />;
      case 'academic': return <ResumeTemplateAcademic {...props} />;
      case 'techpro': return <ResumeTemplateTechPro {...props} />;
      case 'elegant': return <ResumeTemplateElegant {...props} />;
      default: return <ResumeTemplateModern {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <div className="border-b bg-background px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold">Resume Canvas</h1>
        </div>
        <Button onClick={() => window.print()} className="gap-2">
          <Download className="w-4 h-4" /> Download PDF
        </Button>
      </div>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Left panel - editor */}
        <div className="w-80 border-r bg-background overflow-y-auto p-4 flex-shrink-0">
          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="sections">Order</TabsTrigger>
            </TabsList>

            {/* Edit Tab */}
            <TabsContent value="edit" className="space-y-4">
              <div>
                <Label className="text-xs font-medium">First Name</Label>
                <Input value={profile.firstName} onChange={e => updateProfile('firstName', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">Last Name</Label>
                <Input value={profile.lastName} onChange={e => updateProfile('lastName', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">College</Label>
                <Input value={profile.college} onChange={e => updateProfile('college', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">Course</Label>
                <Input value={profile.course} onChange={e => updateProfile('course', e.target.value)} className="mt-1" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Skills</Label>
                <Button variant="ghost" size="sm" onClick={() => handleAIEnhance('skills')} disabled={enhancingSection === 'skills'}>
                  {enhancingSection === 'skills' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                </Button>
              </div>
              <Textarea value={profile.skills} onChange={e => updateProfile('skills', e.target.value)} rows={3} className="text-sm" />

              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Projects</Label>
                <Button variant="ghost" size="sm" onClick={() => handleAIEnhance('projects')} disabled={enhancingSection === 'projects'}>
                  {enhancingSection === 'projects' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                </Button>
              </div>
              <Textarea value={profile.projects} onChange={e => updateProfile('projects', e.target.value)} rows={4} className="text-sm" />

              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Interests</Label>
                <Button variant="ghost" size="sm" onClick={() => handleAIEnhance('interests')} disabled={enhancingSection === 'interests'}>
                  {enhancingSection === 'interests' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                </Button>
              </div>
              <Textarea value={profile.interests} onChange={e => updateProfile('interests', e.target.value)} rows={2} className="text-sm" />

              {/* Photo */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-medium">Show Photo</Label>
                  <Switch checked={settings.showPhoto} onCheckedChange={checked => setSettings(p => ({ ...p, showPhoto: checked }))} />
                </div>
                {settings.showPhoto && (
                  <div>
                    <Label htmlFor="canvas-photo" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg hover:bg-muted text-sm">
                        <Upload className="w-4 h-4" /> Upload Photo
                      </div>
                    </Label>
                    <input id="canvas-photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    {customPhoto && (
                      <div className="relative inline-block mt-2">
                        <img src={customPhoto} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                        <button onClick={() => setCustomPhoto(null)} className="absolute -top-1 -right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Style Tab */}
            <TabsContent value="style" className="space-y-4">
              <div>
                <Label className="text-xs font-medium mb-2 block">Template</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_LAYOUTS.map(layout => (
                    <button key={layout} onClick={() => setSettings(p => ({ ...p, layout: layout as any }))}
                      className={`p-2 rounded-lg border-2 transition-all capitalize text-xs ${
                        settings.layout === layout ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      }`}>
                      {layout}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium mb-2 block">Color Theme</Label>
                <div className="grid grid-cols-2 gap-2">
                  {resumeThemes.map(theme => (
                    <button key={theme.id} onClick={() => handleThemeChange(theme.id)}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        settings.theme.id === theme.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                      }`}>
                      <div className="w-full h-4 rounded mb-1" style={{ background: theme.headerBg }}></div>
                      <span className="text-xs">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium mb-2 block">Font Size</Label>
                <Select value={settings.fontSize} onValueChange={(v: any) => setSettings(p => ({ ...p, fontSize: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Sections Tab */}
            <TabsContent value="sections" className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">Reorder and toggle sections</p>
              {sections.map((section, idx) => (
                <div key={section.key} className="flex items-center gap-2 p-2 rounded-lg border bg-background">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">{section.label}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveSection(idx, 'up')} disabled={idx === 0}>
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveSection(idx, 'down')} disabled={idx === sections.length - 1}>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </div>
                  <Switch checked={section.visible} onCheckedChange={() => toggleSection(idx)} />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel - preview */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6 print:p-0 print:bg-white">
          <div className="max-w-4xl mx-auto shadow-2xl print:shadow-none" id="resume-canvas-preview">
            {renderTemplate()}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #resume-canvas-preview, #resume-canvas-preview * { visibility: visible; }
          #resume-canvas-preview { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default ResumeCanvas;
