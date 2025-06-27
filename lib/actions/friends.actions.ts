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

  // Notify the requester of the outcome
  await createNotification(connection.requester_id, accept ? "friend_request_accepted" : "friend_request_declined", {
    from: userId,
    from_name: (await supabase.from("profiles").select("full_name").eq("id", userId).single()).data?.full_name || "Someone",
  });

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

  // First, get all pending friend requests for this user
  const { data: connections, error: connectionsError } = await supabase
    .from("connections")
    .select("*")
    .eq("recipient_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (connectionsError) {
    console.error("Error fetching friend request connections:", connectionsError);
    return { error: connectionsError.message };
  }

  if (!connections || connections.length === 0) {
    return { requests: [] };
  }

  // Extract requester IDs from connections
  const requesterIds = connections.map(connection => connection.requester_id);

  // Fetch requester profiles
  const { data: requesterProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", requesterIds);

  if (profilesError) {
    console.error("Error fetching requester profiles:", profilesError);
    return { error: profilesError.message };
  }

  // Combine connections with requester profiles
  const requests = connections.map(connection => {
    const requester = requesterProfiles?.find(profile => profile.id === connection.requester_id);
    return {
      id: connection.id,
      requester: requester || { id: connection.requester_id, full_name: "Unknown User", avatar_url: null },
      created_at: connection.created_at,
    };
  });

  return { requests };
}

export async function getFriends(userId: string) {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) return { error: "Not authenticated" };

  const supabase = createSupabaseClient();

  // First, get all accepted connections for this user
  const { data: connections, error: connectionsError } = await supabase
    .from("connections")
    .select("*")
    .or(`and(requester_id.eq.${userId},status.eq.accepted),and(recipient_id.eq.${userId},status.eq.accepted)`);

  if (connectionsError) {
    console.error("Error fetching connections:", connectionsError);
    return { error: connectionsError.message };
  }

  if (!connections || connections.length === 0) {
    return { friends: [] };
  }

  // Extract friend IDs from connections
  const friendIds = connections.map(connection => {
    if (connection.requester_id === userId) {
      return connection.recipient_id;
    } else {
      return connection.requester_id;
    }
  });

  // Fetch friend profiles
  const { data: friendProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, friend_count")
    .in("id", friendIds);

  if (profilesError) {
    console.error("Error fetching friend profiles:", profilesError);
    return { error: profilesError.message };
  }

  return { friends: friendProfiles || [] };
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