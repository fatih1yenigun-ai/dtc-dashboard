"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  loadSupplierProfile,
  incrementProfileViews,
  type SupplierProfile,
} from "@/lib/marketplace";
import { useAuth } from "@/context/AuthContext";
import ReviewSection from "@/components/marketplace/ReviewSection";

// --------------- constants ---------------

const MARKETPLACE_LINKS: {
  key: keyof SupplierProfile;
  label: string;
}[] = [
  { key: "marketplace_shopier", label: "Shopier" },
  { key: "marketplace_trendyol", label: "Trendyol" },
  { key: "marketplace_n11", label: "N11" },
  { key: "marketplace_hepsiburada", label: "HepsiBurada" },
  { key: "marketplace_amazon_tr", label: "Amazon TR" },
];

// --------------- component ---------------

export default function SupplierDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = Number(params.id);

  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const viewIncremented = useRef(false);

  useEffect(() => {
    if (!id || isNaN(id)) return;

    async function fetch() {
      setLoading(true);
      const p = await loadSupplierProfile(id);
      setProfile(p);
      setLoading(false);
    }
    fetch();
  }, [id]);

  useEffect(() => {
    if (!id || isNaN(id) || viewIncremented.current) return;
    viewIncremented.current = true;
    incrementProfileViews("supplier", id);
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
          href="/icerik-tedarik/suppliers"
          className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline mt-4"
        >
          <ArrowLeft size={16} />
          Geri Dön
        </Link>
      </div>
    );
  }

  const activeMarketplaceLinks = MARKETPLACE_LINKS.filter(
    (m) => profile[m.key] != null
  );

  return (
    <div>
      {/* Back link */}
      <Link
        href="/icerik-tedarik/suppliers"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Geri
      </Link>

      {/* Hero Section */}
      <div className="bg-bg-card rounded-[14px] border border-border-default p-6 mb-4">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          {profile.company_name}
        </h1>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              profile.type === "uretici"
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-violet-500/15 text-violet-500"
            }`}
          >
            {profile.type === "uretici" ? "Üretici" : "Toptancı"}
          </span>

          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted">
            {profile.source === "faycom" ? "Faycom'a Özel" : "Veritabanı"}
          </span>
        </div>

        {/* Location */}
        {profile.city && (
          <span className="flex items-center gap-1 text-sm text-text-secondary">
            <MapPin size={14} />
            {profile.city}
          </span>
        )}
      </div>

      {/* Contact Section */}
      {user &&
        (profile.contact_person ||
          profile.phone ||
          profile.email ||
          profile.website) && (
          <div className="bg-bg-card rounded-[14px] border border-border-default p-5 mb-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">
              İletişim
            </h2>
            <div className="space-y-2">
              {profile.contact_person && (
                <p className="text-sm text-text-secondary">
                  {profile.contact_person}
                </p>
              )}
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
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <Globe size={14} className="text-text-muted" />
                  {profile.website}
                </a>
              )}
            </div>
          </div>
        )}

      {/* Category & Specialty */}
      {(profile.category || profile.specialty) && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">
            Kategori & Uzmanlık
          </h2>
          <p className="text-sm text-text-secondary">
            {[profile.category, profile.specialty]
              .filter(Boolean)
              .join(" \u2192 ")}
          </p>
        </div>
      )}

      {/* Brands Produced For */}
      {profile.brands_produced_for &&
        profile.brands_produced_for.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary mb-2">
              Üretim Yaptığı Markalar
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.brands_produced_for.map((brand) => (
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

      {/* Marketplace Links */}
      {activeMarketplaceLinks.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">
            Pazar Yeri Linkleri
          </h2>
          <div className="flex flex-wrap gap-3">
            {activeMarketplaceLinks.map((m) => (
              <a
                key={m.key}
                href={profile[m.key] as string}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card border border-border-default text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                {m.label}
                <ExternalLink size={13} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {profile.description && (
        <div className="bg-bg-card rounded-[14px] border border-border-default p-5 mb-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">
            Açıklama
          </h2>
          <p className="text-sm text-text-secondary whitespace-pre-line">
            {profile.description}
          </p>
        </div>
      )}

      {/* Reviews Section */}
      <ReviewSection targetType="supplier" targetId={profile.id} />
    </div>
  );
}
