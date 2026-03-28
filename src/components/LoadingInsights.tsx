"use client";

import { useState, useEffect } from "react";

interface InsightCard {
  type: "quote" | "tip" | "success" | "offer";
  emoji: string;
  title: string;
  content: string;
  source?: string;
  color: string;
}

const INSIGHTS: InsightCard[] = [
  // Quotes
  {
    type: "quote",
    emoji: "💬",
    title: "Jeff Bezos",
    content: "Your brand is what other people say about you when you're not in the room.",
    source: "Amazon Kurucusu",
    color: "#667eea",
  },
  {
    type: "quote",
    emoji: "💬",
    title: "Gary Vaynerchuk",
    content: "Stop selling. Start helping. DTC'nin altın kuralı budur.",
    source: "VaynerMedia CEO",
    color: "#764ba2",
  },
  {
    type: "quote",
    emoji: "💬",
    title: "Tobi Lütke",
    content: "The next generation of commerce will be about experiences, not transactions.",
    source: "Shopify Kurucusu",
    color: "#f093fb",
  },
  {
    type: "quote",
    emoji: "💬",
    title: "Emily Weiss",
    content: "Every person is an influencer. Her müşteri marka elçinizdir.",
    source: "Glossier Kurucusu",
    color: "#4facfe",
  },
  {
    type: "quote",
    emoji: "💬",
    title: "Yvon Chouinard",
    content: "The more you know, the less you need. Sürdürülebilirlik = Karlılık.",
    source: "Patagonia Kurucusu",
    color: "#43e97b",
  },
  {
    type: "quote",
    emoji: "💬",
    title: "Sara Blakely",
    content: "Don't be intimidated by what you don't know. $0 reklam bütçesiyle $1B marka kurdum.",
    source: "Spanx Kurucusu",
    color: "#fa709a",
  },
  // Success Stories
  {
    type: "success",
    emoji: "🚀",
    title: "Glossier: $0 → $1.8B",
    content: "Blog'dan başlayıp topluluk odaklı büyüme ile 5 yılda $1.8B değerlemeye ulaştı. Sır: müşteri feedback loop.",
    color: "#f093fb",
  },
  {
    type: "success",
    emoji: "🚀",
    title: "Gymshark: Garajdan $1.5B",
    content: "19 yaşında garajda başladı. Instagram influencer seeding ile 8 yılda $1.5B değerleme. Sıfır geleneksel reklam.",
    color: "#4facfe",
  },
  {
    type: "success",
    emoji: "🚀",
    title: "Dollar Shave Club: 1 Video = $1B",
    content: "Tek bir viral YouTube videosu ile 48 saat içinde 12,000 müşteri kazandı. 4 yıl sonra Unilever'a $1B'a satıldı.",
    color: "#43e97b",
  },
  {
    type: "success",
    emoji: "🚀",
    title: "Allbirds: Sürdürülebilir Ayakkabı",
    content: "Yün ayakkabı konseptiyle başladı. Time dergisi 'dünyanın en rahat ayakkabısı' seçti. $100M+ gelir.",
    color: "#667eea",
  },
  {
    type: "success",
    emoji: "🚀",
    title: "Bearaby: Kickstarter → Inc. 5000",
    content: "Kickstarter'da $237K topladı. Dolgu-free ağırlıklı battaniye ile 4999% gelir artışı. Aylık $1.9M ciro.",
    color: "#fa709a",
  },
  {
    type: "success",
    emoji: "🚀",
    title: "The Oodie: $300M+ Gelir",
    content: "Avustralya'dan bir hoodie battaniye. Facebook Ads + TikTok viral ile $300M+ gelire ulaştı. Sadece online.",
    color: "#764ba2",
  },
  // Tips
  {
    type: "tip",
    emoji: "💡",
    title: "Winning Creative Açısı",
    content: "UGC (User Generated Content) reklamları, profesyonel reklamlara göre %4x daha yüksek dönüşüm oranına sahip.",
    color: "#43e97b",
  },
  {
    type: "tip",
    emoji: "💡",
    title: "AOV Artırma Taktiği",
    content: "Ürün bundling + 'Birini al ikincisi %50' teklifleri AOV'yi ortalama %35 artırır.",
    color: "#4facfe",
  },
  {
    type: "tip",
    emoji: "💡",
    title: "Email = Gizli Silah",
    content: "DTC markalarının gelirlerinin %30-40'ı email marketing'den gelir. Abandoned cart serileri %10+ recovery sağlar.",
    color: "#667eea",
  },
  {
    type: "tip",
    emoji: "💡",
    title: "Landing Page Kuralı",
    content: "Tek ürün, tek CTA, tek mesaj. Basit landing page'ler karmaşık olanlara göre %220 daha fazla dönüşüm sağlar.",
    color: "#f093fb",
  },
  {
    type: "tip",
    emoji: "💡",
    title: "Retargeting Altın Kuralı",
    content: "İlk 3 gün içinde retarget edilen kullanıcılar %70 daha yüksek dönüşüm oranına sahip.",
    color: "#fa709a",
  },
  {
    type: "tip",
    emoji: "💡",
    title: "Sosyal Kanıt = Güven",
    content: "Ürün sayfasında video review olan ürünler, olmayanlara göre %84 daha fazla satış yapıyor.",
    color: "#764ba2",
  },
  {
    type: "tip",
    emoji: "💡",
    title: "TikTok Shop Fırsatı",
    content: "TikTok Shop'ta ortalama müşteri edinme maliyeti Meta'nın %60 altında. 2024-2025'in en büyük DTC fırsatı.",
    color: "#43e97b",
  },
  // Offers & Strategies
  {
    type: "offer",
    emoji: "🎯",
    title: "Free + Shipping Modeli",
    content: "Ürünü ücretsiz ver, sadece kargo al. Müşteri listesi oluştur, upsell ile kar et. Info-product'larda %500 ROI.",
    color: "#fa709a",
  },
  {
    type: "offer",
    emoji: "🎯",
    title: "Abonelik = Sürekli Gelir",
    content: "Abonelik modeli LTV'yi %3-5x artırır. Müşteri churn'ü düşürmek için ilk 3 ay %20 indirim stratejisi.",
    color: "#667eea",
  },
  {
    type: "offer",
    emoji: "🎯",
    title: "Influencer Seeding",
    content: "100 micro-influencer'a ücretsiz ürün gönder. %15-20'si organik paylaşım yapar. CAC neredeyse $0.",
    color: "#4facfe",
  },
  {
    type: "offer",
    emoji: "🎯",
    title: "Launch Stratejisi: Waitlist",
    content: "Lansmandan önce waitlist oluştur. İlk 1000 kişiye early access ver. FOMO + sosyal kanıt = viral launch.",
    color: "#764ba2",
  },
  {
    type: "offer",
    emoji: "🎯",
    title: "Referral Loop",
    content: "'Arkadaşını davet et, ikiniz de %20 indirim kazanın.' Dropbox bu stratejiyle %3900 büyüdü.",
    color: "#43e97b",
  },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function LoadingInsights() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards] = useState(() => shuffleArray(INSIGHTS));
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
        setIsVisible(true);
      }, 400);
    }, 4500);
    return () => clearInterval(interval);
  }, [cards.length]);

  const card = cards[currentIndex];
  const nextCard = cards[(currentIndex + 1) % cards.length];
  const prevCard = cards[(currentIndex - 1 + cards.length) % cards.length];

  const typeLabel = {
    quote: "Alıntı",
    tip: "İpucu",
    success: "Başarı Hikayesi",
    offer: "Strateji",
  };

  return (
    <div className="mt-8 mb-4">
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: i === currentIndex % 5 ? 24 : 6,
              background: i === currentIndex % 5 ? card.color : "rgba(0,0,0,0.1)",
            }}
          />
        ))}
      </div>

      {/* Cards container */}
      <div className="relative flex items-center justify-center gap-4 px-4">
        {/* Previous card (peek) */}
        <div
          className="hidden md:block w-64 flex-shrink-0 rounded-2xl p-5 opacity-30 scale-90 blur-[1px] transition-all duration-500"
          style={{
            background: `linear-gradient(135deg, ${prevCard.color}15, ${prevCard.color}08)`,
            border: `1px solid ${prevCard.color}20`,
          }}
        >
          <p className="text-gray-400 text-xs truncate">{prevCard.title}</p>
          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{prevCard.content}</p>
        </div>

        {/* Current card */}
        <div
          className={`w-full max-w-lg flex-shrink-0 rounded-2xl p-6 transition-all duration-500 ${
            isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
          }`}
          style={{
            background: `linear-gradient(135deg, ${card.color}12, ${card.color}06)`,
            border: `1px solid ${card.color}25`,
            boxShadow: `0 4px 30px ${card.color}10`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{card.emoji}</span>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                background: `${card.color}20`,
                color: card.color,
              }}
            >
              {typeLabel[card.type]}
            </span>
          </div>

          <h3
            className="text-base font-bold mb-2"
            style={{ color: card.color }}
          >
            {card.title}
          </h3>

          <p className="text-gray-600 text-sm leading-relaxed">
            {card.content}
          </p>

          {card.source && (
            <p className="text-gray-400 text-xs mt-3 italic">— {card.source}</p>
          )}
        </div>

        {/* Next card (peek) */}
        <div
          className="hidden md:block w-64 flex-shrink-0 rounded-2xl p-5 opacity-30 scale-90 blur-[1px] transition-all duration-500"
          style={{
            background: `linear-gradient(135deg, ${nextCard.color}15, ${nextCard.color}08)`,
            border: `1px solid ${nextCard.color}20`,
          }}
        >
          <p className="text-gray-400 text-xs truncate">{nextCard.title}</p>
          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{nextCard.content}</p>
        </div>
      </div>
    </div>
  );
}
