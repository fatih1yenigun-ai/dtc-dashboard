import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { keyword, count = 10, niche = "fashion" } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: "Keyword is required" },
        { status: 400 }
      );
    }

    const prompt = `You are a DTC (Direct-to-Consumer) brand research expert. Find ${count} real DTC brands related to "${keyword}" in the ${niche} niche.

For each brand, provide:
1. brand_name: The brand name
2. website: The brand's website URL (just domain, no https://)
3. category: Product category in Turkish
4. aov: Estimated Average Order Value (e.g. "$45", "€60")
5. insight: A brief marketing insight about the brand in Turkish (1-2 sentences)
6. meta_ads_url: Facebook Ad Library URL (format: https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=BRAND_NAME)

Return ONLY a valid JSON array. No markdown, no code blocks, no explanation. Just the raw JSON array.

Example format:
[{"brand_name":"Example Brand","website":"example.com","category":"Cilt Bakimi","aov":"$55","insight":"Organik iceriklerle one cikan DTC markasi.","meta_ads_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=Example%20Brand"}]`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON from response
    let brands;
    try {
      // Try direct parse first
      brands = JSON.parse(text);
    } catch {
      // Try to extract JSON array from the text
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
      { error: "Arastirma sirasinda hata olustu" },
      { status: 500 }
    );
  }
}
