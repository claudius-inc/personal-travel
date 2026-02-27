"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Bot, User, MapPin } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  items?: Array<{ location: string; dayIndex: number }>;
};

type ChatPanelProps = {
  tripId: string;
  onItemsAdded: () => void;
};

export function ChatPanel({ tripId, onItemsAdded }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI travel planner. Ask me to suggest activities, restaurants, or help plan your day. I can add items directly to your itinerary!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayedText]);

  // Typing animation
  useEffect(() => {
    if (displayedText === null) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;

    const fullText = lastMsg.content;
    if (displayedText.length >= fullText.length) {
      setDisplayedText(null);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText(fullText.slice(0, displayedText.length + 2));
    }, 10);
    return () => clearTimeout(timer);
  }, [displayedText, messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/trips/${tripId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.reply,
          items: data.items,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setDisplayedText("");

        if (data.items && data.items.length > 0) {
          onItemsAdded();
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to connect. Please check your connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[60vh] sm:h-[600px] bg-card border border-border rounded-xl overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isLast = idx === messages.length - 1;
          const isTyping =
            isLast && msg.role === "assistant" && displayedText !== null;
          const content = isTyping ? displayedText : msg.content;

          return (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-muted text-foreground"
                }`}
                data-testid={
                  msg.role === "assistant" ? "chat-reply" : "chat-user-message"
                }
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {content}
                </p>
                {msg.items && msg.items.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs opacity-80">
                    <MapPin className="w-3 h-3" />
                    <span>
                      {msg.items.length} item
                      {msg.items.length > 1 ? "s" : ""} added to itinerary
                    </span>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-foreground" />
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="bg-muted rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 sm:p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to plan your day, suggest restaurants..."
            className="bg-muted border-border text-foreground"
            disabled={loading}
            data-testid="chat-input"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            data-testid="chat-send"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
