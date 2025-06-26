"use server";

import { createSupabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

// Define the possible notification data structure
export type NotificationData =
  | { from?: string; from_name?: string } // friend_request
  | { prompt_id?: string; prompt_title?: string } // prompt_open, prompt_24h, voting_open
  | { response_id?: string; voter_id?: string; voter_name?: string } // vote_received
  | Record<string, unknown>; // fallback for extensibility

export async function createNotification(userId: string, type: string, data: NotificationData = {}) {
  const supabase = createSupabaseClient();
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    data,
    is_read: false,
  });
}

export async function getNotifications() {
  const { userId } = await auth();
  if (!userId) return { notifications: [] };

  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { notifications: data || [] };
}

export async function getUnreadNotificationCount() {
  const { userId } = await auth();
  if (!userId) return { count: 0 };

  const supabase = createSupabaseClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return { count: count || 0 };
}

export async function markNotificationsRead() {
  const { userId } = await auth();
  if (!userId) return;

  const supabase = createSupabaseClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
} 