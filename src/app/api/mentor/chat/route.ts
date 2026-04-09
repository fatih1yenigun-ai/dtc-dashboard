import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyToken, logActivity } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { buildMentorSystemPrompt, MentorUserContext } from "@/lib/mentor-prompt";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MAX_HISTORY_MESSAGES = 20;
const MAX_STORED_MESSAGES = 200;

interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

function parseContextUpdate(text: string): { cleanText: string; contextUpdate: Partial<MentorUserContext> | null } {
  const regex = /\[CONTEXT_UPDATE:([\s\S]*?)\]/g;
  let contextUpdate: Partial<MentorUserContext> | null = null;
  const cleanText = text.replace(regex, (_, json) => {
    try {
      contextUpdate = JSON.parse(json);
    } catch {
      // Ignore malformed context updates
    }
    return "";
  }).trim();

  return { cleanText, contextUpdate };
}

function parseStageAdvance(text: string): { cleanText: string; nextStage: number | null } {
  const regex = /\[STAGE_ADVANCE:(\d)\]/g;
  let nextStage: number | null = null;
  const cleanText = text.replace(regex, (_, num) => {
    const n = parseInt(num, 10);
    if (n >= 1 && n <= 5) nextStage = n;
    return "";
  }).trim();

  return { cleanText, nextStage };
}

export async function POST(request: NextRequest) {
  try {
    // Auth required
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = verifyToken(authHeader.split(" ")[1]);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const { userId, username } = payload;

    const body = await request.json();
    const { message, imageBase64 } = body as { message: string; imageBase64?: string };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Load or create mentor session
    let { data: session } = await supabase
      .from("mentor_sessions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!session) {
      const { data: newSession, error: insertError } = await supabase
        .from("mentor_sessions")
        .insert({
          user_id: userId,
          stage: 1,
          messages: [],
          user_context: {},
        })
        .select()
        .single();

      if (insertError) {
        console.error("Mentor session create error:", insertError);
        return NextResponse.json({ error: "Session creation failed" }, { status: 500 });
      }
      session = newSession;
    }

    const storedMessages: StoredMessage[] = Array.isArray(session.messages) ? session.messages : [];
    const userContext: MentorUserContext = session.user_context || {};
    const currentStage: number = session.stage || 1;

    // Build system prompt
    const systemPrompt = buildMentorSystemPrompt(currentStage, userContext, username);

    // Build messages for API: last N from history + new user message
    const recentMessages = storedMessages.slice(-MAX_HISTORY_MESSAGES);
    const apiMessages: Anthropic.MessageParam[] = recentMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Build new user message (with optional image)
    if (imageBase64) {
      // Extract mime type from base64 data URI or default to jpeg
      let mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" = "image/jpeg";
      let base64Data = imageBase64;

      if (imageBase64.startsWith("data:")) {
        const match = imageBase64.match(/^data:(image\/\w+);base64,/);
        if (match) {
          mediaType = match[1] as typeof mediaType;
          base64Data = imageBase64.split(",")[1];
        }
      }

      apiMessages.push({
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Data,
            },
          },
          {
            type: "text",
            text: message,
          },
        ],
      });
    } else {
      apiMessages.push({
        role: "user",
        content: message,
      });
    }

    // Stream response
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: apiMessages,
    });

    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        let totalTokens = 0;

        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              fullResponse += event.delta.text;
              controller.enqueue(encoder.encode(event.delta.text));
            }
            if (event.type === "message_delta") {
              const usage = (event as unknown as { usage?: { output_tokens?: number } }).usage;
              if (usage?.output_tokens) totalTokens = usage.output_tokens;
            }
          }

          // Post-stream: parse context update and stage advance
          const { cleanText: afterContext, contextUpdate } = parseContextUpdate(fullResponse);
          const { cleanText: cleanResponse, nextStage } = parseStageAdvance(afterContext);

          // Save messages to DB
          const newUserMsg: StoredMessage = {
            role: "user",
            content: message,
            timestamp: new Date().toISOString(),
          };
          const newAssistantMsg: StoredMessage = {
            role: "assistant",
            content: cleanResponse,
            timestamp: new Date().toISOString(),
          };

          let updatedMessages = [...storedMessages, newUserMsg, newAssistantMsg];

          // Cap at MAX_STORED_MESSAGES — keep first 2 (greeting context) + most recent
          if (updatedMessages.length > MAX_STORED_MESSAGES) {
            const first2 = updatedMessages.slice(0, 2);
            const recent = updatedMessages.slice(-(MAX_STORED_MESSAGES - 2));
            updatedMessages = [...first2, ...recent];
          }

          // Merge context update
          const updatedContext = contextUpdate
            ? { ...userContext, ...contextUpdate }
            : userContext;

          // Update stage if advanced
          const updatedStage = nextStage || currentStage;

          await supabase
            .from("mentor_sessions")
            .update({
              messages: updatedMessages,
              user_context: updatedContext,
              stage: updatedStage,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          // Log activity
          if (userId) {
            await logActivity(userId, "mentor_chat", undefined, undefined, totalTokens).catch(() => {});
          }
        } catch (err) {
          console.error("Mentor stream error:", err);
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
    console.error("Mentor chat API error:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu. Tekrar deneyin." },
      { status: 500 }
    );
  }
}
