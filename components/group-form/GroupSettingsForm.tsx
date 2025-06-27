"use client";

import { useRouter } from "next/navigation";
import { updateGroupSettings } from "@/lib/actions/groups.actions";
import GroupForm from "./GroupForm";

interface Group {
  id: string;
  name: string;
  description: string;
  type: "public" | "private";
  min_members: number;
  max_members: number;
}

export default function GroupSettingsForm({ group }: { group: Group }) {
  const router = useRouter();

  const handleSubmit = async (values: {
    name: string;
    description: string;
    type: "public" | "private";
    min_members: number;
    max_members: number;
  }) => {
    try {
      const result = await updateGroupSettings(group.id, values);

      if (result.error) {
        console.error("Failed to update group settings:", result.error);
        return;
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Error updating group settings:", error);
    }
  };

  return (
    <GroupForm
      mode="update"
      defaultValues={{
        name: group.name,
        description: group.description,
        type: group.type,
        min_members: group.min_members,
        max_members: group.max_members,
      }}
      onSubmit={handleSubmit}
    />
  );
}
