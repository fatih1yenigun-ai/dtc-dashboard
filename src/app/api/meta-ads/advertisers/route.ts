import { NextRequest } from "next/server";
import { verifyToken, logActivity } from "@/lib/auth";

export const maxDuration = 60;

// Module-level token cache shared with /api/meta-ads — we duplicate the minimal
// login helper here to avoid cross-route imports in Next's route handler layer.
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function pipiadsLogin(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch("https://www.pipiads.com/v1/api/member/login", {
    method: "PUT",
    headers: { "content-type": "application/json", device_id: "352039877" },
    body: JSON.stringify({
      email: process.env.PIPIADS_EMAIL || "burakyolive.06@gmail.com",
      password: process.env.PIPIADS_PASSWORD || "oylesine123",
      device_id: 352039877,
      uuid: "1c16840e-17fd-4dba-ad3a-773f218d131e",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("PiPiAds login failed");
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + 30 * 60 * 1000;
  return cachedToken!;
}

function buildHeaders(token: string): Record<string, string> {
  return {
    accept: "application/json",
    access_token: token,
    "content-type": "application/json",
    device_id: "352039877",
    origin: "https://www.pipiads.com",
    referer: "https://www.pipiads.com/",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    cookie: `uid=${token}`,
  };
}

/**
 * Fetches a single page of ads from PiPiAds matching `keyword`. Shares the same
 * `/v1/api/ppspy/advertisements` endpoint the main /api/meta-ads route uses so
 * we don't depend on a separate (and possibly non-existent) advertiser API.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAdsPage(token: string, keyword: string, page: number, perPage: number, orderBy?: string): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {
    is_real: false,
    is_and: false,
    enable_token_search: 2,
    extend_keywords: JSON.stringify([
      { field: "all", value: keyword, logic_operator: "or" },
    ]),
    direction: "desc",
    page,
    per_page: perPage,
  };
  if (orderBy) body.order_by = orderBy;

  const res = await fetch("https://www.pipiads.com/v1/api/ppspy/advertisements", {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    cachedToken = null;
    tokenExpiry = 0;
    const newToken = await pipiadsLogin();
    const retry = await fetch("https://www.pipiads.com/v1/api/ppspy/advertisements", {
      method: "POST",
      headers: buildHeaders(newToken),
      body: JSON.stringify(body),
    });
    return retry.json();
  }
  return res.json();
}

export interface AdvertiserSummary {
  id: string;
  name: string;
  profilePic: string;
  adCount: number;
  adsetCount: number;
  adCountry: string[];
  likeCount: number;
  ecommercePlatform: string;
  adsLibraryLink: string;
  sourceLink: string;
  platforms: string[];
  /** Up to 3 sample ad thumbnails so the Reklamcılar grid can show visual previews. */
  sampleThumbs: string[];
  /** How many ads for this advertiser showed up in the current sample (rough match count, not total) */
  sampleCount: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractThumb(item: any): string {
  const vids = item.videos || [];
  const imgs = item.images || [];
  const cards = item.cards || [];
  if (vids[0]?.cover_url) return vids[0].cover_url;
  if (imgs[0]?.url) return imgs[0].url;
  if (cards[0]?.url) return cards[0].url;
  return item.products?.[0]?.image_url || item.advertiser?.profile_picture_url || "";
}

/**
 * Group ads into a map of unique advertisers. Preserves insertion order from
 * PiPiAds (which is usually the sort the caller requested — recency/reach/etc.)
 * so the client renders the first page in a sensible order.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupByAdvertiser(items: any[]): AdvertiserSummary[] {
  const byKey = new Map<string, AdvertiserSummary>();
  for (const item of items) {
    const adv = item.advertiser || {};
    const key = (adv.id as string) || (adv.name as string) || "";
    if (!key) continue;
    let summary = byKey.get(key);
    if (!summary) {
      summary = {
        id: adv.id || "",
        name: adv.name || "",
        profilePic: adv.profile_picture_url || "",
        adCount: adv.ad_count || 0,
        adsetCount: adv.adset_count || 0,
        adCountry: adv.ad_country || [],
        likeCount: adv.like_count || 0,
        ecommercePlatform: adv.e_commerce_platform || "",
        adsLibraryLink: adv.ads_library_link || "",
        sourceLink: adv.source_advertiser_link || "",
        platforms: [],
        sampleThumbs: [],
        sampleCount: 0,
      };
      byKey.set(key, summary);
    }
    summary.sampleCount += 1;
    // Merge platform list across ads
    for (const p of item.ad_platform || []) {
      if (!summary.platforms.includes(p)) summary.platforms.push(p);
    }
    // Collect up to 3 sample thumbnails
    if (summary.sampleThumbs.length < 3) {
      const t = extractThumb(item);
      if (t && !summary.sampleThumbs.includes(t)) summary.sampleThumbs.push(t);
    }
  }
  return Array.from(byKey.values());
}

export async function POST(request: NextRequest) {
  try {
    let userId: number | null = null;
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyToken(authHeader.split(" ")[1]);
      if (payload) userId = payload.userId;
    }

    const { keyword, page = 1, perPage = 60, orderBy } = await request.json();

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: "Keyword is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = await pipiadsLogin();

    // Pull a big page from PiPiAds so we have enough ad variety to reveal multiple
    // advertisers. 60 is a good balance — bigger = more advertisers but slower.
    const data = await fetchAdsPage(token, keyword, page, perPage, orderBy);
    const items: unknown[] = data?.data?.data || [];
    const advertisers = groupByAdvertiser(items);
    // Sort by highest advertiser.ad_count first (biggest brands surface first)
    advertisers.sort((a, b) => b.adCount - a.adCount);

    if (userId) {
      await logActivity(userId, "meta_advertisers_search", keyword, { page, perPage, count: advertisers.length }).catch(() => {});
    }

    return new Response(
      JSON.stringify({
        advertisers,
        rawAdCount: items.length,
        hasMore: items.length >= perPage,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Meta Advertisers API error:", error);
    return new Response(
      JSON.stringify({
        error: "PiPiAds API hatasi: " + (error instanceof Error ? error.message : "Bilinmeyen hata"),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
