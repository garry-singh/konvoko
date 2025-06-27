"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getAllGroups } from "@/lib/actions/groups.actions";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Link from "next/link";
import GroupCard from "@/components/GroupCard";
import GroupListItemSkeleton from "@/components/skeletons/GroupListItemSkeleton";

interface Group {
  id: string;
  name: string;
  description: string;
  type: "public" | "private";
  member_count?: number;
  max_members?: number;
  creator_username?: string;
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
        <main className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Your Groups</h1>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/create-group">Create Group</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/join-group">Join Group</Link>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <GroupListItemSkeleton key={i} />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-semibold mb-2">No groups yet</h3>
                <p className="text-muted-foreground mb-6">
                  You&apos;re not a member of any groups yet. Create your first
                  group or join an existing one to get started.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/create-group">Create Your First Group</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/join-group">Browse Groups</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </main>
      </SignedIn>
    </>
  );
}
