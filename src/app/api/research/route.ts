import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyToken, logActivity } from "@/lib/auth";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 60; // Vercel Pro allows up to 60s, Hobby = 10s

export async function POST(request: NextRequest) {
  try {
    // Get user from token (optional - don't block if no token)
    let userId: number | null = null;
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyToken(authHeader.split(" ")[1]);
      if (payload) userId = payload.userId;
    }

    const { keyword, count = 20, exclude = "", country = "all", foundedAfter = "all", revenueRange = "all" } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    const batchCount = Math.min(count, 10);

    let prompt = `"${keyword}" nişinde ${batchCount} DTC markası bul. JSON array döndür.

Her marka: {"brand_name":"X","website":"x.com","category":"Türkçe kategori","niche":"kod","aov":50,"estimated_traffic":100000,"insight":"Türkçe 1 cümle","marketing_angles":"açı1, açı2","growth_method":"yöntem1, yöntem2","history":"Türkçe 1 cümle","founded":2020,"country":"US","meta_ads_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=X"}

Niş kodları: gida_icecek, kahve_cay, atistirmalik, takviye_supplement, cilt_bakim, sac_bakim, makyaj, parfum_koku, vucut_bakim, erkek_bakim, bebek_anne, evcil_hayvan, saglik_wellness, kadin_sagligi, moda_kadin, moda_erkek, ic_giyim, ayakkabi, aksesuar_taki, spor_giyim, ev_tekstil, battaniye_yorgan, organizasyon, hali_kilim, mum_koku, mutfak, temizlik, outdoor, seyahat, teknoloji_aksesuar, elektronik, luks_moda, genel

İLK markaya ekle: "niche_summary":"3 cümle pazar özeti","niche_pros":"avantaj1, avantaj2, avantaj3","niche_cons":"dezavantaj1, dezavantaj2, dezavantaj3"

ÖNEMLİ: Sadece GERÇEK, var olan markalar ve gerçek web siteleri yaz. Uydurma marka veya website YAZMA. Website'in gerçek olduğundan emin ol.

SADECE JSON array. Markdown yok.`;

    let filterInstructions = "";

    if (country === "US") {
      filterInstructions += "\nSADECE Amerikan (ABD) markalarını getir. Ülke kodu US olmalı.";
    } else if (country === "TR") {
      filterInstructions += "\nSADECE Türk markalarını getir. Türkiye'de kurulmuş, Türk girişimcilerin sahip olduğu markalar. Ülke kodu TR olmalı. Website'leri gerçek olmalı - uydurma .com.tr domain'leri YAZMA.";
    }

    if (foundedAfter !== "all") {
      filterInstructions += `\nSADECE ${foundedAfter} yılı ve sonrasında kurulan markaları getir.`;
    }

    if (revenueRange !== "all") {
      const ranges: Record<string, string> = {
        "below-50k": "aylık $50,000 altında tahmini gelire sahip küçük/yeni",
        "50k-300k": "aylık $50,000 - $300,000 arası tahmini gelire sahip orta ölçekli",
        "300k+": "aylık $300,000 üzeri tahmini gelire sahip büyük",
      };
      filterInstructions += `\nSADECE ${ranges[revenueRange]} markaları getir. estimated_traffic'i buna göre ayarla.`;
    }

    if (filterInstructions) {
      prompt += filterInstructions;
    }

    if (exclude) {
      prompt += `\n\nBunları TEKRAR ETME: ${exclude}`;
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Calculate tokens used
    const tokensUsed = (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0);

    let brands;
    try {
      brands = JSON.parse(text);
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        brands = JSON.parse(match[0]);
      } else {
        return NextResponse.json({ error: "Sonuç ayrıştırılamadı", brands: [] });
      }
    }

    // Log activity
    if (userId) {
      await logActivity(userId, "search", keyword, { count: batchCount }, tokensUsed).catch(() => {});
    }

    return NextResponse.json({ brands });
  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json({ error: "Araştırma sırasında hata oluştu" }, { status: 500 });
  }
}
