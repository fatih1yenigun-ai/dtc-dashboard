import React from "react";
import { ShoppingCart, ShoppingBag, Search } from "lucide-react";
import type { SavedBrand, BrandData } from "@/lib/supabase";

export const FLAG: Record<string, string> = {
  US: "\u{1F1FA}\u{1F1F8}", UK: "\u{1F1EC}\u{1F1E7}", DE: "\u{1F1E9}\u{1F1EA}", FR: "\u{1F1EB}\u{1F1F7}",
  TR: "\u{1F1F9}\u{1F1F7}", AU: "\u{1F1E6}\u{1F1FA}", KR: "\u{1F1F0}\u{1F1F7}", JP: "\u{1F1EF}\u{1F1F5}",
  CA: "\u{1F1E8}\u{1F1E6}", NL: "\u{1F1F3}\u{1F1F1}", SE: "\u{1F1F8}\u{1F1EA}", DK: "\u{1F1E9}\u{1F1F0}",
  IT: "\u{1F1EE}\u{1F1F9}", ES: "\u{1F1EA}\u{1F1F8}", BR: "\u{1F1E7}\u{1F1F7}", IN: "\u{1F1EE}\u{1F1F3}",
  CN: "\u{1F1E8}\u{1F1F3}", IL: "\u{1F1EE}\u{1F1F1}",
};

export function formatNumber(n: number): string {
  return n.toLocaleString("tr-TR");
}

export function formatTraffic(n: number | null): string {
  if (!n) return "-";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

export function formatRevenue(n: number | null): string {
  if (n == null) return "-";
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

// All brand getter functions accept either a SavedBrand or a raw BrandData
type BrandLike = SavedBrand | { brand_data: BrandData };

export function getBrandName(brand: BrandLike): string {
  const d = brand.brand_data;
  return (d?.Marka as string) || (d?.brand as string) || "Bilinmeyen";
}

export function getBrandWebsite(brand: BrandLike): string {
  const d = brand.brand_data;
  return (d?.["Web Sitesi"] as string) || (d?.website as string) || "";
}

export function getBrandCategory(brand: BrandLike): string {
  const d = brand.brand_data;
  return (d?.Kategori as string) || (d?.category as string) || "";
}

export function getBrandAov(brand: BrandLike): number | null {
  const d = brand.brand_data;
  const aov = d?.["AOV ($)"] ?? d?.aov;
  if (aov == null) return null;
  return typeof aov === "number" ? aov : null;
}

export function getBrandInsight(brand: BrandLike): string {
  const d = brand.brand_data;
  return (d?.["Öne Çıkan Özellik"] as string) || (d?.insight as string) || "";
}

export function getBrandMetaAds(brand: BrandLike): string {
  const d = brand.brand_data;
  return (d?.["Meta Ads"] as string) || (d?.meta_ads_url as string) || "";
}

export function getBrandTraffic(brand: BrandLike): number | null {
  return (brand.brand_data?.["Aylık Trafik"] as number) ?? null;
}

export function getBrandTQS(brand: BrandLike): number | null {
  return (brand.brand_data?.TQS as number) ?? null;
}

export function getBrandRevenue(brand: BrandLike): number | null {
  return (brand.brand_data?.["Ciro ($)"] as number)
    ?? (brand.brand_data?.["Tahmini Aylık Gelir ($)"] as number)
    ?? null;
}

export function getBrandCountry(brand: BrandLike): string {
  return (brand.brand_data?.["Ülke"] as string) || "";
}

export function getBrandGrowth(brand: BrandLike): string {
  return (brand.brand_data?.["Büyüme Yöntemi"] as string) || "";
}

export function getBrandFounded(brand: BrandLike): number | null {
  return (brand.brand_data?.["Kuruluş Yılı"] as number) ?? null;
}

export function getBrandConversion(brand: BrandLike): number | null {
  return (brand.brand_data?.["Dönüşüm %"] as number) ?? null;
}

export function getBrandMarketingAngles(brand: BrandLike): string {
  return (brand.brand_data?.["Pazarlama Açıları"] as string) || "";
}

export function getBrandSource(brand: BrandLike): string {
  const d = brand.brand_data;
  const kaynak = (d?.Kaynak as string) || "";
  if (kaynak === "Amazon") return "Amazon";
  if (kaynak === "PiPiAds" || (d?.["Büyüme Yöntemi"] as string)?.includes("TikTok")) return "TikTok";
  return "Research";
}

export function SourceBadge({ source }: { source: string }) {
  if (source === "Amazon") {
    return React.createElement("span", {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FF9900]/10 text-[#FF9900] text-[10px] font-bold",
    }, React.createElement(ShoppingCart, { size: 10 }), "Amazon");
  }
  if (source === "TikTok") {
    return React.createElement("span", {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/5 text-gray-800 text-[10px] font-bold",
    }, React.createElement(ShoppingBag, { size: 10 }), "TikTok");
  }
  return React.createElement("span", {
    className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#667eea]/10 text-[#667eea] text-[10px] font-bold",
  }, React.createElement(Search, { size: 10 }), "Research");
}
