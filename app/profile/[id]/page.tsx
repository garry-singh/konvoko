import Image from "next/image";
import {
  getUserProfile,
  getUserStats,
  getUserResponseFeed,
} from "@/lib/actions/user.actions";

export default async function Profile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await getUserProfile(id);
  const { responseCount, totalVotesReceived, friendCount } = await getUserStats(
    id
  );
  const { responses } = await getUserResponseFeed(id);

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-24 h-24 mb-2">
          {profile?.avatar_url && (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name || "User avatar"}
              fill
              className="rounded-full object-cover border-2 border-gray-300"
            />
          )}
        </div>
        <h2 className="text-2xl font-bold">{profile?.full_name || "User"}</h2>
        {profile?.bio && (
          <div className="text-gray-600 text-center mt-1">{profile.bio}</div>
        )}
        <div className="flex gap-6 mt-4 text-center">
          <div>
            <div className="font-bold text-lg">{friendCount}</div>
            <div className="text-xs text-gray-500">Friends</div>
          </div>
          <div>
            <div className="font-bold text-lg">{totalVotesReceived}</div>
            <div className="text-xs text-gray-500">Hearts</div>
          </div>
          <div>
            <div className="font-bold text-lg">{responseCount}</div>
            <div className="text-xs text-gray-500">Posts</div>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Feed</h3>
        <div className="flex flex-col gap-4">
          {responses && responses.length === 0 && (
            <div className="text-gray-500 text-center">No posts yet.</div>
          )}
          {responses?.map(
            (r: {
              id: string;
              prompts: { content: string };
              content: string;
              vote_count: number;
              created_at: string;
              groups: { name: string };
            }) => (
              <div key={r.id} className="bg-white rounded shadow p-4">
                <div className="text-sm text-gray-500 mb-1">
                  {r.prompts?.content}
                </div>
                <div className="text-base mb-2">{r.content}</div>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>❤️ {r.vote_count || 0}</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  {r.groups?.name && <span>in {r.groups.name}</span>}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
