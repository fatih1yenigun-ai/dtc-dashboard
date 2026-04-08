import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Giriş yapmanız gerekli" }, { status: 401 });
  }

  const payload = verifyToken(authHeader.split(" ")[1]);
  if (!payload) {
    return NextResponse.json({ error: "Geçersiz token" }, { status: 401 });
  }

  // Admin only
  if (payload.role !== "admin") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;
  const reviewId = Number(id);

  if (isNaN(reviewId)) {
    return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
  }

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId);

  if (error) {
    console.error("DELETE /api/reviews/[id] error:", error);
    return NextResponse.json({ error: "Yorum silinemedi" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
