"use client";

import { Check } from "lucide-react";

const STAGES = [
  { num: 1, label: "Ürün Araştırması", short: "Araştırma" },
  { num: 2, label: "Tedarikçi Bulma", short: "Tedarik" },
  { num: 3, label: "Mağaza Kurulumu", short: "Mağaza" },
  { num: 4, label: "İçerik & Tedarik", short: "İçerik" },
  { num: 5, label: "Reklam Analizi", short: "Reklam" },
];

interface MentorStageBarProps {
  currentStage: number;
  onStageClick?: (stage: number) => void;
}

export default function MentorStageBar({ currentStage, onStageClick }: MentorStageBarProps) {
  return (
    <div className="w-full px-3 py-3">
      <div className="flex items-center gap-1 sm:gap-2">
        {STAGES.map((stage, i) => {
          const isCompleted = stage.num < currentStage;
          const isActive = stage.num === currentStage;
          const isFuture = stage.num > currentStage;

          return (
            <div key={stage.num} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => {
                  if (!isFuture && onStageClick) onStageClick(stage.num);
                }}
                disabled={isFuture}
                className="flex items-center gap-1.5 w-full min-w-0 transition-all duration-150"
                style={{ cursor: isFuture ? "default" : "pointer" }}
              >
                {/* Circle */}
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200"
                  style={{
                    background: isCompleted
                      ? "#8b5cf6"
                      : isActive
                        ? "rgba(139, 92, 246, 0.2)"
                        : "var(--bg-hover)",
                    color: isCompleted
                      ? "#fff"
                      : isActive
                        ? "#a78bfa"
                        : "var(--text-muted)",
                    border: isActive ? "2px solid #8b5cf6" : "2px solid transparent",
                  }}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : stage.num}
                </div>

                {/* Label — show full on sm+, short on mobile */}
                <span
                  className="truncate text-xs font-medium hidden sm:inline"
                  style={{
                    color: isActive
                      ? "#a78bfa"
                      : isCompleted
                        ? "var(--text-secondary)"
                        : "var(--text-muted)",
                  }}
                >
                  {stage.label}
                </span>
                <span
                  className="truncate text-[10px] font-medium sm:hidden"
                  style={{
                    color: isActive
                      ? "#a78bfa"
                      : isCompleted
                        ? "var(--text-secondary)"
                        : "var(--text-muted)",
                  }}
                >
                  {stage.short}
                </span>
              </button>

              {/* Connector line */}
              {i < STAGES.length - 1 && (
                <div
                  className="flex-shrink-0 h-[2px] w-3 sm:w-6 mx-0.5"
                  style={{
                    background: isCompleted ? "#8b5cf6" : "var(--border-subtle)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Active stage name on mobile */}
      <div className="sm:hidden mt-1.5 text-center">
        <span className="text-xs font-medium" style={{ color: "#a78bfa" }}>
          {STAGES[currentStage - 1]?.label}
        </span>
      </div>
    </div>
  );
}
