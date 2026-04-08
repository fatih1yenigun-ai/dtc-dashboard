"use client";

import Link from "next/link";
import { Users, Factory, ArrowRight, Video, Package } from "lucide-react";

const cards = [
  {
    title: "İçerik Üreticileri",
    description: "UGC içerik üreticileri ve influencer'ları keşfet",
    icon: Users,
    href: "/icerik-tedarik/creators",
    accent: "#667eea",
    secondaryCta: { label: "İçerik Üreticisi Ol", href: "/join/creator" },
  },
  {
    title: "Tedarik",
    description: "Üretici ve toptancıları bul, tedarik zincirinizi güçlendirin",
    icon: Factory,
    href: "/icerik-tedarik/suppliers",
    accent: "#f59e0b",
    secondaryCta: { label: "Tedarikçi Ol", href: "/join/supplier" },
  },
];

export default function IcerikTedarikPage() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-text-primary">
          İçerik &amp; Tedarik
        </h1>
        <p className="text-text-secondary mt-1">
          İçerik üreticileri ve tedarikçilerle bağlantı kur
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group bg-bg-card rounded-[14px] border border-border-default p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              style={{ borderTopColor: card.accent, borderTopWidth: 3 }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                  style={{ backgroundColor: `${card.accent}20` }}
                >
                  <Icon size={24} style={{ color: card.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-text-primary group-hover:underline">
                    {card.title}
                  </h2>
                  <p className="text-sm text-text-secondary mt-1">
                    {card.description}
                  </p>
                </div>
                <ArrowRight
                  size={20}
                  className="text-text-muted mt-1 transition-transform group-hover:translate-x-1"
                />
              </div>

              <div className="mt-5 pt-4 border-t border-border-default">
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                  style={{ color: card.accent }}
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = card.secondaryCta.href;
                  }}
                >
                  {card.secondaryCta.label}
                  <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
