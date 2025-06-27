"use client";
import { Button } from "@/components/ui/button";
import { joinGroup } from "@/lib/actions/groups.actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GroupCard({
  group,
}: {
  group: {
    id: string;
    name: string;
    description: string;
    member_count: number;
    max_members: number;
    created_by: string;
  };
}) {
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleJoin = async () => {
    setIsJoining(true);
    setError(null);

    try {
      const result = await joinGroup(group.id);

      if (result.error) {
        setError(result.error);
      } else {
        // Redirect to the group page on successful join
        router.push(`/groups/${group.id}`);
      }
    } catch (err) {
      setError("Failed to join group. Please try again.");
      console.error("Error joining group:", err);
    } finally {
      setIsJoining(false);
    }
  };

  const isFull = group.member_count >= group.max_members;

  return (
    <div className="min-w-[250px] bg-white rounded shadow p-4 flex flex-col">
      <h3 className="font-bold">{group.name}</h3>
      <p className="text-sm text-gray-500 mb-2">{group.description}</p>
      <p className="text-xs text-gray-400 mb-2">
        Created by {group.created_by}
      </p>
      <div className="text-xs text-gray-400 mb-2">
        {group.member_count} / {group.max_members} members
      </div>

      {error && <div className="text-red-500 text-xs mb-2">{error}</div>}

      <Button
        onClick={handleJoin}
        disabled={isJoining || isFull}
        className={isFull ? "bg-gray-400 cursor-not-allowed" : ""}
      >
        {isJoining ? "Joining..." : isFull ? "Full" : "Join"}
      </Button>
    </div>
  );
}
