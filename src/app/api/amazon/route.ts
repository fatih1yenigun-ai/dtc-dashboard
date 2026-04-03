import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyToken, logActivity } from "@/lib/auth";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Auth
    let userId: number | null = null;
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyToken(authHeader.split(" ")[1]);
      if (payload) userId = payload.userId;
    }

    const { keyword, maxItems = 20, searchType = "product" } = await request.json();

    if (!keyword) {
      return Response.json({ error: "Keyword is required" }, { status: 400 });
    }

    const count = Math.min(maxItems, 30);

    let prompt: string;

    if (searchType === "brand") {
      prompt = `You are an Amazon.com product data expert. List exactly ${count} REAL products currently sold by the brand "${keyword}" on Amazon.com (US marketplace).

For each product, provide realistic data based on your knowledge. These must be real products that actually exist on Amazon.

Return a JSON array with this exact format:
[
  {
    "asin": "B0XXXXXXXX",
    "title": "Full product title as it appears on Amazon",
    "brand": "${keyword}",
    "price": 29.99,
    "rating": 4.5,
    "reviewCount": 12500,
    "bsr": 2500,
    "category": "Home & Kitchen",
    "isPrime": true,
    "url": "https://amazon.com/dp/B0XXXXXXXX"
  }
]

IMPORTANT RULES:
- Use REAL ASINs if you know them, otherwise generate realistic B0-prefixed ones
- Prices must be realistic USD prices for that product type
- BSR (Best Sellers Rank) must be realistic for the product's popularity (1-500000)
- Review counts must be realistic (popular products: 5000-50000+, niche: 100-5000)
- Ratings typically 3.5-4.8
- Category must be a real Amazon top-level category
- isPrime: true for FBA products (most major brand products)
- Return ONLY the JSON array. No markdown, no explanation.`;
    } else {
      prompt = `You are an Amazon.com product data expert. Search Amazon.com (US marketplace) for "${keyword}" and list exactly ${count} REAL products that would appear in search results.

Include a mix of:
- Best sellers (low BSR, high reviews)
- Mid-range products (moderate BSR)
- Newer/smaller listings (higher BSR, fewer reviews)
- Different brands and price points

Return a JSON array with this exact format:
[
  {
    "asin": "B0XXXXXXXX",
    "title": "Full product title as it appears on Amazon",
    "brand": "Brand Name",
    "price": 29.99,
    "rating": 4.5,
    "reviewCount": 12500,
    "bsr": 2500,
    "category": "Home & Kitchen",
    "isPrime": true,
    "url": "https://amazon.com/dp/B0XXXXXXXX"
  }
]

IMPORTANT RULES:
- Use REAL products and REAL ASINs if you know them, otherwise generate realistic B0-prefixed ones
- Include real brands that actually sell "${keyword}" on Amazon
- Prices must be realistic USD prices for that product type
- BSR (Best Sellers Rank) must be realistic: top sellers 100-5000, mid 5000-50000, lower 50000+
- Review counts: bestsellers 10000-100000+, mid 1000-10000, newer 50-1000
- Ratings typically 3.5-4.8
- Category must be a real Amazon top-level category (e.g. "Home & Kitchen", "Sports & Outdoors", "Beauty & Personal Care")
- isPrime: true for most FBA products
- Return ONLY the JSON array. No markdown, no explanation.`;
    }

    // Use streaming to avoid Vercel timeout
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    let fullText = "";
    let tokensUsed = 0;

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullText += event.delta.text;
      }
      if (event.type === "message_delta") {
        const usage = (event as unknown as { usage?: { output_tokens?: number } }).usage;
        if (usage?.output_tokens) tokensUsed = usage.output_tokens;
      }
    }

    // Parse JSON
    let products;
    try {
      products = JSON.parse(fullText.trim());
    } catch {
      const match = fullText.match(/\[[\s\S]*\]/);
      if (match) {
        products = JSON.parse(match[0]);
      } else {
        return Response.json(
          { error: "Sonuc ayristirilamadi", products: [], total: 0 },
          { status: 200 }
        );
      }
    }

    // Ensure array
    if (!Array.isArray(products)) {
      products = [products];
    }

    // Clean up and validate
    const cleaned = products
      .filter((p: Record<string, unknown>) => p && p.title)
      .map((p: Record<string, unknown>) => ({
        asin: String(p.asin || ""),
        title: String(p.title || ""),
        brand: String(p.brand || ""),
        price: Number(p.price) || 0,
        rating: Math.round((Number(p.rating) || 0) * 10) / 10,
        reviewCount: Math.floor(Number(p.reviewCount) || 0),
        bsr: Math.floor(Number(p.bsr) || 0),
        category: String(p.category || ""),
        isPrime: Boolean(p.isPrime),
        image: "",
        url: String(p.url || (p.asin ? `https://amazon.com/dp/${p.asin}` : "")),
        keyword,
      }));

    // Log activity
    if (userId) {
      await logActivity(userId, "amazon_search", keyword, {
        searchType,
        maxItems: count,
        resultsCount: cleaned.length,
      }, tokensUsed).catch(() => {});
    }

    return Response.json({
      products: cleaned,
      total: cleaned.length,
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
