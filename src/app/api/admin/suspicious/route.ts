import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }
  const payload = verifyToken(authHeader.split(" ")[1]);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("suspicious_activity")
    .select("*, users(username)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET /api/admin/suspicious error:", error);
    return NextResponse.json({ error: "Veri yüklenemedi" }, { status: 500 });
  }

  const mapped = (data ?? []).map((s) => ({
    id: s.id,
    user_id: s.user_id,
    violation_type: s.violation_type,
    details: s.details,
    created_at: s.created_at,
    username: (s.users as { username: string } | null)?.username ?? null,
  }));

  return NextResponse.json({ suspicious: mapped });
}
