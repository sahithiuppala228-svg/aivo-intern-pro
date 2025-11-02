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
import PracticeMode from "./pages/PracticeMode";
import NotFound from "./pages/NotFound";
import GlobalAIMentor from "./components/GlobalAIMentor";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
          <Route path="/practice-mode" element={<ProtectedRoute><PracticeMode /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <GlobalAIMentor />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
