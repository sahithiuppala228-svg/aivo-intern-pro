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
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-hover bg-gradient-hero z-50 transition-all duration-300 hover:scale-115 active:scale-95 fab-pulse animate-scale-in"
        size="icon"
      >
        <MessageSquare className="h-6 w-6 transition-transform duration-200 group-hover:rotate-12" />
      </Button>
      <AIMentorChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default GlobalAIMentor;
