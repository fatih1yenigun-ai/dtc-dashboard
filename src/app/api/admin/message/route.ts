import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }
  const payload = verifyToken(authHeader.split(" ")[1]);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const body = await request.json();
  const { user_id, title, body: msgBody } = body as {
    user_id: number;
    title: string;
    body: string;
  };

  if (!user_id || !title || !msgBody) {
    return NextResponse.json({ error: "user_id, title ve body gerekli" }, { status: 400 });
  }

  const { error } = await supabase.from("notifications").insert({
    user_id,
    title,
    body: msgBody,
    type: "admin_message",
  });

  if (error) {
    console.error("POST /api/admin/message error:", error);
    return NextResponse.json({ error: "Mesaj gönderilemedi" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
