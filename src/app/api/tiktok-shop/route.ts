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

    const { keyword, count = 10, exclude = "", country = "all", gmvRange = "all", dateRange = "all" } = await request.json();

    if (!keyword) {
      return new Response(JSON.stringify({ error: "Keyword is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const batchCount = Math.min(count, 10);

    let prompt = `"${keyword}" ile ilgili tam olarak ${batchCount} trend TikTok Shop ürünü listele. Gerçek veya gerçekçi TikTok Shop ürünleri olsun.

JSON array formatı:
{"product_name":"X","shop_name":"Y Shop","product_url":"tiktok.com/@yshop","product_price":14.99,"estimated_gmv":85000,"total_views":2500000,"total_videos":340,"marketing_angle":"açı1, açı2","category":"Türkçe kategori","creation_date":"2025-08","country":"US","insight":"Türkçe 1 cümle, neden viral/başarılı"}

İLK ürüne ekle: "niche_summary":"3 cümle pazar özeti","niche_pros":"avantaj1, avantaj2","niche_cons":"dezavantaj1, dezavantaj2"

Tam olarak ${batchCount} ürün döndür. SADECE JSON array. Markdown yok.`;

    let filterInstructions = "";
    if (country === "US") {
      filterInstructions += "\nSADECE Amerikan ürünlerini getir. Ülke kodu US olmalı.";
    } else if (country === "UK") {
      filterInstructions += "\nSADECE İngiltere ürünlerini getir. Ülke kodu UK olmalı.";
    }
    if (gmvRange !== "all") {
      const ranges: Record<string, string> = {
        "below-50k": "$50K altında GMV",
        "50k-300k": "$50K-$300K GMV",
        "300k+": "$300K+ GMV",
      };
      filterInstructions += `\nSADECE ${ranges[gmvRange]} olan ürünleri getir.`;
    }
    if (dateRange !== "all") {
      const dateRanges: Record<string, string> = {
        "3m": "son 3 ayda TikTok Shop'a eklenen",
        "6m": "son 6 ayda TikTok Shop'a eklenen",
        "1y": "son 1 yılda TikTok Shop'a eklenen",
      };
      filterInstructions += `\nSADECE ${dateRanges[dateRange]} ürünleri getir.`;
    }
    if (filterInstructions) prompt += filterInstructions;
    if (exclude) prompt += `\n\nBunları TEKRAR ETME: ${exclude}`;

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

    // Parse the collected text
    let products;
    try {
      products = JSON.parse(fullText.trim());
    } catch {
      const match = fullText.match(/\[[\s\S]*\]/);
      if (match) {
        products = JSON.parse(match[0]);
      } else {
        return new Response(JSON.stringify({ error: "Sonuç ayrıştırılamadı", raw: fullText.substring(0, 200) }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Log activity
    if (userId) {
      await logActivity(userId, "tts_search", keyword, { count: batchCount }, tokensUsed).catch(() => {});
    }

    return new Response(JSON.stringify({ products }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("TikTok Shop API error:", error);
    return new Response(JSON.stringify({ error: "Araştırma sırasında hata oluştu" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
