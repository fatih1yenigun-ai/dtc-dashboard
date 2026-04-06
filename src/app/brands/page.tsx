"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  ExternalLink,
  Globe,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Target,
  Package,
  Megaphone,
  Swords,
  MapPin,
} from "lucide-react";

const FLAG: Record<string, string> = {
  US: "\u{1F1FA}\u{1F1F8}", UK: "\u{1F1EC}\u{1F1E7}", DE: "\u{1F1E9}\u{1F1EA}", FR: "\u{1F1EB}\u{1F1F7}",
  TR: "\u{1F1F9}\u{1F1F7}", AU: "\u{1F1E6}\u{1F1FA}", KR: "\u{1F1F0}\u{1F1F7}", JP: "\u{1F1EF}\u{1F1F5}",
  CA: "\u{1F1E8}\u{1F1E6}", NL: "\u{1F1F3}\u{1F1F1}", SE: "\u{1F1F8}\u{1F1EA}", DK: "\u{1F1E9}\u{1F1F0}",
  IT: "\u{1F1EE}\u{1F1F9}", ES: "\u{1F1EA}\u{1F1F8}", BR: "\u{1F1E7}\u{1F1F7}", IN: "\u{1F1EE}\u{1F1F3}",
  CN: "\u{1F1E8}\u{1F1F3}", IL: "\u{1F1EE}\u{1F1F1}",
};

interface Product {
  name: string;
  price: string;
  category: string;
}

interface TargetAudience {
  age_range: string;
  gender: string;
  interests: string[];
  income_level: string;
  demographics: string;
}

interface BrandDetail {
  brand_name: string;
  website: string;
  tagline: string;
  founded: number;
  country: string;
  founder_story: string;
  scaling_story: string;
  products: Product[];
  target_audience: TargetAudience;
  marketing_channels: string[];
  marketing_angles: string[];
  growth_methods: string[];
  estimated_traffic: number;
  estimated_aov: number;
  estimated_revenue: number;
  competitors: string[];
  strengths: string[];
  weaknesses: string[];
  turkey_potential: string;
}

function formatNumber(n: number): string {
  return n.toLocaleString("tr-TR");
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const TAG_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-blue-100 text-blue-700",
  "bg-cyan-100 text-cyan-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
];

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-bg-hover rounded-lg ${className || ""}`} />
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div className="bg-bg-card rounded-[14px] border border-border-default p-6">
        <SkeletonBlock className="h-8 w-64 mb-3" />
        <SkeletonBlock className="h-4 w-96 mb-2" />
        <SkeletonBlock className="h-4 w-48" />
      </div>
      {/* Metrics skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-bg-card rounded-[14px] border border-border-default p-5">
            <SkeletonBlock className="h-4 w-24 mb-3" />
            <SkeletonBlock className="h-8 w-32" />
          </div>
        ))}
      </div>
      {/* Story skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-bg-card rounded-[14px] border border-border-default p-6">
            <SkeletonBlock className="h-5 w-40 mb-4" />
            <SkeletonBlock className="h-4 w-full mb-2" />
            <SkeletonBlock className="h-4 w-full mb-2" />
            <SkeletonBlock className="h-4 w-3/4" />
          </div>
        ))}
      </div>
      {/* More skeletons */}
      <div className="bg-bg-card rounded-[14px] border border-border-default p-6">
        <SkeletonBlock className="h-5 w-32 mb-4" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-20 w-32" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BrandsPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [error, setError] = useState("");

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setBrand(null);
    setError("");

    // Determine if input looks like a website or brand name
    const isUrl = q.includes(".") && !q.includes(" ");
    const payload = isUrl
      ? { brand_name: "", website: q }
      : { brand_name: q, website: "" };

    try {
      const res = await fetch("/api/brand-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Hata oluştu");
      }
      const data: BrandDetail = await res.json();
      setBrand(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Marka analizi sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Marka Analizi</h1>
        <p className="text-text-secondary mt-1">
          Bir DTC markasını derinlemesine analiz et
        </p>
      </div>

      {/* Search */}
      <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Globe
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Marka adı veya website gir (ör: glossier.com, Allbirds)"
              className="w-full pl-10 pr-4 py-2.5 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="gradient-accent text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            Analiz Et
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && <SkeletonDashboard />}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Results Dashboard */}
      {brand && !loading && (
        <div className="space-y-5">
          {/* Row 1: Hero */}
          <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-text-primary">
                    {brand.brand_name}
                  </h2>
                  {brand.country && (
                    <span className="text-xl">
                      {FLAG[brand.country.toUpperCase()] || ""}
                    </span>
                  )}
                </div>
                {brand.tagline && (
                  <p className="text-text-secondary text-sm mb-2 italic">
                    &ldquo;{brand.tagline}&rdquo;
                  </p>
                )}
                {brand.website && (
                  <a
                    href={
                      brand.website.startsWith("http")
                        ? brand.website
                        : `https://${brand.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline flex items-center gap-1 text-sm"
                  >
                    {brand.website.replace(/^https?:\/\//, "")}
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
              {brand.founded && (
                <div className="text-right">
                  <span className="text-xs text-text-muted">Kuruluş</span>
                  <p className="text-lg font-bold text-text-primary">{brand.founded}</p>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign size={16} className="text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-text-muted">Tahmini Ciro</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCompact(brand.estimated_revenue)}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">aylık</p>
            </div>

            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp size={16} className="text-blue-600" />
                </div>
                <span className="text-xs font-medium text-text-muted">Aylık Trafik</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(brand.estimated_traffic)}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">ziyaret/ay</p>
            </div>

            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <DollarSign size={16} className="text-purple-600" />
                </div>
                <span className="text-xs font-medium text-text-muted">AOV</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                ${brand.estimated_aov}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">ortalama sipariş</p>
            </div>

            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-bg-hover flex items-center justify-center">
                  <Calendar size={16} className="text-text-secondary" />
                </div>
                <span className="text-xs font-medium text-text-muted">Kuruluş Yılı</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {brand.founded || "-"}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {brand.founded ? `${new Date().getFullYear() - brand.founded} yıl` : ""}
              </p>
            </div>
          </div>

          {/* Row 3: Stories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-text-primary">Kurucu Hikayesi</h3>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {brand.founder_story}
              </p>
            </div>
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-blue-500" />
                <h3 className="text-sm font-semibold text-text-primary">Büyüme Hikayesi</h3>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {brand.scaling_story}
              </p>
            </div>
          </div>

          {/* Row 4: Target audience */}
          {brand.target_audience && (
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-indigo-500" />
                <h3 className="text-sm font-semibold text-text-primary">Hedef Kitle</h3>
              </div>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="bg-indigo-50 rounded-lg px-4 py-3 text-center min-w-[100px]">
                  <p className="text-[10px] text-indigo-400 font-medium mb-0.5">Yaş Aralığı</p>
                  <p className="text-sm font-bold text-indigo-700">{brand.target_audience.age_range}</p>
                </div>
                <div className="bg-pink-50 rounded-lg px-4 py-3 text-center min-w-[100px]">
                  <p className="text-[10px] text-pink-400 font-medium mb-0.5">Cinsiyet</p>
                  <p className="text-sm font-bold text-pink-700">{brand.target_audience.gender}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg px-4 py-3 text-center min-w-[100px]">
                  <p className="text-[10px] text-emerald-400 font-medium mb-0.5">Gelir Seviyesi</p>
                  <p className="text-sm font-bold text-emerald-700">{brand.target_audience.income_level}</p>
                </div>
              </div>
              {brand.target_audience.interests && brand.target_audience.interests.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-text-muted font-medium mb-2">İlgi Alanları</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brand.target_audience.interests.map((interest, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {brand.target_audience.demographics && (
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                  {brand.target_audience.demographics}
                </p>
              )}
            </div>
          )}

          {/* Row 5: Products & Competitors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Products */}
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package size={16} className="text-orange-500" />
                <h3 className="text-sm font-semibold text-text-primary">Ürün Portföyü</h3>
              </div>
              {brand.products && brand.products.length > 0 ? (
                <div className="space-y-2">
                  {brand.products.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg-main hover:bg-bg-hover transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">{p.name}</p>
                        {p.category && (
                          <p className="text-[10px] text-text-muted">{p.category}</p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-text-primary">{p.price}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">Ürün bilgisi bulunamadı</p>
              )}
            </div>

            {/* Competitors */}
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
              <div className="flex items-center gap-2 mb-4">
                <Swords size={16} className="text-red-500" />
                <h3 className="text-sm font-semibold text-text-primary">Rakipler</h3>
              </div>
              {brand.competitors && brand.competitors.length > 0 ? (
                <div className="space-y-2">
                  {brand.competitors.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 py-2 px-3 rounded-lg bg-bg-main"
                    >
                      <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold">
                        {i + 1}
                      </div>
                      <span className="text-sm text-text-primary">{c}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">Rakip bilgisi bulunamadı</p>
              )}
            </div>
          </div>

          {/* Row 6: Marketing channels & Growth methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Marketing */}
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
              <div className="flex items-center gap-2 mb-4">
                <Megaphone size={16} className="text-violet-500" />
                <h3 className="text-sm font-semibold text-text-primary">Pazarlama Kanalları & Açıları</h3>
              </div>
              {brand.marketing_channels && brand.marketing_channels.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-text-muted font-medium mb-2">Kanallar</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brand.marketing_channels.map((ch, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {brand.marketing_angles && brand.marketing_angles.length > 0 && (
                <div>
                  <p className="text-[10px] text-text-muted font-medium mb-2">Pazarlama Açıları</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brand.marketing_angles.map((angle, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-full font-medium bg-violet-100 text-violet-700"
                      >
                        {angle}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Growth methods */}
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-cyan-500" />
                <h3 className="text-sm font-semibold text-text-primary">Büyüme Yöntemleri</h3>
              </div>
              {brand.growth_methods && brand.growth_methods.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {brand.growth_methods.map((method, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${TAG_COLORS[(i + 3) % TAG_COLORS.length]}`}
                    >
                      {method}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">Büyüme yöntemi bilgisi bulunamadı</p>
              )}
            </div>
          </div>

          {/* Row 7: Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={16} className="text-emerald-500" />
                <h3 className="text-sm font-semibold text-text-primary">Güçlü Yönler</h3>
              </div>
              {brand.strengths && brand.strengths.length > 0 ? (
                <ul className="space-y-2">
                  {brand.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold">+</span>
                      </div>
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted">-</p>
              )}
            </div>

            <div className="bg-bg-card rounded-[14px] shadow-sm border border-border-default p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert size={16} className="text-red-500" />
                <h3 className="text-sm font-semibold text-text-primary">Zayıf Yönler</h3>
              </div>
              {brand.weaknesses && brand.weaknesses.length > 0 ? (
                <ul className="space-y-2">
                  {brand.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold">-</span>
                      </div>
                      {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted">-</p>
              )}
            </div>
          </div>

          {/* Row 8: Turkey potential */}
          {brand.turkey_potential && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-[14px] shadow-sm border border-red-200/50 p-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-red-500" />
                <h3 className="text-sm font-semibold text-text-primary">Türkiye Potansiyeli</h3>
                <span className="text-lg">{FLAG["TR"]}</span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed">
                {brand.turkey_potential}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
