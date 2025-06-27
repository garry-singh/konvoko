import { getGroupPromptPageData } from "@/lib/actions/groups.actions";
import { notFound } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function Group({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;
  const { userId } = await auth();

  const { group, prompt, response, error } = await getGroupPromptPageData(
    groupId
  );

  console.log(group, prompt, response);

  if (error || !group) return notFound();

  // Check if user is the group creator (admin)
  const isAdmin = group.created_by === userId;

  return (
    <div className="max-w-xl mx-auto py-10 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-muted-foreground text-sm">{group.description}</p>
        </div>

        {isAdmin && (
          <Link href={`/groups/${groupId}/settings`}>
            <Button variant="outline" size="sm">
              Settings
            </Button>
          </Link>
        )}
      </div>

      <hr />

      {prompt ? (
        <>
          <h2 className="text-lg font-semibold">This Week&apos;s Prompt</h2>
          <p className="text-base">{prompt.content}</p>

          <form>
            <Textarea
              className="mt-4"
              placeholder="Write your response here..."
              defaultValue={response?.content || ""}
            />
            <Button type="submit" className="mt-4">
              {response ? "Update Response" : "Submit Response"}
            </Button>
          </form>
        </>
      ) : (
        <div className="text-center py-8">
          <h2 className="text-lg font-semibold mb-2">No Active Prompt</h2>
          <p className="text-muted-foreground">
            There&apos;s no active prompt for this week. Check back later!
          </p>
        </div>
      )}
    </div>
  );
}
