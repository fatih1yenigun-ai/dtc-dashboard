"use client";

import { GraduationCap, ArrowRight } from "lucide-react";

const STAGES_INFO = [
  { num: 1, label: "Ürün Araştırması", desc: "Trend ürünleri bul, pazarı analiz et" },
  { num: 2, label: "Tedarikçi Bulma", desc: "Üretici ve toptancılarla iletişime geç" },
  { num: 3, label: "Mağaza Kurulumu", desc: "Online mağazanı kur, fiyatlandırma yap" },
  { num: 4, label: "İçerik & Tedarik", desc: "Creator bul, script yaz, tedarikçi finalize et" },
  { num: 5, label: "Reklam Analizi", desc: "Reklam performansını analiz etmeyi öğren" },
];

const STARTER_QUESTIONS = [
  "E-ticarete sıfırdan başlamak istiyorum",
  "Ürünüm hazır, tedarikçi arıyorum",
  "Reklam kampanyamı analiz etmek istiyorum",
];

interface MentorWelcomeProps {
  username?: string;
  onStart: () => void;
  onQuestionClick: (question: string) => void;
}

export default function MentorWelcome({ username, onStart, onQuestionClick }: MentorWelcomeProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5"
          style={{ background: "rgba(139, 92, 246, 0.15)" }}
        >
          <GraduationCap size={32} style={{ color: "#a78bfa" }} />
        </div>

        {/* Greeting */}
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Merhaba{username ? `, ${username}` : ""}!
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Ben Faycom Mentörüyüm. E-ticarette ürün bulmaktan mağaza kurmaya, içerik üretiminden
          reklam analizine kadar her adımda sana rehberlik edeceğim.
        </p>

        {/* 5 Stages */}
        <div className="grid gap-2 mb-6 text-left">
          {STAGES_INFO.map((stage) => (
            <div
              key={stage.num}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: "rgba(139, 92, 246, 0.15)",
                  color: "#a78bfa",
                }}
              >
                {stage.num}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {stage.label}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {stage.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 mb-4"
          style={{
            background: "#8b5cf6",
            color: "#fff",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#7c3aed";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#8b5cf6";
          }}
        >
          Başla
          <ArrowRight size={16} />
        </button>

        {/* Starter questions */}
        <div className="flex flex-wrap gap-2 justify-center">
          {STARTER_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onQuestionClick(q)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
              style={{
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#8b5cf6";
                e.currentTarget.style.color = "#a78bfa";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
