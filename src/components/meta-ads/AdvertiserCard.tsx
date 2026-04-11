"use client";

import Link from "next/link";
import { Megaphone, Sparkles, Layers, Heart, ArrowRight } from "lucide-react";
import type { AdvertiserSummary } from "@/hooks/useMetaAdvertiserSearch";
import { FLAG, formatCompact, advertiserProfileHref } from "./utils";

interface AdvertiserCardProps {
  advertiser: AdvertiserSummary;
}

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "FB",
  INSTAGRAM: "IG",
  AUDIENCE_NETWORK: "AN",
  MESSENGER: "MSG",
  THREADS: "THR",
};

export function AdvertiserCard({ advertiser }: AdvertiserCardProps) {
  const href = advertiserProfileHref(advertiser.name);

  return (
    <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-5 hover:shadow-md transition-shadow flex flex-col">
      {/* Header: avatar + name + platform pill */}
      <div className="flex items-start gap-3 mb-3">
        {advertiser.profilePic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={advertiser.profilePic}
            alt={advertiser.name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-border-default"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-bg-hover flex items-center justify-center flex-shrink-0">
            <Megaphone size={20} className="text-text-muted" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-text-primary truncate">{advertiser.name || "Bilinmeyen"}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {advertiser.ecommercePlatform && (
              <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                {advertiser.ecommercePlatform}
              </span>
            )}
            {advertiser.platforms.slice(0, 5).map((p) => (
              <span key={p} className="text-[10px] bg-bg-hover text-text-secondary px-1 py-0.5 rounded">
                {PLATFORM_LABELS[p] || p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sample ad thumbnails */}
      {advertiser.sampleThumbs.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {advertiser.sampleThumbs.slice(0, 3).map((t, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={t}
              alt=""
              className="w-full aspect-[4/5] rounded-md object-cover bg-bg-hover"
              loading="lazy"
            />
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-bg-main rounded-lg px-2 py-1.5 text-center">
          <div className="flex items-center justify-center gap-1 text-text-muted mb-0.5">
            <Sparkles size={10} />
          </div>
          <p className="text-sm font-bold text-text-primary leading-none">{formatCompact(advertiser.adCount)}</p>
          <p className="text-[10px] text-text-muted mt-0.5">Reklam</p>
        </div>
        <div className="bg-bg-main rounded-lg px-2 py-1.5 text-center">
          <div className="flex items-center justify-center gap-1 text-text-muted mb-0.5">
            <Layers size={10} />
          </div>
          <p className="text-sm font-bold text-text-primary leading-none">{formatCompact(advertiser.adsetCount)}</p>
          <p className="text-[10px] text-text-muted mt-0.5">Adset</p>
        </div>
        <div className="bg-bg-main rounded-lg px-2 py-1.5 text-center">
          <div className="flex items-center justify-center gap-1 text-text-muted mb-0.5">
            <Heart size={10} />
          </div>
          <p className="text-sm font-bold text-text-primary leading-none">{formatCompact(advertiser.likeCount)}</p>
          <p className="text-[10px] text-text-muted mt-0.5">Begeni</p>
        </div>
      </div>

      {/* Country flags */}
      {advertiser.adCountry.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-3">
          <span className="text-[10px] text-text-muted mr-1">Ulkeler:</span>
          {advertiser.adCountry.slice(0, 8).map((c) => (
            <span key={c} className="text-sm" title={c}>
              {FLAG[c.toUpperCase()] || c}
            </span>
          ))}
          {advertiser.adCountry.length > 8 && (
            <span className="text-[10px] text-text-muted">+{advertiser.adCountry.length - 8}</span>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* CTA */}
      <Link
        href={href}
        className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2 rounded-lg gradient-accent text-white text-sm font-medium hover:opacity-90"
      >
        Reklamlari Gor
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
