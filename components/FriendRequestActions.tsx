"use client";

import { useState } from "react";
import { respondToFriendRequest } from "@/lib/actions/friends.actions";
import { Button } from "@/components/ui/button";

interface FriendRequestActionsProps {
  connectionId: string;
  onSuccess?: () => void;
  className?: string;
}

export default function FriendRequestActions({
  connectionId,
  onSuccess,
  className = "",
}: FriendRequestActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<"accept" | "reject" | null>(null);

  const handleAction = async (accept: boolean) => {
    setIsLoading(true);
    setAction(accept ? "accept" : "reject");

    try {
      const result = await respondToFriendRequest(connectionId, accept);

      if (result.error) {
        console.error("Error responding to friend request:", result.error);
        // You might want to show a toast notification here
        return;
      }

      // Call the success callback to refresh the parent component
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error responding to friend request:", error);
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        onClick={() => handleAction(true)}
        disabled={isLoading}
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {isLoading && action === "accept" ? "Accepting..." : "Accept"}
      </Button>
      <Button
        onClick={() => handleAction(false)}
        disabled={isLoading}
        size="sm"
        variant="outline"
        className="border-red-300 text-red-600 hover:bg-red-50"
      >
        {isLoading && action === "reject" ? "Rejecting..." : "Reject"}
      </Button>
    </div>
  );
}
