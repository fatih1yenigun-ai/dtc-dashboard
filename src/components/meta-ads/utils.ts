import type { MetaAd } from "@/hooks/useMetaAdSearch";
import type { BrandData } from "@/lib/supabase";

export const FLAG: Record<string, string> = {
  US: "\u{1F1FA}\u{1F1F8}", UK: "\u{1F1EC}\u{1F1E7}", GB: "\u{1F1EC}\u{1F1E7}",
  DE: "\u{1F1E9}\u{1F1EA}", FR: "\u{1F1EB}\u{1F1F7}", TR: "\u{1F1F9}\u{1F1F7}",
  AU: "\u{1F1E6}\u{1F1FA}", KR: "\u{1F1F0}\u{1F1F7}", JP: "\u{1F1EF}\u{1F1F5}",
  CA: "\u{1F1E8}\u{1F1E6}", NL: "\u{1F1F3}\u{1F1F1}", SE: "\u{1F1F8}\u{1F1EA}",
  IT: "\u{1F1EE}\u{1F1F9}", ES: "\u{1F1EA}\u{1F1F8}", BR: "\u{1F1E7}\u{1F1F7}",
  IN: "\u{1F1EE}\u{1F1F3}", CN: "\u{1F1E8}\u{1F1F3}", ID: "\u{1F1EE}\u{1F1E9}",
  TH: "\u{1F1F9}\u{1F1ED}", VN: "\u{1F1FB}\u{1F1F3}", MY: "\u{1F1F2}\u{1F1FE}",
  PH: "\u{1F1F5}\u{1F1ED}", SG: "\u{1F1F8}\u{1F1EC}", MX: "\u{1F1F2}\u{1F1FD}",
  BE: "\u{1F1E7}\u{1F1EA}", AT: "\u{1F1E6}\u{1F1F9}", PL: "\u{1F1F5}\u{1F1F1}",
  RO: "\u{1F1F7}\u{1F1F4}", GR: "\u{1F1EC}\u{1F1F7}", HU: "\u{1F1ED}\u{1F1FA}",
  HR: "\u{1F1ED}\u{1F1F7}", PT: "\u{1F1F5}\u{1F1F9}", LU: "\u{1F1F1}\u{1F1FA}",
  DK: "\u{1F1E9}\u{1F1F0}", FI: "\u{1F1EB}\u{1F1EE}",
};

export const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "FB",
  INSTAGRAM: "IG",
  AUDIENCE_NETWORK: "AN",
  MESSENGER: "MSG",
  THREADS: "THR",
};

export function formatCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatDate(ts: number): string {
  if (!ts) return "-";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDateRange(startTs: number, activeDays: number): string {
  if (!startTs) return "";
  const start = new Date(startTs * 1000);
  const end = activeDays > 0 ? new Date(start.getTime() + activeDays * 86400000) : new Date();
  const fmt = (d: Date) => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")} ${d.getFullYear()}`;
  };
  return `${fmt(start)}-${fmt(end)}`;
}

export function toBrandData(ad: MetaAd): BrandData {
  return {
    Marka: ad.advertiserName,
    "Web Sitesi": ad.landingPages?.[0] || ad.storeLink || "",
    Kategori: ad.productCategoryName || "Meta Reklam",
    "Harcama ($)": ad.adCost,
    "Erisim": ad.adAudienceReach,
    "One Cikan Ozellik": ad.adContent?.substring(0, 200) || "",
    "Buyume Yontemi": "Meta Ads",
    Kaynak: "PiPiAds Meta",
    Cover: ad.thumbnail,
    // Capture playable creative so the saved page can render it like the search page does.
    VideoUrl: ad.videos?.[0]?.url || "",
    AdvertiserName: ad.advertiserName,
    Ulke: ad.country?.join(", "),
  } as BrandData;
}

/** Build the internal advertiser profile URL from an ad (or empty string if no name). */
export function advertiserProfileHref(advertiserName: string): string {
  if (!advertiserName) return "";
  return `/meta-ads/advertiser/${encodeURIComponent(advertiserName)}`;
}
