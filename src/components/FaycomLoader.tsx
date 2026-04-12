"use client";

import { useState, useEffect } from "react";

const MESSAGES = [
  "İnternet'in derinliklerine dalıyoruz...",
  "Gizli hazineleri arıyoruz...",
  "Milyonlarca veri arasından elmas arıyoruz...",
  "Veriler pişiyor, biraz sabır...",
  "Potansiyel fırsatları kokluyoruz...",
  "Sihirli formülümüzü karıştırıyoruz...",
  "Bilgisayarlar düşünüyor, insanlar bekliyor...",
  "Veri şelalesi akıyor, bardağınızı hazırlayın...",
  "Akıllı tarama başlatıldı, arkanıza yaslanın...",
  "Dijital dedektifler iz sürüyor...",
  "E-ticaret galaksisini tarıyoruz...",
  "Dedektifiniz iş başında...",
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FaycomLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    setOrder(shuffleArray(MESSAGES.map((_, i) => i)));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
        setFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const displayIndex = order.length > 0 ? order[msgIndex % order.length] : msgIndex;

  return (
    <div className="py-16 flex flex-col items-center">
      {/* Egg animation */}
      <div className="egg-container mb-5">
        <svg width="64" height="80" viewBox="0 0 64 80" className="egg-svg">
          {/* Egg body */}
          <ellipse
            cx="32"
            cy="44"
            rx="26"
            ry="34"
            className="egg-body"
          />
          {/* Glow through crack */}
          <line
            x1="32" y1="18" x2="32" y2="50"
            className="egg-glow"
          />
          {/* Crack line */}
          <polyline
            points="28,26 34,32 26,38 36,44 30,50"
            className="egg-crack"
          />
          {/* Sparkles */}
          <circle cx="20" cy="30" r="2" className="egg-sparkle sparkle-1" />
          <circle cx="44" cy="34" r="1.5" className="egg-sparkle sparkle-2" />
          <circle cx="38" cy="22" r="1.5" className="egg-sparkle sparkle-3" />
        </svg>
      </div>

      {/* Rotating message */}
      <p
        className="text-text-secondary font-medium text-sm text-center transition-opacity duration-300"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {MESSAGES[displayIndex]}
      </p>

      <style jsx>{`
        .egg-container {
          filter: drop-shadow(0 4px 12px rgba(var(--accent-rgb, 99, 102, 241), 0.2));
        }

        .egg-body {
          fill: var(--bg-card, #1e1e2e);
          stroke: var(--accent, #6366f1);
          stroke-width: 2.5;
          animation: eggPulse 3s ease-in-out infinite;
        }

        .egg-crack {
          fill: none;
          stroke: var(--accent, #6366f1);
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: crackAppear 3s ease-in-out infinite;
        }

        .egg-glow {
          stroke: var(--accent, #6366f1);
          stroke-width: 6;
          stroke-linecap: round;
          opacity: 0;
          filter: blur(4px);
          animation: glowPulse 3s ease-in-out infinite;
        }

        .egg-sparkle {
          fill: var(--accent, #6366f1);
          opacity: 0;
          animation: sparkle 3s ease-in-out infinite;
        }

        .sparkle-1 { animation-delay: 1.2s; }
        .sparkle-2 { animation-delay: 1.5s; }
        .sparkle-3 { animation-delay: 1.35s; }

        @keyframes eggPulse {
          0%, 100% { transform: scale(1); }
          20% { transform: scale(1); }
          40% { transform: scale(1.03) translateX(-1px); }
          50% { transform: scale(1.05); }
          60% { transform: scale(1.03) translateX(1px); }
          80% { transform: scale(1); }
        }

        @keyframes crackAppear {
          0%, 15% { stroke-dashoffset: 60; }
          35%, 65% { stroke-dashoffset: 0; }
          85%, 100% { stroke-dashoffset: 60; }
        }

        @keyframes glowPulse {
          0%, 20% { opacity: 0; }
          40%, 60% { opacity: 0.6; }
          80%, 100% { opacity: 0; }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1.5); }
          70% { opacity: 0; transform: scale(0); }
        }
      `}</style>
    </div>
  );
}
