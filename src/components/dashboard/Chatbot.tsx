import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Activity, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatbotProps {
  currentSite: any;
}

export const Chatbot: React.FC<ChatbotProps> = ({ currentSite }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I am your AI Growth Agent. Ask me questions about your site's audit reports, or give me suggestions on what optimizations to prioritize next!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Hello! I am your AI Growth Agent for ${currentSite?.url || "your site"}. Ask me questions about your site's audit reports, or give me suggestions on what optimizations to prioritize next!`,
      },
    ]);
  }, [currentSite?.id]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    if (!textToSend) {
      setInput("");
    }

    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: newMessages,
          siteId: currentSite?.id,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I ran into a small error processing that. Please try again." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to connect to AI assistant. Check your connection." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const chips = [
    "Explain latest audit issues",
    "How do I boost Core Web Vitals?",
    "Prioritize image optimizations",
    "Focus content on educational blogs"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          type="button"
          className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white flex items-center justify-center border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] transition-all duration-150 group"
        >
          <MessageSquare className="w-6 h-6 group-hover:scale-105 transition-transform" />
        </button>
      )}

      {/* Chat Widget Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white border-2 border-zinc-950 rounded-2xl shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="px-4 py-3 bg-zinc-950 text-white flex items-center justify-between border-b-2 border-zinc-950">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-500 to-indigo-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider font-mono">
                  Growth Assistant
                </h4>
                <p className="text-[9px] text-zinc-400 font-mono">
                  Online • Site Context Loaded
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-zinc-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed border shadow-sm ${
                    msg.role === "user"
                      ? "bg-violet-600 text-white border-violet-750 rounded-tr-none shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
                      : "bg-white text-zinc-850 border-zinc-200 rounded-tl-none font-mono"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-zinc-200 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-xs text-zinc-500 flex items-center gap-1.5 font-mono shadow-sm">
                  <Activity className="w-3.5 h-3.5 animate-spin text-violet-600" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-4 py-2 bg-white border-t border-zinc-100 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide select-none">
            {chips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                type="button"
                className="px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 text-zinc-650 hover:text-zinc-900 rounded-lg border border-zinc-200 text-[10px] font-semibold whitespace-nowrap transition-colors shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t-2 border-zinc-950 flex gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask me anything or suggest improvements..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-xs border-2 border-zinc-950 rounded-xl focus:outline-none focus:border-violet-500 bg-white text-zinc-850 placeholder-zinc-400"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-3 rounded-xl bg-zinc-950 hover:bg-zinc-850 text-white flex items-center justify-center transition-colors disabled:bg-zinc-300"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
