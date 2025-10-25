import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import AIMentorChat from "./AIMentorChat";

const GlobalAIMentor = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-hover bg-gradient-hero hover:opacity-90 z-50 transition-all duration-300 hover:scale-110"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
      <AIMentorChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default GlobalAIMentor;
