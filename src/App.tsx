import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import AssessmentIntro from "./pages/AssessmentIntro";
import MCQTest from "./pages/MCQTest";
import CodingTest from "./pages/CodingTest";
import MockInterview from "./pages/MockInterview";
import Certificate from "./pages/Certificate";
import Internships from "./pages/Internships";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import GlobalAIMentor from "./components/GlobalAIMentor";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
          <Route path="/assessment-intro" element={<ProtectedRoute><AssessmentIntro /></ProtectedRoute>} />
          <Route path="/mcq-test" element={<ProtectedRoute><MCQTest /></ProtectedRoute>} />
          <Route path="/coding-test" element={<ProtectedRoute><CodingTest /></ProtectedRoute>} />
          <Route path="/mock-interview" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
          <Route path="/certificate" element={<ProtectedRoute><Certificate /></ProtectedRoute>} />
          <Route path="/internships" element={<ProtectedRoute><Internships /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <GlobalAIMentor />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
