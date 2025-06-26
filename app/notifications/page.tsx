import {
  getNotifications,
  markNotificationsRead,
} from "@/lib/actions/notifications.actions";

export default async function Notifications() {
  await markNotificationsRead();
  const { notifications } = await getNotifications();

  return (
    <div className="max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <div className="flex flex-col gap-4">
        {notifications.length === 0 && <div>No notifications yet.</div>}
        {notifications.map((n) => (
          <div
            key={n.id}
            className="bg-white rounded shadow p-4 flex items-center gap-3"
          >
            <span>
              {n.type === "friend_request" && "👥"}
              {n.type === "prompt_open" && "📝"}
              {n.type === "prompt_24h" && "⏰"}
              {n.type === "voting_open" && "⭐"}
              {n.type === "vote_received" && "❤️"}
            </span>
            <div>
              {n.type === "friend_request" && (
                <span>
                  You received a friend request from{" "}
                  <b>{n.data?.from_name || "Someone"}</b>
                </span>
              )}
              {n.type === "prompt_open" && (
                <span>A new weekly prompt is open!</span>
              )}
              {n.type === "prompt_24h" && (
                <span>24 hours left to answer this week&apos;s prompt!</span>
              )}
              {n.type === "voting_open" && (
                <span>Voting is now open for this week&apos;s prompt!</span>
              )}
              {n.type === "vote_received" && (
                <span>Your response received a new vote!</span>
              )}
              <div className="text-xs text-gray-500">
                {new Date(n.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
