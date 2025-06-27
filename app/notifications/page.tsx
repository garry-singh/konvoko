"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getNotifications,
  markNotificationsRead,
} from "@/lib/actions/notifications.actions";
import { useNotifications } from "@/components/NotificationProvider";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  data: Record<string, unknown>;
  created_at: string;
  is_read: boolean;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { refreshCount } = useNotifications();

  const fetchData = useCallback(async () => {
    try {
      // Mark notifications as read
      await markNotificationsRead();

      // Refresh the global notification count
      await refreshCount();

      // Fetch notifications
      const notificationsResult = await getNotifications();
      setNotifications(notificationsResult.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>

      {/* All Notifications Section */}
      <div className="flex flex-col gap-4">
        {notifications.length === 0 && (
          <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-2">🔔</div>
            <p className="text-lg font-medium mb-2">No notifications yet</p>
            <p className="text-sm">
              You&apos;ll see notifications here when you receive friend
              requests and other updates.
            </p>
          </div>
        )}
        {notifications.map((n) => (
          <div
            key={n.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-3"
          >
            <span className="text-xl">
              {n.type === "friend_request" && "👥"}
              {n.type === "prompt_open" && "📝"}
              {n.type === "prompt_24h" && "⏰"}
              {n.type === "voting_open" && "⭐"}
              {n.type === "vote_received" && "❤️"}
              {n.type === "friend_request_accepted" && "✅"}
              {n.type === "friend_request_declined" && "❌"}
            </span>
            <div className="flex-1">
              {n.type === "friend_request" && (
                <div>
                  <span>
                    You received a friend request from{" "}
                    <b>{(n.data?.from_name as string) || "Someone"}</b>
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              )}
              {n.type === "friend_request_accepted" && (
                <div>
                  <span>
                    <b>{(n.data?.from_name as string) || "Someone"}</b> accepted
                    your friend request
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              )}
              {n.type === "friend_request_declined" && (
                <div>
                  <span>
                    <b>{(n.data?.from_name as string) || "Someone"}</b> declined
                    your friend request
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              )}
              {n.type === "prompt_open" && (
                <div>
                  <span>A new weekly prompt is open!</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              )}
              {n.type === "prompt_24h" && (
                <div>
                  <span>24 hours left to answer this week&apos;s prompt!</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              )}
              {n.type === "voting_open" && (
                <div>
                  <span>Voting is now open for this week&apos;s prompt!</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              )}
              {n.type === "vote_received" && (
                <div>
                  <span>Your response received a new vote!</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            {n.type === "friend_request" && (
              <Link href="/friends">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  View
                </Button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
