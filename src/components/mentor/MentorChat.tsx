"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, GraduationCap, User, RotateCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import MentorStageBar from "./MentorStageBar";
import MentorToolCard from "./MentorToolCard";
import MentorWelcome from "./MentorWelcome";
import MentorImageUpload from "./MentorImageUpload";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface MentorSession {
  hasSession: boolean;
  stage: number;
  messageCount: number;
  messages: Message[];
}

// Parse [TOOL:/route:Name:Description] markers from text
function parseToolCards(text: string): Array<{ type: "text"; content: string } | { type: "tool"; route: string; name: string; description: string }> {
  const toolRegex = /\[TOOL:(\/[^:]+):([^:]+):([^\]]+)\]/g;
  const parts: Array<{ type: "text"; content: string } | { type: "tool"; route: string; name: string; description: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = toolRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({
      type: "tool",
      route: match[1],
      name: match[2],
      description: match[3],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", content: text }];
}

// Strip hidden markers from displayed text
function stripHiddenMarkers(text: string): string {
  return text
    .replace(/\[CONTEXT_UPDATE:[\s\S]*?\]/g, "")
    .replace(/\[STAGE_ADVANCE:\d\]/g, "")
    .trim();
}

// Format text with bold and number highlighting
function formatText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={i} className="font-semibold" style={{ color: "#a78bfa" }}>
          {part.slice(2, -2)}
        </span>
      );
    }
    const numParts = part.split(/(\d+[.,]?\d*%?|\$\d+[.,]?\d*[KMB]?)/g);
    return numParts.map((np, j) =>
      /^\d|^\$/.test(np) ? (
        <span key={`${i}-${j}`} className="font-medium" style={{ color: "#4facfe" }}>
          {np}
        </span>
      ) : (
        <span key={`${i}-${j}`}>{np}</span>
      )
    );
  });
}

export default function MentorChat() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [stage, setStage] = useState(1);
  const [hasSession, setHasSession] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [stageAdvancePrompt, setStageAdvancePrompt] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load session on mount
  useEffect(() => {
    if (!token) {
      setSessionLoading(false);
      return;
    }

    async function loadSession() {
      try {
        const res = await fetch("/api/mentor/context", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load session");
        const data: MentorSession = await res.json();

        setHasSession(data.hasSession && data.messageCount > 0);
        setStage(data.stage);

        if (data.messages && data.messages.length > 0) {
          setMessages(
            data.messages.map((m) => ({
              role: m.role,
              content: m.content,
            }))
          );
        }
      } catch (err) {
        console.error("Load mentor session error:", err);
      } finally {
        setSessionLoading(false);
      }
    }

    loadSession();
  }, [token]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading || !token) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setHasSession(true);

    const currentImage = imageBase64;
    setImageBase64(null);

    try {
      const res = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text.trim(),
          ...(currentImage ? { imageBase64: currentImage } : {}),
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        // Show text with hidden markers stripped but tool cards visible during stream
        const displayContent = stripHiddenMarkers(assistantContent);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: displayContent,
          };
          return updated;
        });
      }

      // Check for stage advance in the raw response
      const stageMatch = assistantContent.match(/\[STAGE_ADVANCE:(\d)\]/);
      if (stageMatch) {
        const nextStage = parseInt(stageMatch[1], 10);
        if (nextStage >= 1 && nextStage <= 5 && nextStage > stage) {
          setStageAdvancePrompt(nextStage);
        }
      }

      // Refresh stage from server (context update may have changed it)
      try {
        const ctxRes = await fetch("/api/mentor/context", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ctxRes.ok) {
          const ctxData = await ctxRes.json();
          setStage(ctxData.stage);
        }
      } catch {
        // Non-critical
      }
    } catch (err) {
      console.error("Mentor chat error:", err);
      setMessages((prev) => [
        ...prev.slice(0, -1).length > 0 && prev[prev.length - 1]?.content === ""
          ? prev.slice(0, -1)
          : prev,
        {
          role: "assistant",
          content: "Bir hata oluştu. Lütfen tekrar deneyin.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleStageAdvance(nextStage: number) {
    if (!token) return;
    try {
      await fetch("/api/mentor/context", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stage: nextStage }),
      });
      setStage(nextStage);
    } catch (err) {
      console.error("Stage advance error:", err);
    }
    setStageAdvancePrompt(null);
  }

  async function handleReset() {
    if (!token) return;
    if (!confirm("Tüm konuşma geçmişi silinecek ve baştan başlayacaksın. Emin misin?")) return;

    try {
      await fetch("/api/mentor/context", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([]);
      setStage(1);
      setHasSession(false);
      setImageBase64(null);
      setStageAdvancePrompt(null);
    } catch (err) {
      console.error("Reset error:", err);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleStart() {
    sendMessage("Merhaba, e-ticarete başlamak istiyorum!");
  }

  // Auth gate
  if (!user || !token) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
        <p className="text-sm">Mentör&apos;ü kullanmak için giriş yapmalısın.</p>
      </div>
    );
  }

  // Loading state
  if (sessionLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: "#8b5cf6" }} />
      </div>
    );
  }

  // Welcome screen
  if (!hasSession) {
    return (
      <MentorWelcome
        username={user.username}
        onStart={handleStart}
        onQuestionClick={(q) => sendMessage(q)}
      />
    );
  }

  // Chat interface
  return (
    <div className="flex flex-col h-full">
      {/* Stage bar + reset button */}
      <div
        className="flex items-center border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex-1">
          <MentorStageBar currentStage={stage} />
        </div>
        <button
          onClick={handleReset}
          className="p-2 mr-2 rounded-lg transition-all duration-150"
          title="Baştan başla"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: "rgba(139, 92, 246, 0.15)" }}
              >
                <GraduationCap size={16} style={{ color: "#a78bfa" }} />
              </div>
            )}

            <div
              className="max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={
                msg.role === "user"
                  ? {
                      background: "#8b5cf6",
                      color: "#fff",
                      borderBottomRightRadius: "6px",
                    }
                  : {
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                      borderBottomLeftRadius: "6px",
                    }
              }
            >
              {msg.role === "user" ? (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              ) : (
                <div className="space-y-1">
                  {parseToolCards(msg.content).map((part, j) =>
                    part.type === "tool" ? (
                      <MentorToolCard
                        key={j}
                        route={part.route}
                        toolName={part.name}
                        description={part.description}
                      />
                    ) : (
                      <span key={j} className="whitespace-pre-wrap">
                        {formatText(part.content)}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: "var(--bg-hover)" }}
              >
                <User size={16} style={{ color: "var(--text-muted)" }} />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-3">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(139, 92, 246, 0.15)" }}
            >
              <GraduationCap size={16} style={{ color: "#a78bfa" }} />
            </div>
            <div
              className="rounded-2xl px-4 py-3 text-sm"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            >
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Stage advance prompt */}
      {stageAdvancePrompt && (
        <div
          className="mx-4 mb-2 p-3 rounded-xl flex items-center justify-between"
          style={{
            background: "rgba(139, 92, 246, 0.1)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
          }}
        >
          <span className="text-sm" style={{ color: "#a78bfa" }}>
            Sonraki aşamaya geçmeye hazır mısın?
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setStageAdvancePrompt(null)}
              className="px-3 py-1 rounded-lg text-xs font-medium"
              style={{
                background: "var(--bg-hover)",
                color: "var(--text-secondary)",
              }}
            >
              Henüz değil
            </button>
            <button
              onClick={() => handleStageAdvance(stageAdvancePrompt)}
              className="px-3 py-1 rounded-lg text-xs font-medium"
              style={{
                background: "#8b5cf6",
                color: "#fff",
              }}
            >
              Evet, geç
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div
        className="border-t px-4 py-3"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        {/* Image preview */}
        {imageBase64 && (
          <div className="mb-2">
            <MentorImageUpload
              onImageSelect={setImageBase64}
              previewUrl={imageBase64}
            />
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Image upload button — visible from stage 5 onwards */}
          {stage >= 5 && !imageBase64 && (
            <MentorImageUpload
              onImageSelect={setImageBase64}
              previewUrl={null}
            />
          )}

          <div
            className="flex-1 rounded-xl overflow-hidden"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                stage >= 5
                  ? "Mesajını yaz veya reklam görseli ekle..."
                  : "Mesajını yaz..."
              }
              rows={1}
              className="w-full px-4 py-3 text-sm resize-none bg-transparent outline-none"
              style={{
                color: "var(--text-primary)",
                maxHeight: "120px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
          </div>

          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150"
            style={{
              background: input.trim() ? "#8b5cf6" : "var(--bg-hover)",
              color: input.trim() ? "#fff" : "var(--text-muted)",
              cursor: input.trim() && !loading ? "pointer" : "default",
            }}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
