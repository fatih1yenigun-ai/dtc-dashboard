import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get("target_type");
  const targetId = searchParams.get("target_id");

  if (!targetType || !targetId) {
    return NextResponse.json(
      { error: "target_type ve target_id gerekli" },
      { status: 400 }
    );
  }

  // Fetch reviews with reviewer username
  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("*, users(username)")
    .eq("target_type", targetType)
    .eq("target_id", Number(targetId))
    .order("is_expert", { ascending: false })
    .order("created_at", { ascending: false });

  if (reviewsError) {
    console.error("GET /api/reviews error:", reviewsError);
    return NextResponse.json({ error: "Yorumlar yüklenemedi" }, { status: 500 });
  }

  // Map username from joined users table
  const mappedReviews = (reviews ?? []).map((r) => ({
    id: r.id,
    reviewer_user_id: r.reviewer_user_id,
    target_type: r.target_type,
    target_id: r.target_id,
    rating: r.rating,
    text: r.text,
    is_expert: r.is_expert,
    created_at: r.created_at,
    reviewer_username:
      (r.users as { username: string } | null)?.username ?? null,
  }));

  // Compute stats
  const ratings = mappedReviews.map((r) => r.rating);
  const reviewCount = ratings.length;
  const avgRating =
    reviewCount > 0
      ? Math.round(
          (ratings.reduce((a, b) => a + b, 0) / reviewCount) * 10
        ) / 10
      : 0;

  return NextResponse.json({
    reviews: mappedReviews,
    stats: { avg_rating: avgRating, review_count: reviewCount },
  });
}

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Giriş yapmanız gerekli" }, { status: 401 });
  }

  const payload = verifyToken(authHeader.split(" ")[1]);
  if (!payload) {
    return NextResponse.json({ error: "Geçersiz token" }, { status: 401 });
  }

  const body = await request.json();
  const { target_type, target_id, rating, text } = body;

  if (!target_type || !target_id || !rating) {
    return NextResponse.json(
      { error: "target_type, target_id ve rating gerekli" },
      { status: 400 }
    );
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating 1-5 arasında olmalı" },
      { status: 400 }
    );
  }

  const userId = payload.userId;

  // Anti-spam: Check if user already reviewed this profile
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_user_id", userId)
    .eq("target_type", target_type)
    .eq("target_id", target_id);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "Bu profili zaten değerlendirdiniz." },
      { status: 409 }
    );
  }

  // Anti-spam: Max 5 reviews in 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentReviews, error: recentError } = await supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_user_id", userId)
    .gte("created_at", oneDayAgo);

  if (!recentError && recentReviews && recentReviews.length >= 5) {
    // Log suspicious activity
    await supabase.from("suspicious_activity").insert({
      user_id: userId,
      activity_type: "review_rate_limit",
      details: { target_type, target_id, recent_count: recentReviews.length },
    });
    return NextResponse.json(
      { error: "24 saat içinde en fazla 5 yorum yapabilirsiniz." },
      { status: 429 }
    );
  }

  // Anti-spam: Duplicate text check (last 7 days)
  if (text && text.trim()) {
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: dupeReviews } = await supabase
      .from("reviews")
      .select("id")
      .eq("reviewer_user_id", userId)
      .eq("text", text.trim())
      .gte("created_at", sevenDaysAgo);

    if (dupeReviews && dupeReviews.length > 0) {
      await supabase.from("suspicious_activity").insert({
        user_id: userId,
        activity_type: "review_duplicate_text",
        details: { target_type, target_id, text: text.trim() },
      });
      return NextResponse.json(
        { error: "Bu yorumu daha önce yazmışsınız." },
        { status: 409 }
      );
    }
  }

  // Determine expert status
  const isExpert = payload.role === "expert" || payload.role === "admin";

  // Insert review
  const { data: review, error: insertError } = await supabase
    .from("reviews")
    .insert({
      reviewer_user_id: userId,
      target_type,
      target_id,
      rating,
      text: text?.trim() || null,
      is_expert: isExpert,
    })
    .select()
    .single();

  if (insertError) {
    console.error("POST /api/reviews insert error:", insertError);
    return NextResponse.json(
      { error: "Yorum kaydedilemedi." },
      { status: 500 }
    );
  }

  return NextResponse.json({ review }, { status: 201 });
}
