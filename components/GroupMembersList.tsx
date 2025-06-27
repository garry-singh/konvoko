"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  removeMember,
  promoteToAdmin,
  demoteFromAdmin,
} from "@/lib/actions/groups.actions";

interface Member {
  user_id: string;
  is_admin: boolean;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export default function GroupMembersList({
  groupId,
  members,
  isCreator,
  groupCreatorId,
}: {
  groupId: string;
  members: Member[];
  isCreator: boolean;
  groupCreatorId: string;
}) {
  const [loadingStates, setLoadingStates] = useState<Record<string, string>>(
    {}
  );
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: string, memberId: string) => {
    setLoadingStates((prev) => ({ ...prev, [memberId]: action }));
    setError(null);

    try {
      let result;
      switch (action) {
        case "remove":
          result = await removeMember(groupId, memberId);
          break;
        case "promote":
          result = await promoteToAdmin(groupId, memberId);
          break;
        case "demote":
          result = await demoteFromAdmin(groupId, memberId);
          break;
        default:
          return;
      }

      if (result.error) {
        setError(result.error);
      } else {
        // Refresh the page to show updated data
        window.location.reload();
      }
    } catch (err) {
      setError("Failed to perform action. Please try again.");
      console.error("Error performing member action:", err);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [memberId]: "" }));
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {members.map((member) => {
          const isLoading = loadingStates[member.user_id];
          const isCreatorMember = member.user_id === groupCreatorId;

          return (
            <div
              key={member.user_id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {member.profiles.full_name?.charAt(0) || "?"}
                </div>
                <div>
                  <div className="font-medium">
                    {member.profiles.full_name || "Unknown User"}
                    {member.is_admin && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                    {isCreatorMember && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Creator
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isCreator && !isCreatorMember && (
                <div className="flex space-x-2">
                  {member.is_admin ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction("demote", member.user_id)}
                      disabled={!!isLoading}
                    >
                      {isLoading === "demote" ? "Demoting..." : "Demote"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction("promote", member.user_id)}
                      disabled={!!isLoading}
                    >
                      {isLoading === "promote" ? "Promoting..." : "Promote"}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction("remove", member.user_id)}
                    disabled={!!isLoading}
                  >
                    {isLoading === "remove" ? "Removing..." : "Remove"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {members.length === 0 && (
        <div className="text-center text-gray-500 py-8">No members found.</div>
      )}
    </div>
  );
}
