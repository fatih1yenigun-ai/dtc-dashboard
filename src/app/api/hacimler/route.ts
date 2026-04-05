import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyToken, logActivity } from "@/lib/auth";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    let userId: number | null = null;
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyToken(authHeader.split(" ")[1]);
      if (payload) userId = payload.userId;
    }

    const { keyword } = await request.json();

    if (!keyword) {
      return Response.json({ error: "Keyword is required" }, { status: 400 });
    }

    const prompt = `You are a market research data expert with deep knowledge of Amazon, Google Search, and web analytics. For the keyword "${keyword}", provide comprehensive market data.

Return a single JSON object with exactly this structure (NO markdown, NO explanation, ONLY the JSON):
{
  "amazon": [ ... 15 products ... ],
  "keywords": [ ... 5 keywords ... ],
  "websites": [ ... 5 websites ... ]
}

## Amazon Products
For "amazon": provide 15 REAL products on Amazon.com (US) for "${keyword}". Mix of bestsellers and mid-range.
Each product object:
{
  "asin": "B0XXXXXXXX",
  "title": "Short product name (max 60 chars)",
  "brand": "Brand Name",
  "price": 29.99,
  "rating": 4.5,
  "reviewCount": 12500,
  "bsr": 2500,
  "category": "Home & Kitchen",
  "isPrime": true
}

## Google Keywords
For "keywords": provide the top 5 most searched Google keywords related to "${keyword}". Include the main keyword itself as #1.
Each keyword object:
{
  "keyword": "exact search term",
  "monthlyVolume": 74000,
  "difficulty": 45,
  "cpc": 1.25,
  "trend": "up"
}
Rules:
- monthlyVolume: realistic Google US monthly search volume
- difficulty: SEO difficulty 0-100 (0=easy, 100=impossible)
- cpc: Google Ads cost per click in USD
- trend: "up", "down", or "stable" based on market direction

## Top Websites
For "websites": provide the top 5 websites/brands that rank highest on Google for "${keyword}" and dominate this market.
Each website object:
{
  "rank": 1,
  "domain": "example.com",
  "brandName": "Example Brand",
  "monthlyTraffic": 500000,
  "category": "E-commerce / Category",
  "description": "One sentence about this brand"
}
Rules:
- Include real, well-known brands/websites in this niche
- monthlyTraffic: realistic estimated monthly visits
- Mix of DTC brands, marketplaces, and content sites

CRITICAL: Return ONLY the JSON object. No markdown code blocks. No text before or after.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 10000,
      messages: [{ role: "user", content: prompt }],
    });

    const tokensUsed = message.usage?.output_tokens || 0;
    const fullText = message.content
      .filter((b) => b.type === "text")
      .map((b) => ("text" in b ? b.text : ""))
      .join("");

    console.log("[Hacimler] Response length:", fullText.length);

    if (!fullText) {
      return Response.json({ error: "Claude bos yanit dondurdu" }, { status: 200 });
    }

    // Parse JSON - strip markdown, repair truncation
    let textToParse = fullText.trim();
    textToParse = textToParse.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");

    let parsed: { amazon?: unknown[]; keywords?: unknown[]; websites?: unknown[] };

    try {
      parsed = JSON.parse(textToParse);
    } catch {
      // Try to extract the JSON object
      const match = textToParse.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          // Try to repair truncated JSON
          let repairText = match[0];
          // Close any unclosed arrays/objects
          const openBrackets = (repairText.match(/\[/g) || []).length;
          const closeBrackets = (repairText.match(/\]/g) || []).length;
          const openBraces = (repairText.match(/\{/g) || []).length;
          const closeBraces = (repairText.match(/\}/g) || []).length;

          // Find last complete object
          const lastBrace = repairText.lastIndexOf("}");
          if (lastBrace > 0) {
            repairText = repairText.substring(0, lastBrace + 1);
            // Add missing closing brackets
            for (let i = 0; i < openBrackets - closeBrackets; i++) repairText += "]";
            for (let i = 0; i < openBraces - closeBraces - 1; i++) repairText += "}";
            repairText += "}";
          }

          try {
            parsed = JSON.parse(repairText);
          } catch (e3) {
            console.error("[Hacimler] JSON repair failed:", e3);
            console.error("[Hacimler] Text:", textToParse.substring(0, 500));
            return Response.json(
              { error: "Sonuc ayristirilamadi", debug: textToParse.substring(0, 300) },
              { status: 200 }
            );
          }
        }
      } else {
        console.error("[Hacimler] No JSON object found:", textToParse.substring(0, 500));
        return Response.json(
          { error: "JSON bulunamadi", debug: textToParse.substring(0, 300) },
          { status: 200 }
        );
      }
    }

    // Clean Amazon products
    const amazonRaw = (Array.isArray(parsed.amazon) ? parsed.amazon : []) as Record<string, unknown>[];
    const amazon = amazonRaw
      .filter((p) => p && p.title)
      .map((p) => ({
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
        url: `https://www.amazon.com/s?k=${encodeURIComponent(String(p.title || keyword))}`,
        keyword,
      }));

    // Clean keywords
    const keywordsRaw = (Array.isArray(parsed.keywords) ? parsed.keywords : []) as Record<string, unknown>[];
    const keywords = keywordsRaw
      .filter((k) => k && k.keyword)
      .map((k) => ({
        keyword: String(k.keyword || ""),
        monthlyVolume: Math.floor(Number(k.monthlyVolume) || 0),
        difficulty: Math.min(100, Math.max(0, Math.floor(Number(k.difficulty) || 0))),
        cpc: Math.round((Number(k.cpc) || 0) * 100) / 100,
        trend: (["up", "down", "stable"].includes(String(k.trend)) ? String(k.trend) : "stable") as "up" | "down" | "stable",
      }));

    // Clean websites
    const websitesRaw = (Array.isArray(parsed.websites) ? parsed.websites : []) as Record<string, unknown>[];
    const websites = websitesRaw
      .filter((w) => w && w.domain)
      .map((w, i) => ({
        rank: Number(w.rank) || i + 1,
        domain: String(w.domain || ""),
        brandName: String(w.brandName || w.domain || ""),
        monthlyTraffic: Math.floor(Number(w.monthlyTraffic) || 0),
        category: String(w.category || ""),
        description: String(w.description || ""),
      }));

    // Log activity
    if (userId) {
      await logActivity(userId, "hacimler_search", keyword, {
        amazonCount: amazon.length,
        keywordCount: keywords.length,
        websiteCount: websites.length,
      }, tokensUsed).catch(() => {});
    }

    return Response.json({
      keyword,
      amazon: { products: amazon, total: amazon.length },
      keywords,
      websites,
    });
  } catch (error) {
    console.error("[Hacimler] API error:", error);
    return Response.json(
      { error: "Hacimler arama hatasi: " + (error instanceof Error ? error.message : "Bilinmeyen hata") },
      { status: 500 }
    );
  }
}
