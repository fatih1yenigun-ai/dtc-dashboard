import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Token gerekli" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Gecersiz token" }, { status: 401 });
  }

  return NextResponse.json({
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
  });
}
