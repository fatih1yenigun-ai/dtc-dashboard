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

    const { keyword, count = 20, exclude = "", country = "all", foundedAfter = "all", revenueRange = "all" } = await request.json();

    if (!keyword) {
      return new Response(JSON.stringify({ error: "Keyword is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const batchCount = Math.min(count, 10);

    let prompt = `"${keyword}" ile ilgili tam olarak ${batchCount} DTC e-ticaret markası listele. Bilinen, gerçek markalar olsun. Büyük ve küçük markalar karışık olabilir.

JSON array formatı:
{"brand_name":"X","website":"x.com","category":"Türkçe","niche":"kod","aov":50,"estimated_traffic":100000,"insight":"Türkçe 1 cümle","marketing_angles":"açı1, açı2","growth_method":"yöntem1, yöntem2","history":"Türkçe 1 cümle","founded":2020,"country":"US","meta_ads_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=X"}

Niş kodları: gida_icecek, kahve_cay, atistirmalik, takviye_supplement, cilt_bakim, sac_bakim, makyaj, parfum_koku, vucut_bakim, erkek_bakim, bebek_anne, evcil_hayvan, saglik_wellness, kadin_sagligi, moda_kadin, moda_erkek, ic_giyim, ayakkabi, aksesuar_taki, spor_giyim, ev_tekstil, battaniye_yorgan, organizasyon, hali_kilim, mum_koku, mutfak, temizlik, outdoor, seyahat, teknoloji_aksesuar, elektronik, luks_moda, genel

İLK markaya ekle: "niche_summary":"3 cümle pazar özeti","niche_pros":"avantaj1, avantaj2, avantaj3","niche_cons":"dezavantaj1, dezavantaj2, dezavantaj3"

Tam olarak ${batchCount} marka döndür. SADECE JSON array. Markdown yok.`;

    let filterInstructions = "";
    if (country === "US") {
      filterInstructions += "\nSADECE Amerikan markalarını getir. Ülke kodu US olmalı.";
    } else if (country === "TR") {
      filterInstructions += "\nSADECE Türk markalarını getir. Ülke kodu TR olmalı.";
    }
    if (foundedAfter !== "all") {
      filterInstructions += `\nSADECE ${foundedAfter} yılı ve sonrasında kurulan markaları getir.`;
    }
    if (revenueRange !== "all") {
      const ranges: Record<string, string> = {
        "below-50k": "aylık $50,000 altında gelire sahip küçük",
        "50k-300k": "aylık $50,000-$300,000 arası gelire sahip orta",
        "300k+": "aylık $300,000+ gelire sahip büyük",
      };
      filterInstructions += `\nSADECE ${ranges[revenueRange]} markaları getir.`;
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
    let brands;
    try {
      brands = JSON.parse(fullText.trim());
    } catch {
      const match = fullText.match(/\[[\s\S]*\]/);
      if (match) {
        brands = JSON.parse(match[0]);
      } else {
        return new Response(JSON.stringify({ error: "Sonuç ayrıştırılamadı", raw: fullText.substring(0, 200) }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Log activity
    if (userId) {
      await logActivity(userId, "search", keyword, { count: batchCount }, tokensUsed).catch(() => {});
    }

    return new Response(JSON.stringify({ brands }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Research API error:", error);
    return new Response(JSON.stringify({ error: "Araştırma sırasında hata oluştu" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
