"use client";
import { useState, useEffect, useCallback } from "react";
import { searchUsers } from "@/lib/actions/user.actions";
import {
  sendFriendRequest,
  getFriendRequests,
  getFriends,
} from "@/lib/actions/friends.actions";
import FriendRequestActions from "@/components/FriendRequestActions";
import FriendCardSkeleton from "@/components/skeletons/FriendCardSkeleton";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

interface FriendRequest {
  id: string;
  requester: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  created_at: string;
}

interface Friend {
  id: string;
  full_name: string;
  avatar_url: string;
  friend_count: number;
}

export default function FindFriends() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    {
      id: string;
      full_name: string;
      avatar_url: string;
      connectionStatus?: string | null;
    }[]
  >([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [sent, setSent] = useState<string[]>([]);
  const { refreshCount } = useNotifications();
  const { user } = useUser();

  const fetchFriendRequests = useCallback(async () => {
    setRequestsLoading(true);
    const { requests } = await getFriendRequests();
    setFriendRequests(requests || []);
    setRequestsLoading(false);
  }, []);

  const fetchFriends = useCallback(async () => {
    if (user) {
      setFriendsLoading(true);
      const { friends: friendsList } = await getFriends(user.id);
      setFriends(friendsList || []);
      setFriendsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFriendRequests();
    fetchFriends();
  }, [fetchFriendRequests, fetchFriends]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { users } = await searchUsers(query);
    setResults(users);
    setLoading(false);
  }

  async function handleAddFriend(userId: string) {
    await sendFriendRequest(userId);
    setSent((prev) => [...prev, userId]);
  }

  const handleFriendRequestAction = async () => {
    // Refresh friend requests after action
    await fetchFriendRequests();
    // Also refresh friends list since accepting a request adds a friend
    await fetchFriends();
    // Also refresh notification count since friend requests affect notifications
    await refreshCount();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Friends</h1>

      {/* Enhanced Friend Requests Section */}
      {!requestsLoading && friendRequests.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">👥</span>
            <h2 className="text-xl font-semibold text-gray-800">
              Friend Requests ({friendRequests.length})
            </h2>
          </div>
          <p className="text-gray-600 mb-4">
            You have pending friend requests. Accept or decline them below.
          </p>
          <div className="space-y-3">
            {friendRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center gap-4">
                  {request.requester.avatar_url ? (
                    <Image
                      src={request.requester.avatar_url}
                      alt={request.requester.full_name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <span className="text-gray-600 text-lg font-semibold">
                        {request.requester.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {request.requester.full_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Sent you a friend request
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(request.created_at).toLocaleDateString()} at{" "}
                      {new Date(request.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <FriendRequestActions
                    connectionId={request.id}
                    onSuccess={handleFriendRequestAction}
                    className="flex gap-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">
          Your Friends {!friendsLoading && `(${friends.length})`}
        </h2>
        {friendsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <FriendCardSkeleton key={i} />
            ))}
          </div>
        ) : friends.length === 0 ? (
          <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-lg font-medium mb-2">No friends yet</p>
            <p className="text-sm">
              Search for people below to start building your network!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/profile/${friend.id}`}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200 block border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  {friend.avatar_url ? (
                    <Image
                      src={friend.avatar_url}
                      alt={friend.full_name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-lg">
                        {friend.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {friend.full_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {friend.friend_count} friend
                      {friend.friend_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Search for Friends</h2>
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name..."
          />
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
            type="submit"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Search Results ({results.length})
            </h3>
            {results.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.full_name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="flex-1 font-medium">{user.full_name}</span>
                <button
                  className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  disabled={
                    user.connectionStatus === "pending" ||
                    user.connectionStatus === "accepted" ||
                    sent.includes(user.id)
                  }
                  onClick={() => handleAddFriend(user.id)}
                >
                  {user.connectionStatus === "accepted"
                    ? "Friends"
                    : user.connectionStatus === "pending" ||
                      sent.includes(user.id)
                    ? "Request Sent"
                    : "Add Friend"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
