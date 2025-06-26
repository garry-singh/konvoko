"use server";

import { createSupabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { createNotification } from "@/lib/actions/notifications.actions";

export async function sendFriendRequest(recipientId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  if (userId === recipientId) {
    return { error: "Cannot send friend request to yourself" };
  }

  const supabase = createSupabaseClient();

  // Check if connection already exists
  const { data: existingConnection } = await supabase
    .from("connections")
    .select("*")
    .or(`and(requester_id.eq.${userId},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${userId})`)
    .maybeSingle();

  if (existingConnection) {
    return { error: "Connection already exists" };
  }

  // Get sender's profile for notification
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  const { data, error } = await supabase
    .from("connections")
    .insert({
      requester_id: userId,
      recipient_id: recipientId,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error sending friend request:", error);
    return { error: error.message };
  }

  // Create notification for recipient
  await createNotification(recipientId, "friend_request", {
    from: userId,
    from_name: senderProfile?.full_name || "Someone",
  });

  return { data };
}

export async function respondToFriendRequest(connectionId: string, accept: boolean) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const supabase = createSupabaseClient();

  // Get the connection
  const { data: connection, error: fetchError } = await supabase
    .from("connections")
    .select("*")
    .eq("id", connectionId)
    .eq("recipient_id", userId)
    .single();

  if (fetchError || !connection) {
    return { error: "Friend request not found" };
  }

  const status = accept ? "accepted" : "rejected";

  const { data, error } = await supabase
    .from("connections")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", connectionId)
    .select()
    .single();

  if (error) {
    console.error("Error responding to friend request:", error);
    return { error: error.message };
  }

  // Update friend counts if accepted
  if (accept) {
    // Update requester's friend count
    const { data: requesterProfile } = await supabase
      .from("profiles")
      .select("friend_count")
      .eq("id", connection.requester_id)
      .single();

    await supabase
      .from("profiles")
      .update({ friend_count: (requesterProfile?.friend_count || 0) + 1 })
      .eq("id", connection.requester_id);

    // Update recipient's friend count
    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("friend_count")
      .eq("id", connection.recipient_id)
      .single();

    await supabase
      .from("profiles")
      .update({ friend_count: (recipientProfile?.friend_count || 0) + 1 })
      .eq("id", connection.recipient_id);
  }

  return { data };
}

export async function getFriendRequests() {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const supabase = createSupabaseClient();

  const { data: requests, error } = await supabase
    .from("connections")
    .select(`
      *,
      requester:requester_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("recipient_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching friend requests:", error);
    return { error: error.message };
  }

  return { requests };
}

export async function getFriends(userId: string) {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) return { error: "Not authenticated" };

  const supabase = createSupabaseClient();

  const { data: friends, error } = await supabase
    .from("connections")
    .select(`
      *,
      friend:requester_id (
        id,
        full_name,
        avatar_url,
        friend_count
      ),
      friend2:recipient_id (
        id,
        full_name,
        avatar_url,
        friend_count
      )
    `)
    .or(`and(requester_id.eq.${userId},status.eq.accepted),and(recipient_id.eq.${userId},status.eq.accepted)`);

  if (error) {
    console.error("Error fetching friends:", error);
    return { error: error.message };
  }

  // Transform the data to get friend profiles
  const friendProfiles = friends.map(connection => {
    if (connection.requester_id === userId) {
      return connection.friend2;
    } else {
      return connection.friend;
    }
  });

  return { friends: friendProfiles };
}

export async function removeFriend(friendId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const supabase = createSupabaseClient();

  // Find the connection
  const { data: connection, error: fetchError } = await supabase
    .from("connections")
    .select("*")
    .or(`and(requester_id.eq.${userId},recipient_id.eq.${friendId},status.eq.accepted),and(requester_id.eq.${friendId},recipient_id.eq.${userId},status.eq.accepted)`)
    .single();

  if (fetchError || !connection) {
    return { error: "Friendship not found" };
  }

  // Delete the connection
  const { error: deleteError } = await supabase
    .from("connections")
    .delete()
    .eq("id", connection.id);

  if (deleteError) {
    console.error("Error removing friend:", deleteError);
    return { error: deleteError.message };
  }

  // Decrease friend counts
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("friend_count")
    .eq("id", userId)
    .single();

  await supabase
    .from("profiles")
    .update({ friend_count: (userProfile?.friend_count || 0) - 1 })
    .eq("id", userId);

  const { data: friendProfile } = await supabase
    .from("profiles")
    .select("friend_count")
    .eq("id", friendId)
    .single();

  await supabase
    .from("profiles")
    .update({ friend_count: (friendProfile?.friend_count || 0) - 1 })
    .eq("id", friendId);

  return { success: true };
}

export async function getConnectionStatus(otherUserId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  if (userId === otherUserId) {
    return { status: "self" };
  }

  const supabase = createSupabaseClient();

  const { data: connection, error } = await supabase
    .from("connections")
    .select("*")
    .or(`and(requester_id.eq.${userId},recipient_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},recipient_id.eq.${userId})`)
    .maybeSingle();

  if (error) {
    console.error("Error fetching connection status:", error);
    return { error: error.message };
  }

  if (!connection) {
    return { status: "none" };
  }

  if (connection.status === "pending") {
    return { 
      status: connection.requester_id === userId ? "pending_sent" : "pending_received",
      connectionId: connection.id
    };
  }

  return { status: connection.status };
} 