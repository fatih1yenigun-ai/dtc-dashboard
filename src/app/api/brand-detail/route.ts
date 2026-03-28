import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { brand_name, website } = await req.json();

    if (!brand_name && !website) {
      return NextResponse.json(
        { error: "brand_name veya website gerekli" },
        { status: 400 }
      );
    }

    const query = brand_name && website
      ? `${brand_name} (${website})`
      : brand_name || website;

    const prompt = `Sen bir DTC (Direct-to-Consumer) marka analiz uzmanısın. Aşağıdaki markayı detaylı analiz et ve JSON formatında yanıt ver.

Marka: ${query}

Aşağıdaki JSON yapısını AYNEN doldur. Tüm metin alanlarını Türkçe yaz. Tahminlerin gerçekçi olsun.

{
  "brand_name": "Markanın adı",
  "website": "tam website URL'si",
  "tagline": "Markanın sloganı veya kısa açıklaması",
  "founded": 2019,
  "country": "US gibi 2 harfli ülke kodu",
  "founder_story": "Kurucu hikayesi - kim kurdu, neden kurdu, nasıl başladı, motivasyonu ne. En az 3-4 cümle detaylı anlat.",
  "scaling_story": "Marka nasıl büyüdü - ilk satışlardan bugünkü ölçeğe nasıl geldi, önemli dönüm noktaları, büyüme stratejileri. En az 3-4 cümle detaylı anlat.",
  "products": [
    { "name": "Ürün adı", "price": "$45", "category": "Kategori" }
  ],
  "target_audience": {
    "age_range": "25-35",
    "gender": "Kadın ağırlıklı / Erkek ağırlıklı / Unisex",
    "interests": ["ilgi alanı 1", "ilgi alanı 2", "ilgi alanı 3"],
    "income_level": "Düşük / Orta / Orta-üst / Yüksek",
    "demographics": "Hedef kitlenin detaylı demografik açıklaması"
  },
  "marketing_channels": ["Instagram", "TikTok", "Meta Ads", "Google Ads", "Email"],
  "marketing_angles": ["açı 1", "açı 2", "açı 3"],
  "growth_methods": ["Yöntem 1", "Yöntem 2", "Yöntem 3"],
  "estimated_traffic": 150000,
  "estimated_aov": 65,
  "estimated_revenue": 500000,
  "competitors": ["Rakip 1", "Rakip 2", "Rakip 3"],
  "strengths": ["Güçlü yön 1", "Güçlü yön 2", "Güçlü yön 3"],
  "weaknesses": ["Zayıf yön 1", "Zayıf yön 2", "Zayıf yön 3"],
  "turkey_potential": "Bu markayı veya benzer bir konsepti Türkiye'de başlatmak için detaylı analiz. Pazar büyüklüğü, rekabet durumu, fiyatlandırma stratejisi, hedef kitle adaptasyonu, pazarlama kanalları önerileri, olası zorluklar ve fırsatlar. En az 5-6 cümle detaylı anlat."
}

SADECE JSON döndür, başka hiçbir şey yazma. JSON geçerli olmalı.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response
    let jsonStr = text.trim();
    // Remove markdown code fences if present
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const data = JSON.parse(jsonStr);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Brand detail error:", error);
    return NextResponse.json(
      { error: "Marka analizi sırasında hata oluştu" },
      { status: 500 }
    );
  }
}
