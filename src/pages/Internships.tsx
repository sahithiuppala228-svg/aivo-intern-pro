import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Building2, MapPin, Clock, Briefcase, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Internship data based on domain
const internshipsByDomain: Record<string, Array<{
  company: string;
  role: string;
  location: string;
  duration: string;
  type: string;
  logo: string;
  applyLink: string;
  skills: string[];
}>> = {
  "Web Development": [
    { company: "Google", role: "Frontend Developer Intern", location: "Bangalore, India", duration: "6 months", type: "Hybrid", logo: "🅶", applyLink: "https://careers.google.com", skills: ["React", "TypeScript", "CSS"] },
    { company: "Microsoft", role: "Full Stack Developer Intern", location: "Hyderabad, India", duration: "3 months", type: "On-site", logo: "🅼", applyLink: "https://careers.microsoft.com", skills: ["Node.js", "Azure", "React"] },
    { company: "Amazon", role: "Web Developer Intern", location: "Chennai, India", duration: "6 months", type: "Remote", logo: "🅰", applyLink: "https://amazon.jobs", skills: ["JavaScript", "AWS", "HTML/CSS"] },
    { company: "Flipkart", role: "UI Engineer Intern", location: "Bangalore, India", duration: "4 months", type: "Hybrid", logo: "🅵", applyLink: "https://www.flipkartcareers.com", skills: ["React", "Redux", "TypeScript"] },
    { company: "Swiggy", role: "Frontend Developer Intern", location: "Bangalore, India", duration: "3 months", type: "On-site", logo: "🆂", applyLink: "https://careers.swiggy.com", skills: ["Vue.js", "JavaScript", "Tailwind"] },
  ],
  "Data Science": [
    { company: "Google", role: "Data Science Intern", location: "Bangalore, India", duration: "6 months", type: "Hybrid", logo: "🅶", applyLink: "https://careers.google.com", skills: ["Python", "TensorFlow", "SQL"] },
    { company: "Meta", role: "ML Engineer Intern", location: "Remote", duration: "4 months", type: "Remote", logo: "🅼", applyLink: "https://metacareers.com", skills: ["PyTorch", "Python", "NLP"] },
    { company: "Amazon", role: "Data Analyst Intern", location: "Hyderabad, India", duration: "6 months", type: "Hybrid", logo: "🅰", applyLink: "https://amazon.jobs", skills: ["SQL", "Python", "Tableau"] },
    { company: "Myntra", role: "Data Science Intern", location: "Bangalore, India", duration: "3 months", type: "On-site", logo: "🅼", applyLink: "https://www.myntra.com/careers", skills: ["Python", "ML", "Analytics"] },
    { company: "Zomato", role: "Analytics Intern", location: "Gurgaon, India", duration: "4 months", type: "Hybrid", logo: "🆉", applyLink: "https://www.zomato.com/careers", skills: ["Python", "SQL", "Power BI"] },
  ],
  "Mobile Development": [
    { company: "Google", role: "Android Developer Intern", location: "Bangalore, India", duration: "6 months", type: "Hybrid", logo: "🅶", applyLink: "https://careers.google.com", skills: ["Kotlin", "Android SDK", "Firebase"] },
    { company: "Apple", role: "iOS Developer Intern", location: "Hyderabad, India", duration: "4 months", type: "On-site", logo: "🍎", applyLink: "https://jobs.apple.com", skills: ["Swift", "SwiftUI", "Xcode"] },
    { company: "PhonePe", role: "Mobile Developer Intern", location: "Bangalore, India", duration: "6 months", type: "Hybrid", logo: "🅿", applyLink: "https://www.phonepe.com/careers", skills: ["React Native", "Flutter", "Dart"] },
    { company: "Paytm", role: "Android Intern", location: "Noida, India", duration: "3 months", type: "On-site", logo: "🅿", applyLink: "https://paytm.com/careers", skills: ["Kotlin", "Java", "Android"] },
    { company: "CRED", role: "Flutter Developer Intern", location: "Bangalore, India", duration: "4 months", type: "Remote", logo: "🅲", applyLink: "https://careers.cred.club", skills: ["Flutter", "Dart", "Firebase"] },
  ],
  "Machine Learning": [
    { company: "OpenAI", role: "ML Research Intern", location: "Remote", duration: "6 months", type: "Remote", logo: "🅾", applyLink: "https://openai.com/careers", skills: ["Python", "PyTorch", "NLP"] },
    { company: "Google DeepMind", role: "AI Research Intern", location: "Bangalore, India", duration: "6 months", type: "Hybrid", logo: "🅶", applyLink: "https://deepmind.google/careers", skills: ["TensorFlow", "Python", "Research"] },
    { company: "Microsoft Research", role: "ML Intern", location: "Bangalore, India", duration: "4 months", type: "On-site", logo: "🅼", applyLink: "https://www.microsoft.com/en-us/research/careers", skills: ["Python", "Azure ML", "Deep Learning"] },
    { company: "NVIDIA", role: "Deep Learning Intern", location: "Pune, India", duration: "6 months", type: "Hybrid", logo: "🅽", applyLink: "https://nvidia.wd5.myworkdayjobs.com", skills: ["CUDA", "Python", "Computer Vision"] },
    { company: "Amazon AI", role: "Applied Scientist Intern", location: "Bangalore, India", duration: "6 months", type: "On-site", logo: "🅰", applyLink: "https://amazon.jobs", skills: ["Python", "SageMaker", "ML Ops"] },
  ],
  "Cloud Computing": [
    { company: "Amazon Web Services", role: "Cloud Engineer Intern", location: "Hyderabad, India", duration: "6 months", type: "Hybrid", logo: "🅰", applyLink: "https://amazon.jobs", skills: ["AWS", "Terraform", "Python"] },
    { company: "Microsoft Azure", role: "Cloud Developer Intern", location: "Bangalore, India", duration: "4 months", type: "On-site", logo: "🅼", applyLink: "https://careers.microsoft.com", skills: ["Azure", "Kubernetes", "Docker"] },
    { company: "Google Cloud", role: "Cloud Intern", location: "Gurgaon, India", duration: "6 months", type: "Hybrid", logo: "🅶", applyLink: "https://careers.google.com", skills: ["GCP", "BigQuery", "Python"] },
    { company: "IBM", role: "Cloud Solutions Intern", location: "Bangalore, India", duration: "3 months", type: "Remote", logo: "🅸", applyLink: "https://www.ibm.com/employment", skills: ["IBM Cloud", "DevOps", "Linux"] },
    { company: "Oracle", role: "OCI Intern", location: "Hyderabad, India", duration: "6 months", type: "Hybrid", logo: "🅾", applyLink: "https://www.oracle.com/careers", skills: ["OCI", "Java", "Terraform"] },
  ],
};

// Default internships for domains not explicitly listed
const defaultInternships = [
  { company: "TCS", role: "Software Intern", location: "Multiple Locations", duration: "6 months", type: "Hybrid", logo: "🆃", applyLink: "https://www.tcs.com/careers", skills: ["Programming", "Problem Solving", "Teamwork"] },
  { company: "Infosys", role: "Technology Intern", location: "Bangalore, India", duration: "4 months", type: "On-site", logo: "🅸", applyLink: "https://www.infosys.com/careers", skills: ["Java", "Python", "SQL"] },
  { company: "Wipro", role: "Graduate Intern", location: "Hyderabad, India", duration: "3 months", type: "Hybrid", logo: "🆆", applyLink: "https://careers.wipro.com", skills: ["Technology", "Innovation", "Learning"] },
  { company: "Tech Mahindra", role: "Associate Intern", location: "Pune, India", duration: "6 months", type: "On-site", logo: "🆃", applyLink: "https://careers.techmahindra.com", skills: ["IT Services", "Development", "Support"] },
  { company: "HCL", role: "Tech Intern", location: "Noida, India", duration: "4 months", type: "Hybrid", logo: "🅷", applyLink: "https://www.hcltech.com/careers", skills: ["Software", "Cloud", "Digital"] },
];

const Internships = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const domain = location.state?.domain || "Web Development";

  // Get internships based on domain
  const internships = internshipsByDomain[domain] || defaultInternships;

  const handleApply = (applyLink: string) => {
    window.open(applyLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-slate-50 to-emerald-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/certificate", { state: { domain } })}
          className="mb-6 text-green-800 hover:text-green-900 hover:bg-green-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Certificate
        </Button>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 rounded-full mb-4 shadow-lg">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-800 via-emerald-700 to-green-800 bg-clip-text text-transparent">
            Top 5 Internships For You
          </h1>
          <p className="text-green-700 text-lg">
            Perfect matches based on your <span className="font-semibold">{domain}</span> certification
          </p>
        </div>

        {/* AI Match Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full border border-purple-200">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">AI-Curated based on your skills & domain</span>
          </div>
        </div>

        {/* Internship Cards */}
        <div className="space-y-5">
          {internships.map((internship, index) => (
            <Card 
              key={index} 
              className="p-6 border-2 border-green-100 hover:border-green-300 hover:shadow-lg transition-all bg-white group"
            >
              <div className="flex flex-col md:flex-row items-start gap-5">
                {/* Rank Badge */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                  #{index + 1}
                </div>

                {/* Company Logo */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-3xl text-white font-bold shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                  {internship.logo}
                </div>

                {/* Internship Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 mb-1">{internship.role}</h3>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Building2 className="w-4 h-4" />
                        <span className="font-semibold">{internship.company}</span>
                      </div>
                    </div>
                    <Badge 
                      className={`flex-shrink-0 px-3 py-1 text-sm ${
                        internship.type === 'Remote' ? 'bg-green-100 text-green-800 border-green-300' :
                        internship.type === 'Hybrid' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        'bg-orange-100 text-orange-800 border-orange-300'
                      }`}
                    >
                      {internship.type}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span>{internship.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>{internship.duration}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {internship.skills.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <Button
                  size="lg"
                  onClick={() => handleApply(internship.applyLink)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all w-full md:w-auto"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Apply Now
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* More Internships Section */}
        <Card className="mt-10 p-8 border-2 border-dashed border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 text-center">
          <h3 className="font-semibold text-xl text-green-900 mb-2">Looking for more opportunities?</h3>
          <p className="text-green-700 mb-5">
            Explore thousands of internships on popular job platforms
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              variant="outline" 
              className="border-green-600 text-green-700 hover:bg-green-100"
              onClick={() => window.open('https://internshala.com', '_blank')}
            >
              Internshala
            </Button>
            <Button 
              variant="outline" 
              className="border-blue-600 text-blue-700 hover:bg-blue-100"
              onClick={() => window.open('https://linkedin.com/jobs', '_blank')}
            >
              LinkedIn Jobs
            </Button>
            <Button 
              variant="outline" 
              className="border-purple-600 text-purple-700 hover:bg-purple-100"
              onClick={() => window.open('https://www.naukri.com', '_blank')}
            >
              Naukri
            </Button>
          </div>
        </Card>

        {/* Continue Button */}
        <div className="mt-8 text-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-700 hover:from-blue-800 hover:via-blue-900 hover:to-blue-800 text-white px-10"
            onClick={() => window.location.href = 'https://intern-ai-coach.lovable.app'}
          >
            Continue to AI Mock Interview →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Internships;
