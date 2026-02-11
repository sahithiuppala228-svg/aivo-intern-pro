import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, Sparkles, Target, Award, Users, BarChart3 } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const navigate = useNavigate();
  const features = [
    {
      icon: <CheckCircle className="w-8 h-8 text-primary" />,
      title: "Smart Assessments",
      description: "Verify your skills with AI-powered MCQ and practical tests designed for your domain."
    },
    {
      icon: <Sparkles className="w-8 h-8 text-secondary" />,
      title: "AI Mentor Support",
      description: "Get personalized learning support and instant feedback from your always-available AI mentor."
    },
    {
      icon: <Target className="w-8 h-8 text-primary" />,
      title: "Perfect Matches",
      description: "Receive top 3 internship recommendations tailored to your verified skills and interests."
    }
  ];

  const steps = [
    { number: "01", title: "Create Profile", description: "Set up your profile with domains of interest and professional links" },
    { number: "02", title: "Complete Assessment", description: "Take MCQ and practical tests to verify your skills" },
    { number: "03", title: "Learn & Improve", description: "Use AI-generated lessons to master any topics you missed" },
    { number: "04", title: "Get Matched", description: "Receive personalized internship recommendations with auto-generated resume" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-hero" />
            <span className="text-xl font-bold text-foreground">AI Internship Provider</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/auth">Login</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10 pointer-events-none" />
        <div className="container relative z-10 mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm font-medium">
              <Sparkles className="w-4 h-4 text-primary" />
              AI-Powered Learning & Matching
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Learn → Verify → <span className="bg-gradient-hero bg-clip-text text-transparent">Intern</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Transform your journey from student to professional with AI-powered skill verification, personalized learning, and smart internship matching.
            </p>
            <Button variant="hero" size="lg" asChild className="btn-shine">
              <Link to="/auth">
                Start Your Journey <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">5,000+ Students</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-secondary" />
                <span className="text-sm text-muted-foreground">2,000+ Placements</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-hero opacity-20 blur-3xl rounded-full pointer-events-none" />
            <img 
              src={heroImage} 
              alt="Students learning with AI technology" 
              className="relative rounded-2xl shadow-hover w-full hover:shadow-glow transition-shadow duration-300"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the future of internship preparation with our AI-powered platform
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="group animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="bg-card rounded-xl p-8 shadow-soft hover:shadow-hover transition-all duration-300 border border-border h-full card-hover group-hover:border-primary/30">
                  <div className="mb-4 icon-hover inline-block">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Four simple steps to your dream internship</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative animate-slide-up" style={{ animationDelay: `${idx * 0.15}s` }}>
                <div className="bg-card rounded-xl p-6 shadow-soft border border-border h-full card-hover hover:border-primary/30 group">
                  <div className="text-4xl font-bold text-primary mb-4 opacity-30 group-hover:opacity-50 transition-opacity">{step.number}</div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-hero" />
              <span className="font-semibold">AI Internship Provider</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 AI Internship Provider. Empowering students globally.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
