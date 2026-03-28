import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Niche multipliers for conversion rate
const NICHE_LIST = `
Niş kategorileri ve dönüşüm çarpanları:
- gida_icecek (Yiyecek & İçecek): 2.0x
- kahve_cay (Kahve & Çay): 2.0x
- atistirmalik (Atıştırmalık & Snack): 2.0x
- takviye_supplement (Takviye & Supplement): 1.8x
- protein_fitness_gida (Protein & Fitness Gıda): 1.8x
- cilt_bakim (Cilt Bakımı): 1.5x
- sac_bakim (Saç Bakımı): 1.5x
- makyaj (Makyaj & Kozmetik): 1.5x
- parfum_koku (Parfüm & Koku): 1.5x
- vucut_bakim (Vücut Bakımı): 1.5x
- erkek_bakim (Erkek Bakım): 1.5x
- dis_agiz_bakim (Diş & Ağız Bakımı): 1.5x
- bebek_anne (Bebek & Anne): 1.4x
- evcil_hayvan (Evcil Hayvan): 1.4x
- saglik_wellness (Sağlık & Wellness): 1.3x
- kadin_sagligi (Kadın Sağlığı): 1.3x
- cinsel_saglik (Cinsel Sağlık): 1.3x
- moda_kadin (Kadın Moda): 1.0x
- moda_erkek (Erkek Moda): 1.0x
- ic_giyim (İç Giyim & Çorap): 1.0x
- ayakkabi (Ayakkabı & Terlik): 1.0x
- aksesuar_taki (Aksesuar & Takı): 1.0x
- gozluk (Gözlük & Güneş Gözlüğü): 1.0x
- spor_giyim (Spor Giyim & Athleisure): 1.0x
- ev_tekstil (Ev Tekstili & Yatak): 1.0x
- battaniye_yorgan (Battaniye & Yorgan): 1.0x
- havlu_bornoz (Havlu & Bornoz): 1.0x
- organizasyon (Ev Organizasyon): 1.0x
- hali_kilim (Halı & Kilim): 1.0x
- mum_koku (Mum & Ev Kokusu): 1.1x
- mutfak (Mutfak & Pişirme): 0.9x
- temizlik (Temizlik & Ev Bakımı): 0.9x
- outdoor (Outdoor & Kamp): 0.8x
- seyahat (Seyahat & Bavul): 0.8x
- teknoloji_aksesuar (Teknoloji Aksesuarı): 0.7x
- elektronik (Elektronik & Gadget): 0.7x
- uyku_teknoloji (Uyku Teknolojisi): 0.7x
- luks_moda (Lüks Moda): 0.5x
- luks_aksesuar (Lüks Aksesuar): 0.5x
- luks_ev (Lüks Ev & Dekor): 0.5x
- genel (Genel / Diğer): 1.0x
`;

export async function POST(request: NextRequest) {
  try {
    const { keyword, count = 10 } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: "Keyword is required" },
        { status: 400 }
      );
    }

    const prompt = `Sen bir DTC (Direct-to-Consumer) marka araştırma uzmanısın. "${keyword}" ile ilgili ${count} gerçek DTC markası bul.

Her marka için şunları ver:
1. brand_name: Marka adı
2. website: Web sitesi (sadece domain, https:// olmadan)
3. category: Ürün kategorisi (Türkçe)
4. niche: Aşağıdaki niş listesinden en uygun olanı seç (sadece kodu yaz):
${NICHE_LIST}
5. aov: Tahmini Ortalama Sipariş Değeri (USD sayı olarak, örn: 45)
6. estimated_traffic: Tahmini aylık trafik (sayı olarak, örn: 150000). Marka büyüklüğüne göre tahmin et.
7. insight: Markanın pazarlama açısı, ne ile farklılaştığı (Türkçe, 1-2 cümle). İçerik olarak: kullandığı özel malzemeler, hedef kitlesi, fiyatlandırma stratejisi gibi detaylar.
8. marketing_angles: Markanın kullandığı pazarlama açıları/stratejileri (Türkçe, virgülle ayrılmış, örn: "influencer marketing, UGC, TikTok viral, doğal içerikler, abonelik modeli")
9. growth_method: Markanın büyüme yöntemi (örn: "TikTok Shop", "Influencer Marketing", "Meta Ads", "Organik SEO", "Amazon FBA", "Kickstarter", "Referral", "Celebrity Endorsement", "Podcast Sponsorship"). Birden fazla olabilir, virgülle ayır.
10. history: Kuruluş hikayesi, nasıl büyüdüğü (Türkçe, 1-2 cümle)
11. founded: Kuruluş yılı (sayı, örn: 2019)
12. country: Markanın ülkesi (2 harfli ülke kodu, örn: "US", "UK", "DE", "TR", "AU", "FR", "KR")
13. meta_ads_url: Facebook Reklam Kütüphanesi URL'si (format: https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=MARKA_ADI)

Ayrıca araştırma sonunda şu ek bilgileri de ver:
14. niche_summary: Bu niş hakkında kısa bir özet (Türkçe, 3-4 cümle). Pazarın durumu, büyüme trendi, rekabet seviyesi.
15. niche_pros: Bu nişin avantajları (Türkçe, virgülle ayrılmış 4-5 madde)
16. niche_cons: Bu nişin dezavantajları (Türkçe, virgülle ayrılmış 4-5 madde)

ÖNEMLI: niche_summary, niche_pros ve niche_cons alanlarını SADECE ilk marka objesine ekle. Diğer markalara ekleme.

SADECE geçerli JSON array döndür. Markdown yok, açıklama yok. Ham JSON array.

Örnek:
[{"brand_name":"Bearaby","website":"bearaby.com","category":"Ağırlıklı Battaniye","niche":"ev_tekstil","aov":249,"estimated_traffic":210000,"insight":"Dolgu malzemesiz örgü ağırlıklı battaniye ile kategoride devrim yarattı; cam boncuk yerine organik pamuk kullanımı","marketing_angles":"sürdürülebilirlik, premium tasarım, anksiyete çözümü, Instagram estetik","growth_method":"Kickstarter, Instagram Ads, Influencer Marketing","history":"2018'de Kickstarter ile kuruldu, Inc. 5000'de 82. sıra, $1.9M aylık gelir","founded":2018,"country":"US","meta_ads_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=Bearaby","niche_summary":"Ağırlıklı battaniye pazarı 2018'den beri hızla büyüyor. Anksiyete ve uyku sorunlarına çözüm olarak konumlandırılıyor.","niche_pros":"Yüksek AOV, düşük iade oranı, duygusal satın alma, tekrarlı müşteri potansiyeli","niche_cons":"Mevsimsel talep dalgalanması, yüksek kargo maliyeti, sınırlı SKU çeşitliliği, büyük markalarla rekabet"}]`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let brands;
    try {
      brands = JSON.parse(text);
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        brands = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse brands from response");
      }
    }

    return NextResponse.json({ brands });
  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json(
      { error: "Araştırma sırasında hata oluştu" },
      { status: 500 }
    );
  }
}
