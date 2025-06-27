import CreateGroupForm from "@/components/group-form/CreateGroupForm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const CreateGroup = async () => {
  const { userId } = await auth();
  console.log(userId);

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="flex justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <article className="space-y-6">
          <h1 className="text-2xl font-bold text-center">Create Group</h1>
          <CreateGroupForm />
        </article>
      </div>
    </main>
  );
};

export default CreateGroup;
