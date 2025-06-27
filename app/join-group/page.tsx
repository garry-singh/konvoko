"use client";
import { useState, useEffect } from "react";
import {
  getFriendsGroups,
  getAvailablePublicGroups,
} from "@/lib/actions/groups.actions";
import GroupCard from "@/components/GroupCard";
import GroupCardSkeleton from "@/components/skeletons/GroupCardSkeleton";

interface Group {
  id: string;
  name: string;
  description: string;
  type: "public" | "private";
  member_count: number;
  max_members: number;
  creator_username: string;
}

export default function JoinGroup() {
  const [friendsGroups, setFriendsGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [publicLoading, setPublicLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const [friendsResult, publicResult] = await Promise.all([
          getFriendsGroups(),
          getAvailablePublicGroups(),
        ]);

        setFriendsGroups(friendsResult.groups || []);
        setPublicGroups(publicResult.groups || []);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setFriendsLoading(false);
        setPublicLoading(false);
      }
    };

    fetchGroups();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Join a Group</h1>

      <section>
        <h2 className="text-lg font-semibold mb-2">
          Groups Your Friends Created
        </h2>
        <div className="flex overflow-x-auto gap-4 pb-4">
          {friendsLoading ? (
            [...Array(4)].map((_, i) => <GroupCardSkeleton key={i} />)
          ) : friendsGroups.length === 0 ? (
            <div className="text-gray-500">No groups found.</div>
          ) : (
            friendsGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Other Public Groups</h2>
        <div className="flex overflow-x-auto gap-4 pb-4">
          {publicLoading ? (
            [...Array(4)].map((_, i) => <GroupCardSkeleton key={i} />)
          ) : publicGroups.length === 0 ? (
            <div className="text-gray-500">
              No public groups available to join.
            </div>
          ) : (
            publicGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
