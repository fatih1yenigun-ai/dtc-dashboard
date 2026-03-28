import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyToken, logActivity } from "@/lib/auth";

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
    // Get user from token (optional)
    let userId: number | null = null;
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyToken(authHeader.split(" ")[1]);
      if (payload) userId = payload.userId;
    }

    const { messages, model = "sonnet", stream: wantStream = false } = await request.json();

    const modelId =
      model === "haiku"
        ? "claude-haiku-4-5-20251001"
        : "claude-sonnet-4-20250514";

    const maxTokens = model === "haiku" ? 1000 : 2048;

    // Non-streaming mode (floating chat, or any request with stream:false)
    if (!wantStream) {
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

      // Log activity
      const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
      if (userId) {
        await logActivity(userId, "chat", undefined, undefined, tokensUsed).catch(() => {});
      }

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
        let totalTokens = 0;
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
          if (event.type === "message_delta") {
            const usage = (event as unknown as { usage?: { output_tokens?: number } }).usage;
            if (usage?.output_tokens) totalTokens = usage.output_tokens;
          }
        }
        // Log activity after stream completes
        if (userId) {
          await logActivity(userId, "chat", undefined, undefined, totalTokens).catch(() => {});
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
