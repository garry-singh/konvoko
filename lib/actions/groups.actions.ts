"use server";

import { createSupabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

export const createGroup = async (
    groupName: string, 
    groupDescription: string) => {
        
        // Check if user is authenticated
        const { userId } = await auth();
        if (!userId) {
            return { error: "User not authenticated" };
        }

        const supabase = createSupabaseClient();

        const { data, error } = await supabase.from('groups').insert({
            created_by: userId.toString(),
            name: groupName,
            description: groupDescription,
        }).select().single();

        if (error) {
            console.error("Supabase error:", error);
            return { error: error.message };
        }

        return { data };
}

export const getAllGroups = async () => {
    const { userId } = await auth();
    if (!userId) {
      return { error: "User not authenticated" };
    }
  
    const supabase = createSupabaseClient();
  
    // Query for groups where the user is the creator or a member
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .or(`created_by.eq.${userId}`);
  
    if (error) {
      console.error("Supabase error:", error);
      return { error: error.message };
    }
  
    return { data };
  };

export async function getActivePrompt() {
  const supabase = createSupabaseClient();
  
  const now = new Date().toISOString();
  
  const { data: prompt, error } = await supabase
    .from("prompts")
    .select("*")
    .lte("active_date", now) // Prompt is active if active_date is in the past
    .order("active_date", { ascending: false }) // Get the most recently activated prompt
    .limit(1)
    .single();
  
  if (error) {
    console.error("Error fetching active prompt:", error);
    return { error: error.message };
  }
  
  return { prompt };
}

export async function getPastPrompts() {
  const supabase = createSupabaseClient();
  
  const now = new Date().toISOString();
  
  const { data: prompts, error } = await supabase
    .from("prompts")
    .select("*")
    .lt("active_date", now) // Prompts that have already been active
    .order("active_date", { ascending: false }) // Most recent first
    .limit(10); // Limit to last 10 prompts
  
  if (error) {
    console.error("Error fetching past prompts:", error);
    return { error: error.message };
  }
  
  return { prompts };
}

export async function getUpcomingPrompts() {
  const supabase = createSupabaseClient();
  
  const now = new Date().toISOString();
  
  const { data: prompts, error } = await supabase
    .from("prompts")
    .select("*")
    .gt("active_date", now) // Prompts that haven't been activated yet
    .order("active_date", { ascending: true }) // Order by activation date
    .limit(5); // Limit to next 5 prompts
  
  if (error) {
    console.error("Error fetching upcoming prompts:", error);
    return { error: error.message };
  }
  
  return { prompts };
}

export async function getGroupPromptPageData(groupId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };
  
    const supabase = createSupabaseClient();
  
    // 1. Get group data
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();
  
    if (groupError || !group) return { error: "Group not found" };
  
    // 2. Get the active prompt (static for all groups)
    const { prompt, error: promptError } = await getActivePrompt();
    if (promptError) return { error: promptError };
  
    // 3. Get this user's response for this group and prompt (if any)
    const { data: response } = await supabase
      .from("responses")
      .select("*")
      .eq("prompt_id", prompt?.id)
      .eq("group_id", groupId) // Responses are tied to group + prompt
      .eq("user_id", userId)
      .maybeSingle();

    // 4. Check if responses are revealed
    const isRevealed = prompt?.reveal_date && new Date() >= new Date(prompt.reveal_date);
  
    return { 
      group, 
      prompt, 
      response,
      isRevealed,
      revealDate: prompt?.reveal_date
    };
  }

export async function submitResponse(groupId: string, content: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const supabase = createSupabaseClient();

  // Get the active prompt
  const { prompt, error: promptError } = await getActivePrompt();
  if (promptError) return { error: promptError };
  if (!prompt) return { error: "No active prompt found" };

  // Check if user already has a response for this group and prompt
  const { data: existingResponse } = await supabase
    .from("responses")
    .select("*")
    .eq("prompt_id", prompt.id)
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingResponse) {
    // Update existing response
    const { data, error } = await supabase
      .from("responses")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", existingResponse.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating response:", error);
      return { error: error.message };
    }

    return { data };
  } else {
    // Create new response
    const { data, error } = await supabase
      .from("responses")
      .insert({
        prompt_id: prompt.id,
        group_id: groupId,
        user_id: userId,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating response:", error);
      return { error: error.message };
    }

    return { data };
  }
}

export async function getGroupResponses(groupId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const supabase = createSupabaseClient();

  // Get the active prompt
  const { prompt, error: promptError } = await getActivePrompt();
  if (promptError) return { error: promptError };
  if (!prompt) return { error: "No active prompt found" };

  // Check if responses are revealed for this prompt
  const isRevealed = prompt.reveal_date && new Date() >= new Date(prompt.reveal_date);

  if (!isRevealed) {
    // Responses are hidden - only return count and user's own response
    const { data: responses, error } = await supabase
      .from("responses")
      .select(`
        id,
        user_id,
        content,
        created_at,
        profiles:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("prompt_id", prompt.id)
      .eq("group_id", groupId);

    if (error) {
      console.error("Error fetching group responses:", error);
      return { error: error.message };
    }

    // Filter to only show user's own response, but count all responses
    const userResponse = responses.find(r => r.user_id === userId);
    const responseCount = responses.length;

    return { 
      responses: userResponse ? [userResponse] : [],
      responseCount,
      isRevealed: false,
      revealDate: prompt.reveal_date
    };
  } else {
    // Responses are revealed - return all responses
    const { data: responses, error } = await supabase
      .from("responses")
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("prompt_id", prompt.id)
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching group responses:", error);
      return { error: error.message };
    }

    return { 
      responses, 
      responseCount: responses.length,
      isRevealed: true,
      revealDate: prompt.reveal_date
    };
  }
}

export async function getGroupResponseCount(groupId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const supabase = createSupabaseClient();

  // Get the active prompt
  const { prompt, error: promptError } = await getActivePrompt();
  if (promptError) return { error: promptError };
  if (!prompt) return { error: "No active prompt found" };

  // Get count of responses for this group and prompt
  const { count, error } = await supabase
    .from("responses")
    .select("*", { count: "exact", head: true })
    .eq("prompt_id", prompt.id)
    .eq("group_id", groupId);

  if (error) {
    console.error("Error fetching response count:", error);
    return { error: error.message };
  }

  return { count: count || 0 };
}