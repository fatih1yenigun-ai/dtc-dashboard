"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function FloatingChat() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMsg }],
          model: "sonnet",
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "Bir hata oluştu." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Bağlantı hatası. Tekrar deneyin." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Format assistant message with highlights
  function formatMessage(text: string) {
    // Bold text between ** **
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <span key={i} className="text-[#43e97b] font-semibold">
            {part.slice(2, -2)}
          </span>
        );
      }
      // Numbers and percentages in cyan
      const numParts = part.split(/(\d+[.,]?\d*%?|\$\d+[.,]?\d*[KMB]?)/g);
      return numParts.map((np, j) =>
        /^\d|^\$/.test(np) ? (
          <span key={`${i}-${j}`} className="text-[#4facfe] font-medium">
            {np}
          </span>
        ) : (
          <span key={`${i}-${j}`}>{np}</span>
        )
      );
    });
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen
            ? "bg-red-500 hover:bg-red-600 rotate-90"
            : "bg-[#0D1B2A] hover:bg-[#1a2d45] animate-pulse"
        }`}
        style={{
          boxShadow: isOpen
            ? "0 0 20px rgba(239,68,68,0.4)"
            : "0 0 20px rgba(102,126,234,0.4)",
        }}
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageCircle size={22} className="text-[#43e97b]" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "linear-gradient(135deg, #0D1B2A 0%, #1a1a2e 100%)",
            boxShadow:
              "0 0 40px rgba(102,126,234,0.2), 0 20px 60px rgba(0,0,0,0.5)",
            animation: "chatSlideUp 0.15s ease-out",
          }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full bg-[#43e97b] flex items-center justify-center"
              style={{ boxShadow: "0 0 12px rgba(67,233,123,0.4)" }}
            >
              <MessageCircle size={16} className="text-[#0D1B2A]" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">AI Danışman</p>
              <p className="text-[#43e97b] text-xs">
                {loading ? "yazıyor..." : "Çevrimiçi"}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.length === 0 && (
              <div className="text-center pt-16">
                <div
                  className="w-16 h-16 rounded-full bg-[#43e97b]/10 flex items-center justify-center mx-auto mb-4"
                  style={{ boxShadow: "0 0 20px rgba(67,233,123,0.1)" }}
                >
                  <MessageCircle size={28} className="text-[#43e97b]" />
                </div>
                <p className="text-gray-400 text-sm">
                  Merhaba! DTC araştırma konusunda
                </p>
                <p className="text-gray-400 text-sm">
                  sana nasıl yardımcı olabilirim?
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    "Hangi niş daha karlı?",
                    "Türkiye'de ne satmalıyım?",
                    "AOV nasıl artırılır?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        setTimeout(() => handleSend(), 100);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-lg bg-white/5 text-gray-300 text-xs hover:bg-white/10 transition-colors border border-white/5"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#667eea] text-white rounded-br-md"
                      : "bg-white/5 border border-white/10 text-gray-100 rounded-bl-md"
                  }`}
                  style={
                    msg.role === "assistant"
                      ? { animation: "typeIn 0.3s ease-out" }
                      : undefined
                  }
                >
                  {msg.role === "assistant" ? (
                    <div className="whitespace-pre-wrap">
                      {formatMessage(msg.content)}
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1.5">
                    <span
                      className="w-2 h-2 bg-[#43e97b] rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-[#43e97b] rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-[#43e97b] rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Bir şey sor..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#43e97b]/50 focus:ring-1 focus:ring-[#43e97b]/20 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-[#43e97b] flex items-center justify-center hover:bg-[#38d970] transition-colors disabled:opacity-30"
                style={{ boxShadow: "0 0 12px rgba(67,233,123,0.3)" }}
              >
                {loading ? (
                  <Loader2 size={16} className="text-[#0D1B2A] animate-spin" />
                ) : (
                  <Send size={16} className="text-[#0D1B2A]" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx global>{`
        @keyframes chatSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes typeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
