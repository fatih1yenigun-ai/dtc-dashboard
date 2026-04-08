import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

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
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });
    }
    return NextResponse.json({ role: "creator", profile: data });
  }

  if (role === "supplier") {
    const { data, error } = await supabase
      .from("supplier_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });
    }
    return NextResponse.json({ role: "supplier", profile: data });
  }

  return NextResponse.json({ error: "Bu rol için profil yok" }, { status: 403 });
}

export async function PUT(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Token gerekli" }, { status: 401 });
  }

  const payload = verifyToken(authHeader.split(" ")[1]);
  if (!payload) {
    return NextResponse.json({ error: "Gecersiz token" }, { status: 401 });
  }

  const { userId, role } = payload;
  const body = await request.json();

  if (role === "creator") {
    // Verify ownership
    const { data: existing } = await supabase
      .from("creator_profiles")
      .select("id, user_id")
      .eq("user_id", userId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    const allowed = [
      "name", "city", "country", "phone",
      "instagram_url", "youtube_url", "linkedin_url", "tiktok_url", "x_url",
      "categories", "brands_worked_with",
      "ugc_video_price", "affiliate_commission_info", "post_sharing_cost", "package_details",
      "media_kit_url", "portfolio_urls",
    ];
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from("creator_profiles")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Güncelleme hatası" }, { status: 500 });
    }
    return NextResponse.json({ profile: data });
  }

  if (role === "supplier") {
    const { data: existing } = await supabase
      .from("supplier_profiles")
      .select("id, user_id")
      .eq("user_id", userId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    const allowed = [
      "company_name", "contact_person", "phone", "website", "city",
      "category", "specialty", "brands_produced_for",
      "marketplace_shopier", "marketplace_trendyol", "marketplace_n11",
      "marketplace_hepsiburada", "marketplace_amazon_tr",
      "description",
    ];
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from("supplier_profiles")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Güncelleme hatası" }, { status: 500 });
    }
    return NextResponse.json({ profile: data });
  }

  return NextResponse.json({ error: "Bu rol için profil yok" }, { status: 403 });
}
