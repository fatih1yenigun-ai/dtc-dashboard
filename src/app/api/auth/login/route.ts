import { NextRequest, NextResponse } from "next/server";
import { loginUser, createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Kullanıcı adı ve şifre gerekli" }, { status: 400 });
    }

    const user = await loginUser(username, password);
    const token = createToken(user.id, user.username, user.role);

    return NextResponse.json({
      token,
      user: { userId: user.id, username: user.username, role: user.role },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Giriş sırasında hata oluştu";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
