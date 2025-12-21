import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Upload, Plus, Sparkles, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import aiMentorIcon from "@/assets/ai-mentor-icon.jpg";
import { useNavigate } from "react-router-dom";


const ProfileSetup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState("");
  
  // Form field states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [internshipType, setInternshipType] = useState("");
  const [availability, setAvailability] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [projects, setProjects] = useState("");
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [customDomains, setCustomDomains] = useState<string[]>([]);

  const availableDomains = [
    "Web Development",
    "Data Science",
    "Machine Learning",
    "Mobile Development",
    "UI/UX Design",
    "DevOps",
    "Cloud Computing",
    "Cybersecurity",
    "Blockchain",
    "Game Development"
  ];

  const handleDomainToggle = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(selectedDomains.filter(d => d !== domain));
    } else {
      setSelectedDomains([...selectedDomains, domain]);
    }
  };

  const handleAddCustomDomain = () => {
    if (!customDomainInput.trim()) {
      toast({
        variant: "destructive",
        title: "Enter domain name",
        description: "Please enter a custom domain name.",
      });
      return;
    }
    
    const newDomain = customDomainInput.trim();
    if (customDomains.includes(newDomain) || availableDomains.includes(newDomain)) {
      toast({
        variant: "destructive",
        title: "Domain already exists",
        description: "This domain is already in the list.",
      });
      return;
    }
    
    setCustomDomains([...customDomains, newDomain]);
    setSelectedDomains([...selectedDomains, newDomain]);
    setCustomDomainInput("");
    
    toast({
      title: "Domain added",
      description: `"${newDomain}" has been added to your domains.`,
    });
  };

  const handleRemoveCustomDomain = (domain: string) => {
    setCustomDomains(customDomains.filter(d => d !== domain));
    setSelectedDomains(selectedDomains.filter(d => d !== domain));
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!firstName.trim()) {
      toast({
        variant: "destructive",
        title: "First name required",
        description: "Please enter your first name.",
      });
      return;
    }
    if (!lastName.trim()) {
      toast({
        variant: "destructive",
        title: "Last name required",
        description: "Please enter your last name.",
      });
      return;
    }
    if (!college.trim()) {
      toast({
        variant: "destructive",
        title: "College required",
        description: "Please enter your college or institution.",
      });
      return;
    }
    if (!course.trim()) {
      toast({
        variant: "destructive",
        title: "Course required",
        description: "Please enter your course.",
      });
      return;
    }
    if (!year) {
      toast({
        variant: "destructive",
        title: "Year required",
        description: "Please select your current year.",
      });
      return;
    }
    if (selectedDomains.length === 0) {
      toast({
        variant: "destructive",
        title: "Select at least one domain",
        description: "Please select at least one domain you want to intern in.",
      });
      return;
    }
    if (!internshipType) {
      toast({
        variant: "destructive",
        title: "Internship type required",
        description: "Please select your preferred internship type.",
      });
      return;
    }
    if (!availability) {
      toast({
        variant: "destructive",
        title: "Availability required",
        description: "Please select your availability.",
      });
      return;
    }
    if (!linkedin.trim()) {
      toast({
        variant: "destructive",
        title: "LinkedIn required",
        description: "Please enter your LinkedIn profile URL.",
      });
      return;
    }
    if (!github.trim()) {
      toast({
        variant: "destructive",
        title: "GitHub required",
        description: "Please enter your GitHub profile URL.",
      });
      return;
    }

    // Save profile to localStorage for use in mock interview
    const profileData = {
      firstName,
      lastName,
      college,
      course,
      year,
      selectedDomains,
      internshipType,
      availability,
      linkedin,
      github,
      skills,
      interests,
      projects,
      avatar: avatarPreview,
    };
    localStorage.setItem('userProfile', JSON.stringify(profileData));

    toast({
      title: "Profile saved!",
      description: "Let's begin your assessment journey.",
    });
    // Pass the first selected domain to the assessment
    navigate("/assessment-intro", { state: { domain: selectedDomains[0], allDomains: selectedDomains } });
  };

  return (
    <>
      <div className="min-h-screen bg-muted/30 py-12 px-6">
        <div className="container mx-auto max-w-4xl space-y-8">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center flex-1 space-y-3">
              <h1 className="text-4xl font-bold">Complete Your Profile</h1>
              <p className="text-xl text-muted-foreground">
                Help us understand your goals and interests
              </p>
            </div>
          </div>

        {/* AI Mentor Card */}
        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16 border-2 border-primary/20">
                <AvatarImage src={aiMentorIcon} alt="Aivo" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">Meet Aivo — Your AI Mentor</h3>
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Pro tip:</strong> Link your LinkedIn or GitHub for better internship matches and personalized insights!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24 border-2 border-border">
                  <AvatarImage src={avatarPreview} />
                  <AvatarFallback className="text-2xl">JD</AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Upload Photo</span>
                    </div>
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG up to 5MB</p>
                </div>
              </div>

              {/* Name */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required 
                  />
                </div>
              </div>

              {/* College/Institution */}
              <div className="space-y-2">
                <Label htmlFor="college">College/Institution *</Label>
                <Input 
                  id="college" 
                  placeholder="University of Technology" 
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  required 
                />
              </div>

              {/* Course and Year */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course">Course *</Label>
                  <Input 
                    id="course" 
                    placeholder="Computer Science" 
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger id="year">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Domains of Interest *</CardTitle>
              <CardDescription>Select the areas where you want to intern (select at least one)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Domain Pills */}
              <div className="flex flex-wrap gap-2">
                {availableDomains.map((domain) => (
                  <Badge
                    key={domain}
                    variant={selectedDomains.includes(domain) ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm"
                    onClick={() => handleDomainToggle(domain)}
                  >
                    {domain}
                    {selectedDomains.includes(domain) && (
                      <X className="w-3 h-3 ml-2" />
                    )}
                  </Badge>
                ))}
                {/* Custom domains */}
                {customDomains.map((domain) => (
                  <Badge
                    key={domain}
                    variant={selectedDomains.includes(domain) ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm bg-secondary"
                    onClick={() => handleDomainToggle(domain)}
                  >
                    {domain}
                    <X 
                      className="w-3 h-3 ml-2 hover:text-destructive" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustomDomain(domain);
                      }}
                    />
                  </Badge>
                ))}
              </div>

              {/* Add Custom Domain */}
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium mb-2 block">Add Custom Domain</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Artificial Intelligence, IoT, etc."
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomDomain();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddCustomDomain}
                    className="px-4"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Can't find your domain? Add a custom one above.
                </p>
              </div>

            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Internship Preferences</CardTitle>
              <CardDescription>Help us find the perfect match</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="internshipType">Internship Type *</Label>
                  <Select value={internshipType} onValueChange={setInternshipType}>
                    <SelectTrigger id="internshipType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid Only</SelectItem>
                      <SelectItem value="free">Unpaid</SelectItem>
                      <SelectItem value="either">Either</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability *</Label>
                  <Select value={availability} onValueChange={setAvailability}>
                    <SelectTrigger id="availability">
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fulltime">Full-time</SelectItem>
                      <SelectItem value="parttime">Part-time</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Professional Links *</CardTitle>
              <CardDescription>Connect your profiles for better matches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL *</Label>
                <Input
                  id="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub URL *</Label>
                <Input
                  id="github"
                  type="url"
                  placeholder="https://github.com/yourusername"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Tell us more about your expertise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input
                  id="skills"
                  placeholder="JavaScript, React, Python, etc."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interests">Interests</Label>
                <Input
                  id="interests"
                  placeholder="AI, Web Development, Mobile Apps, etc."
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projects">Projects (comma-separated)</Label>
                <Input
                  id="projects"
                  placeholder="E-commerce App, Portfolio Website, etc."
                  value={projects}
                  onChange={(e) => setProjects(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" variant="hero" size="lg" className="px-12">
              Save & Continue
            </Button>
          </div>
        </form>
        </div>
      </div>

    </>
  );
};

export default ProfileSetup;
