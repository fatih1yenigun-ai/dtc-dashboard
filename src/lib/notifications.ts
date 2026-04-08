import { supabase } from "./supabase";

export async function createNotification(
  userId: number,
  type: string,
  title: string,
  body?: string,
  metadata?: Record<string, unknown>
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body: body || null,
    metadata: metadata || {},
  });
  if (error) console.error("Notification create error:", error);
}

export async function getUserNotifications(userId: number) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

export async function getUnreadCount(userId: number): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) {
    console.error(error);
    return 0;
  }
  return count || 0;
}

export async function markAsRead(notificationId: number) {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);
}

export async function markAllAsRead(userId: number) {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}
