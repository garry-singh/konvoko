"use client";
import { Button } from "@/components/ui/button";

export default function GroupCard({
  group,
}: {
  group: {
    id: string;
    name: string;
    description: string;
    member_count: number;
    max_members: number;
  };
}) {
  // Implement join logic here
  return (
    <div className="min-w-[250px] bg-white rounded shadow p-4 flex flex-col">
      <h3 className="font-bold">{group.name}</h3>
      <p className="text-sm text-gray-500 mb-2">{group.description}</p>
      <div className="text-xs text-gray-400 mb-2">
        {group.member_count} / {group.max_members} members
      </div>
      <Button>Join</Button>
    </div>
  );
}
