"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, GraduationCap, User, RotateCcw } from "lucide-react";
import MentorStageBar from "./MentorStageBar";
import MentorToolCard from "./MentorToolCard";
import MentorWelcome from "./MentorWelcome";
import MentorImageUpload from "./MentorImageUpload";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ---------- Scripted Response Engine (no AI) ----------

interface ScriptedResponse {
  text: string;
  nextStage?: number;
}

function getScriptedResponse(message: string, stage: number): ScriptedResponse {
  const lower = message.toLowerCase();

  // Stage-independent responses
  if (lower.includes("merhaba") || lower.includes("selam") || lower.includes("başlamak")) {
    return {
      text: `Merhaba! Ben Faycom Mentörüyüm 👋

Sana e-ticarette adım adım rehberlik edeceğim. Şu anda **Aşama ${stage}** — ${STAGE_NAMES[stage]} aşamasındasın.

Başlamak için sana birkaç soru soracağım. Hangi ürün kategorisi veya niş ile ilgileniyorsun? Eğer henüz bir fikrin yoksa, trend ürünlere bakarak başlayabiliriz.

İlk adım olarak TikTok Shop'ta trend ürünlere bakalım:
[TOOL:/tts:TikTok Shop Araştırma:GMV bazlı trend ürünleri keşfet]`,
    };
  }

  if (lower.includes("teşekkür") || lower.includes("sağol") || lower.includes("eyvallah")) {
    return {
      text: "Rica ederim! Her zaman buradayım. Başka bir sorun olursa veya devam etmek istersen yazman yeterli 😊",
    };
  }

  // Stage-specific responses
  switch (stage) {
    case 1:
      return getStage1Response(lower);
    case 2:
      return getStage2Response(lower);
    case 3:
      return getStage3Response(lower);
    case 4:
      return getStage4Response(lower);
    case 5:
      return getStage5Response(lower);
    default:
      return getStage1Response(lower);
  }
}

const STAGE_NAMES: Record<number, string> = {
  1: "Ürün Araştırması",
  2: "Tedarikçi Bulma",
  3: "Mağaza Kurulumu",
  4: "İçerik & Tedarik",
  5: "Reklam Analizi",
};

function getStage1Response(msg: string): ScriptedResponse {
  if (msg.includes("ürün") || msg.includes("ne satayım") || msg.includes("fikir") || msg.includes("bilmiyorum") || msg.includes("nasıl")) {
    return {
      text: `Harika, ürün araştırmasına başlayalım! 🔍

**Ürün bulmak için 3 adımlı yaklaşım:**

**1. Trend Ürünleri Bul** — TikTok Shop'ta GMV (satış hacmi) yüksek ürünlere bak. GMV yüksekse = gerçek talep var demektir.
[TOOL:/tts:TikTok Shop Araştırma:GMV bazlı trend ürünleri keşfet]

**2. Rakip Reklamlarını Ara** — O nişte aktif reklam veren markalar var mı? Birisi reklam veriyorsa, para kazanıyor demektir.
[TOOL:/reklam-tara:Reklam Merkezi:Aktif Meta reklamlarını keşfet]

**3. Marka Trafiğini Kontrol Et** — Bulduğun markaların trafiğine bak. Trafik artıyorsa = büyüyen bir pazar.
[TOOL:/storeleads:Mağaza Keşif:Marka trafiği ve büyüme analizi]

Önce TikTok Shop'a gidip ilgini çeken bir ürün bul, sonra bana söyle!`,
    };
  }

  if (msg.includes("buldum") || msg.includes("karar verdim") || msg.includes("seçtim") || msg.includes("bu ürün")) {
    return {
      text: `Süper! Ürün kararını verdin gibi görünüyor 🎯

Karar vermeden önce şu kontrolleri yaptın mı?
- ✅ TikTok Shop'ta GMV trendi yükseliyor mu?
- ✅ En az 2-3 rakip marka aktif reklam veriyor mu?
- ✅ Bu markaların trafik trendi nasıl?

Eğer bunların hepsini kontrol ettiysen, **bir sonraki aşamaya geçmeye hazırsın: Tedarikçi Bulma!** 🚀

Tedarikçi araştırmasına geçmek ister misin?`,
      nextStage: 2,
    };
  }

  if (msg.includes("gmv") || msg.includes("satış")) {
    return {
      text: `**GMV (Gross Merchandise Value)** = Toplam satış hacmi.

Bir ürünün GMV'si yüksekse, insanlar gerçekten satın alıyor demektir. Bu sadece "popüler" olmaktan farklı — gerçek para akışını gösterir.

Bakmak istediğin şey:
- **Günlük/haftalık GMV trendi** yükseliyor mu?
- **Birden fazla satıcı** aynı ürünü satıyor mu? (Evet = talep kanıtlanmış)
- **Fiyat aralığı** nerede? (Çok ucuzsa marj düşük olabilir)

Hadi TikTok Shop'tan trend ürünlere bakalım:
[TOOL:/tts:TikTok Shop Araştırma:GMV bazlı trend ürünleri keşfet]`,
    };
  }

  if (msg.includes("reklam") || msg.includes("meta") || msg.includes("facebook")) {
    return {
      text: `Reklam araştırması çok önemli! 📊

Bir nişte aktif reklam veren markalar varsa bu **pozitif sinyal**:
- Reklam veriyorlar = Para harcıyorlar = Kâr ediyorlar (yoksa durarlardı)
- Birden fazla marka reklam veriyorsa = Pazar büyüyor

Reklam Tara aracıyla rakip reklamları bulabilirsin:
[TOOL:/reklam-tara:Reklam Merkezi:Aktif Meta reklamlarını keşfet]

Bütünsel Analiz ile daha geniş pazar resmini de görebilirsin:
[TOOL:/kombine:Bütünsel Analiz:Çoklu kaynaklardan kapsamlı analiz]`,
    };
  }

  // Default Stage 1
  return {
    text: `Şu anda **Ürün Araştırması** aşamasındasın.

Bu aşamada amacın satacağın ürünü bulmak. İşte kullanabileceğin araçlar:

[TOOL:/tts:TikTok Shop Araştırma:GMV bazlı trend ürünleri keşfet]
[TOOL:/reklam-tara:Reklam Merkezi:Aktif Meta reklamlarını keşfet]
[TOOL:/storeleads:Mağaza Keşif:Marka trafiği ve büyüme analizi]
[TOOL:/amazon:Pazar Talebi:Amazon pazar hacim analizi]

Hangi ürün kategorisiyle ilgileniyorsun? Ya da "ne satayım bilmiyorum" diyorsan, birlikte trend ürünlere bakalım!`,
  };
}

function getStage2Response(msg: string): ScriptedResponse {
  if (msg.includes("tedarikçi") || msg.includes("üretici") || msg.includes("toptancı") || msg.includes("nasıl")) {
    return {
      text: `Tedarikçi bulmaya başlayalım! 🏭

Önce platformdaki tedarikçilere göz at:
[TOOL:/icerik-tedarik/suppliers:Tedarikçi Pazaryeri:Üretici ve toptancıları keşfet]

Tedarikçiye mesaj atarken şu şablonu kullan:

**"Merhaba, [ürün adı] ile ilgileniyorum.**
- **Üretici misiniz yoksa toptancı mısınız?** (Üretici tercih ediyorum)
- **MOQ (minimum sipariş adedi)** nedir?
- **Birim fiyat:** MOQ'da, 2x MOQ'da ve 5x MOQ'da ne kadar?
- **Numune maliyeti** ve teslim süresi nedir?
- **Özel ambalaj/etiketleme** yapabiliyor musunuz?"

**Neden bu sorular önemli:**
- Üretici = doğrudan markalaşma imkanı
- Kademeli fiyat = ölçekleme planın
- Numune = kalite kontrolü (toplu sipariş vermeden test et!)

En az **3 tedarikçiye** ulaşmanı öneriyorum.`,
    };
  }

  if (msg.includes("teklif") || msg.includes("fiyat") || msg.includes("aldım") || msg.includes("karşılaştır")) {
    return {
      text: `Teklifleri karşılaştıralım! 📋

Şu kriterlere göre değerlendir:
- **Birim fiyat / MOQ dengesi** — En düşük fiyat her zaman en iyi değil, MOQ da önemli
- **Profesyonellik** — Hızlı ve detaylı cevap veriyorlar mı?
- **Numune kalitesi** — Numune sipariş ettin mi?

**🚩 Kırmızı bayraklar:**
- Çok düşük fiyat (kalite sorunu olabilir)
- MOQ çok yüksek (başlangıç için riskli)
- Numune göndermek istemeyen tedarikçi
- İletişimde geç ve kısa cevaplar

Tedarikçi seçimini yaptıysan, **mağaza kurulumuna** geçebiliriz!`,
      nextStage: 3,
    };
  }

  return {
    text: `Şu anda **Tedarikçi Bulma** aşamasındasın.

Platformdaki tedarikçilere göz at:
[TOOL:/icerik-tedarik/suppliers:Tedarikçi Pazaryeri:Üretici ve toptancıları keşfet]

"Tedarikçiye nasıl yazayım?" dersen şablon verebilirim. "Teklif aldım" dersen karşılaştırma yapalım.

Nasıl devam etmek istersin?`,
  };
}

function getStage3Response(msg: string): ScriptedResponse {
  if (msg.includes("mağaza") || msg.includes("site") || msg.includes("shopify") || msg.includes("kur")) {
    return {
      text: `Mağaza kurulumuna geçelim! 🛍️

**Başarılı bir e-ticaret sitesinin 5 temel unsuru:**

**1. Hero Section** — Tek net değer önerisi. "Her şey" değil, "bu ürün seni neden ilgilendirmeli" mesajı.

**2. Renk Paleti** — Max 2-3 renk. Ürününle uyumlu olmalı.

**3. Ürün Görselleri** — Temiz arka plan + yaşam tarzı fotoğrafları + boyut referansı.

**4. Güven Sinyalleri** — Yorumlar, iade politikası, iletişim bilgisi. Scroll etmeden görünmeli!

**5. Mobil Öncelikli** — Müşterilerin %70+'ı telefondan geliyor. Her sayfayı telefonda test et.

Fiyatlandırma için Birim Ekonomi Hesaplayıcı'yı kullan:
[TOOL:/tools/urun-ekonomisi:Birim Ekonomi Hesaplayıcı:Ürün maliyet ve kâr analizi]
[TOOL:/tools/nakit-akisi:Nakit Akışı Hesaplayıcı:Nakit akışı projeksiyonu]`,
    };
  }

  if (msg.includes("fiyat") || msg.includes("ekonomi") || msg.includes("maliyet") || msg.includes("marj")) {
    return {
      text: `Fiyatlandırma kritik! 💰

**Fiyat formülü:**
COGS (ürün maliyeti) + Kargo + Reklam Maliyeti + Platform Komisyonu = **Başabaş Noktası**
Başabaş Noktası + **Marj Hedefi (%30-50)** = Satış Fiyatı

Birim Ekonomi Hesaplayıcı ile hesaplayalım:
[TOOL:/tools/urun-ekonomisi:Birim Ekonomi Hesaplayıcı:Ürün maliyet ve kâr analizi]

Nakit akışını da kontrol et — ilk aylar negatif olabilir, bunu planla:
[TOOL:/tools/nakit-akisi:Nakit Akışı Hesaplayıcı:Nakit akışı projeksiyonu]`,
    };
  }

  if (msg.includes("hazır") || msg.includes("tamamdır") || msg.includes("bitti") || msg.includes("kurdum")) {
    return {
      text: `Mağazan hazır! 🎉

Son kontrol listesi:
- ✅ Ürün sayfaları hazır mı?
- ✅ Ödeme sistemi çalışıyor mu?
- ✅ Kargo ayarları tamam mı?
- ✅ Mobilde test ettim mi?
- ✅ Fiyatlandırma hesaplandı mı?

Her şey tamamsa **İçerik & Tedarik** aşamasına geçelim! Creator bulma ve tedarikçi finalize etme zamanı 🚀`,
      nextStage: 4,
    };
  }

  return {
    text: `Şu anda **Mağaza Kurulumu** aşamasındasın.

Fiyatlandırma hesaplamak için:
[TOOL:/tools/urun-ekonomisi:Birim Ekonomi Hesaplayıcı:Ürün maliyet ve kâr analizi]

"Mağazamı nasıl kurayım?" dersen adım adım rehberlik edebilirim. Ne konuda yardıma ihtiyacın var?`,
  };
}

function getStage4Response(msg: string): ScriptedResponse {
  if (msg.includes("creator") || msg.includes("içerik") || msg.includes("ugc") || msg.includes("influencer") || msg.includes("video")) {
    return {
      text: `İçerik üretimi zamanı! 🎬

Creator bulmak için:
[TOOL:/icerik-tedarik/creators:Creator Pazaryeri:UGC ve influencer'ları keşfet]

**Creator seçim kriterleri:**
- **Niş uyumu** > takipçi sayısı (10K alakalı takipçi > 100K alakasız)
- **Engagement rate** önemli, sadece görüntülenme değil
- 2-3 **mikro creator** (10K-100K) ile başla

**Fiyat rehberi:**
- UGC (sadece video, paylaşım yok): **500-2000 TL**
- Kendi hesabında paylaşım: UGC fiyatının **2x-5x**'i
- HER ZAMAN **reklam kullanım hakkı** iste!

**Video Script Yapısı (Hook-Body-CTA):**
- **Hook (0-3 sn):** Dikkat çekici — soru veya cesur ifade
- **Body (3-25 sn):** Problem → Çözüm → Kanıt
- **CTA (son 3 sn):** Tek net aksiyon — "Linke tıkla" gibi`,
    };
  }

  if (msg.includes("tedarik") || msg.includes("sipariş") || msg.includes("ambalaj") || msg.includes("üretim")) {
    return {
      text: `Tedarikçi ilişkisini derinleştirelim! 📦

Artık markanı ve hedeflerini biliyorsun. Şimdi:
[TOOL:/icerik-tedarik/suppliers:Tedarikçi Pazaryeri:Tedarikçi ilişkilerini derinleştir]

**Finalize etmen gerekenler:**
- **Özel ambalaj/etiketleme** detayları — logo, renkler, kutu tasarımı
- **İlk toplu sipariş** miktarı — MOQ veya biraz üstü (çok fazla stok tutma)
- **Teslimat takvimi** — ilk siparişten teslimata kaç gün?
- **Ödeme koşulları** — peşin mi, yarı yarıya mı?
- **Kalite kontrol** — numune onayı → üretim → sevkiyat süreci

Hem creator hem tedarikçi işlerin tamamsa, **reklam aşamasına** geçebiliriz!`,
      nextStage: 5,
    };
  }

  return {
    text: `Şu anda **İçerik & Tedarik** aşamasındasın. İki iş var:

**A) İçerik Üretimi:**
[TOOL:/icerik-tedarik/creators:Creator Pazaryeri:UGC ve influencer'ları keşfet]

**B) Tedarikçi Finalize:**
[TOOL:/icerik-tedarik/suppliers:Tedarikçi Pazaryeri:Tedarikçi ilişkilerini derinleştir]

Hangisiyle başlamak istersin?`,
  };
}

function getStage5Response(msg: string): ScriptedResponse {
  if (msg.includes("reklam") || msg.includes("analiz") || msg.includes("kampanya") || msg.includes("meta")) {
    return {
      text: `Reklam analizi zamanı! 📊

Önce rakip reklamlarını incele:
[TOOL:/reklam-tara:Reklam Merkezi:Rakip Meta reklamlarını analiz et]

**Öğrenmen gereken temel metrikler:**
- **CTR (Click-Through Rate):** Reklamı görenlerin kaçı tıklıyor? %1 üstü genelde iyi.
- **CPM (Cost Per Mille):** 1000 gösterim başına maliyet. Nişe göre değişir.
- **CPC (Cost Per Click):** Tıklama başına maliyet.
- **ROAS (Return on Ad Spend):** Reklama harcadığın her 1 TL için kazandığın. 2x+ hedefle.
- **Frequency:** Aynı kişi reklamı kaç kez gördü? 3+ ise reklam yorgunluğu başlıyor.

Reklam kampanya görselini yükleyebilirsin — birlikte analiz edelim! 📸`,
    };
  }

  if (msg.includes("ctr") || msg.includes("cpm") || msg.includes("roas") || msg.includes("cpc")) {
    return {
      text: `Metrikleri anlamak çok önemli!

Sence bu metrikler ne anlatıyor? Şu soruları düşün:

- **CTR düşükse** → Reklam görseli veya başlık yeterince dikkat çekmiyor olabilir. Creative'i test ettin mi?
- **CPM yüksekse** → Hedefleme çok dar veya rekabet yoğun olabilir. Farklı hedef kitle denedin mi?
- **ROAS düşükse** → Landing page'de sorun olabilir veya ürün-pazar uyumu zayıf olabilir.

Sana bir şey söylemem gerekiyor: **Ben sana "bu reklam iyi/kötü" demem.** Bunun yerine doğru soruları sorarak **senin kendi analizini yapmanı** sağlarım. Böylece her kampanyanda bağımsız karar verebilirsin.

Kampanya görselini yükle, birlikte bakalım! 📸`,
    };
  }

  // Image upload or generic
  return {
    text: `Şu anda **Reklam Analizi** aşamasındasın.

Bu aşamada reklam metriklerini okumayı ve yorumlamayı öğreneceksin.

[TOOL:/reklam-tara:Reklam Merkezi:Rakip Meta reklamlarını analiz et]

Kampanya görselini yükleyebilirsin — birlikte yapısal olarak inceleriz. Ya da reklam metrikleri hakkında soru sorabilirsin.

Ne ile başlamak istersin?`,
  };
}

// ---------- Tool Card Parser (reused from MentorChat) ----------

function parseToolCards(text: string): Array<{ type: "text"; content: string } | { type: "tool"; route: string; name: string; description: string }> {
  const toolRegex = /\[TOOL:(\/[^:]+):([^:]+):([^\]]+)\]/g;
  const parts: Array<{ type: "text"; content: string } | { type: "tool"; route: string; name: string; description: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = toolRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "tool", route: match[1], name: match[2], description: match[3] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", content: text }];
}

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

// ---------- Shared localStorage persistence ----------

const MENTOR_STORAGE_KEY = "mentor2_state";
const MENTOR_SYNC_EVENT = "mentor-state-change";

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

function saveMentorState(state: MentorState, notify = false) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MENTOR_STORAGE_KEY, JSON.stringify(state));
    if (notify) window.dispatchEvent(new Event(MENTOR_SYNC_EVENT));
  } catch { /* ignore */ }
}

// ---------- Main Component ----------

export default function MentorMockChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
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

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadMentorState();
    setMessages(saved.messages);
    setStage(saved.stage);
    setHasStarted(saved.messages.length > 0);
  }, []);

  // Listen for sync events from floating chat
  useEffect(() => {
    function handleSync() {
      const saved = loadMentorState();
      setMessages(saved.messages);
      setStage(saved.stage);
      setHasStarted(saved.messages.length > 0);
    }
    window.addEventListener(MENTOR_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(MENTOR_SYNC_EVENT, handleSync);
  }, []);

  // Save to localStorage whenever messages or stage change (skip during typing animation)
  const isTypingRef = useRef(false);
  useEffect(() => { isTypingRef.current = isTyping; }, [isTyping]);

  useEffect(() => {
    if (messages.length > 0 && !isTypingRef.current) {
      saveMentorState({ messages, stage });
    }
  }, [messages, stage]);

  // Simulate typing delay then add response
  function simulateResponse(text: string, userMsg: string) {
    setIsTyping(true);

    const response = getScriptedResponse(userMsg, stage);

    const words = response.text.split(" ");
    let accumulated = "";
    let wordIndex = 0;

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const interval = setInterval(() => {
      if (wordIndex >= words.length) {
        clearInterval(interval);
        setIsTyping(false);

        // Save final state after typing is done and notify floating chat
        setMessages((prev) => {
          const final = [...prev];
          saveMentorState({ messages: final, stage: response.nextStage || stage }, true);
          return final;
        });

        if (response.nextStage) {
          setStageAdvancePrompt(response.nextStage);
        }
        return;
      }

      accumulated += (wordIndex > 0 ? " " : "") + words[wordIndex];
      wordIndex++;

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: accumulated };
        return updated;
      });
    }, 30);
  }

  function sendMessage(text: string) {
    if (!text.trim() || isTyping) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setHasStarted(true);
    setImageBase64(null);

    setTimeout(() => {
      simulateResponse(text, text.trim());
    }, 300);
  }

  function handleStageAdvance(nextStage: number) {
    setStage(nextStage);
    setStageAdvancePrompt(null);
    saveMentorState({ messages, stage: nextStage }, true);
  }

  function handleReset() {
    if (!confirm("Tüm konuşma silinecek. Emin misin?")) return;
    setMessages([]);
    setStage(1);
    setHasStarted(false);
    setImageBase64(null);
    setStageAdvancePrompt(null);
    localStorage.removeItem(MENTOR_STORAGE_KEY);
    window.dispatchEvent(new Event(MENTOR_SYNC_EVENT));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  // Welcome screen
  if (!hasStarted) {
    return (
      <MentorWelcome
        username="Test"
        onStart={() => sendMessage("Merhaba, e-ticarete başlamak istiyorum!")}
        onQuestionClick={(q) => sendMessage(q)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Stage bar + reset */}
      <div className="flex items-center border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex-1">
          <MentorStageBar currentStage={stage} />
        </div>
        <button
          onClick={handleReset}
          className="p-2 mr-2 rounded-lg transition-all duration-150"
          title="Baştan başla"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5" style={{ background: "rgba(139, 92, 246, 0.15)" }}>
                <GraduationCap size={16} style={{ color: "#a78bfa" }} />
              </div>
            )}

            <div
              className="max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={
                msg.role === "user"
                  ? { background: "#8b5cf6", color: "#fff", borderBottomRightRadius: "6px" }
                  : { background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", borderBottomLeftRadius: "6px" }
              }
            >
              {msg.role === "user" ? (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              ) : (
                <div className="space-y-1">
                  {parseToolCards(msg.content).map((part, j) =>
                    part.type === "tool" ? (
                      <MentorToolCard key={j} route={part.route} toolName={part.name} description={part.description} />
                    ) : (
                      <span key={j} className="whitespace-pre-wrap">{formatText(part.content)}</span>
                    )
                  )}
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5" style={{ background: "var(--bg-hover)" }}>
                <User size={16} style={{ color: "var(--text-muted)" }} />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(139, 92, 246, 0.15)" }}>
              <GraduationCap size={16} style={{ color: "#a78bfa" }} />
            </div>
            <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
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
        <div className="mx-4 mb-2 p-3 rounded-xl flex items-center justify-between" style={{ background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.3)" }}>
          <span className="text-sm" style={{ color: "#a78bfa" }}>
            Sonraki aşamaya geçmeye hazır mısın? → {STAGE_NAMES[stageAdvancePrompt]}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setStageAdvancePrompt(null)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}>
              Henüz değil
            </button>
            <button onClick={() => handleStageAdvance(stageAdvancePrompt)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: "#8b5cf6", color: "#fff" }}>
              Evet, geç
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}>
        {imageBase64 && (
          <div className="mb-2">
            <MentorImageUpload onImageSelect={setImageBase64} previewUrl={imageBase64} />
          </div>
        )}

        <div className="flex items-end gap-2">
          {stage >= 5 && !imageBase64 && (
            <MentorImageUpload onImageSelect={setImageBase64} previewUrl={null} />
          )}

          <div className="flex-1 rounded-xl overflow-hidden" style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={stage >= 5 ? "Mesajını yaz veya reklam görseli ekle..." : "Mesajını yaz..."}
              rows={1}
              className="w-full px-4 py-3 text-sm resize-none bg-transparent outline-none"
              style={{ color: "var(--text-primary)", maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
          </div>

          <button
            onClick={() => sendMessage(input)}
            disabled={isTyping || !input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150"
            style={{
              background: input.trim() ? "#8b5cf6" : "var(--bg-hover)",
              color: input.trim() ? "#fff" : "var(--text-muted)",
              cursor: input.trim() && !isTyping ? "pointer" : "default",
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
