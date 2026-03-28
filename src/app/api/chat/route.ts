import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Sen deneyimli bir DTC (Direct-to-Consumer) danismanisin. Turkce konusuyorsun.

Uzmanlik alanlarin:
- DTC marka stratejisi ve is modelleri
- E-ticaret donusum optimizasyonu
- TQS (Traffic Quality Score) analizi: Bounce rate, sayfa/ziyaret ve oturum suresi metrikleriyle trafik kalitesini 1-10 arasi puanlama
- AOV (Average Order Value) tahminleme
- Meta/Facebook reklam stratejileri
- Turkiye e-ticaret pazari
- Marka konumlandirma ve pazarlama acilari

TQS Hakkinda:
- TQS 1-10 arasi bir puan, trafik kalitesini olcer
- Bounce Score: Dusuk bounce rate = yuksek puan
- Pages Score: Cok sayfa goruntulemesi = yuksek puan
- Duration Score: Uzun oturum suresi = yuksek puan
- Agirliklar: Bounce %40, Pages %30, Duration %30

Nis carpanlari: Yiyecek/Icecek 2.0x, Guzellik 1.5x, Moda 1.0x, Elektronik 0.7x, Luks 0.5x

Yuvacim markasi hakkinda bilgin var - bu bir Turkiye merkezli DTC markasi.

Yanitlarini kisa, oze ve pratik tut. Turkce yaz.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
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
    return new Response("Sohbet sirasinda hata olustu", { status: 500 });
  }
}
