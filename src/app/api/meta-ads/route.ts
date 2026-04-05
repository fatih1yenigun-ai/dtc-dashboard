import { NextRequest } from "next/server";
import { verifyToken, logActivity } from "@/lib/auth";

export const maxDuration = 60;

// Module-level token cache
let cachedToken: string | null = null;
let tokenExpiry = 0;

// ── Request queue: serializes all PiPiAds calls with a delay ──
const REQUEST_DELAY_MS = 600;
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
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

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
  if (!data.access_token) {
    throw new Error("PiPiAds login failed: " + JSON.stringify(data));
  }

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

async function searchAds(
  token: string,
  keyword: string,
  page: number,
  perPage: number,
  sortKey?: string,
  direction: string = "desc"
) {
  const url = "https://www.pipiads.com/v1/api/ppspy/advertisements";
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

  // Add sort_key if not default
  if (sortKey && sortKey !== "default") {
    body.sort_key = sortKey;
  }

  console.log("[Meta Ads Search] Request:", { keyword, page, perPage, sortKey, direction });

  const res = await fetch(url, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
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
  const items = json?.data?.data || [];
  if (items.length > 0) {
    console.log(
      `[Meta Ads Search] Got ${items.length} results, first: ${(items[0].advertiser?.name || "").substring(0, 40)}`
    );
  }
  return json;
}

export async function POST(request: NextRequest) {
  try {
    let userId: number | null = null;
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyToken(authHeader.split(" ")[1]);
      if (payload) userId = payload.userId;
    }

    const { keyword, page = 1, perPage = 20, sortKey, direction = "desc" } = await request.json();

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: "Keyword is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = await pipiadsLogin();

    const data = await enqueue(() =>
      searchAds(token, keyword, page, perPage, sortKey, direction)
    );

    if (!data?.data?.data) {
      console.error(
        "PiPiAds Meta unexpected response:",
        JSON.stringify(data).substring(0, 500)
      );
    }

    if (userId) {
      await logActivity(userId, "meta_ads_search", keyword, {
        page,
        perPage,
      }).catch(() => {});
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Meta Ads API error:", error);
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
