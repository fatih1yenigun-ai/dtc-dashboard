import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Token gerekli" }, { status: 401 });
  }

  const payload = verifyToken(authHeader.split(" ")[1]);
  if (!payload) {
    return NextResponse.json({ error: "Gecersiz token" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(payload.userId),
    getUnreadCount(payload.userId),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Token gerekli" }, { status: 401 });
  }

  const payload = verifyToken(authHeader.split(" ")[1]);
  if (!payload) {
    return NextResponse.json({ error: "Gecersiz token" }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "mark_read" && body.id) {
    await markAsRead(body.id);
    return NextResponse.json({ success: true });
  }

  if (body.action === "mark_all_read") {
    await markAllAsRead(payload.userId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Geçersiz aksiyon" }, { status: 400 });
}
