import { NextRequest } from "next/server";
import { verifyToken, logActivity } from "@/lib/auth";

export const maxDuration = 60;

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_BASE = "https://api.apify.com/v2";

// Actors to try in order
const ACTORS = [
  "junglee/amazon-crawler",
  "vaclavrut/amazon-crawler",
  "epctex/amazon-scraper",
];

interface ApifyProduct {
  title?: string;
  name?: string;
  productTitle?: string;
  price?: number | string | { value?: number; current?: number };
  currentPrice?: number | string;
  salePrice?: number | string;
  stars?: number | string;
  rating?: number | string;
  averageRating?: number | string;
  reviewsCount?: number | string;
  reviews?: number | string;
  numberOfReviews?: number | string;
  totalReviews?: number | string;
  ratingsTotal?: number | string;
  bsr?: number | string;
  bestSellersRank?: number | string;
  salesRank?: number | string;
  rank?: number | string;
  bestSellersRanks?: Array<{ rank?: number | string; category?: string }>;
  salesRanks?: Array<{ rank?: number | string; category?: string }>;
  brand?: string;
  brandName?: string;
  manufacturer?: string;
  category?: string;
  categoryName?: string;
  mainCategory?: string;
  breadcrumbs?: Array<{ name?: string }>;
  asin?: string;
  ASIN?: string;
  productId?: string;
  thumbnailImage?: string;
  image?: string;
  imageUrl?: string;
  mainImage?: string;
  url?: string;
  productUrl?: string;
  link?: string;
  isPrime?: boolean;
  prime?: boolean;
  isFBA?: boolean;
  sellersCount?: number | string;
  sellers?: number | string;
  [key: string]: unknown;
}

function extractPrice(raw: ApifyProduct): number {
  for (const key of ["price", "currentPrice", "salePrice"] as const) {
    const val = raw[key];
    if (typeof val === "number" && val > 0) return Math.round(val * 100) / 100;
    if (typeof val === "string") {
      const cleaned = val.replace(/[$,]/g, "").trim();
      const p = parseFloat(cleaned);
      if (p > 0) return Math.round(p * 100) / 100;
    }
  }
  // Nested price object
  if (typeof raw.price === "object" && raw.price !== null) {
    const obj = raw.price as Record<string, unknown>;
    for (const key of ["value", "current"]) {
      if (obj[key]) {
        const p = parseFloat(String(obj[key]));
        if (p > 0) return Math.round(p * 100) / 100;
      }
    }
  }
  return 0;
}

function extractBsr(raw: ApifyProduct): number {
  for (const key of ["bsr", "bestSellersRank", "salesRank", "rank"] as const) {
    const val = raw[key];
    if (typeof val === "number" && val > 0) return Math.floor(val);
    if (typeof val === "string") {
      const n = parseInt(val.replace(/[,#]/g, "").trim());
      if (n > 0) return n;
    }
  }
  // Nested BSR list
  const bsrList = raw.bestSellersRanks || raw.salesRanks || [];
  if (Array.isArray(bsrList) && bsrList.length > 0) {
    for (const entry of bsrList) {
      if (entry?.rank) {
        const n = parseInt(String(entry.rank).replace(/[,#]/g, ""));
        if (n > 0) return n;
      }
    }
  }
  return 0;
}

function parseNum(val: unknown): number {
  if (typeof val === "number") return Math.floor(val);
  if (typeof val === "string") {
    const n = parseInt(val.replace(/[,+#]/g, "").trim());
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function normalizeProduct(raw: ApifyProduct, keyword: string) {
  const asin = raw.asin || raw.ASIN || raw.productId || "";
  const title = raw.title || raw.name || raw.productTitle || "";
  const brand = raw.brand || raw.brandName || raw.manufacturer || "";
  const price = extractPrice(raw);
  const rating = parseFloat(String(raw.stars || raw.rating || raw.averageRating || 0)) || 0;
  const reviewCount = parseNum(raw.reviewsCount || raw.reviews || raw.numberOfReviews || raw.totalReviews || raw.ratingsTotal || 0);
  const bsr = extractBsr(raw);
  const isPrime = !!(raw.isPrime || raw.prime || raw.isFBA);

  let category = raw.category || raw.categoryName || raw.mainCategory || "";
  if (!category && Array.isArray(raw.breadcrumbs) && raw.breadcrumbs.length > 0) {
    category = raw.breadcrumbs[0]?.name || "";
  }

  const image = raw.thumbnailImage || raw.image || raw.imageUrl || raw.mainImage || "";
  const url = raw.url || raw.productUrl || raw.link || (asin ? `https://amazon.com/dp/${asin}` : "");

  return {
    asin,
    title,
    brand,
    price,
    rating: Math.round(rating * 10) / 10,
    reviewCount,
    bsr,
    category,
    isPrime,
    image,
    url,
    keyword,
  };
}

async function runApifyActor(keyword: string, maxItems: number): Promise<ApifyProduct[]> {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_API_TOKEN not configured");
  }

  const inputVariants = [
    { searchTerms: [keyword], maxItems, country: "US" },
    { keyword, maxResults: maxItems, domain: "amazon.com" },
    { search: keyword, maxItems, amazonDomain: "amazon.com" },
  ];

  for (let i = 0; i < ACTORS.length; i++) {
    const actorId = ACTORS[i];
    const input = inputVariants[i] || inputVariants[0];

    try {
      console.log(`[Amazon] Trying actor: ${actorId}`);
      const runRes = await fetch(`${APIFY_BASE}/acts/${actorId}/runs?token=${APIFY_TOKEN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          proxyConfiguration: { useApifyProxy: true },
        }),
      });

      if (!runRes.ok) {
        console.log(`[Amazon] Actor ${actorId} start failed: ${runRes.status}`);
        continue;
      }

      const run = await runRes.json();
      const runId = run.data?.id;
      if (!runId) continue;

      // Poll for completion (max 90 seconds)
      let status = "RUNNING";
      let attempts = 0;
      while (status === "RUNNING" && attempts < 30) {
        await new Promise((r) => setTimeout(r, 3000));
        const statusRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`);
        const statusData = await statusRes.json();
        status = statusData.data?.status || "FAILED";
        attempts++;
      }

      if (status !== "SUCCEEDED") {
        console.log(`[Amazon] Actor ${actorId} status: ${status}`);
        continue;
      }

      // Get results
      const datasetId = run.data?.defaultDatasetId;
      if (!datasetId) continue;

      const itemsRes = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=${maxItems}`);
      const items = await itemsRes.json();

      if (Array.isArray(items) && items.length > 0) {
        console.log(`[Amazon] Got ${items.length} results from ${actorId}`);
        return items;
      }
    } catch (err) {
      console.log(`[Amazon] Actor ${actorId} error:`, err);
    }
  }

  return [];
}

export async function POST(request: NextRequest) {
  try {
    // Auth
    let userId: number | null = null;
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyToken(authHeader.split(" ")[1]);
      if (payload) userId = payload.userId;
    }

    const { keyword, maxItems = 30, searchType = "product" } = await request.json();

    if (!keyword) {
      return Response.json({ error: "Keyword is required" }, { status: 400 });
    }

    if (!APIFY_TOKEN) {
      return Response.json({ error: "APIFY_API_TOKEN not configured on server" }, { status: 500 });
    }

    const searchKeyword = searchType === "brand" ? keyword : keyword;
    const rawItems = await runApifyActor(searchKeyword, maxItems);
    const products = rawItems
      .map((item) => normalizeProduct(item, keyword))
      .filter((p) => p.title);

    // Deduplicate by ASIN
    const seen = new Set<string>();
    const unique = products.filter((p) => {
      const key = p.asin || p.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Log activity
    if (userId) {
      await logActivity(userId, "amazon_search", keyword, {
        searchType,
        maxItems,
        resultsCount: unique.length,
      }).catch(() => {});
    }

    return Response.json({
      products: unique,
      total: unique.length,
      keyword,
      searchType,
    });
  } catch (error) {
    console.error("[Amazon] API error:", error);
    return Response.json(
      { error: "Amazon arama hatasi: " + (error instanceof Error ? error.message : "Bilinmeyen hata") },
      { status: 500 }
    );
  }
}
