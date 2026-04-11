"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Image as ImageIcon, Megaphone } from "lucide-react";
import type { MetaAd } from "@/hooks/useMetaAdSearch";
import {
  FLAG,
  PLATFORM_LABELS,
  formatCompact,
  formatMoney,
  formatDuration,
  formatDateRange,
  advertiserProfileHref,
} from "./utils";

interface AdCardProps {
  ad: MetaAd;
  onDetail: (ad: MetaAd) => void;
  /** True when this card is rendered on the advertiser's own profile page —
   *  hides the advertiser chip + suppresses the navigation link to itself. */
  onOwnProfile?: boolean;
}

export function AdCard({ ad, onDetail, onOwnProfile = false }: AdCardProps) {
  const router = useRouter();
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dateRange = formatDateRange(ad.adStartedAt, ad.activeDays);

  function handleVideoClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (playing) {
      videoRef.current?.pause();
      setPlaying(false);
    } else {
      videoRef.current?.play();
      setPlaying(true);
    }
  }

  function handleAdvertiserClick(e: React.MouseEvent) {
    e.stopPropagation();
    const href = advertiserProfileHref(ad.advertiserName);
    if (href) router.push(href);
  }

  return (
    <div className="bg-bg-card rounded-xl shadow-sm border border-border-default overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Creative area — video plays inline, images/carousel open popup */}
      <div className="relative aspect-[4/5] bg-bg-hover flex-shrink-0">
        {ad.mediaFormat === 1 && ad.videos.length > 0 ? (
          /* Video: click plays inline */
          <div className="w-full h-full cursor-pointer" onClick={handleVideoClick}>
            {playing ? (
              <video
                ref={videoRef}
                src={ad.videos[0].url}
                poster={ad.videos[0].coverUrl || ad.thumbnail}
                className="w-full h-full object-cover"
                autoPlay
                loop
                playsInline
                onClick={handleVideoClick}
              />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ad.videos[0].coverUrl || ad.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-black/30 flex items-center justify-center">
                    <Play size={24} className="text-white ml-1" fill="white" />
                  </div>
                </div>
              </>
            )}
            {ad.videos[0].duration > 0 && !playing && (
              <div className="absolute bottom-2 left-2">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-black/70 text-white">
                  {formatDuration(ad.videos[0].duration)}
                </span>
              </div>
            )}
          </div>
        ) : ad.mediaFormat === 3 && ad.cards.length > 0 ? (
          /* Carousel: click opens popup */
          <div className="w-full h-full cursor-pointer" onClick={() => onDetail(ad)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.cards[0].url || ad.thumbnail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-2 right-2">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-black/70 text-white">
                1/{ad.cards.length}
              </span>
            </div>
          </div>
        ) : ad.images.length > 0 ? (
          /* Image: click opens popup */
          <div className="w-full h-full cursor-pointer" onClick={() => onDetail(ad)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.images[0].url || ad.thumbnail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : ad.thumbnail ? (
          <div className="w-full h-full cursor-pointer" onClick={() => onDetail(ad)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ad.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted cursor-pointer" onClick={() => onDetail(ad)}>
            <ImageIcon size={48} />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2 pointer-events-none">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
            ad.adStatus === 2
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ad.adStatus === 2 ? "bg-green-500" : "bg-red-500"}`} />
            {ad.adStatus === 2 ? "Aktif" : "Kaldirildi"}
          </span>
        </div>
      </div>

      {/* Info area — click opens popup */}
      <div className="p-3 flex flex-col flex-1 cursor-pointer" onClick={() => onDetail(ad)}>
        {/* Advertiser chip → navigates to internal profile */}
        {!onOwnProfile && ad.advertiserName && (
          <button
            type="button"
            onClick={handleAdvertiserClick}
            title={`${ad.advertiserName} profilini goruntule`}
            className="flex items-center gap-2 mb-2 -mx-1 px-1 py-1 rounded-md hover:bg-bg-hover transition-colors cursor-pointer text-left"
          >
            {ad.advertiserProfilePic ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ad.advertiserProfilePic}
                alt={ad.advertiserName}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-bg-hover flex items-center justify-center flex-shrink-0">
                <Megaphone size={12} className="text-text-muted" />
              </div>
            )}
            <span className="text-xs font-medium text-text-primary truncate hover:text-accent">
              {ad.advertiserName}
            </span>
          </button>
        )}

        {/* Date range + Platform icons */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-text-muted">{dateRange}</span>
          <div className="flex items-center gap-1">
            {ad.adPlatform.map((p) => (
              <span key={p} className="text-[10px] bg-bg-hover text-text-secondary px-1 py-0.5 rounded">{PLATFORM_LABELS[p] || p}</span>
            ))}
          </div>
        </div>

        {/* Metrics row: Gunler, Erisim (Harcama), Adset */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="text-center">
            <p className="text-base font-bold text-text-primary">{ad.activeDays}</p>
            <p className="text-[10px] text-text-muted">Gunler</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-text-primary">
              {formatCompact(ad.adAudienceReach)}
              {ad.adCost !== null && ad.adCost > 0 && (
                <span className="text-[10px] font-normal text-text-muted ml-0.5">({formatMoney(ad.adCost)})</span>
              )}
            </p>
            <p className="text-[10px] text-text-muted">Erisim (Harcama)</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-text-primary">{ad.adsetCount}</p>
            <p className="text-[10px] text-text-muted">Adset</p>
          </div>
        </div>

        {/* Ad text preview */}
        <p className="text-xs text-text-primary line-clamp-2 mb-2 leading-snug min-h-[2rem]">
          {ad.adContent ? (ad.adContent.length > 100 ? ad.adContent.substring(0, 100) + "..." : ad.adContent) : ""}
        </p>

        <div className="flex-1" />

        {/* CTA button + Country flags */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {ad.country.slice(0, 3).map((c) => (
              <span key={c} className="text-sm" title={c}>{FLAG[c.toUpperCase()] || c}</span>
            ))}
            {ad.country.length > 3 && <span className="text-[10px] text-text-muted">+{ad.country.length - 3}</span>}
          </div>
          {ad.buttonText && (
            <span className="text-[11px] bg-bg-hover text-text-secondary px-2.5 py-1 rounded-lg font-medium">
              {ad.buttonText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
