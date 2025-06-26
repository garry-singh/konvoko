import { getGroupPromptPageData } from "@/lib/actions/groups.actions";
import { notFound } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default async function Group({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;

  const { group, prompt, response, error } = await getGroupPromptPageData(
    groupId
  );

  if (error || !group || !prompt) return notFound();

  return (
    <div className="max-w-xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">{group.name}</h1>
      <p className="text-muted-foreground text-sm">{group.description}</p>

      <hr />

      <h2 className="text-lg font-semibold">This Week&apos;s Prompt</h2>
      <p className="text-base">{prompt.prompt_text}</p>

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
    </div>
  );
}
