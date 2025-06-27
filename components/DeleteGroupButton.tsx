"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteGroup } from "@/lib/actions/groups.actions";

export default function DeleteGroupButton({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteGroup(groupId);

      if (result.error) {
        setError(result.error);
      } else {
        // Redirect to home page after successful deletion
        router.push("/");
      }
    } catch (err) {
      setError("Failed to delete group. Please try again.");
      console.error("Error deleting group:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="space-y-4">
        <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded">
          <p className="font-medium">
            Are you sure you want to delete &quot;{groupName}&quot;?
          </p>
          <p className="text-sm mt-1">
            This action cannot be undone. All group data and responses will be
            permanently deleted.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Yes, Delete Group"}
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowConfirmation(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="destructive" onClick={() => setShowConfirmation(true)}>
      Delete Group
    </Button>
  );
}
