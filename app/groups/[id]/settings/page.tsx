import {
  getGroupMembers,
  getGroupPromptPageData,
} from "@/lib/actions/groups.actions";
import { notFound } from "next/navigation";
import GroupSettingsForm from "@/components/GroupSettingsForm";
import GroupMembersList from "@/components/GroupMembersList";
import DeleteGroupButton from "@/components/DeleteGroupButton";

export default async function GroupSettings({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;

  // Get group data and check if user is admin
  const { group, error } = await getGroupPromptPageData(groupId);
  if (error || !group) return notFound();

  // Get group members
  const { members, isAdmin, isCreator } = await getGroupMembers(groupId);

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            Only group admins can access group settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Group Settings</h1>
        <p className="text-gray-600">
          Manage your group &quot;{group.name}&quot; settings and members.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Group Settings Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Group Information</h2>
          <GroupSettingsForm group={group} />
        </div>

        {/* Member Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Member Management</h2>
          <GroupMembersList
            groupId={groupId}
            members={members}
            isCreator={isCreator}
          />
        </div>
      </div>

      {/* Danger Zone */}
      {isCreator && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">
            Danger Zone
          </h2>
          <p className="text-red-700 mb-4">
            These actions cannot be undone. Please be careful.
          </p>
          <DeleteGroupButton groupId={groupId} groupName={group.name} />
        </div>
      )}
    </div>
  );
}
