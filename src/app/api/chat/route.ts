import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Sen deneyimli bir DTC (Direct-to-Consumer) danışmanısın. Türkçe konuşuyorsun. Adın "AI Danışman".

Uzmanlık alanların:
- DTC marka stratejisi ve iş modelleri
- E-ticaret dönüşüm optimizasyonu
- TQS (Traffic Quality Score) analizi
- AOV (Average Order Value) tahminleme
- Meta/Facebook reklam stratejileri
- Türkiye e-ticaret pazarı
- Marka konumlandırma ve pazarlama açıları
- Ürün-pazar uyumu değerlendirmesi
- Rakip analizi

Niş çarpanları: Yiyecek/İçecek 2.0x, Güzellik 1.5x, Bebek 1.4x, Sağlık 1.3x, Moda 1.0x, Elektronik 0.7x, Lüks 0.5x

Yuvacım markası hakkında bilgin var - Türkiye merkezli ev organizasyonu DTC markası.

Yanıtlarını kısa, öz ve pratik tut. Önemli kelimeleri **kalın** yaz. Rakamları ve yüzdeleri vurgula. Türkçe yaz.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, model = "sonnet" } = await request.json();

    const modelId =
      model === "haiku"
        ? "claude-haiku-4-5-20251001"
        : "claude-sonnet-4-20250514";

    const maxTokens = model === "haiku" ? 1000 : 2048;

    // For haiku (floating chat), return non-streaming JSON
    if (model === "haiku") {
      const response = await anthropic.messages.create({
        model: modelId,
        max_tokens: maxTokens,
        system: SYSTEM_PROMPT,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      });

      const reply =
        response.content[0].type === "text" ? response.content[0].text : "";
      return NextResponse.json({ reply });
    }

    // For sonnet (full chat page), stream response
    const stream = await anthropic.messages.stream({
      model: modelId,
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { reply: "Bir hata oluştu. Tekrar deneyin." },
      { status: 500 }
    );
  }
}
