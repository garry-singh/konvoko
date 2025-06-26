"use client";
import { useState } from "react";
import { searchUsers } from "@/lib/actions/user.actions";
import { sendFriendRequest } from "@/lib/actions/friends.actions";
import Image from "next/image";

export default function FindFriends() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    {
      id: string;
      full_name: string;
      avatar_url: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string[]>([]);

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

  return (
    <div className="max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Find Friends</h1>
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          className="border rounded px-2 py-1 flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name"
        />
        <button className="btn" type="submit" disabled={loading}>
          Search
        </button>
      </form>
      <div>
        {results.map((user) => (
          <div key={user.id} className="flex items-center gap-2 mb-2">
            {user.avatar_url && (
              <Image
                src={user.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            )}
            <span>{user.full_name}</span>
            <button
              className="btn"
              disabled={sent.includes(user.id)}
              onClick={() => handleAddFriend(user.id)}
            >
              {sent.includes(user.id) ? "Request Sent" : "Add Friend"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
