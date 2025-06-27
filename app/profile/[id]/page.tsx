import Image from "next/image";
import { getUserProfile, getUserStats } from "@/lib/actions/user.actions";

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
    </div>
  );
}
