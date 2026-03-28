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

async function searchVideos(
  token: string,
  keyword: string,
  page: number,
  pageSize: number,
  sortBy: number = 999
) {
  const url =
    "https://www.pipiads.com/v3/api/search4/at/video/search-tiktok-shop";
  const body = {
    is_participle: false,
    search_type: 1,
    extend_keywords: [{ type: 1, keyword }],
    sort: sortBy,
    sort_type: "desc",
    current_page: page,
    page_size: pageSize,
  };

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

  return res.json();
}

async function searchProducts(
  token: string,
  keyword: string,
  page: number,
  pageSize: number,
  sortKey: string = "gmv"
) {
  const params = new URLSearchParams({
    keyword,
    sort_key: sortKey,
    sort_type: "desc",
    current_page: String(page),
    page_size: String(pageSize),
  });
  const url = `https://www.pipiads.com/v1/api/tiktok-shop/product?${params}`;

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
    return retryRes.json();
  }

  return res.json();
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
      data = await searchProducts(token, keyword, page, pageSize, sortKey);
    } else {
      data = await searchVideos(token, keyword, page, pageSize, sortBy);
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
