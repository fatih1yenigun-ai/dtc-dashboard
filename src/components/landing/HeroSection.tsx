"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import {
  FolderOpen,
  Info,
  MetaLogo,
  TiktokLogo,
} from "@phosphor-icons/react";
import CircuitBackground from "./CircuitBackground";

const CTA_URL = "https://dtc-dashboard-sigma.vercel.app/tts";

const tickerItems = [
  { name: "Boyun yastığı", stat: "↑ $1.2M GMV", up: true },
  { name: "LED şerit", stat: "↑ %88 arama hacmi", up: true },
  { name: "Protein tozu", stat: "↓ Doymuş pazar", up: false },
  { name: "Evcil hayvan eldiveni", stat: "↑ 340 yeni reklam", up: true },
  { name: "Kore cilt bakım", stat: "↑ %92 arama artışı", up: true },
  { name: "Takviye ürünler", stat: "↑ %66 AyÜAy", up: true },
  { name: "Mavi ışık gözlüğü", stat: "↓ CPC düşüyor", up: false },
  { name: "Matcha tozu", stat: "↑ Trend olan", up: true },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function HeroSection() {
  return (
    <section className="relative bg-white overflow-x-clip">
      <CircuitBackground />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href={CTA_URL} className="flex items-center gap-2 cursor-pointer">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span
              className="text-xl tracking-tight text-gray-900"
              style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
            >
              Markett
            </span>
          </a>

          {/* Nav links — hidden on mobile */}
          <div className="hidden md:flex items-center gap-8">
            {["Özellikler", "Fiyatlar", "Uzmanlar"].map((label) => (
              <a
                key={label}
                href="#"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <a
              href={CTA_URL}
              className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Erken erişim al
              <ArrowUpRight size={14} />
            </a>
            {/* Mobile menu dot */}
            <button className="md:hidden text-gray-500 text-xl cursor-pointer">
              ···
            </button>
          </div>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative mt-28 md:mt-36 px-6">
        {/* Purple radial glow behind text */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(124,111,247,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          {/* Center content */}
          <div className="text-center max-w-3xl mx-auto relative z-10">
            {/* Announcement pill */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white mb-8 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span
                className="text-sm text-gray-600"
                style={{ fontFamily: "var(--font-body)" }}
              >
                E-ticaret için Bloomberg — beta&apos;da şimdi
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6"
              style={{
                fontFamily: "var(--font-display), serif",
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              Her marka. Her reklam.
              <br />
              <span className="text-[#7c6ff7]">Tek platformda.</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="text-lg md:text-xl text-gray-500 mb-10 max-w-xl mx-auto"
              style={{ fontFamily: "var(--font-body)", fontWeight: 400 }}
            >
              Veri isteyen satıcılar ve marka yatırımcıları için.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a
                href={CTA_URL}
                className="px-8 py-3.5 rounded-xl bg-[#7c6ff7] text-white font-medium text-base hover:bg-[#6b5ce6] transition-all duration-200 shadow-lg shadow-[#7c6ff7]/25 cursor-pointer"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Ücretsiz başla
              </a>
              <a
                href={CTA_URL}
                className="px-8 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-base hover:border-[#7c6ff7] hover:text-[#7c6ff7] transition-all duration-200 cursor-pointer"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Demo izle
              </a>
            </motion.div>
          </div>

          {/* ═══════════════════════════════════════════
              FLOATING DATA CARDS
              ═══════════════════════════════════════════ */}

          {/* TOP LEFT — Uzman Klasörleri */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="hidden lg:block absolute left-0 xl:-left-4 animate-float"
            style={{ top: 0 }}
          >
            <div className="landing-card w-[280px] bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 p-5 cursor-pointer">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-sm text-gray-900"
                  style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                >
                  Uzman Klasörleri
                </span>
                <span className="text-[11px] text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full font-medium">
                  Herkese Açık
                </span>
              </div>

              {/* Expert users */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                    BY
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">@burakyol</span>
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">Yeni</span>
                    </div>
                    <p className="text-[11px] text-gray-400">42 marka · 18 ürün</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                    JN
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900">@joshnow</span>
                    <p className="text-[11px] text-gray-400">88 kreatif · 31 reklam</p>
                  </div>
                </div>
              </div>

              {/* News section */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">E-Ticaret Haberleri</p>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-purple-600 font-medium">Tedarikçi</span>
                    <p className="text-[11px] text-gray-600 leading-snug">
                      Gümüş takı üreticileri YeniToptancıya katıldı
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">2 saat önce</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* TOP RIGHT — Brand Card Bahsbar */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="hidden lg:block absolute right-0 xl:-right-4 animate-float-delay-1"
            style={{ top: 0 }}
          >
            <div className="landing-card w-[260px] bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 p-5 cursor-pointer">
              {/* Brand header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                  BH
                </div>
                <div>
                  <p className="text-sm text-gray-900" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
                    Bahsbar
                  </p>
                  <p className="text-[11px] text-gray-400">bahsbar.com · Takviye Gıda</p>
                </div>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p className="text-[10px] text-gray-500 mb-0.5">Web ciro</p>
                  <p
                    className="text-lg text-gray-900"
                    style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                  >
                    ₺6.8M
                  </p>
                  <p className="text-[10px] text-green-500">↑ %44</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-0.5">TT GMV</p>
                  <p
                    className="text-lg text-gray-900"
                    style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                  >
                    ₺1.2M
                  </p>
                  <p className="text-[10px] text-green-500">↑ 2.4x</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-0.5">AMZ BSR</p>
                  <p
                    className="text-lg text-gray-900"
                    style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                  >
                    #7
                  </p>
                  <p className="text-[10px] text-gray-400">kat.</p>
                </div>
              </div>

              {/* Platform badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {["TikTok", "Meta", "Amazon"].map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium"
                  >
                    {p} ✓
                  </span>
                ))}
              </div>

              {/* Market share */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[11px] text-gray-500 font-medium mb-2">Pazar Payı</p>
                <div className="flex items-center gap-3">
                  {/* Donut ring */}
                  <div className="relative w-14 h-14">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#7c6ff7"
                        strokeWidth="3.5"
                        strokeDasharray="30.8 57.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p
                      className="text-2xl text-[#7c6ff7]"
                      style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                    >
                      %35
                    </p>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      Takviye gıda
                      <br />
                      kategorisinde
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* BOTTOM LEFT — Bearaby Ad Card */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="hidden lg:block absolute left-0 xl:-left-4 animate-float-delay-2"
            style={{ top: 255 }}
          >
            <div className="landing-card w-[280px] bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 p-5 cursor-pointer">
              {/* Brand header — Bahsbar style */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                  BY
                </div>
                <div>
                  <p className="text-sm text-gray-900" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
                    Bearaby
                  </p>
                  <p className="text-[11px] text-gray-400">bearaby.com · Uyku & Ev</p>
                </div>
              </div>

              {/* Ad platform counts */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1.5 rounded-lg flex-1">
                  <MetaLogo size={14} weight="light" className="text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-900" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>1.240</p>
                    <p className="text-[10px] text-gray-500">reklam</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg flex-1">
                  <TiktokLogo size={14} weight="light" className="text-gray-700" />
                  <div>
                    <p className="text-sm text-gray-900" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>3.219</p>
                    <p className="text-[10px] text-gray-500">reklam</p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 mb-3">En iyi pazarlama açıları</p>

              {/* Ad angles with progress bars */}
              <div className="space-y-3">
                {[
                  { label: "UGC Ücretli Reklam", hook: '"Uyku kaygısı"', count: 614, pct: 49, color: "#7c6ff7" },
                  { label: "Podcast Affiliate", hook: '"Derin uyku bilimi"', count: 372, pct: 30, color: "#f59e0b" },
                  { label: "UGC Ücretli Reklam", hook: '"Öncesi / sonrası"', count: 254, pct: 21, color: "#22c55e" },
                ].map((angle, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                        {angle.label}
                      </span>
                      <span className="text-[11px] text-gray-500 italic">{angle.hook}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 w-8" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
                        {angle.count}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${angle.pct}%`, backgroundColor: angle.color }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-400 w-8 text-right">%{angle.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* BOTTOM RIGHT — Kayıtlı Klasörler */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="hidden lg:block absolute right-0 xl:-right-4 animate-float-delay-3"
            style={{ top: 295 }}
          >
            <div className="landing-card w-[250px] bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 p-5 cursor-pointer">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-sm text-gray-900"
                  style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                >
                  Kayıtlı Klasörler
                </span>
                <Info size={14} weight="light" className="text-gray-300" />
              </div>

              {/* Folder list */}
              <div className="space-y-3">
                {[
                  { name: "Ev Tekstili", detail: "12 ürün kaydedildi", color: "bg-blue-100 text-blue-600" },
                  { name: "Çanta Markaları", detail: "7 marka · 23 reklam", color: "bg-amber-100 text-amber-600" },
                  { name: "Kreatif İlham", detail: "38 kreatif kaydedildi", color: "bg-purple-100 text-purple-600" },
                ].map((folder) => (
                  <div key={folder.name} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg ${folder.color} flex items-center justify-center`}
                    >
                      <FolderOpen size={14} weight="light" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{folder.name}</p>
                      <p className="text-[11px] text-gray-500">{folder.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">3 klasör · 80 öğe</span>
                <a
                  href={CTA_URL}
                  className="text-[11px] text-[#7c6ff7] font-medium cursor-pointer hover:underline"
                >
                  + Yeni klasör
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Spacer for floating cards */}
        <div className="h-48 md:h-56 lg:h-[420px]" />
      </div>

      {/* ═══════════════════════════════════════════
          TICKER BAR
          ═══════════════════════════════════════════ */}
      <div className="border-t border-gray-100 bg-white py-4 overflow-hidden">
        <div className="animate-ticker whitespace-nowrap flex">
          {/* Duplicate for seamless loop */}
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 mx-6"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <span className="text-sm text-gray-700 font-medium">{item.name}</span>
              <span
                className={`inline-flex items-center gap-1 text-sm font-medium ${
                  item.up ? "text-green-500" : "text-red-500"
                }`}
              >
                {item.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {item.stat}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
