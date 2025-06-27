"use client";

import { useRouter } from "next/navigation";
import { createGroup } from "@/lib/actions/groups.actions";
import GroupForm from "./GroupForm";

export default function CreateGroupForm() {
  const router = useRouter();

  const handleSubmit = async (values: {
    name: string;
    description: string;
    type: "public" | "private";
    min_members: number;
    max_members: number;
  }) => {
    try {
      const result = await createGroup(
        values.name,
        values.description,
        values.type,
        values.min_members,
        values.max_members
      );

      if (result.error) {
        console.error("Failed to create group:", result.error);
        return;
      }

      if (result.data) {
        router.push(`/groups/${result.data.id}`);
      }
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  return <GroupForm mode="create" onSubmit={handleSubmit} />;
}
