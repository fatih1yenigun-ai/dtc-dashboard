import { NextRequest, NextResponse } from "next/server";
import { createUser, createToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || username.length < 3) {
      return NextResponse.json({ error: "Kullanici adi en az 3 karakter olmali" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Sifre en az 6 karakter olmali" }, { status: 400 });
    }

    // Check if this is the first user (make admin)
    const { count } = await supabase.from("users").select("id", { count: "exact", head: true });
    const role = count === 0 ? "admin" : "user";

    const user = await createUser(username, password, role);
    const token = createToken(user.id, user.username, user.role);

    // Create default "Genel" folder for the user
    await supabase.from("folders").insert({ name: "Genel", user_id: user.id }).select();

    return NextResponse.json({
      token,
      user: { userId: user.id, username: user.username, role: user.role },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Kayit sirasinda hata olustu";
    // Handle duplicate username
    if (typeof message === "string" && message.includes("duplicate")) {
      return NextResponse.json({ error: "Bu kullanici adi zaten kullaniliyor" }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
