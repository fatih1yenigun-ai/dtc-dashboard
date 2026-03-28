import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "./supabase";

const JWT_SECRET = process.env.JWT_SECRET || "dtc-dashboard-secret-key-2026";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(userId: number, username: string, role: string): string {
  return jwt.sign({ userId, username, role }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number; username: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; username: string; role: string };
  } catch {
    return null;
  }
}

export async function createUser(username: string, password: string, role = "user") {
  const hash = await hashPassword(password);
  const { data, error } = await supabase.from("users").insert({ username, password_hash: hash, role }).select().single();
  if (error) throw error;
  return data;
}

export async function loginUser(username: string, password: string) {
  const { data, error } = await supabase.from("users").select("*").eq("username", username).single();
  if (error || !data) throw new Error("Kullanici bulunamadi");
  const valid = await verifyPassword(password, data.password_hash);
  if (!valid) throw new Error("Yanlis sifre");
  return data;
}

export async function logActivity(userId: number, actionType: string, keyword?: string, details?: Record<string, unknown>, tokensUsed = 0) {
  await supabase.from("user_activity").insert({
    user_id: userId,
    action_type: actionType,
    keyword,
    details,
    tokens_used: tokensUsed,
  });
}
