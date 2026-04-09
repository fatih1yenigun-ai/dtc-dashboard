"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface MentorToolCardProps {
  route: string;
  toolName: string;
  description: string;
}

export default function MentorToolCard({ route, toolName, description }: MentorToolCardProps) {
  return (
    <Link
      href={route}
      className="flex items-center justify-between gap-3 my-2 px-4 py-3 rounded-xl transition-all duration-150 group"
      style={{
        background: "var(--bg-card)",
        borderLeft: "3px solid #8b5cf6",
        border: "1px solid var(--border-subtle)",
        borderLeftWidth: "3px",
        borderLeftColor: "#8b5cf6",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-hover)";
        e.currentTarget.style.borderColor = "#8b5cf6";
        e.currentTarget.style.borderLeftColor = "#8b5cf6";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg-card)";
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.borderLeftColor = "#8b5cf6";
      }}
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold" style={{ color: "#a78bfa" }}>
          {toolName}
        </div>
        <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
          {description}
        </div>
      </div>
      <div
        className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150"
        style={{
          background: "rgba(139, 92, 246, 0.15)",
          color: "#a78bfa",
        }}
      >
        Aracı Aç
        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
