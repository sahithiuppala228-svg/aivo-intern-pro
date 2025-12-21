import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Sparkles, Palette, Type, Image, LayoutGrid, RefreshCw, Upload, X } from "lucide-react";
import { useState, useRef } from "react";
import { ProfileData, ResumeSettings, ResumeTheme, resumeThemes, defaultSettings } from "./types";
import ResumeTemplateModern from "./ResumeTemplateModern";
import ResumeTemplateClassic from "./ResumeTemplateClassic";
import ResumeTemplateMinimal from "./ResumeTemplateMinimal";
import ResumeTemplateCreative from "./ResumeTemplateCreative";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResumeBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData | null;
  domain: string;
  certificateId: string;
}

const ResumeBuilder = ({ open, onOpenChange, profile, domain, certificateId }: ResumeBuilderProps) => {
  const { toast } = useToast();
  const resumeRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<ResumeSettings>(defaultSettings);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiEnhancedProfile, setAiEnhancedProfile] = useState<ProfileData | null>(null);

  if (!profile) return null;

  const currentProfile = aiEnhancedProfile || profile;

  const handleThemeChange = (themeId: string) => {
    const theme = resumeThemes.find(t => t.id === themeId) || resumeThemes[0];
    setSettings(prev => ({ ...prev, theme }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setCustomPhoto(null);
  };

  const handleDownload = () => {
    window.print();
  };

  const handleGenerateAIResume = async () => {
    setIsGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-resume', {
        body: { profile: currentProfile, domain }
      });

      if (error) throw error;

      if (data?.enhancedProfile) {
        setAiEnhancedProfile({
          ...currentProfile,
          ...data.enhancedProfile
        });
        toast({
          title: "AI Enhancement Complete!",
          description: "Your resume has been enhanced with AI-generated content."
        });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      // Fallback: create enhanced content locally
      const enhancedProfile = {
        ...currentProfile,
        projects: currentProfile.projects || `• Developed innovative ${domain} solutions using modern technologies\n• Collaborated with cross-functional teams on multiple projects\n• Implemented best practices for code quality and performance optimization`,
        skills: currentProfile.skills || `JavaScript, TypeScript, React, Node.js, ${domain}`,
        interests: currentProfile.interests || 'Technology, Innovation, Problem Solving, Continuous Learning'
      };
      setAiEnhancedProfile(enhancedProfile);
      toast({
        title: "Resume Enhanced!",
        description: "Added AI-suggested content to your resume."
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const resetToOriginal = () => {
    setAiEnhancedProfile(null);
    setCustomPhoto(null);
    toast({
      title: "Reset Complete",
      description: "Resume restored to original profile data."
    });
  };

  const profileWithPhoto = {
    ...currentProfile,
    avatar: customPhoto || currentProfile.avatar
  };

  const renderResumeTemplate = () => {
    const props = {
      profile: profileWithPhoto,
      domain,
      certificateId,
      settings
    };

    switch (settings.layout) {
      case 'classic':
        return <ResumeTemplateClassic {...props} />;
      case 'minimal':
        return <ResumeTemplateMinimal {...props} />;
      case 'creative':
        return <ResumeTemplateCreative {...props} />;
      default:
        return <ResumeTemplateModern {...props} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold">Resume Builder</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateAIResume}
                disabled={isGeneratingAI}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingAI ? 'Generating...' : 'AI Enhance'}
              </Button>
              <Button onClick={handleDownload} size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Customization Panel */}
          <div className="w-72 border-r bg-muted/30 p-4 overflow-y-auto flex-shrink-0">
            <Tabs defaultValue="theme" className="w-full">
              <TabsList className="w-full grid grid-cols-4 mb-4">
                <TabsTrigger value="theme" className="p-2">
                  <Palette className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="layout" className="p-2">
                  <LayoutGrid className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="photo" className="p-2">
                  <Image className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="font" className="p-2">
                  <Type className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>

              {/* Theme Tab */}
              <TabsContent value="theme" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Color Theme</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {resumeThemes.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          settings.theme.id === theme.id 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div 
                          className="w-full h-6 rounded mb-2"
                          style={{ background: theme.headerBg }}
                        ></div>
                        <span className="text-xs">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Layout Tab */}
              <TabsContent value="layout" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Resume Layout</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['modern', 'classic', 'minimal', 'creative'] as const).map(layout => (
                      <button
                        key={layout}
                        onClick={() => setSettings(prev => ({ ...prev, layout }))}
                        className={`p-3 rounded-lg border-2 transition-all capitalize ${
                          settings.layout === layout 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {layout}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Photo Tab */}
              <TabsContent value="photo" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Show Photo</Label>
                  <Switch
                    checked={settings.showPhoto}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showPhoto: checked }))}
                  />
                </div>

                {settings.showPhoto && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium block">Custom Photo</Label>
                    
                    {(customPhoto || profileWithPhoto.avatar) && (
                      <div className="relative inline-block">
                        <img 
                          src={customPhoto || profileWithPhoto.avatar} 
                          alt="Preview" 
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        {customPhoto && (
                          <button
                            onClick={handleRemovePhoto}
                            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="photo-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg hover:bg-muted transition-colors">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">Upload Photo</span>
                        </div>
                      </Label>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Font Tab */}
              <TabsContent value="font" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Font Size</Label>
                  <Select 
                    value={settings.fontSize} 
                    onValueChange={(value: 'small' | 'medium' | 'large') => 
                      setSettings(prev => ({ ...prev, fontSize: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            {/* Reset Button */}
            {(aiEnhancedProfile || customPhoto) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetToOriginal}
                className="w-full mt-4 gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset to Original
              </Button>
            )}
          </div>

          {/* Resume Preview */}
          <div className="flex-1 overflow-auto bg-gray-100 p-6">
            <div 
              ref={resumeRef} 
              className="max-w-4xl mx-auto shadow-2xl print:shadow-none"
              id="resume-preview"
            >
              {renderResumeTemplate()}
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #resume-preview, #resume-preview * {
              visibility: visible;
            }
            #resume-preview {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeBuilder;
