"use client";
import { useState, useEffect } from "react";
import { searchUsers } from "@/lib/actions/user.actions";
import {
  sendFriendRequest,
  getFriendRequests,
  getFriends,
} from "@/lib/actions/friends.actions";
import FriendRequestActions from "@/components/FriendRequestActions";
import { useNotifications } from "@/components/NotificationProvider";
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
  const [sent, setSent] = useState<string[]>([]);
  const { refreshCount } = useNotifications();
  const { user } = useUser();

  const fetchFriendRequests = async () => {
    const { requests } = await getFriendRequests();
    setFriendRequests(requests || []);
  };

  const fetchFriends = async () => {
    if (user) {
      const { friends: friendsList } = await getFriends(user.id);
      setFriends(friendsList || []);
    }
  };

  useEffect(() => {
    fetchFriendRequests();
    fetchFriends();
  }, [user]);

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

      {/* Friend Requests Section */}
      {friendRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Friend Requests</h2>
          <div className="flex flex-col gap-3">
            {friendRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded shadow p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {request.requester.avatar_url && (
                    <Image
                      src={request.requester.avatar_url}
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
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

      {/* Friends List Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">
          Your Friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            You don&apos;t have any friends yet. Search for people to add as
            friends!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/profile/${friend.id}`}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200 block"
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
      <div>
        <h2 className="text-lg font-semibold mb-3">Search for Friends</h2>
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            className="border rounded px-3 py-2 flex-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name"
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
        <div className="space-y-2">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 bg-white rounded shadow"
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
              <span className="flex-1">{user.full_name}</span>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
}
