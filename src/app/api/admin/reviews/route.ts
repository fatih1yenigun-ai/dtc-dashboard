import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function getAdminPayload(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const payload = verifyToken(authHeader.split(" ")[1]);
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

export async function GET(request: NextRequest) {
  if (!getAdminPayload(request)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const targetType = searchParams.get("target_type");
  const pageSize = 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("reviews")
    .select("*, users(username)")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (targetType) {
    query = query.eq("target_type", targetType);
  }

  const { data: reviews, error } = await query;

  if (error) {
    console.error("GET /api/admin/reviews error:", error);
    return NextResponse.json({ error: "Yorumlar yüklenemedi" }, { status: 500 });
  }

  const mapped = (reviews ?? []).map((r) => ({
    id: r.id,
    reviewer_user_id: r.reviewer_user_id,
    target_type: r.target_type,
    target_id: r.target_id,
    rating: r.rating,
    text: r.text,
    is_expert: r.is_expert,
    created_at: r.created_at,
    reviewer_username: (r.users as { username: string } | null)?.username ?? null,
  }));

  return NextResponse.json({ reviews: mapped, page });
}

export async function DELETE(request: NextRequest) {
  if (!getAdminPayload(request)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const body = await request.json();
  const { id } = body as { id: number };

  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }

  const { error } = await supabase.from("reviews").delete().eq("id", id);

  if (error) {
    console.error("DELETE /api/admin/reviews error:", error);
    return NextResponse.json({ error: "Silme hatası" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
