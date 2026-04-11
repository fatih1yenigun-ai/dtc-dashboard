"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  Save,
  Globe,
  ExternalLink,
  ShoppingBag,
  Megaphone,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { MetaAd } from "@/hooks/useMetaAdSearch";
import {
  FLAG,
  PLATFORM_LABELS,
  formatCompact,
  formatMoney,
  formatDate,
  advertiserProfileHref,
} from "./utils";

interface AdDetailPopupProps {
  ad: MetaAd;
  onClose: () => void;
  onSave: (ad: MetaAd) => void;
  /** True when the popup is opened on the advertiser's own profile page —
   *  the header advertiser block becomes plain text instead of a self-link. */
  onOwnProfile?: boolean;
}

export function AdDetailPopup({ ad, onClose, onSave, onOwnProfile = false }: AdDetailPopupProps) {
  const [carouselIdx, setCarouselIdx] = useState(0);

  const profileHref = advertiserProfileHref(ad.advertiserName);
  const showAdvertiserLink = !onOwnProfile && !!profileHref;

  const advertiserBlock = (
    <div className="flex items-center gap-3">
      {ad.advertiserProfilePic ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.advertiserProfilePic} alt={ad.advertiserName} className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-bg-hover flex items-center justify-center">
          <Megaphone size={18} className="text-text-muted" />
        </div>
      )}
      <div>
        <p className="font-semibold text-text-primary text-sm">{ad.advertiserName || "Bilinmeyen"}</p>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          {ad.ecommercePlatform && (
            <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-medium">{ad.ecommercePlatform}</span>
          )}
          <span>{ad.adPlatform.map((p) => PLATFORM_LABELS[p] || p).join(" · ")}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-bg-card rounded-xl w-full max-w-3xl mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-default">
          {showAdvertiserLink ? (
            <Link
              href={profileHref}
              onClick={onClose}
              className="hover:bg-bg-hover rounded-lg -mx-2 px-2 py-1 transition-colors"
              title={`${ad.advertiserName} profilini goruntule`}
            >
              {advertiserBlock}
            </Link>
          ) : (
            advertiserBlock
          )}
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary cursor-pointer"><X size={20} /></button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Left: Creative */}
          <div className="md:w-1/2 p-5 border-r border-border-default">
            {ad.mediaFormat === 1 && ad.videos.length > 0 ? (
              <video
                src={ad.videos[0].url}
                poster={ad.videos[0].coverUrl}
                controls
                className="w-full rounded-lg bg-bg-hover"
              />
            ) : ad.mediaFormat === 3 && ad.cards.length > 0 ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ad.cards[carouselIdx]?.url}
                  alt={`Card ${carouselIdx + 1}`}
                  className="w-full rounded-lg object-cover"
                />
                {ad.cards.length > 1 && (
                  <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCarouselIdx(Math.max(0, carouselIdx - 1))}
                      disabled={carouselIdx === 0}
                      className="w-8 h-8 rounded-full bg-bg-card/80 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">
                      {carouselIdx + 1}/{ad.cards.length}
                    </span>
                    <button
                      onClick={() => setCarouselIdx(Math.min(ad.cards.length - 1, carouselIdx + 1))}
                      disabled={carouselIdx === ad.cards.length - 1}
                      className="w-8 h-8 rounded-full bg-bg-card/80 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            ) : ad.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ad.images[0].url} alt="Ad" className="w-full rounded-lg object-cover" />
            ) : ad.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ad.thumbnail} alt="Ad" className="w-full rounded-lg object-cover" />
            ) : (
              <div className="w-full aspect-square bg-bg-hover rounded-lg flex items-center justify-center">
                <ImageIcon size={48} className="text-text-muted" />
              </div>
            )}

            {/* Ad text */}
            <div className="mt-4 max-h-40 overflow-y-auto">
              <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{ad.adContent || "Reklam metni yok"}</p>
            </div>
          </div>

          {/* Right: Details */}
          <div className="md:w-1/2 p-5 space-y-4">
            {/* Country */}
            <div>
              <p className="text-xs font-medium text-text-secondary mb-1">Ulke</p>
              <div className="flex flex-wrap gap-1">
                {ad.country.map((c) => (
                  <span key={c} className="text-sm">
                    {FLAG[c.toUpperCase()] || c} <span className="text-xs text-text-secondary">{c}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Landing Page */}
            <div>
              <p className="text-xs font-medium text-text-secondary mb-1">Acilis Sayfasi</p>
              {ad.landingPages.map((lp, i) => (
                <a key={i} href={lp} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline flex items-center gap-1 mb-0.5">
                  <ExternalLink size={12} />
                  {lp.length > 60 ? lp.substring(0, 60) + "..." : lp}
                </a>
              ))}
              {ad.landingPages.length === 0 && <span className="text-sm text-text-muted">-</span>}
            </div>

            {/* CTA */}
            <div>
              <p className="text-xs font-medium text-text-secondary mb-1">CTA</p>
              <span className="text-sm bg-bg-hover text-text-primary px-2.5 py-1 rounded-lg">{ad.buttonText || "-"}</span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-emerald-600 mb-0.5">Harcama</p>
                <p className="text-sm font-bold text-emerald-700">{formatMoney(ad.adCost)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-blue-600 mb-0.5">Erisim</p>
                <p className="text-sm font-bold text-blue-700">{formatCompact(ad.adAudienceReach)}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-purple-600 mb-0.5">Adset</p>
                <p className="text-sm font-bold text-purple-700">{ad.adsetCount}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-amber-600 mb-0.5">Gunler</p>
                <p className="text-sm font-bold text-amber-700">{ad.activeDays}</p>
              </div>
              <div className="bg-cyan-50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-cyan-600 mb-0.5">Platform</p>
                <p className="text-sm font-bold text-cyan-700">{ad.adPlatform.map((p) => PLATFORM_LABELS[p] || p).join(", ")}</p>
              </div>
              <div className="bg-rose-50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-rose-600 mb-0.5">Durum</p>
                <p className="text-sm font-bold text-rose-700">{ad.adStatus === 2 ? "Aktif" : "Pasif"}</p>
              </div>
            </div>

            {/* Product info */}
            {ad.productName && (
              <div className="bg-bg-main rounded-lg p-3">
                <p className="text-xs font-medium text-text-secondary mb-2">Urun Bilgisi</p>
                <div className="flex items-center gap-3">
                  {ad.productImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ad.productImageUrl} alt={ad.productName} className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-text-primary">{ad.productName}</p>
                    <p className="text-xs text-text-secondary">
                      ${ad.productPriceUsd.toFixed(2)} · {ad.productCategoryName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Audience */}
            {ad.adAudience && (
              <div className="bg-bg-main rounded-lg p-3">
                <p className="text-xs font-medium text-text-secondary mb-1">Hedef Kitle</p>
                <div className="flex items-center gap-3 text-sm text-text-primary">
                  <span>Toplam: {formatCompact(ad.adAudience.totalReach)}</span>
                  <span>Cinsiyet: {ad.adAudience.genderAudience}</span>
                  <span>Yas: {ad.adAudience.ageMin}-{ad.adAudience.ageMax}+</span>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="flex items-center gap-4 text-xs text-text-secondary">
              <span>Baslangic: {formatDate(ad.adStartedAt)}</span>
              <span>Ilk Gorulme: {formatDate(ad.firstDiscoveredAt)}</span>
              <span>Son Gorulme: {formatDate(ad.lastDiscoveredAt)}</span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => { onClose(); onSave(ad); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-medium hover:opacity-90 cursor-pointer"
              >
                <Save size={14} /> Kaydet
              </button>
              {ad.advertiserAdsLibraryLink && (
                <a
                  href={ad.advertiserAdsLibraryLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100"
                >
                  <Globe size={14} /> Meta Ad Library
                </a>
              )}
              {ad.advertiserLink && (
                <a
                  href={ad.advertiserLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-bg-hover text-text-primary text-sm font-medium hover:bg-bg-hover"
                >
                  <ExternalLink size={14} /> Facebook
                </a>
              )}
              {ad.storeLink && (
                <a
                  href={ad.storeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-bg-hover text-text-primary text-sm font-medium hover:bg-bg-hover"
                >
                  <ShoppingBag size={14} /> Magaza
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
