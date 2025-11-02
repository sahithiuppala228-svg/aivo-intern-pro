import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/profile-setup');
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "Login successful. Redirecting to your profile...",
      });
      navigate("/profile-setup");
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Welcome aboard! You can now log in.",
      });
      navigate("/profile-setup");
    }
  };

  const handleOAuthLogin = (provider: string) => {
    toast({
      title: `${provider} sign-in`,
      description: `Redirecting to ${provider}... (demo)`,
    });
    navigate("/profile-setup");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-hero" />
              <h1 className="text-3xl font-bold">AI Internship Provider</h1>
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              Learn → Verify → Intern
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Join thousands of students transforming their careers with AI-powered skill verification and personalized internship matching.
            </p>
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-success" />
                </div>
                <span>Smart skill assessments</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-success" />
                </div>
                <span>24/7 AI mentor support</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-success" />
                </div>
                <span>Personalized internship matches</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <Card className="shadow-hover border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" />
                      <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                        Remember me
                      </label>
                    </div>
                    <Button variant="link" className="px-0 text-sm">
                      Forgot password?
                    </Button>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleOAuthLogin("Google")}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleOAuthLogin("LinkedIn")}
                  >
                    LinkedIn
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Min. 8 characters"
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="Confirm password"
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="terms" required />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                      I accept the{" "}
                      <Button variant="link" className="px-0 h-auto text-sm">
                        Terms & Privacy Policy
                      </Button>
                    </label>
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleOAuthLogin("Google")}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleOAuthLogin("LinkedIn")}
                  >
                    LinkedIn
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <p className="text-xs text-center text-muted-foreground mt-6">
              Need a demo account?{" "}
              <Button variant="link" className="px-0 h-auto text-xs">
                Contact support
              </Button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
