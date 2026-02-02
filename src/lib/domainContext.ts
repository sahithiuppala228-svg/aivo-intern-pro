// Domain-specific context for coding and interview assessments

export interface DomainContext {
  codingTopics: string[];
  interviewTopics: string[];
  description: string;
}

export const DOMAIN_CONTEXT: Record<string, DomainContext> = {
  "Web Development": {
    codingTopics: ["DOM manipulation", "API integration", "async programming", "state management", "form validation"],
    interviewTopics: ["Frontend frameworks", "HTTP/REST APIs", "Performance optimization", "Security best practices", "Responsive design"],
    description: "Build modern, responsive web applications"
  },
  "Data Science": {
    codingTopics: ["Data cleaning", "Statistical analysis", "Pandas/NumPy operations", "Data visualization", "Feature engineering"],
    interviewTopics: ["ML fundamentals", "Data pipelines", "Model evaluation", "Statistical methods", "Data storytelling"],
    description: "Extract insights from complex data"
  },
  "Machine Learning": {
    codingTopics: ["Model training", "Neural networks", "Feature extraction", "Hyperparameter tuning", "Model evaluation"],
    interviewTopics: ["Deep learning architectures", "Supervised/Unsupervised learning", "Model deployment", "MLOps", "Ethics in AI"],
    description: "Build intelligent systems that learn from data"
  },
  "Mobile Development": {
    codingTopics: ["UI components", "State management", "API calls", "Local storage", "Navigation patterns"],
    interviewTopics: ["iOS/Android ecosystems", "Cross-platform development", "App performance", "Push notifications", "App Store guidelines"],
    description: "Create native and cross-platform mobile apps"
  },
  "UI/UX Design": {
    codingTopics: ["CSS animations", "Responsive layouts", "Component styling", "Accessibility", "Design systems"],
    interviewTopics: ["User research", "Wireframing", "Prototyping", "Usability testing", "Design thinking"],
    description: "Design intuitive and beautiful user experiences"
  },
  "DevOps": {
    codingTopics: ["Shell scripting", "CI/CD pipelines", "Infrastructure as code", "Container orchestration", "Monitoring scripts"],
    interviewTopics: ["Cloud platforms", "Kubernetes", "Docker", "Infrastructure automation", "Site reliability"],
    description: "Automate and streamline software delivery"
  },
  "Cloud Computing": {
    codingTopics: ["Serverless functions", "Cloud storage", "API gateways", "Database management", "Cost optimization"],
    interviewTopics: ["AWS/Azure/GCP services", "Cloud architecture", "Security & compliance", "Scalability patterns", "Migration strategies"],
    description: "Build scalable cloud-native solutions"
  },
  "Cybersecurity": {
    codingTopics: ["Encryption algorithms", "Input validation", "Authentication systems", "Vulnerability scanning", "Secure coding"],
    interviewTopics: ["Threat modeling", "Penetration testing", "Security frameworks", "Incident response", "Compliance standards"],
    description: "Protect systems and data from threats"
  },
  "Blockchain": {
    codingTopics: ["Smart contracts", "Token standards", "Cryptographic hashing", "Wallet integration", "DApp development"],
    interviewTopics: ["Consensus mechanisms", "DeFi protocols", "Web3 architecture", "Security audits", "Scalability solutions"],
    description: "Build decentralized applications and systems"
  },
  "Game Development": {
    codingTopics: ["Game loops", "Physics simulation", "AI pathfinding", "Collision detection", "State machines"],
    interviewTopics: ["Game engines", "Graphics programming", "Game design patterns", "Multiplayer networking", "Performance optimization"],
    description: "Create immersive gaming experiences"
  }
};

/**
 * Get domain context for a specific domain
 * Falls back to generic context for custom domains
 */
export function getDomainContext(domain: string): DomainContext {
  const normalizedDomain = domain.trim();
  
  // Check for exact match
  if (DOMAIN_CONTEXT[normalizedDomain]) {
    return DOMAIN_CONTEXT[normalizedDomain];
  }
  
  // Check for case-insensitive match
  const lowerDomain = normalizedDomain.toLowerCase();
  for (const [key, context] of Object.entries(DOMAIN_CONTEXT)) {
    if (key.toLowerCase() === lowerDomain) {
      return context;
    }
  }
  
  // Return generic context for custom domains
  return {
    codingTopics: ["Problem solving", "Algorithm design", "Data structures", "Code optimization", "Testing"],
    interviewTopics: ["Core concepts", "Best practices", "Real-world applications", "Problem-solving approaches", "Industry trends"],
    description: `Demonstrate your expertise in ${normalizedDomain}`
  };
}

/**
 * Get coding topics as a formatted string
 */
export function getCodingTopicsString(domain: string): string {
  const context = getDomainContext(domain);
  return context.codingTopics.join(", ");
}

/**
 * Get interview topics as a formatted string
 */
export function getInterviewTopicsString(domain: string): string {
  const context = getDomainContext(domain);
  return context.interviewTopics.join(", ");
}
