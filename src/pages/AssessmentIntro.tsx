import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, FileText, Code, AlertCircle, ArrowLeft } from "lucide-react";
import assessmentIcon from "@/assets/assessment-icon.jpg";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AssessmentIntro = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const domain = location.state?.domain || "Web Development";
  
  const [showWhyTest, setShowWhyTest] = useState(false);

  const assessmentFlow = [
    {
      icon: <FileText className="w-6 h-6 text-primary" />,
      title: "MCQ Test",
      description: "50 multiple choice questions (Easy, Medium, Hard)",
      duration: "1 hour 30 minutes",
      passingScore: "60%"
    },
    {
      icon: <Code className="w-6 h-6 text-secondary" />,
      title: "Practical Task",
      description: "8 real-world coding problems",
      duration: "30 minutes per problem",
      passingScore: "60%"
    }
  ];

  const requirements = [
    "Stable internet connection",
    "Quiet environment",
    "Microphone & camera (for future mock interview)",
    "Screen sharing enabled"
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-6">
      <div className="container mx-auto max-w-4xl space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img src={assessmentIcon} alt="Assessment" className="w-24 h-24 rounded-2xl shadow-soft" />
          </div>
          <h1 className="text-4xl font-bold">Ready for Your Assessment?</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete our two-part assessment to verify your skills and unlock personalized learning
          </p>
        </div>

        {/* Assessment Flow */}
        <div className="grid md:grid-cols-2 gap-6">
          {assessmentFlow.map((step, idx) => (
            <Card 
              key={idx} 
              className={`shadow-soft border-2 hover:shadow-hover transition-all ${
                idx === 0 
                  ? 'bg-primary/5 border-primary/30 hover:border-primary' 
                  : 'bg-secondary/5 border-secondary/30 hover:border-secondary'
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${idx === 0 ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                      {step.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                      <CardDescription className="mt-1">{step.description}</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      idx === 0 
                        ? 'border-primary text-primary bg-primary/10' 
                        : 'border-secondary text-secondary bg-secondary/10'
                    }`}
                  >
                    Step {idx + 1}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Duration: <span className="font-medium text-foreground">{step.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4" />
                  Passing Score: <span className="font-medium text-foreground">{step.passingScore}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Requirements */}
        <Card className="shadow-soft bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Before You Start
            </CardTitle>
            <CardDescription>Make sure you have these ready</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3 h-3 text-success" />
                  </div>
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="shadow-soft border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Important Notes:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>You must score <strong className="text-foreground">≥60%</strong> to pass each section</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>If you don't pass, we'll provide personalized AI lessons to help you improve</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>You can retake the assessment up to 3 times after completing lessons</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Your AI mentor is available anytime during the assessment</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Why Test Section */}
        <Card className="shadow-soft hover:shadow-hover transition-all cursor-pointer" onClick={() => setShowWhyTest(!showWhyTest)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Why do we test?</h3>
                <p className="text-sm text-muted-foreground">
                  Learn about our assessment methodology and how it benefits you
                </p>
              </div>
              <Button variant="ghost">
                {showWhyTest ? "Hide" : "Learn More"} →
              </Button>
            </div>
          </CardContent>
        </Card>

        {showWhyTest && (
          <Card className="shadow-soft border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle>Why We Test: Building Your Technical Foundation</CardTitle>
              <CardDescription>Understanding our comprehensive assessment approach</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">1. Objective Skill Verification</h4>
                <p className="text-muted-foreground">Our AI-powered assessments provide unbiased evaluation of your technical knowledge and practical abilities, ensuring fair opportunities for all candidates regardless of background.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">2. Identifying Knowledge Gaps</h4>
                <p className="text-muted-foreground">The tests help pinpoint specific areas where you need improvement, allowing our AI mentor to create personalized learning paths tailored to your exact needs.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">3. Industry-Relevant Problem Solving</h4>
                <p className="text-muted-foreground">Practical coding challenges mirror real-world scenarios you'll encounter in internships, preparing you for actual work environments and technical interviews.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">4. Building Confidence Through Preparation</h4>
                <p className="text-muted-foreground">By testing under time constraints and realistic conditions, you develop the confidence and composure needed for technical interviews and workplace challenges.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">5. Accurate Internship Matching</h4>
                <p className="text-muted-foreground">Verified skills enable us to recommend internships that truly match your capabilities, increasing your chances of success and job satisfaction.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">6. Demonstrating Growth Mindset</h4>
                <p className="text-muted-foreground">Completing assessments shows employers your commitment to continuous learning and willingness to be evaluated objectively on technical merit.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">7. Structured Learning Path</h4>
                <p className="text-muted-foreground">Test results inform our AI mentor's lesson plans, ensuring you focus on high-impact topics rather than wasting time on concepts you've already mastered.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">8. Performance Benchmarking</h4>
                <p className="text-muted-foreground">Compare your performance against industry standards and peer groups, understanding where you stand in the competitive internship landscape.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">9. Time Management Skills</h4>
                <p className="text-muted-foreground">Timed assessments teach crucial time management—deciding when to move on, how to prioritize problems, and working efficiently under pressure.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">10. Portfolio Enhancement</h4>
                <p className="text-muted-foreground">Successfully passing assessments becomes a verified credential on your profile, distinguishing you from candidates without proven technical abilities.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="min-w-[200px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate("/mcq-test", { state: { domain } })}
          >
            <FileText className="w-4 h-4 mr-2" />
            Step 1: MCQ Test
          </Button>
          <Button 
            size="lg" 
            className="min-w-[200px] bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate("/practice-mode", { state: { domain } })}
          >
            <Code className="w-4 h-4 mr-2" />
            Step 2: Practice Mode
          </Button>
        </div>

        <p className="text-sm text-center text-muted-foreground">
          Need help? Your AI mentor is just a click away!
        </p>
      </div>
    </div>
  );
};

export default AssessmentIntro;
