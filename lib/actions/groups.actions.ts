"use server";

import { createSupabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";
import { createNotification } from "@/lib/actions/notifications.actions";

export const createGroup = async (
    groupName: string, 
    groupDescription: string,
    groupType: string,
    groupMinMembers: number,
    groupMaxMembers: number) => {
        
        // Check if user is authenticated
        const { userId } = await auth();
        if (!userId) {
            return { error: "User not authenticated" };
        }

        const supabase = createSupabaseClient();

        // Fetch creator's username/full_name
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("username, full_name")
            .eq("id", userId)
            .single();

        if (profileError || !profile) {
            return { error: "Could not fetch user profile" };
        }

        const creatorUsername = profile.username || profile.full_name || "Unknown";

        // Create the group
        const { data: group, error: groupError } = await supabase.from('groups').insert({
            created_by: userId.toString(),
            name: groupName,
            description: groupDescription,
            type: groupType,
            min_members: groupMinMembers,
            max_members: groupMaxMembers,
            creator_username: creatorUsername,
        }).select().single();

        if (groupError) {
            console.error("Supabase error creating group:", groupError);
            return { error: groupError.message };
        }

        // Add the creator as an admin member
        const { error: memberError } = await supabase.from('group_members').insert({
            group_id: group.id,
            user_id: userId.toString(),
            is_admin: true,
        });

        if (memberError) {
            console.error("Supabase error adding creator as member:", memberError);
            // Note: We don't return error here as the group was created successfully
            // The user can still access the group since they're the creator
        }

        return { data: group };
}

export const getAllGroups = async () => {
  const { userId } = await auth();
  if (!userId) {
    return { error: "User not authenticated" };
  }

  const serviceSupabase = createServiceRoleSupabaseClient();

  // First, get all groups where the user is a member
  const { data: memberGroups, error: memberError } = await serviceSupabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);

  if (memberError) {
    console.error("Error fetching member groups:", memberError);
    return { error: memberError.message };
  }

  // Get group IDs where user is a member
  const memberGroupIds = (memberGroups || []).map(g => g.group_id);

  // Get all groups where user is creator or member
  const { data: groups, error } = await serviceSupabase
    .from('groups')
    .select('*')
    .or(`created_by.eq.${userId},id.in.(${memberGroupIds.join(',')})`);

  if (error) {
    console.error("Supabase error:", error);
    return { error: error.message };
  }

  // Get member counts for each group
  const groupsWithMemberCounts = await Promise.all(
    (groups || []).map(async (group) => {
      const { count: memberCount } = await serviceSupabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      // Get member profiles for avatars (show all members)
      const { data: members } = await serviceSupabase
        .from('group_members')
        .select(`
          user_id,
          profiles!inner(id, full_name, avatar_url)
        `)
        .eq('group_id', group.id);

      return {
        ...group,
        member_count: memberCount || 0,
        members: members || [],
        // creator_username is already available from the groups table
      };
    })
  );

  return { data: groupsWithMemberCounts };
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

  const serviceSupabase = createServiceRoleSupabaseClient();

  // 1. Get group data using service role to bypass RLS
  const { data: group, error: groupError } = await serviceSupabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (groupError || !group) return { error: "Group not found" };

  // 2. Get the active prompt (static for all groups)
  const { prompt, error: promptError } = await getActivePrompt();
  
  // If there's no active prompt, still return the group data
  if (promptError && !prompt) {
    return { 
      group, 
      prompt: null, 
      response: null,
      isRevealed: false,
      revealDate: null
    };
  }

  // 3. Get this user's response for this group and prompt (if any)
  const { data: response } = await serviceSupabase
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
      .select("id, user_id, content, created_at")
      .eq("prompt_id", prompt.id)
      .eq("group_id", groupId);

    if (error) {
      console.error("Error fetching group responses:", error);
      return { error: error.message };
    }

    // Filter to only show user's own response, but count all responses
    const userResponse = responses.find(r => r.user_id === userId);
    const responseCount = responses.length;

    // Fetch profile for user's response if it exists
    let userResponseWithProfile = null;
    if (userResponse) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", userResponse.user_id)
        .single();
      
      userResponseWithProfile = {
        ...userResponse,
        profiles: profile || { id: userResponse.user_id, full_name: "Unknown User", avatar_url: null },
      };
    }

    return { 
      responses: userResponseWithProfile ? [userResponseWithProfile] : [],
      responseCount,
      isRevealed: false,
      revealDate: prompt.reveal_date
    };
  } else {
    // Responses are revealed - return all responses
    const { data: responses, error } = await supabase
      .from("responses")
      .select("*")
      .eq("prompt_id", prompt.id)
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching group responses:", error);
      return { error: error.message };
    }

    if (!responses || responses.length === 0) {
      return { 
        responses: [], 
        responseCount: 0,
        isRevealed: true,
        revealDate: prompt.reveal_date
      };
    }

    // Extract unique user IDs
    const userIds = [...new Set(responses.map(r => r.user_id))];

    // Fetch profiles for all users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return { error: profilesError.message };
    }

    // Combine responses with profiles
    const responsesWithProfiles = responses.map(response => {
      const profile = profiles?.find(p => p.id === response.user_id);
      return {
        ...response,
        profiles: profile || { id: response.user_id, full_name: "Unknown User", avatar_url: null },
      };
    });

    return { 
      responses: responsesWithProfiles, 
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

export async function getFriendsGroups() {
  const { userId } = await auth();
  if (!userId) return { groups: [] };

  const supabase = createSupabaseClient();
  const serviceSupabase = createServiceRoleSupabaseClient();

  // First, get all accepted connections for this user
  const { data: connections, error: connectionsError } = await supabase
    .from("connections")
    .select("requester_id, recipient_id, status")
    .or(`and(requester_id.eq.${userId},status.eq.accepted),and(recipient_id.eq.${userId},status.eq.accepted)`);

  if (connectionsError) {
    console.error("Error fetching friend connections:", connectionsError);
    return { groups: [] };
  }

  if (!connections || connections.length === 0) {
    return { groups: [] };
  }

  // Extract friend IDs from connections
  const friendIds = connections.map(connection => {
    if (connection.requester_id === userId) {
      return connection.recipient_id;
    } else {
      return connection.requester_id;
    }
  });

  // Get groups created by friends using service role to bypass RLS
  const { data: groups, error: groupsError } = await serviceSupabase
    .from("groups")
    .select("id, name, description, max_members, created_by, type, creator_username")
    .in("created_by", friendIds);

  if (groupsError) {
    console.error("Error fetching friend groups:", groupsError);
    return { groups: [] };
  }

  if (!groups || groups.length === 0) {
    return { groups: [] };
  }

  // Get groups the user is already a member of
  const { data: myGroups } = await serviceSupabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  const myGroupIds = (myGroups || []).map((g) => g.group_id);

  // Filter out groups the user is already a member of
  const availableGroups = groups.filter(g => !myGroupIds.includes(g.id));

  if (availableGroups.length === 0) {
    return { groups: [] };
  }

  // Get member counts for these groups using service role
  const groupIds = availableGroups.map((g) => g.id);
  const { data: memberCountsRaw, error: memberCountsError } = await serviceSupabase
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds);

  if (memberCountsError) {
    console.error("Error fetching member counts:", memberCountsError);
    return { groups: [] };
  }

  const memberCounts = (memberCountsRaw || []) as { group_id: string }[];

  const memberCountMap: Record<string, number> = {};
  memberCounts.forEach((mc: { group_id: string }) => {
    memberCountMap[mc.group_id] = (memberCountMap[mc.group_id] || 0) + 1;
  });

  const groupsWithCount = await Promise.all(
    availableGroups.map(async (g) => {
      // Get member profiles for avatars (show all members)
      const { data: members } = await serviceSupabase
        .from('group_members')
        .select(`
          user_id,
          profiles!inner(id, full_name, avatar_url)
        `)
        .eq('group_id', g.id);

      return {
        ...g,
        member_count: memberCountMap[g.id] || 0,
        members: members || [],
        // creator_username is already available from the groups table
      };
    })
  );

  return { groups: groupsWithCount };
}

export async function getAvailablePublicGroups() {
  const { userId } = await auth();
  if (!userId) return { groups: [] };

  const serviceSupabase = createServiceRoleSupabaseClient();

  // Get all public groups using service role to bypass RLS
  const { data: groups, error: groupsError } = await serviceSupabase
    .from("groups")
    .select("id, name, description, max_members, created_by, creator_username")
    .eq("type", "public");

  if (groupsError) {
    console.error("Error fetching public groups:", groupsError);
    return { groups: [] };
  }

  if (!groups || groups.length === 0) {
    return { groups: [] };
  }

  // Get groups the user is already a member of
  const { data: myGroups } = await serviceSupabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  const myGroupIds = (myGroups || []).map((g) => g.group_id);

  // Filter out groups the user is already a member of
  const availableGroups = groups.filter(g => !myGroupIds.includes(g.id));

  if (availableGroups.length === 0) {
    return { groups: [] };
  }

  // Get member counts for these groups using service role
  const groupIds = availableGroups.map((g) => g.id);
  const { data: memberCountsRaw, error: memberCountsError } = await serviceSupabase
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds);

  if (memberCountsError) {
    console.error("Error fetching member counts:", memberCountsError);
    return { groups: [] };
  }

  const memberCounts = (memberCountsRaw || []) as { group_id: string }[];

  const memberCountMap: Record<string, number> = {};
  memberCounts.forEach((mc: { group_id: string }) => {
    memberCountMap[mc.group_id] = (memberCountMap[mc.group_id] || 0) + 1;
  });

  const groupsWithCount = await Promise.all(
    availableGroups.map(async (g) => {
      // Get member profiles for avatars (show all members)
      const { data: members } = await serviceSupabase
        .from('group_members')
        .select(`
          user_id,
          profiles!inner(id, full_name, avatar_url)
        `)
        .eq('group_id', g.id);

      return {
        ...g,
        type: "public" as const, // These are all public groups
        member_count: memberCountMap[g.id] || 0,
        members: members || [],
        // creator_username is already available from the groups table
      };
    })
  );

  return { groups: groupsWithCount };
}

export async function joinGroup(groupId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const supabase = createSupabaseClient();
  const serviceSupabase = createServiceRoleSupabaseClient();

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMember) {
    return { error: "Already a member of this group" };
  }

  // Get group details to check if it's full and get the admin
  const { data: group, error: groupError } = await serviceSupabase
    .from("groups")
    .select("id, name, max_members, created_by")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return { error: "Group not found" };
  }

  // Check if group is full
  const { data: memberCount, error: countError } = await serviceSupabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);

  if (countError) {
    console.error("Error checking member count:", countError);
    return { error: "Error checking group capacity" };
  }

  if ((memberCount?.length || 0) >= group.max_members) {
    return { error: "Group is full" };
  }

  // Add user to group
  const { error: joinError } = await serviceSupabase
    .from("group_members")
    .insert({
      group_id: groupId,
      user_id: userId,
      is_admin: false,
    });

  if (joinError) {
    console.error("Error joining group:", joinError);
    return { error: joinError.message };
  }

  // Get user's profile for notification
  const { data: userProfile } = await serviceSupabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  // Notify the group admin
  await createNotification(group.created_by, "member_joined", {
    group_id: groupId,
    group_name: group.name,
    member_id: userId,
    member_name: userProfile?.full_name || "Someone",
  });

  return { success: true };
}

// Group Management Functions
export async function getGroupMembers(groupId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const serviceSupabase = createServiceRoleSupabaseClient();

  try {
    // Get group details to check if user is admin
    const { data: group, error: groupError } = await serviceSupabase
      .from("groups")
      .select("created_by")
      .eq("id", groupId)
      .single();

    if (groupError) {
      console.error("Error fetching group:", groupError);
      return { error: groupError.message };
    }

    if (!group) {
      return { error: "Group not found" };
    }

    // First, get all group members
    const { data: members, error: membersError } = await serviceSupabase
      .from("group_members")
      .select("user_id, is_admin")
      .eq("group_id", groupId)
      .order("user_id", { ascending: true });

    if (membersError) {
      console.error("Error fetching group members:", membersError);
      return { error: membersError.message };
    }

    if (!members || members.length === 0) {
      return { 
        members: [], 
        isAdmin: group.created_by === userId,
        isCreator: group.created_by === userId 
      };
    }

    // Extract user IDs
    const userIds = members.map(m => m.user_id);

    // Fetch profiles for all members
    const { data: profiles, error: profilesError } = await serviceSupabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching member profiles:", profilesError);
      return { error: profilesError.message };
    }

    // Combine members with their profiles
    const membersWithProfiles = members.map(member => {
      const profile = profiles?.find(p => p.id === member.user_id);
      return {
        user_id: member.user_id,
        is_admin: member.is_admin,
        profiles: profile || { id: member.user_id, full_name: "Unknown User", avatar_url: null },
      };
    });

    // Check if current user is admin (either creator or has admin privileges)
    const currentUserMember = members.find(m => m.user_id === userId);
    const isAdmin = group.created_by === userId || currentUserMember?.is_admin === true;

    return { 
      members: membersWithProfiles, 
      isAdmin,
      isCreator: group.created_by === userId 
    };
  } catch (error) {
    console.error("Unexpected error in getGroupMembers:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function removeMember(groupId: string, memberId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const serviceSupabase = createServiceRoleSupabaseClient();

  // Check if user is admin
  const { data: group } = await serviceSupabase
    .from("groups")
    .select("created_by")
    .eq("id", groupId)
    .single();

  if (!group || group.created_by !== userId) {
    return { error: "Not authorized to remove members" };
  }

  // Prevent removing the creator
  if (memberId === group.created_by) {
    return { error: "Cannot remove the group creator" };
  }

  // Remove member
  const { error: removeError } = await serviceSupabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", memberId);

  if (removeError) {
    console.error("Error removing member:", removeError);
    return { error: removeError.message };
  }

  // Notify the removed member
  await createNotification(memberId, "member_removed", {
    group_id: groupId,
    group_name: (await serviceSupabase.from("groups").select("name").eq("id", groupId).single()).data?.name || "Unknown Group",
    admin_name: (await serviceSupabase.from("profiles").select("full_name").eq("id", userId).single()).data?.full_name || "Admin",
  });

  return { success: true };
}

export async function promoteToAdmin(groupId: string, memberId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const serviceSupabase = createServiceRoleSupabaseClient();

  // Check if user is admin
  const { data: group } = await serviceSupabase
    .from("groups")
    .select("created_by")
    .eq("id", groupId)
    .single();

  if (!group || group.created_by !== userId) {
    return { error: "Not authorized to promote members" };
  }

  // Promote member to admin
  const { error: promoteError } = await serviceSupabase
    .from("group_members")
    .update({ is_admin: true })
    .eq("group_id", groupId)
    .eq("user_id", memberId);

  if (promoteError) {
    console.error("Error promoting member:", promoteError);
    return { error: promoteError.message };
  }

  // Notify the promoted member
  await createNotification(memberId, "member_promoted", {
    group_id: groupId,
    group_name: (await serviceSupabase.from("groups").select("name").eq("id", groupId).single()).data?.name || "Unknown Group",
    admin_name: (await serviceSupabase.from("profiles").select("full_name").eq("id", userId).single()).data?.full_name || "Admin",
  });

  return { success: true };
}

export async function demoteFromAdmin(groupId: string, memberId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const serviceSupabase = createServiceRoleSupabaseClient();

  // Check if user is admin
  const { data: group } = await serviceSupabase
    .from("groups")
    .select("created_by")
    .eq("id", groupId)
    .single();

  if (!group || group.created_by !== userId) {
    return { error: "Not authorized to demote members" };
  }

  // Prevent demoting the creator
  if (memberId === group.created_by) {
    return { error: "Cannot demote the group creator" };
  }

  // Demote member from admin
  const { error: demoteError } = await serviceSupabase
    .from("group_members")
    .update({ is_admin: false })
    .eq("group_id", groupId)
    .eq("user_id", memberId);

  if (demoteError) {
    console.error("Error demoting member:", demoteError);
    return { error: demoteError.message };
  }

  // Notify the demoted member
  await createNotification(memberId, "member_demoted", {
    group_id: groupId,
    group_name: (await serviceSupabase.from("groups").select("name").eq("id", groupId).single()).data?.name || "Unknown Group",
    admin_name: (await serviceSupabase.from("profiles").select("full_name").eq("id", userId).single()).data?.full_name || "Admin",
  });

  return { success: true };
}

export async function updateGroupSettings(
  groupId: string, 
  updates: {
    name?: string;
    description?: string;
    type?: "public" | "private";
    min_members?: number;
    max_members?: number;
  }
) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const serviceSupabase = createServiceRoleSupabaseClient();

  // Check if user is admin
  const { data: group } = await serviceSupabase
    .from("groups")
    .select("created_by, member_count")
    .eq("id", groupId)
    .single();

  if (!group || group.created_by !== userId) {
    return { error: "Not authorized to update group settings" };
  }

  // Validate max_members is not less than current member count
  if (updates.max_members && updates.max_members < group.member_count) {
    return { error: `Cannot set max members below current count (${group.member_count})` };
  }

  // Update group settings
  const { data, error: updateError } = await serviceSupabase
    .from("groups")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating group settings:", updateError);
    return { error: updateError.message };
  }

  return { data };
}

export async function deleteGroup(groupId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const serviceSupabase = createServiceRoleSupabaseClient();

  // Check if user is admin
  const { data: group } = await serviceSupabase
    .from("groups")
    .select("created_by, name")
    .eq("id", groupId)
    .single();

  if (!group || group.created_by !== userId) {
    return { error: "Not authorized to delete group" };
  }

  // Get all members for notifications
  const { data: members } = await serviceSupabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  // Delete group (this will cascade delete members and responses)
  const { error: deleteError } = await serviceSupabase
    .from("groups")
    .delete()
    .eq("id", groupId);

  if (deleteError) {
    console.error("Error deleting group:", deleteError);
    return { error: deleteError.message };
  }

  // Notify all members that the group was deleted
  const adminName = (await serviceSupabase.from("profiles").select("full_name").eq("id", userId).single()).data?.full_name || "Admin";
  
  if (members) {
    for (const member of members) {
      if (member.user_id !== userId) { // Don't notify the admin who deleted it
        await createNotification(member.user_id, "group_deleted", {
          group_name: group.name,
          admin_name: adminName,
        });
      }
    }
  }

  return { success: true };
}