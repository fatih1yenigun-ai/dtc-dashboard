import { NextRequest } from "next/server";
import { verifyToken, logActivity } from "@/lib/auth";

export const maxDuration = 60;

// Module-level token cache
let cachedToken: string | null = null;
let tokenExpiry = 0;

// ── Request queue: serializes all PiPiAds calls with a delay ──
const REQUEST_DELAY_MS = 600; // minimum ms between PiPiAds requests
let lastRequestTime = 0;
const queuedRequests: Array<{
  execute: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];
let processing = false;

async function processQueue() {
  if (processing) return;
  processing = true;
  while (queuedRequests.length > 0) {
    const item = queuedRequests.shift()!;
    const now = Date.now();
    const wait = Math.max(0, REQUEST_DELAY_MS - (now - lastRequestTime));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    try {
      lastRequestTime = Date.now();
      const result = await item.execute();
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    }
  }
  processing = false;
}

function enqueue<T>(execute: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queuedRequests.push({
      execute: execute as () => Promise<unknown>,
      resolve: resolve as (value: unknown) => void,
      reject,
    });
    processQueue();
  });
}

async function pipiadsLogin(): Promise<string> {
  // Return cached token if still valid (cache for 30 minutes)
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const res = await fetch("https://www.pipiads.com/v1/api/member/login", {
    method: "PUT",
    headers: { "content-type": "application/json", "device_id": "352039877" },
    body: JSON.stringify({
      email: process.env.PIPIADS_EMAIL || "burakyolive.06@gmail.com",
      password: process.env.PIPIADS_PASSWORD || "oylesine123",
      device_id: 352039877,
      uuid: "1c16840e-17fd-4dba-ad3a-773f218d131e",
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("PiPiAds login failed: " + JSON.stringify(data));
  }

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + 30 * 60 * 1000; // 30 min
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

interface VideoFilters {
  country?: string[];
  language?: string[];
  ad_time?: number;
  audience_age?: number[];
  audience_gender?: number[];
  interest?: string;
}

async function searchVideos(
  token: string,
  keyword: string,
  page: number,
  pageSize: number,
  sortBy: number = 999,
  filters?: VideoFilters
) {
  const url =
    "https://www.pipiads.com/v3/api/search4/at/video/search-tiktok-shop";
  const body: Record<string, unknown> = {
    is_participle: false,
    search_type: 1,
    extend_keywords: [{ type: 1, keyword }],
    sort: sortBy,
    sort_type: "desc",
    current_page: page,
    page_size: pageSize,
  };

  if (filters?.country?.length) body.fetch_region = filters.country;
  if (filters?.language?.length) body.language = filters.language;
  // ad_time: number of days to look back — convert to timestamp range
  if (filters?.ad_time && filters.ad_time > 0) {
    const now = Math.floor(Date.now() / 1000);
    const start = now - filters.ad_time * 86400;
    body.ad_time = filters.ad_time;
    body.ad_create_time_start = start;
    body.ad_create_time_end = now;
  }
  if (filters?.audience_age?.length) body.audience_age = filters.audience_age;
  if (filters?.audience_gender?.length) body.audience_gender = filters.audience_gender;
  if (filters?.interest) body.interest = filters.interest;

  console.log("[TTS Video Search] Request body:", JSON.stringify(body));

  const res = await fetch(url, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    // Token expired — clear cache and retry once
    cachedToken = null;
    tokenExpiry = 0;
    const newToken = await pipiadsLogin();
    const retryRes = await fetch(url, {
      method: "POST",
      headers: buildHeaders(newToken),
      body: JSON.stringify(body),
    });
    return retryRes.json();
  }

  const json = await res.json();
  const firstItem = json?.result?.data?.[0];
  if (firstItem) {
    console.log("[TTS Video Search] First result digg_count:", firstItem.digg_count, "play_count:", firstItem.play_count);
  }
  console.log("[TTS Video Search] Total results:", json?.result?.total || json?.data?.total || "unknown");
  return json;
}

// v3 endpoint: GET with numeric sort param
// sort=2: found_time, sort=3: sales, sort=4: GMV, sort=5: views,
// sort=7: video_count (ads), sort=8: person_count (influencers)
async function searchProducts(
  token: string,
  keyword: string,
  page: number,
  pageSize: number,
  sort: number = 2,
  sortType: string = "desc"
) {
  const params = new URLSearchParams({
    keyword,
    sort: String(sort),
    sort_type: sortType,
    current_page: String(page),
    page_size: String(pageSize),
  });
  const url = `https://www.pipiads.com/v3/api/tiktok-shop/product?${params}`;
  console.log("[TTS Product Search] v3 GET:", url);

  const res = await fetch(url, {
    method: "GET",
    headers: buildHeaders(token),
  });

  if (res.status === 401) {
    cachedToken = null;
    tokenExpiry = 0;
    const newToken = await pipiadsLogin();
    const retryRes = await fetch(url, {
      method: "GET",
      headers: buildHeaders(newToken),
    });
    return retryRes.json();
  }

  const json = await res.json();
  const items = json?.result?.data || [];
  if (items.length > 0) {
    console.log(`[TTS Product Search] First 3 (sort=${sort} ${sortType}):`);
    items.slice(0, 3).forEach((item: { title?: string; sales_volume?: number; gmv_usd?: number; play_count?: number; video_count?: number; person_count?: number }, i: number) => {
      console.log(`  ${i + 1}. ${(item.title || "").substring(0, 50)} | sales=${item.sales_volume} gmv=${item.gmv_usd} views=${item.play_count}`);
    });
  }
  return json;
}

export async function POST(request: NextRequest) {
  try {
    // Auth verification
    let userId: number | null = null;
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyToken(authHeader.split(" ")[1]);
      if (payload) userId = payload.userId;
    }

    const {
      keyword,
      page = 1,
      pageSize = 20,
      searchMode = "video",
      sortBy = 999,
      sortType = "desc",
      productSort = 2,
      filters,
    } = await request.json();

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: "Keyword is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Login to PiPiAds
    const token = await pipiadsLogin();

    // Call appropriate search endpoint — queued to avoid hammering PiPiAds
    let data;
    if (searchMode === "product") {
      data = await enqueue(() => searchProducts(token, keyword, page, pageSize, productSort, sortType));
    } else {
      data = await enqueue(() => searchVideos(token, keyword, page, pageSize, sortBy, filters));
    }

    // Debug: log if no results
    if (!data?.result?.data && !data?.data) {
      console.error("PiPiAds unexpected response:", JSON.stringify(data).substring(0, 500));
    }

    // Log activity
    if (userId) {
      await logActivity(userId, "tts_pipiads_search", keyword, {
        searchMode,
        page,
        pageSize,
      }).catch(() => {});
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("TikTok Shop API error:", error);
    return new Response(
      JSON.stringify({
        error:
          "PiPiAds API hatasi: " +
          (error instanceof Error ? error.message : "Bilinmeyen hata"),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
