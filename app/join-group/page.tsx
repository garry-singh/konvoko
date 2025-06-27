import {
  getFriendsGroups,
  getAvailablePublicGroups,
} from "@/lib/actions/groups.actions";
import GroupCard from "@/components/GroupCard";

export default async function JoinGroup() {
  const { groups: friendsGroups } = await getFriendsGroups();
  const { groups: publicGroups } = await getAvailablePublicGroups();

  console.log(friendsGroups);
  console.log(publicGroups);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Join a Group</h1>

      <section>
        <h2 className="text-lg font-semibold mb-2">
          Groups Your Friends Created
        </h2>
        <div className="flex overflow-x-auto gap-4 pb-4">
          {friendsGroups.length === 0 && <div>No groups found.</div>}
          {friendsGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Other Public Groups</h2>
        <div className="flex overflow-x-auto gap-4 pb-4">
          {publicGroups.length === 0 && (
            <div>No public groups available to join.</div>
          )}
          {publicGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </section>
    </div>
  );
}
