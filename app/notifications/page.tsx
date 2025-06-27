"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getNotifications,
  markNotificationsRead,
  deleteReadNotifications,
  deleteNotification,
} from "@/lib/actions/notifications.actions";
import { useNotifications } from "@/components/providers/NotificationProvider";
import NotificationSkeleton from "@/components/skeletons/NotificationSkeleton";
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
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleClearRead = async () => {
    setIsDeleting(true);
    try {
      await deleteReadNotifications();
      await fetchData(); // Refresh the list
      await refreshCount(); // Refresh the global count
    } catch (error) {
      console.error("Error clearing read notifications:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      await refreshCount(); // Refresh the global count
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const readNotifications = notifications.filter((n) => n.is_read);
  const unreadNotifications = notifications.filter((n) => !n.is_read);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {readNotifications.length > 0 && (
          <Button
            onClick={handleClearRead}
            disabled={isDeleting}
            variant="outline"
            size="sm"
          >
            {isDeleting ? "Clearing..." : "Clear Read"}
          </Button>
        )}
      </div>

      {/* Unread Notifications Section */}
      {unreadNotifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-blue-600">New</h2>
          <div className="flex flex-col gap-3">
            {unreadNotifications.map((n) => (
              <div
                key={n.id}
                className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4 flex items-center gap-3"
              >
                <span className="text-xl">
                  {n.type === "friend_request" && "👥"}
                  {n.type === "prompt_open" && "📝"}
                  {n.type === "prompt_24h" && "⏰"}
                  {n.type === "voting_open" && "⭐"}
                  {n.type === "vote_received" && "❤️"}
                  {n.type === "friend_request_accepted" && "✅"}
                  {n.type === "friend_request_declined" && "❌"}
                  {n.type === "member_joined" && "👋"}
                  {n.type === "member_removed" && "🚪"}
                  {n.type === "member_promoted" && "⬆️"}
                  {n.type === "member_demoted" && "⬇️"}
                  {n.type === "group_deleted" && "🗑️"}
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
                        <b>{(n.data?.from_name as string) || "Someone"}</b>{" "}
                        accepted your friend request
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {n.type === "friend_request_declined" && (
                    <div>
                      <span>
                        <b>{(n.data?.from_name as string) || "Someone"}</b>{" "}
                        declined your friend request
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
                      <span>
                        24 hours left to answer this week&apos;s prompt!
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {n.type === "voting_open" && (
                    <div>
                      <span>
                        Voting is now open for this week&apos;s prompt!
                      </span>
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
                  {n.type === "member_joined" && (
                    <div>
                      <span>
                        <b>{(n.data?.member_name as string) || "Someone"}</b>{" "}
                        joined your group{" "}
                        <b>
                          {(n.data?.group_name as string) || "Unknown Group"}
                        </b>
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {n.type === "member_removed" && (
                    <div>
                      <span>
                        You were removed from{" "}
                        <b>
                          {(n.data?.group_name as string) || "Unknown Group"}
                        </b>{" "}
                        by <b>{(n.data?.admin_name as string) || "Admin"}</b>
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {n.type === "member_promoted" && (
                    <div>
                      <span>
                        You were promoted to admin in{" "}
                        <b>
                          {(n.data?.group_name as string) || "Unknown Group"}
                        </b>{" "}
                        by <b>{(n.data?.admin_name as string) || "Admin"}</b>
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {n.type === "member_demoted" && (
                    <div>
                      <span>
                        You were demoted from admin in{" "}
                        <b>
                          {(n.data?.group_name as string) || "Unknown Group"}
                        </b>{" "}
                        by <b>{(n.data?.admin_name as string) || "Admin"}</b>
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {n.type === "group_deleted" && (
                    <div>
                      <span>
                        <b>
                          {(n.data?.group_name as string) || "Unknown Group"}
                        </b>{" "}
                        was deleted by{" "}
                        <b>{(n.data?.admin_name as string) || "Admin"}</b>
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {n.type === "friend_request" && (
                    <Link href="/friends">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        View
                      </Button>
                    </Link>
                  )}
                  <Button
                    onClick={() => handleDeleteNotification(n.id)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Read Notifications Section */}
      {readNotifications.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-600">Earlier</h2>
          <div className="flex flex-col gap-3">
            {readNotifications.map((n) => (
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
                  {n.type === "member_joined" && "👋"}
                  {n.type === "member_removed" && "🚪"}
                  {n.type === "member_promoted" && "⬆️"}
                  {n.type === "member_demoted" && "⬇️"}
                  {n.type === "group_deleted" && "🗑️"}
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
                        <b>{(n.data?.from_name as string) || "Someone"}</b>{" "}
                        accepted your friend request
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {n.type === "friend_request_declined" && (
                    <div>
                      <span>
                        <b>{(n.data?.from_name as string) || "Someone"}</b>{" "}
                        declined your friend request
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
                      <span>
                        24 hours left to answer this week&apos;s prompt!
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {n.type === "voting_open" && (
                    <div>
                      <span>
                        Voting is now open for this week&apos;s prompt!
                      </span>
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
                  {n.type === "member_joined" && (
                    <div>
                      <span>
                        <b>{(n.data?.member_name as string) || "Someone"}</b>{" "}
                        joined your group{" "}
                        <b>
                          {(n.data?.group_name as string) || "Unknown Group"}
                        </b>
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {n.type === "member_removed" && (
                    <div>
                      <span>
                        You were removed from{" "}
                        <b>
                          {(n.data?.group_name as string) || "Unknown Group"}
                        </b>{" "}
                        by <b>{(n.data?.admin_name as string) || "Admin"}</b>
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {n.type === "member_promoted" && (
                    <div>
                      <span>
                        You were promoted to admin in{" "}
                        <b>
                          {(n.data?.group_name as string) || "Unknown Group"}
                        </b>{" "}
                        by <b>{(n.data?.admin_name as string) || "Admin"}</b>
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {n.type === "member_demoted" && (
                    <div>
                      <span>
                        You were demoted from admin in{" "}
                        <b>
                          {(n.data?.group_name as string) || "Unknown Group"}
                        </b>{" "}
                        by <b>{(n.data?.admin_name as string) || "Admin"}</b>
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {n.type === "group_deleted" && (
                    <div>
                      <span>
                        <b>
                          {(n.data?.group_name as string) || "Unknown Group"}
                        </b>{" "}
                        was deleted by{" "}
                        <b>{(n.data?.admin_name as string) || "Admin"}</b>
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {n.type === "friend_request" && (
                    <Link href="/friends">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        View
                      </Button>
                    </Link>
                  )}
                  <Button
                    onClick={() => handleDeleteNotification(n.id)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {notifications.length === 0 && (
        <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-2">🔔</div>
          <p className="text-lg font-medium mb-2">No notifications yet</p>
          <p className="text-sm">
            You&apos;ll see notifications here when you receive friend requests
            and other updates.
          </p>
        </div>
      )}
    </div>
  );
}
