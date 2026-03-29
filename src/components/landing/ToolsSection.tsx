"use client";

import { motion } from "framer-motion";
import {
  ChartBar,
  TrendUp,
  MagnifyingGlass,
  Package,
  Scales,
  FolderOpen,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

interface ToolDef {
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; weight?: "light"; color?: string }>;
  glowColor: string;
  iconColor: string;
  iconBorderColor: string;
  iconBgColor: string;
}

const tools: ToolDef[] = [
  {
    title: "Marka Araştırma",
    description: "Web cirosu, reklam geçmişi ve büyüme eğilimleri tek sorguda.",
    icon: ChartBar,
    glowColor: "#7c6ff7",
    iconColor: "#a89ef5",
    iconBorderColor: "rgba(124,111,247,0.16)",
    iconBgColor: "rgba(124,111,247,0.08)",
  },
  {
    title: "TikTok GMV Analizi",
    description: "Hangi ürünler TikTok Shop'ta patlıyor?",
    icon: TrendUp,
    glowColor: "#22c55e",
    iconColor: "#5dd4a8",
    iconBorderColor: "rgba(34,197,94,0.16)",
    iconBgColor: "rgba(34,197,94,0.08)",
  },
  {
    title: "AdSpy — Meta & TikTok",
    description: "Rakip reklamlara göz at, kazanan açıları keşfet.",
    icon: MagnifyingGlass,
    glowColor: "#3b82f6",
    iconColor: "#6ba8e8",
    iconBorderColor: "rgba(59,130,246,0.16)",
    iconBgColor: "rgba(59,130,246,0.08)",
  },
  {
    title: "Amazon Araştırma",
    description: "BSR, review trendi ve fiyat geçmişi ile kategori analizi.",
    icon: Package,
    glowColor: "#f59e0b",
    iconColor: "#e8b84b",
    iconBorderColor: "rgba(245,158,11,0.16)",
    iconBgColor: "rgba(245,158,11,0.08)",
  },
  {
    title: "Talep / Arz Skoru",
    description: "Pazar doygunluğu, hacim ve rekabet skoru tek bakışta.",
    icon: Scales,
    glowColor: "#22c55e",
    iconColor: "#2fc99a",
    iconBorderColor: "rgba(34,197,94,0.16)",
    iconBgColor: "rgba(34,197,94,0.08)",
  },
  {
    title: "Kayıtlı Klasörler",
    description: "Ürün, marka ve kreatifleri kaydet.",
    icon: FolderOpen,
    glowColor: "#ef4444",
    iconColor: "#e88080",
    iconBorderColor: "rgba(239,68,68,0.16)",
    iconBgColor: "rgba(239,68,68,0.08)",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: 0.15 + i * 0.08,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

export default function ToolsSection() {
  return (
    <section className="relative bg-[#0e0d12] py-24 md:py-32 px-6 overflow-hidden">
      {/* Subtle top gradient fade */}
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(14,13,18,0) 0%, rgba(14,13,18,1) 100%)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section label */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center text-sm tracking-widest uppercase text-[#7c6ff7] mb-4"
          style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
        >
          Araçlar
        </motion.p>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-center text-3xl sm:text-4xl md:text-5xl text-white max-w-3xl mx-auto mb-5"
          style={{
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          E-ticarette ihtiyacınız olan
          <br />
          her şey tek platformda
        </motion.h2>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-gray-400 text-base md:text-lg max-w-2xl mx-auto mb-16"
          style={{ fontFamily: "var(--font-body)", fontWeight: 400 }}
        >
          Her araç birbiriyle konuşur. Veriler birleşir, kararlar kolaylaşır.
        </motion.p>

        {/* Card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={cardVariants}
              className="group relative overflow-hidden rounded-2xl bg-[#16151d] border border-white/[0.06] p-7 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.1]"
            >
              {/* Colored glow — top left */}
              <div
                className="absolute -top-16 -left-16 w-48 h-48 rounded-full opacity-0 group-hover:opacity-[0.12] transition-opacity duration-500 blur-3xl pointer-events-none"
                style={{ backgroundColor: tool.glowColor }}
              />

              {/* Icon */}
              <div
                className="flex items-center justify-center mb-5"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  backgroundColor: tool.iconBgColor,
                  border: `1px solid ${tool.iconBorderColor}`,
                }}
              >
                <tool.icon size={18} weight="light" color={tool.iconColor} />
              </div>

              {/* Title */}
              <h3
                className="text-lg text-white mb-2"
                style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
              >
                {tool.title}
              </h3>

              {/* Description */}
              <p
                className="text-sm text-gray-400 leading-relaxed"
                style={{ fontFamily: "var(--font-body)", fontWeight: 400 }}
              >
                {tool.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
