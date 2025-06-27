"use client";
import { useState, useEffect } from "react";
import {
  getGroupMembers,
  getGroupPromptPageData,
} from "@/lib/actions/groups.actions";
import { notFound } from "next/navigation";
import GroupSettingsForm from "@/components/GroupSettingsForm";
import GroupMembersList from "@/components/GroupMembersList";
import MemberCardSkeleton from "@/components/skeletons/MemberCardSkeleton";
import DeleteGroupButton from "@/components/DeleteGroupButton";
import { Skeleton } from "@/components/ui/skeleton";

interface Group {
  id: string;
  name: string;
  description: string;
  type: "public" | "private";
  min_members: number;
  max_members: number;
  created_by: string;
}

interface Member {
  user_id: string;
  is_admin: boolean;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export default function GroupSettings({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { id: groupId } = await params;

        // Get group data and check if user is admin
        const groupResult = await getGroupPromptPageData(groupId);
        if (groupResult.error || !groupResult.group) {
          setError("Group not found");
          return;
        }

        setGroup(groupResult.group);

        // Get group members
        const membersResult = await getGroupMembers(groupId);
        if (membersResult.error) {
          setError(membersResult.error);
          return;
        }

        setMembers(membersResult.members || []);
        setIsAdmin(membersResult.isAdmin || false);
        setIsCreator(membersResult.isCreator || false);
      } catch (err) {
        setError("Failed to load group data");
        console.error("Error loading group settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Group Settings Form Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Member Management Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <MemberCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return notFound();
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            Only group admins can access group settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Group Settings</h1>
        <p className="text-gray-600">
          Manage your group &quot;{group.name}&quot; settings and members.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Group Settings Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Group Information</h2>
          <GroupSettingsForm group={group} />
        </div>

        {/* Member Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Member Management</h2>
          <GroupMembersList
            groupId={group.id}
            members={members}
            isCreator={isCreator}
          />
        </div>
      </div>

      {/* Danger Zone */}
      {isCreator && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">
            Danger Zone
          </h2>
          <p className="text-red-700 mb-4">
            These actions cannot be undone. Please be careful.
          </p>
          <DeleteGroupButton groupId={group.id} groupName={group.name} />
        </div>
      )}
    </div>
  );
}
