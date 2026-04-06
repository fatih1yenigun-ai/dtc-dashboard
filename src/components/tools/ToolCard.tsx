"use client";

import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  badge?: string;
  disabled?: boolean;
  accentColor?: string;
}

export default function ToolCard({ title, description, icon: Icon, href, badge, disabled, accentColor = "var(--accent)" }: ToolCardProps) {
  const content = (
    <div
      className={`bg-bg-card rounded-[14px] border border-border-default p-6 transition-all ${
        disabled ? "opacity-60" : "hover:border-border-default hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentColor + "18" }}>
          <Icon size={20} style={{ color: accentColor }} />
        </div>
        {badge && (
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-[15px] font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      {!disabled && (
        <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: accentColor }}>
          Aç <ArrowRight size={13} />
        </div>
      )}
    </div>
  );

  if (href && !disabled) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
