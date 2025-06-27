"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getAllGroups } from "@/lib/actions/groups.actions";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Link from "next/link";
import GroupListItemSkeleton from "@/components/skeletons/GroupListItemSkeleton";

interface Group {
  id: string;
  name: string;
  description: string;
}

export default function Home() {
  const { user } = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      if (user) {
        try {
          const groupResult = await getAllGroups();
          if (groupResult.error) {
            console.error("Error fetching groups:", groupResult.error);
          }
          setGroups(groupResult.data || []);
        } catch (error) {
          console.error("Error fetching groups:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  return (
    <>
      <SignedOut>
        <section className="text-center py-20">
          <h1 className="text-4xl font-bold">Welcome to Konvoko</h1>
          <p className="mt-4 text-lg">
            Reflect, connect, and grow — one prompt at a time.
          </p>
          <div className="mt-8">{/* CTA Buttons */}</div>
        </section>
      </SignedOut>

      <SignedIn>
        {/* Your dashboard UI (group list, latest prompt, etc) */}
        <main className="text-center py-20">
          <h1>Dashboard</h1>
          <Button asChild>
            <Link href="/create-group">Create Group</Link>
          </Button>
          <Button asChild>
            <Link href="/join-group">Join Group</Link>
          </Button>

          {isLoading ? (
            <div className="mt-8 space-y-2">
              {[...Array(3)].map((_, i) => (
                <GroupListItemSkeleton key={i} />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <p className="mt-8">You are not a member of any groups yet.</p>
          ) : (
            <ul className="mt-8 space-y-2">
              {groups.map((group) => (
                <li key={group.id}>
                  <Link
                    href={`/groups/${group.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {group.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </main>
      </SignedIn>
    </>
  );
}
