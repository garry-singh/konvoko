"use server";

import { createSupabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

// User Profile and Feed Functions
export async function getUserResponseFeed(userId: string, limit: number = 20) {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) return { error: "Not authenticated" };

  const supabase = createSupabaseClient();

  // First, get the responses
  const { data: responses, error: responsesError } = await supabase
    .from("responses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (responsesError) {
    console.error("Error fetching responses:", responsesError);
    return { error: responsesError.message };
  }

  if (!responses || responses.length === 0) {
    return { responses: [] };
  }

  // Extract unique prompt and group IDs
  const promptIds = [...new Set(responses.map(r => r.prompt_id))];
  const groupIds = [...new Set(responses.map(r => r.group_id))];

  // Fetch prompts and groups
  const [promptsResult, groupsResult] = await Promise.all([
    supabase.from("prompts").select("id, content, active_date, reveal_date").in("id", promptIds),
    supabase.from("groups").select("id, name").in("id", groupIds),
  ]);

  if (promptsResult.error) {
    console.error("Error fetching prompts:", promptsResult.error);
    return { error: promptsResult.error.message };
  }

  if (groupsResult.error) {
    console.error("Error fetching groups:", groupsResult.error);
    return { error: groupsResult.error.message };
  }

  // Combine the data
  const responsesWithDetails = responses.map(response => {
    const prompt = promptsResult.data?.find(p => p.id === response.prompt_id);
    const group = groupsResult.data?.find(g => g.id === response.group_id);
    
    return {
      ...response,
      prompts: prompt,
      groups: group,
    };
  });

  return { responses: responsesWithDetails };
}

export async function voteOnResponse(responseId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const supabase = createSupabaseClient();

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from("votes")
    .select("*")
    .eq("response_id", responseId)
    .eq("voter_id", userId)
    .maybeSingle();

  if (existingVote) {
    // Remove vote (toggle off)
    const { error: deleteError } = await supabase
      .from("votes")
      .delete()
      .eq("id", existingVote.id);

    if (deleteError) {
      console.error("Error removing vote:", deleteError);
      return { error: deleteError.message };
    }

    // Decrease vote count
    const { data: currentResponse } = await supabase
      .from("responses")
      .select("vote_count")
      .eq("id", responseId)
      .single();

    const { error: updateError } = await supabase
      .from("responses")
      .update({ vote_count: (currentResponse?.vote_count || 0) - 1 })
      .eq("id", responseId);

    if (updateError) {
      console.error("Error updating response vote count:", updateError);
      return { error: updateError.message };
    }

    return { voted: false };
  } else {
    // Add vote
    const { error: insertError } = await supabase
      .from("votes")
      .insert({
        response_id: responseId,
        voter_id: userId,
      });

    if (insertError) {
      console.error("Error adding vote:", insertError);
      return { error: insertError.message };
    }

    // Increase vote count
    const { data: currentResponse } = await supabase
      .from("responses")
      .select("vote_count")
      .eq("id", responseId)
      .single();

    const { error: updateError } = await supabase
      .from("responses")
      .update({ vote_count: (currentResponse?.vote_count || 0) + 1 })
      .eq("id", responseId);

    if (updateError) {
      console.error("Error updating response vote count:", updateError);
      return { error: updateError.message };
    }

    return { voted: true };
  }
}

export async function getUserStats(userId: string) {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) return { error: "Not authenticated" };

  const supabase = createSupabaseClient();

  // Get response count
  const { count: responseCount } = await supabase
    .from("responses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Get total votes received
  const { data: responses } = await supabase
    .from("responses")
    .select("vote_count")
    .eq("user_id", userId);

  const totalVotesReceived = responses?.reduce((sum, response) => sum + (response.vote_count || 0), 0) || 0;

  // Get friend count
  const { data: profile } = await supabase
    .from("profiles")
    .select("friend_count")
    .eq("id", userId)
    .single();

  return {
    responseCount: responseCount || 0,
    totalVotesReceived,
    friendCount: profile?.friend_count || 0,
  };
}

export async function updateUserProfile(updates: {
  full_name?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar_url?: string;
}) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error updating user profile:", error);
    return { error: error.message };
  }

  return { data };
}

export async function getUserProfile(userId: string) {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) return { error: "Not authenticated" };

  const supabase = createSupabaseClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return { error: error.message };
  }

  return { profile };
}

export async function searchUsers(query: string, limit = 10) {
  const { userId } = await auth();
  if (!userId) return { users: [] };

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .ilike("full_name", `%${query}%`)
    .neq("id", userId)
    .limit(limit);

  if (error) {
    console.error("Error searching users:", error);
    return { users: [] };
  }

  // For each user, check if a connection exists
  const usersWithStatus = await Promise.all(
    (data || []).map(async (user) => {
      const { data: connection } = await supabase
        .from("connections")
        .select("status")
        .or(
          `and(requester_id.eq.${userId},recipient_id.eq.${user.id}),and(requester_id.eq.${user.id},recipient_id.eq.${userId})`
        )
        .maybeSingle();
      return {
        ...user,
        connectionStatus: connection?.status || null,
      };
    })
  );

  return { users: usersWithStatus };
} 