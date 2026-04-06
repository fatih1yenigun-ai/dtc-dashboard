"use client";

import { Calculator, TrendingUp, Subtitles, FileText, ImageIcon, Sparkles } from "lucide-react";
import ToolCard from "@/components/tools/ToolCard";

const EKONOMI_TOOLS = [
  {
    title: "Ürün Ekonomisi",
    description: "Birim maliyet, kâr marjı ve ROAS matrisini tek ekranda hesapla.",
    icon: Calculator,
    href: "/tools/urun-ekonomisi",
    accentColor: "#40c860",
  },
  {
    title: "Nakit Akışı",
    description: "Gelir, gider ve reklam harcamalarını takip et, nakit akışını görselleştir.",
    icon: TrendingUp,
    href: "/tools/nakit-akisi",
    accentColor: "#20d0f8",
  },
];

const YARATICI_TOOLS = [
  {
    title: "Altyazı Kaldırıcı",
    description: "Videolardan altyazı ve metin katmanlarını otomatik temizle.",
    icon: Subtitles,
  },
  {
    title: "Script Yazıcı",
    description: "Ürün videolarına uygun satış scriptleri oluştur.",
    icon: FileText,
  },
  {
    title: "Görsel Üretici",
    description: "Ürün görselleri ve reklam kreatifleri üret.",
    icon: ImageIcon,
  },
];

export default function ToolsPage() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-text-primary">Atölye</h1>
        <p className="text-text-secondary mt-1">İşini büyütecek araçlar</p>
      </div>

      {/* Ekonomi */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Ekonomi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EKONOMI_TOOLS.map((tool) => (
            <ToolCard
              key={tool.title}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              href={tool.href}
              accentColor={tool.accentColor}
            />
          ))}
        </div>
      </section>

      {/* Yaratıcı Asistan */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Yaratıcı Asistan</h2>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 flex items-center gap-1">
            <Sparkles size={11} />
            Beta
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {YARATICI_TOOLS.map((tool) => (
            <ToolCard
              key={tool.title}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              disabled
              badge="Yakında"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
