"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  loadCreatorProfile,
  incrementProfileViews,
  type CreatorProfile,
} from "@/lib/marketplace";
import { useAuth } from "@/context/AuthContext";
import ReviewSection from "@/components/marketplace/ReviewSection";

// --------------- constants ---------------

const TIER_COLORS: Record<string, string> = {
  micro: "bg-blue-500/15 text-blue-500",
  mid: "bg-green-500/15 text-green-500",
  macro: "bg-purple-500/15 text-purple-500",
  mega: "bg-red-500/15 text-red-500",
};

function isVideo(url: string): boolean {
  return /\.(mp4|webm)$/i.test(url);
}

// --------------- component ---------------

export default function CreatorDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = Number(params.id);

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const viewIncremented = useRef(false);

  useEffect(() => {
    if (!id || isNaN(id)) return;

    async function fetch() {
      setLoading(true);
      const p = await loadCreatorProfile(id);
      setProfile(p);
      setLoading(false);
    }
    fetch();
  }, [id]);

  useEffect(() => {
    if (!id || isNaN(id) || viewIncremented.current) return;
    viewIncremented.current = true;
    incrementProfileViews("creator", id);
  }, [id]);

  // --------------- loading / error ---------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-text-muted">Profil bulunamadı</p>
        <Link
          href="/icerik-tedarik/creators"
          className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline mt-4"
        >
          <ArrowLeft size={16} />
          Geri Dön
        </Link>
      </div>
    );
  }

  const socialLinks = [
    { url: profile.instagram_url, label: "Instagram" },
    { url: profile.youtube_url, label: "YouTube" },
    { url: profile.linkedin_url, label: "LinkedIn" },
    { url: profile.tiktok_url, label: "TikTok" },
    { url: profile.x_url, label: "X" },
  ].filter((s) => s.url);

  const hasPricing =
    profile.source === "faycom" &&
    (profile.ugc_video_price ||
      profile.post_sharing_cost ||
      profile.affiliate_commission_info ||
      profile.package_details);

  return (
    <div>
      {/* Back link */}
      <Link
        href="/icerik-tedarik/creators"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Geri
      </Link>

      {/* Hero Section */}
      <div className="bg-bg-card rounded-[14px] border border-border-default p-6 mb-4">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.name}
              width={80}
              height={80}
              className="rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-accent/20 text-accent flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {profile.name}
            </h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  profile.type === "ugc"
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-violet-500/15 text-violet-500"
                }`}
              >
                {profile.type === "ugc" ? "UGC" : "Influencer"}
              </span>

              {profile.tier && (
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    TIER_COLORS[profile.tier] ?? ""
                  }`}
                >
                  {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}
                </span>
              )}

              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted">
                {profile.source === "faycom" ? "Faycom'a Özel" : "Veritabanı"}
              </span>
            </div>

            {/* Location */}
            {(profile.city || profile.country) && (
              <span className="flex items-center gap-1 text-sm text-text-secondary">
                <MapPin size={14} />
                {[profile.city, profile.country].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Social Links */}
      {socialLinks.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {socialLinks.map((s) => (
            <a
              key={s.label}
              href={s.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card border border-border-default text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {s.label}
              <ExternalLink size={13} />
            </a>
          ))}
        </div>
      )}

      {/* Contact Section */}
      {user && (profile.phone || profile.email) && (
        <div className="bg-bg-card rounded-[14px] border border-border-default p-5 mb-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            İletişim
          </h2>
          <div className="space-y-2">
            {profile.phone && (
              <p className="flex items-center gap-2 text-sm text-text-secondary">
                <Phone size={14} className="text-text-muted" />
                {profile.phone}
              </p>
            )}
            {profile.email && (
              <p className="flex items-center gap-2 text-sm text-text-secondary">
                <Mail size={14} className="text-text-muted" />
                {profile.email}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Categories */}
      {profile.categories && profile.categories.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">
            Kategoriler
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.categories.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Brands Worked With */}
      {profile.brands_worked_with && profile.brands_worked_with.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">
            Çalıştığı Markalar
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.brands_worked_with.map((brand) => (
              <span
                key={brand}
                className="px-3 py-1 rounded-full border border-border-default text-text-secondary text-sm"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Section */}
      {hasPricing && (
        <div className="bg-bg-card rounded-[14px] border border-border-default p-5 mb-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            Fiyatlandırma
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.ugc_video_price != null && (
              <div>
                <p className="text-xs text-text-muted">UGC Video</p>
                <p className="text-sm text-text-primary font-medium">
                  ₺{profile.ugc_video_price.toLocaleString("tr-TR")}
                </p>
              </div>
            )}
            {profile.post_sharing_cost != null && (
              <div>
                <p className="text-xs text-text-muted">Post/Story</p>
                <p className="text-sm text-text-primary font-medium">
                  ₺{profile.post_sharing_cost.toLocaleString("tr-TR")}
                </p>
              </div>
            )}
            {profile.affiliate_commission_info && (
              <div>
                <p className="text-xs text-text-muted">Affiliate</p>
                <p className="text-sm text-text-primary">
                  {profile.affiliate_commission_info}
                </p>
              </div>
            )}
            {profile.package_details && (
              <div className="sm:col-span-2">
                <p className="text-xs text-text-muted">Paket Detayları</p>
                <p className="text-sm text-text-primary">
                  {profile.package_details}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media Kit */}
      {profile.media_kit_url && (
        <div className="mb-4">
          <a
            href={profile.media_kit_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
          >
            <Download size={16} />
            Medya Kit İndir
          </a>
        </div>
      )}

      {/* Portfolio */}
      {profile.portfolio_urls && profile.portfolio_urls.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">
            Portfolyo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {profile.portfolio_urls.slice(0, 3).map((url, idx) =>
              isVideo(url) ? (
                <video
                  key={idx}
                  src={url}
                  controls
                  className="w-full rounded-lg border border-border-default"
                />
              ) : (
                <div
                  key={idx}
                  className="relative aspect-video rounded-lg border border-border-default overflow-hidden"
                >
                  <Image
                    src={url}
                    alt={`Portfolyo ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <ReviewSection targetType="creator" targetId={profile.id} />
    </div>
  );
}
