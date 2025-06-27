"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getNotifications,
  markNotificationsRead,
} from "@/lib/actions/notifications.actions";
import { getFriendRequests } from "@/lib/actions/friends.actions";
import FriendRequestActions from "@/components/FriendRequestActions";
import { useNotifications } from "@/components/NotificationProvider";

interface Notification {
  id: string;
  type: string;
  data: Record<string, unknown>;
  created_at: string;
  is_read: boolean;
}

interface FriendRequest {
  id: string;
  requester: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { refreshCount } = useNotifications();

  const fetchData = useCallback(async () => {
    try {
      // Mark notifications as read
      await markNotificationsRead();

      // Refresh the global notification count
      await refreshCount();

      // Fetch notifications and friend requests
      const [notificationsResult, friendRequestsResult] = await Promise.all([
        getNotifications(),
        getFriendRequests(),
      ]);

      setNotifications(notificationsResult.notifications || []);
      setFriendRequests(friendRequestsResult.requests || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFriendRequestAction = () => {
    // Refresh the data after a friend request action
    fetchData();
  };

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

      {/* Friend Requests Section */}
      {friendRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Friend Requests</h2>
          <div className="flex flex-col gap-3">
            {friendRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded shadow p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span>👥</span>
                  <div>
                    <span>
                      Friend request from <b>{request.requester.full_name}</b>
                    </span>
                    <div className="text-xs text-gray-500">
                      {new Date(request.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <FriendRequestActions
                  connectionId={request.id}
                  onSuccess={handleFriendRequestAction}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Notifications Section */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Other Notifications</h2>
        <div className="flex flex-col gap-4">
          {notifications.length === 0 && <div>No notifications yet.</div>}
          {notifications.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded shadow p-4 flex items-center gap-3"
            >
              <span>
                {n.type === "friend_request" && "👥"}
                {n.type === "prompt_open" && "📝"}
                {n.type === "prompt_24h" && "⏰"}
                {n.type === "voting_open" && "⭐"}
                {n.type === "vote_received" && "❤️"}
                {n.type === "friend_request_accepted" && "✅"}
                {n.type === "friend_request_declined" && "❌"}
              </span>
              <div>
                {n.type === "friend_request" && (
                  <span>
                    You received a friend request from{" "}
                    <b>{(n.data?.from_name as string) || "Someone"}</b>
                  </span>
                )}
                {n.type === "friend_request_accepted" && (
                  <span>
                    <b>{(n.data?.from_name as string) || "Someone"}</b> accepted
                    your friend request
                  </span>
                )}
                {n.type === "friend_request_declined" && (
                  <span>
                    <b>{(n.data?.from_name as string) || "Someone"}</b> declined
                    your friend request
                  </span>
                )}
                {n.type === "prompt_open" && (
                  <span>A new weekly prompt is open!</span>
                )}
                {n.type === "prompt_24h" && (
                  <span>24 hours left to answer this week&apos;s prompt!</span>
                )}
                {n.type === "voting_open" && (
                  <span>Voting is now open for this week&apos;s prompt!</span>
                )}
                {n.type === "vote_received" && (
                  <span>Your response received a new vote!</span>
                )}
                <div className="text-xs text-gray-500">
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
