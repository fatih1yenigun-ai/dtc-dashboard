"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, GraduationCap, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type ActiveTab = "danisma" | "mentor";

const MENTOR_STORAGE_KEY = "mentor2_state";
const MENTOR_SYNC_EVENT = "mentor-state-change";

// ============================================================
// Mentor Scripted Responses (no API)
// ============================================================

const STAGE_NAMES: Record<number, string> = {
  1: "Ürün Araştırması",
  2: "Tedarikçi Bulma",
  3: "Mağaza Kurulumu",
  4: "İçerik & Tedarik",
  5: "Reklam Analizi",
};

interface MentorState {
  messages: Message[];
  stage: number;
}

function loadMentorState(): MentorState {
  if (typeof window === "undefined") return { messages: [], stage: 1 };
  try {
    const raw = localStorage.getItem(MENTOR_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
        stage: typeof parsed.stage === "number" ? parsed.stage : 1,
      };
    }
  } catch { /* ignore */ }
  return { messages: [], stage: 1 };
}

function saveMentorState(state: MentorState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MENTOR_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(MENTOR_SYNC_EVENT));
  } catch { /* ignore */ }
}

interface ScriptedResponse {
  text: string;
  nextStage?: number;
}

function getScriptedResponse(msg: string, stage: number): ScriptedResponse {
  const lower = msg.toLowerCase();

  if (lower.includes("merhaba") || lower.includes("selam") || lower.includes("başlamak")) {
    return {
      text: `Merhaba! Ben Faycom Mentörüyüm 👋\n\nSana e-ticarette adım adım rehberlik edeceğim. Şu anda **Aşama ${stage}** — ${STAGE_NAMES[stage]} aşamasındasın.\n\nHangi ürün kategorisi veya niş ile ilgileniyorsun? Eğer henüz bir fikrin yoksa, trend ürünlere bakarak başlayabiliriz.\n\n[TOOL:/tts:TikTok Shop Araştırma:GMV bazlı trend ürünleri keşfet]`,
    };
  }

  if (lower.includes("teşekkür") || lower.includes("sağol")) {
    return { text: "Rica ederim! Başka bir sorun olursa yazman yeterli 😊" };
  }

  switch (stage) {
    case 1: {
      if (lower.includes("ürün") || lower.includes("ne satayım") || lower.includes("bilmiyorum") || lower.includes("nasıl") || lower.includes("fikir")) {
        return {
          text: `Ürün araştırmasına başlayalım! 🔍\n\n**3 adımlı yaklaşım:**\n\n**1.** TikTok Shop'ta GMV yüksek ürünlere bak:\n[TOOL:/tts:TikTok Shop Araştırma:GMV bazlı trend ürünleri keşfet]\n\n**2.** Aktif reklam veren markaları bul:\n[TOOL:/reklam-tara:Reklam Tara:Aktif Meta reklamlarını keşfet]\n\n**3.** Marka trafiğini kontrol et:\n[TOOL:/storeleads:Marka Nabzı:Marka trafiği ve büyüme analizi]\n\nÖnce bir ürün bul, sonra bana söyle!`,
        };
      }
      if (lower.includes("buldum") || lower.includes("karar") || lower.includes("seçtim")) {
        return {
          text: `Süper! Ürün kararını verdin 🎯\n\nKontrolleri yaptıysan **Tedarikçi Bulma** aşamasına geçebiliriz!\n\n[TOOL:/icerik-tedarik/suppliers:Tedarikçi Pazaryeri:Üretici ve toptancıları keşfet]`,
          nextStage: 2,
        };
      }
      if (lower.includes("gmv")) {
        return { text: `**GMV** = Toplam satış hacmi. Yüksek GMV = gerçek talep.\n\n[TOOL:/tts:TikTok Shop Araştırma:GMV bazlı trend ürünleri keşfet]` };
      }
      if (lower.includes("reklam")) {
        return { text: `Aktif reklam veren markalar = kârlı pazar sinyali.\n\n[TOOL:/reklam-tara:Reklam Tara:Aktif Meta reklamlarını keşfet]` };
      }
      return {
        text: `Şu anda **Ürün Araştırması** aşamasındasın.\n\n[TOOL:/tts:TikTok Shop Araştırma:GMV bazlı trend ürünleri keşfet]\n[TOOL:/reklam-tara:Reklam Tara:Aktif reklamları keşfet]\n[TOOL:/storeleads:Marka Nabzı:Marka trafiği analizi]\n\nHangi ürün kategorisiyle ilgileniyorsun?`,
      };
    }
    case 2: {
      if (lower.includes("tedarikçi") || lower.includes("nasıl") || lower.includes("üretici")) {
        return {
          text: `Tedarikçi bulalım! 🏭\n\n[TOOL:/icerik-tedarik/suppliers:Tedarikçi Pazaryeri:Üretici ve toptancıları keşfet]\n\n**Tedarikçiye sor:**\n- Üretici mi toptancı mı?\n- MOQ nedir?\n- Birim fiyat (MOQ/2x/5x)?\n- Numune maliyeti?\n- Özel ambalaj yapıyor mu?\n\nEn az **3 tedarikçiye** ulaş.`,
        };
      }
      if (lower.includes("teklif") || lower.includes("aldım") || lower.includes("karşılaştır")) {
        return {
          text: `Teklifleri değerlendir:\n- Fiyat/MOQ dengesi\n- Profesyonellik\n- Numune kalitesi\n\n🚩 Kırmızı bayrak: Çok düşük fiyat, yüksek MOQ, numune göndermek istemeyen.\n\nSeçimini yaptıysan **Mağaza Kurulumu**'na geçelim!`,
          nextStage: 3,
        };
      }
      return {
        text: `**Tedarikçi Bulma** aşamasındasın.\n\n[TOOL:/icerik-tedarik/suppliers:Tedarikçi Pazaryeri:Üretici ve toptancıları keşfet]\n\n"Nasıl yazayım?" dersen şablon verebilirim.`,
      };
    }
    case 3: {
      if (lower.includes("mağaza") || lower.includes("kur") || lower.includes("site")) {
        return {
          text: `Mağaza kurulumu! 🛍️\n\n**5 temel:**\n1. Hero: tek net mesaj\n2. Max 2-3 renk\n3. Temiz ürün görselleri\n4. Güven sinyalleri (yorumlar, iade politikası)\n5. Mobil test!\n\nFiyatlandırma:\n[TOOL:/tools/urun-ekonomisi:Birim Ekonomi:Maliyet ve kâr analizi]`,
        };
      }
      if (lower.includes("hazır") || lower.includes("tamam") || lower.includes("kurdum")) {
        return { text: `Mağazan hazır! 🎉 **İçerik & Tedarik** aşamasına geçelim!`, nextStage: 4 };
      }
      return {
        text: `**Mağaza Kurulumu** aşamasındasın.\n\n[TOOL:/tools/urun-ekonomisi:Birim Ekonomi:Maliyet ve kâr analizi]\n\nNe konuda yardım lazım?`,
      };
    }
    case 4: {
      if (lower.includes("creator") || lower.includes("içerik") || lower.includes("video") || lower.includes("ugc")) {
        return {
          text: `İçerik zamanı! 🎬\n\n[TOOL:/icerik-tedarik/creators:Creator Pazaryeri:UGC ve influencer bul]\n\n**Seçim kriterleri:**\n- Niş uyumu > takipçi sayısı\n- 2-3 mikro creator ile başla\n- UGC: 500-2000 TL\n- Reklam kullanım hakkı iste!\n\n**Script:** Hook (0-3sn) → Body (3-25sn) → CTA (son 3sn)`,
        };
      }
      if (lower.includes("tedarik") || lower.includes("sipariş") || lower.includes("ambalaj")) {
        return {
          text: `Tedarikçiyi finalize et! 📦\n\n[TOOL:/icerik-tedarik/suppliers:Tedarikçi Pazaryeri:Tedarikçi finalize]\n\n- Özel ambalaj detayları\n- İlk toplu sipariş miktarı\n- Teslimat takvimi\n- Kalite kontrol süreci\n\nHer şey tamamsa **Reklam Analizi**'ne geçelim!`,
          nextStage: 5,
        };
      }
      return {
        text: `**İçerik & Tedarik** aşamasındasın.\n\n[TOOL:/icerik-tedarik/creators:Creator Pazaryeri:Creator bul]\n[TOOL:/icerik-tedarik/suppliers:Tedarikçi Pazaryeri:Tedarikçi finalize]\n\nHangisiyle başlayalım?`,
      };
    }
    case 5: {
      if (lower.includes("ctr") || lower.includes("cpm") || lower.includes("roas") || lower.includes("cpc")) {
        return {
          text: `Metrikleri anlamak önemli!\n\n- **CTR düşük** → Creative dikkat çekmiyor\n- **CPM yüksek** → Hedefleme dar veya rekabet yoğun\n- **ROAS düşük** → Landing page veya ürün-pazar uyumu sorunu\n\nSence senin kampanyanda hangisi sorun?`,
        };
      }
      return {
        text: `**Reklam Analizi** aşamasındasın.\n\n[TOOL:/reklam-tara:Reklam Tara:Rakip reklamları analiz et]\n\n**Temel metrikler:**\n- CTR: Tıklama oranı (%1+ iyi)\n- CPM: 1000 gösterim maliyeti\n- ROAS: Reklam getirisi (2x+ hedef)\n- CPC: Tıklama maliyeti\n\nHangi metrik hakkında konuşalım?`,
      };
    }
    default:
      return { text: "Nasıl yardımcı olabilirim?" };
  }
}

// ============================================================
// Tool card parser
// ============================================================
interface ToolPart { type: "tool"; route: string; name: string; description: string }
interface TextPart { type: "text"; content: string }
type ContentPart = ToolPart | TextPart;

function parseToolCards(text: string): ContentPart[] {
  const toolRegex = /\[TOOL:(\/[^:]+):([^:]+):([^\]]+)\]/g;
  const parts: ContentPart[] = [];
  let lastIndex = 0;
  let match;

  while ((match = toolRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    parts.push({ type: "tool", route: match[1], name: match[2], description: match[3] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: "text", content: text.slice(lastIndex) });
  return parts.length > 0 ? parts : [{ type: "text", content: text }];
}

// ============================================================
// Component
// ============================================================

export default function FloatingChat() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("mentor");

  // --- AI Danışman state ---
  const [danismaMessages, setDanismaMessages] = useState<Message[]>([]);
  const [danismaInput, setDanismaInput] = useState("");
  const [danismaLoading, setDanismaLoading] = useState(false);

  // --- Mentor state (persisted) ---
  const [mentorMessages, setMentorMessages] = useState<Message[]>([]);
  const [mentorStage, setMentorStage] = useState(1);
  const [mentorInput, setMentorInput] = useState("");
  const [mentorTyping, setMentorTyping] = useState(false);
  const [stageAdvance, setStageAdvance] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load mentor state from localStorage on mount
  useEffect(() => {
    const saved = loadMentorState();
    setMentorMessages(saved.messages);
    setMentorStage(saved.stage);
  }, []);

  // Listen for sync events from Mentör2 page
  useEffect(() => {
    function handleSync() {
      if (mentorTypingRef.current) return; // Don't reload during own typing
      const saved = loadMentorState();
      setMentorMessages(saved.messages);
      setMentorStage(saved.stage);
    }
    window.addEventListener(MENTOR_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(MENTOR_SYNC_EVENT, handleSync);
  }, []);

  const mentorTypingRef = useRef(false);
  useEffect(() => { mentorTypingRef.current = mentorTyping; }, [mentorTyping]);

  // Save mentor state whenever it changes (skip during typing)
  useEffect(() => {
    if ((mentorMessages.length > 0 || mentorStage > 1) && !mentorTypingRef.current) {
      saveMentorState({ messages: mentorMessages, stage: mentorStage });
    }
  }, [mentorMessages, mentorStage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [danismaMessages, mentorMessages]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen, activeTab]);

  // --- AI Danışman ---
  async function handleDanismaSend() {
    if (!danismaInput.trim() || danismaLoading) return;
    const userMsg = danismaInput.trim();
    setDanismaInput("");
    setDanismaMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setDanismaLoading(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: [...danismaMessages, { role: "user", content: userMsg }], model: "sonnet" }),
      });
      const data = await res.json();
      setDanismaMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Bir hata oluştu." }]);
    } catch {
      setDanismaMessages((prev) => [...prev, { role: "assistant", content: "Bağlantı hatası." }]);
    } finally {
      setDanismaLoading(false);
    }
  }

  // --- Mentor (scripted) ---
  const sendMentorMessage = useCallback((text: string) => {
    if (!text.trim() || mentorTyping) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    setMentorMessages((prev) => [...prev, userMessage]);
    setMentorInput("");
    setMentorTyping(true);

    setTimeout(() => {
      const response = getScriptedResponse(text.trim(), mentorStage);
      const words = response.text.split(" ");
      let accumulated = "";
      let wordIndex = 0;

      setMentorMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const interval = setInterval(() => {
        if (wordIndex >= words.length) {
          clearInterval(interval);
          setMentorTyping(false);
          // Save final state after typing completes
          setMentorMessages((prev) => {
            saveMentorState({ messages: prev, stage: response.nextStage || mentorStage });
            return prev;
          });
          if (response.nextStage) setStageAdvance(response.nextStage);
          return;
        }
        accumulated += (wordIndex > 0 ? " " : "") + words[wordIndex];
        wordIndex++;
        setMentorMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: accumulated };
          return updated;
        });
      }, 25);
    }, 300);
  }, [mentorTyping, mentorStage]);

  function handleMentorReset() {
    setMentorMessages([]);
    setMentorStage(1);
    setStageAdvance(null);
    localStorage.removeItem(MENTOR_STORAGE_KEY);
    window.dispatchEvent(new Event(MENTOR_SYNC_EVENT));
  }

  // Format text with bold + numbers
  function formatMessage(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <span key={i} className="font-semibold" style={{ color: activeTab === "mentor" ? "#a78bfa" : "#43e97b" }}>{part.slice(2, -2)}</span>;
      }
      const numParts = part.split(/(\d+[.,]?\d*%?|\$\d+[.,]?\d*[KMB]?)/g);
      return numParts.map((np, j) =>
        /^\d|^\$/.test(np)
          ? <span key={`${i}-${j}`} className="text-[#4facfe] font-medium">{np}</span>
          : <span key={`${i}-${j}`}>{np}</span>
      );
    });
  }

  // Render inline tool card (compact for floating chat)
  function renderMiniToolCard(part: ToolPart, key: number) {
    return (
      <div
        key={key}
        className="flex items-center gap-2 my-1.5 px-3 py-2 rounded-lg transition-all duration-150 group cursor-pointer"
        style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}
        onClick={() => {
          setIsOpen(false);
          window.location.href = part.route;
        }}
      >
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold" style={{ color: "#a78bfa" }}>{part.name}</div>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{part.description}</div>
        </div>
        <ArrowRight size={12} style={{ color: "#a78bfa" }} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </div>
    );
  }

  // Current messages/input/loading based on active tab
  const messages = activeTab === "danisma" ? danismaMessages : mentorMessages;
  const isLoading = activeTab === "danisma" ? danismaLoading : mentorTyping;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-bg-sidebar hover:bg-[#1a2d45] animate-pulse"
        }`}
        style={{ boxShadow: isOpen ? "0 0 20px rgba(239,68,68,0.4)" : "0 0 20px rgba(139,92,246,0.4)" }}
      >
        {isOpen ? <X size={22} className="text-white" /> : <GraduationCap size={22} style={{ color: "#a78bfa" }} />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[380px] h-[540px] rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "linear-gradient(135deg, #0D1B2A 0%, #1a1a2e 100%)",
            boxShadow: "0 0 40px rgba(139,92,246,0.2), 0 20px 60px rgba(0,0,0,0.5)",
            animation: "chatSlideUp 0.15s ease-out",
          }}
        >
          {/* Tab switcher */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab("mentor")}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-all duration-150"
              style={{
                color: activeTab === "mentor" ? "#a78bfa" : "var(--text-muted)",
                borderBottom: activeTab === "mentor" ? "2px solid #8b5cf6" : "2px solid transparent",
                background: activeTab === "mentor" ? "rgba(139,92,246,0.05)" : "transparent",
              }}
            >
              <GraduationCap size={14} />
              Mentör
              {mentorStage > 1 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa" }}>
                  {mentorStage}/5
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("danisma")}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-all duration-150"
              style={{
                color: activeTab === "danisma" ? "#43e97b" : "var(--text-muted)",
                borderBottom: activeTab === "danisma" ? "2px solid #43e97b" : "2px solid transparent",
                background: activeTab === "danisma" ? "rgba(67,233,123,0.05)" : "transparent",
              }}
            >
              <MessageCircle size={14} />
              AI Danışman
            </button>
          </div>

          {/* Stage bar for mentor */}
          {activeTab === "mentor" && (
            <div className="flex items-center px-3 py-2 border-b border-white/5 gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: s < mentorStage ? "#8b5cf6" : s === mentorStage ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)",
                      color: s <= mentorStage ? "#fff" : "var(--text-muted)",
                      border: s === mentorStage ? "1.5px solid #8b5cf6" : "none",
                    }}
                  >
                    {s < mentorStage ? "✓" : s}
                  </div>
                  {s < 5 && <div className="flex-1 h-[1px] mx-0.5" style={{ background: s < mentorStage ? "#8b5cf6" : "rgba(255,255,255,0.1)" }} />}
                </div>
              ))}
              <button
                onClick={handleMentorReset}
                className="ml-1 p-1 rounded text-[10px]"
                style={{ color: "var(--text-muted)" }}
                title="Sıfırla"
              >
                ↺
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.length === 0 && (
              <div className="text-center pt-12">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{
                    background: activeTab === "mentor" ? "rgba(139,92,246,0.1)" : "rgba(67,233,123,0.1)",
                    boxShadow: `0 0 20px ${activeTab === "mentor" ? "rgba(139,92,246,0.1)" : "rgba(67,233,123,0.1)"}`,
                  }}
                >
                  {activeTab === "mentor"
                    ? <GraduationCap size={24} style={{ color: "#a78bfa" }} />
                    : <MessageCircle size={24} className="text-[#43e97b]" />
                  }
                </div>
                <p className="text-text-muted text-sm mb-1">
                  {activeTab === "mentor" ? "E-ticaret yolculuğuna başla!" : "DTC araştırma konusunda"}
                </p>
                <p className="text-text-muted text-sm mb-4">
                  {activeTab === "mentor" ? "Adım adım rehberlik edeceğim." : "sana nasıl yardımcı olabilirim?"}
                </p>
                <div className="space-y-2">
                  {activeTab === "mentor"
                    ? ["E-ticarete sıfırdan başlamak istiyorum", "Ürünüm hazır, tedarikçi arıyorum", "Reklam kampanyamı analiz et"].map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMentorMessage(q)}
                          className="block w-full text-left px-3 py-2 rounded-lg bg-white/5 text-text-muted text-xs hover:bg-white/10 transition-colors border border-white/5"
                        >
                          {q}
                        </button>
                      ))
                    : ["Hangi niş daha karlı?", "Türkiye'de ne satmalıyım?", "AOV nasıl artırılır?"].map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            // Send directly instead of setting input + delayed send
                            setDanismaMessages((prev) => [...prev, { role: "user", content: q }]);
                            setDanismaLoading(true);
                            const headers: Record<string, string> = { "Content-Type": "application/json" };
                            if (token) headers["Authorization"] = `Bearer ${token}`;
                            fetch("/api/chat", {
                              method: "POST",
                              headers,
                              body: JSON.stringify({ messages: [...danismaMessages, { role: "user", content: q }], model: "sonnet" }),
                            })
                              .then((r) => r.json())
                              .then((data) => setDanismaMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Bir hata oluştu." }]))
                              .catch(() => setDanismaMessages((prev) => [...prev, { role: "assistant", content: "Bağlantı hatası." }]))
                              .finally(() => setDanismaLoading(false));
                          }}
                          className="block w-full text-left px-3 py-2 rounded-lg bg-white/5 text-text-muted text-xs hover:bg-white/10 transition-colors border border-white/5"
                        >
                          {q}
                        </button>
                      ))
                  }
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "text-white rounded-br-md"
                      : "bg-white/5 border border-white/10 text-gray-100 rounded-bl-md"
                  }`}
                  style={msg.role === "user" ? { background: activeTab === "mentor" ? "#8b5cf6" : "var(--accent)" } : undefined}
                >
                  {msg.role === "assistant" ? (
                    activeTab === "mentor" ? (
                      <div className="whitespace-pre-wrap">
                        {parseToolCards(msg.content).map((part, j) =>
                          part.type === "tool"
                            ? renderMiniToolCard(part, j)
                            : <span key={j}>{formatMessage(part.content)}</span>
                        )}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{formatMessage(msg.content)}</div>
                    )
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1.5">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: activeTab === "mentor" ? "#a78bfa" : "#43e97b", animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Stage advance for mentor */}
          {activeTab === "mentor" && stageAdvance && (
            <div className="mx-3 mb-2 p-2.5 rounded-xl flex items-center justify-between" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
              <span className="text-xs" style={{ color: "#a78bfa" }}>→ {STAGE_NAMES[stageAdvance]}</span>
              <div className="flex gap-1.5">
                <button onClick={() => setStageAdvance(null)} className="px-2 py-1 rounded text-[10px] font-medium" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}>Henüz değil</button>
                <button onClick={() => { setMentorStage(stageAdvance); setStageAdvance(null); }} className="px-2 py-1 rounded text-[10px] font-medium" style={{ background: "#8b5cf6", color: "#fff" }}>Geç</button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={activeTab === "danisma" ? danismaInput : mentorInput}
                onChange={(e) => activeTab === "danisma" ? setDanismaInput(e.target.value) : setMentorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (activeTab === "danisma") handleDanismaSend();
                    else sendMentorMessage(mentorInput);
                  }
                }}
                placeholder={activeTab === "mentor" ? "Mentöre sor..." : "Bir şey sor..."}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-text-secondary focus:outline-none transition-colors"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              />
              <button
                onClick={() => activeTab === "danisma" ? handleDanismaSend() : sendMentorMessage(mentorInput)}
                disabled={isLoading || !(activeTab === "danisma" ? danismaInput.trim() : mentorInput.trim())}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30"
                style={{
                  background: activeTab === "mentor" ? "#8b5cf6" : "#43e97b",
                  boxShadow: `0 0 12px ${activeTab === "mentor" ? "rgba(139,92,246,0.3)" : "rgba(67,233,123,0.3)"}`,
                }}
              >
                {isLoading
                  ? <Loader2 size={16} className="text-white animate-spin" />
                  : <Send size={16} className="text-white" />
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
