"use client";

import Link from "next/link";
import { Megaphone, Users } from "lucide-react";

type TabKey = "reklamlar" | "reklamcilar";

interface MetaAdsTabsProps {
  active: TabKey;
}

/**
 * Tab strip used on /meta-ads and /meta-ads/reklamcilar so users can switch
 * between the ad library view (Reklamlar) and the advertiser directory view
 * (Reklamcılar) with a single click.
 */
export function MetaAdsTabs({ active }: MetaAdsTabsProps) {
  const tabs: { key: TabKey; href: string; label: string; Icon: typeof Megaphone }[] = [
    { key: "reklamlar", href: "/meta-ads", label: "Reklamlar", Icon: Megaphone },
    { key: "reklamcilar", href: "/meta-ads/reklamcilar", label: "Reklamcilar", Icon: Users },
  ];
  return (
    <div className="flex items-center gap-2 border-b border-border-default mb-6">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-accent text-accent"
                : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-default"
            }`}
          >
            <t.Icon size={16} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
