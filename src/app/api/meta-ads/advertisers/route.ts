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
async function fetchAdsPage(token: string, keyword: string, page: number, perPage: number, orderBy?: string, direction: string = "desc"): Promise<any> {
  // PiPiAds' advertisements endpoint doesn't support partial-match on the
  // "advertiser_name" field — it only works for exact names. Using "all" with
  // order_by="advertiser_ad_count" ensures the biggest brands (most relevant to
  // the keyword) surface first. Grouping then dedupes by advertiser.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {
    is_real: false,
    is_and: false,
    enable_token_search: 2,
    extend_keywords: JSON.stringify([
      { field: "all", value: keyword, logic_operator: "or" },
    ]),
    direction,
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
 * Group ads into a map of unique advertisers, then rank them using a composite
 * score that heavily rewards advertisers whose NAME contains the keyword.
 * This surfaces "rhode" above "TYMO Beauty" for a "rhode" search, even
 * though TYMO has 200K+ total ads. Without this, the "all" field search
 * returns ads from mega-advertisers that happen to mention the keyword
 * in their ad copy, drowning out the actual brand.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupByAdvertiser(items: any[], keyword?: string): AdvertiserSummary[] {
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

  // Rank: advertisers whose name contains the keyword get a massive boost so they
  // appear at the top regardless of total ad count.
  const results = Array.from(byKey.values());
  if (keyword) {
    const kw = keyword.trim().toLowerCase();
    results.sort((a, b) => {
      const aMatch = a.name.toLowerCase().includes(kw) ? 1 : 0;
      const bMatch = b.name.toLowerCase().includes(kw) ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch; // name-matches first
      return b.adCount - a.adCount; // then by ad count
    });
  }
  return results;
}

export async function POST(request: NextRequest) {
  try {
    let userId: number | null = null;
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyToken(authHeader.split(" ")[1]);
      if (payload) userId = payload.userId;
    }

    const {
      keyword,
      page = 1,
      perPage = 60,
      // Default to ad_started_at for the PiPiAds query — this ensures diverse
      // results across many advertisers. Sorting by advertiser_ad_count causes
      // mega-advertisers to monopolize all ad slots for common keywords.
      // The response is then re-ranked by name-match + adCount client-side.
      orderBy = "ad_started_at",
      direction = "desc",
    } = await request.json();

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: "Keyword is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = await pipiadsLogin();

    // Pull 3 pages worth of ads to get past mega-advertisers that dominate
    // the first page (e.g. TYMO Beauty fills 60 slots for "rhode" because
    // its ad copy mentions the word). Fetching 3 pages × 60 ads gives us
    // ~180 ads → typically 15-30 unique advertisers.
    const pagesToFetch = page === 1 ? [1, 2, 3] : [page];
    const results = await Promise.all(
      pagesToFetch.map((p) => fetchAdsPage(token, keyword, p, perPage, orderBy, direction))
    );
    // Merge all ad items across pages
    const allItems: unknown[] = [];
    let lastPageFull = false;
    for (const data of results) {
      const items = data?.data?.data || [];
      allItems.push(...items);
      lastPageFull = items.length >= perPage;
    }
    const advertisers = groupByAdvertiser(allItems, keyword);

    if (userId) {
      await logActivity(userId, "meta_advertisers_search", keyword, { page, perPage, count: advertisers.length }).catch(() => {});
    }

    return new Response(
      JSON.stringify({
        advertisers,
        rawAdCount: allItems.length,
        hasMore: lastPageFull,
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
