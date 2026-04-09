import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function getUserId(request: NextRequest): number | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const payload = verifyToken(authHeader.split(" ")[1]);
  return payload?.userId ?? null;
}

// GET — Return current mentor session state
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("mentor_sessions")
    .select("stage, user_context, messages, updated_at")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({
      hasSession: false,
      stage: 1,
      userContext: {},
      messageCount: 0,
      messages: [],
    });
  }

  const messages = Array.isArray(data.messages) ? data.messages : [];

  return NextResponse.json({
    hasSession: true,
    stage: data.stage,
    userContext: data.user_context || {},
    messageCount: messages.length,
    messages,
    updatedAt: data.updated_at,
  });
}

// PATCH — Update stage number
export async function PATCH(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { stage } = await request.json();

  if (typeof stage !== "number" || stage < 1 || stage > 5) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const { error } = await supabase
    .from("mentor_sessions")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) {
    console.error("Mentor context PATCH error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ stage });
}

// DELETE — Reset session
export async function DELETE(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("mentor_sessions")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Mentor context DELETE error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
