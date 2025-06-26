import { Button } from "@/components/ui/button";
import { getAllGroups } from "@/lib/actions/groups.actions";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  // Only fetch groups if user is signed in
  const { userId } = await auth();
  let groups = [];

  if (userId) {
    const groupResult = await getAllGroups();
    if (groupResult.error) {
      console.error("Error fetching groups:", groupResult.error);
    }
    groups = groupResult.data || [];
  }

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
          <Button>Join Group</Button>
          {groups.length === 0 ? (
            <p>You are not a member of any groups yet.</p>
          ) : (
            <ul className="space-y-2">
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
