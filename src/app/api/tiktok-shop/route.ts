import { NextRequest } from "next/server";
import { verifyToken, logActivity } from "@/lib/auth";

export const maxDuration = 60;

// Module-level token cache
let cachedToken: string | null = null;
let tokenExpiry = 0;

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

async function searchProducts(
  token: string,
  keyword: string,
  page: number,
  pageSize: number,
  sortKey: string = "gmv",
  sortType: string = "desc"
) {
  const params = new URLSearchParams({
    keyword,
    sort_key: sortKey,
    sort_type: sortType,
    current_page: String(page),
    page_size: String(pageSize),
  });
  const url = `https://www.pipiads.com/v1/api/tiktok-shop/product?${params}`;
  console.log("[TTS Product Search] URL:", url);
  console.log("[TTS Product Search] sort_key:", sortKey, "sort_type:", sortType);

  const res = await fetch(url, {
    method: "POST",
    headers: buildHeaders(token),
  });

  if (res.status === 401) {
    cachedToken = null;
    tokenExpiry = 0;
    const newToken = await pipiadsLogin();
    const retryRes = await fetch(url, {
      method: "POST",
      headers: buildHeaders(newToken),
    });
    const retryJson = await retryRes.json();
    logProductResults(retryJson, sortKey);
    return retryJson;
  }

  const json = await res.json();
  logProductResults(json, sortKey);
  return json;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logProductResults(json: any, sortKey: string) {
  const items = json?.result?.data || [];
  if (items.length > 0) {
    console.log(`[TTS Product Search] First 3 results (sorted by ${sortKey}):`);
    items.slice(0, 3).forEach((item: { title?: string; sales_volume?: number; gmv_usd?: number; found_time?: number; play_count?: number; video_count?: number; person_count?: number }, i: number) => {
      console.log(`  ${i + 1}. ${(item.title || "").substring(0, 50)} | sales=${item.sales_volume} gmv=${item.gmv_usd} views=${item.play_count} videos=${item.video_count} found=${item.found_time} influencers=${item.person_count}`);
    });
  }
  console.log("[TTS Product Search] Total:", json?.result?.total || "unknown");
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
      sortKey = "gmv",
      sortType = "desc",
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

    // Call appropriate search endpoint
    let data;
    if (searchMode === "product") {
      data = await searchProducts(token, keyword, page, pageSize, sortKey, sortType);
    } else {
      data = await searchVideos(token, keyword, page, pageSize, sortBy, filters);
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
