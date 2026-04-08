import { NextRequest } from "next/server";
import { hashPassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, type, city, country, phone, instagram_url, youtube_url, linkedin_url, tiktok_url, x_url, categories, brands_worked_with, ugc_video_price, affiliate_commission_info, post_sharing_cost, package_details, media_kit_url, portfolio_urls, follower_count } = body;

    // Validate required fields
    if (!name || !email || !password || !type) {
      return Response.json({ error: "Ad, e-posta, şifre ve tür zorunludur." }, { status: 400 });
    }
    if (!['ugc', 'influencer'].includes(type)) {
      return Response.json({ error: "Geçersiz tür." }, { status: 400 });
    }

    // Check email uniqueness
    const { data: existing } = await supabase.from("users").select("id").eq("username", email).single();
    if (existing) {
      return Response.json({ error: "Bu e-posta adresi zaten kullanılıyor." }, { status: 409 });
    }

    // Create user
    const hash = await hashPassword(password);
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({ username: email, password_hash: hash, role: "creator" })
      .select()
      .single();
    if (userError) throw userError;

    // Compute tier for influencers
    let tier = null;
    if (type === 'influencer' && follower_count) {
      if (follower_count < 50000) tier = 'micro';
      else if (follower_count <= 250000) tier = 'mid';
      else if (follower_count <= 700000) tier = 'macro';
      else tier = 'mega';
    }

    // Create creator profile
    const { error: profileError } = await supabase.from("creator_profiles").insert({
      user_id: user.id,
      source: 'faycom',
      type,
      tier,
      name,
      city: city || null,
      country: country || 'Türkiye',
      phone: phone || null,
      email,
      instagram_url: instagram_url || null,
      youtube_url: youtube_url || null,
      linkedin_url: linkedin_url || null,
      tiktok_url: tiktok_url || null,
      x_url: x_url || null,
      follower_count: follower_count || 0,
      categories: categories || [],
      brands_worked_with: brands_worked_with || [],
      ugc_video_price: ugc_video_price || null,
      affiliate_commission_info: affiliate_commission_info || null,
      post_sharing_cost: post_sharing_cost || null,
      package_details: package_details || null,
      media_kit_url: media_kit_url || null,
      portfolio_urls: portfolio_urls || [],
      status: 'PENDING_APPROVAL',
    });
    if (profileError) throw profileError;

    return Response.json({ success: true, message: "Başvurunuz alındı. Admin onayı sonrası giriş yapabilirsiniz." });
  } catch (err: unknown) {
    console.error("Join creator error:", err);
    const message = err instanceof Error ? err.message : "Bir hata oluştu.";
    return Response.json({ error: message }, { status: 500 });
  }
}
