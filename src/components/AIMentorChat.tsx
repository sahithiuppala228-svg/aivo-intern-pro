import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Mic, Sparkles, MessageSquare } from "lucide-react";
import aiMentorIcon from "@/assets/ai-mentor-icon.jpg";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIMentorChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIMentorChat = ({ isOpen, onClose }: AIMentorChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm Aivo, your AI mentor. I'm here to help you succeed! Ask me anything about your assessments, learning paths, or career goals. 🚀",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const quickActions = [
    { label: "Practice 3 questions", icon: <MessageSquare className="w-4 h-4" /> },
    { label: "Explain last mistake", icon: <Sparkles className="w-4 h-4" /> },
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I understand you're asking about " + input + ". Let me help you with that! This is a simulated response. In the full version, I'll provide detailed, contextual guidance based on your learning journey.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-background border-l border-border shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-card">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-primary/20">
            <AvatarImage src={aiMentorIcon} alt="Aivo" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">Aivo — Your Mentor</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Always here to help
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-border bg-muted/30">
        <p className="text-xs text-muted-foreground mb-2">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(action.label)}
              className="text-xs"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={aiMentorIcon} alt="Aivo" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <Card
                className={cn(
                  "p-3 max-w-[80%]",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={cn(
                  "text-xs mt-1",
                  message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </Card>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={aiMentorIcon} alt="Aivo" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <Card className="p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-200" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask Aivo anything..."
            className="flex-1"
          />
          <Button variant="ghost" size="icon">
            <Mic className="w-5 h-5" />
          </Button>
          <Button onClick={handleSend} disabled={!input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Voice & text support available
        </p>
      </div>
    </div>
  );
};

export default AIMentorChat;
