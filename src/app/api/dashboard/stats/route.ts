import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { loadReviewStats } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Token gerekli" }, { status: 401 });
  }

  const payload = verifyToken(authHeader.split(" ")[1]);
  if (!payload) {
    return NextResponse.json({ error: "Gecersiz token" }, { status: 401 });
  }

  const { userId, role } = payload;

  if (role === "creator") {
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("id, profile_views")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });
    }

    const stats = await loadReviewStats("creator", data.id);

    return NextResponse.json({
      profile_views: data.profile_views ?? 0,
      avg_rating: stats.avg_rating,
      review_count: stats.review_count,
    });
  }

  if (role === "supplier") {
    const { data, error } = await supabase
      .from("supplier_profiles")
      .select("id, profile_views")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });
    }

    const stats = await loadReviewStats("supplier", data.id);

    return NextResponse.json({
      profile_views: data.profile_views ?? 0,
      avg_rating: stats.avg_rating,
      review_count: stats.review_count,
    });
  }

  return NextResponse.json({ error: "Bu rol için dashboard yok" }, { status: 403 });
}
