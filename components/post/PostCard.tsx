import { Heart, Bookmark, MoreHorizontal, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface PostCardProps {
  avatarUrl: string;
  displayName: string;
  username: string;
  postedAt: Date | string;
  content: string;
}

function formatTime(postedAt: Date | string) {
  const date = typeof postedAt === "string" ? new Date(postedAt) : postedAt;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return `${diffHours}h`;
  }
  return date.toLocaleString("en-US", { month: "short", day: "numeric" });
}

const fallbackAvatar = "/default-avatar.png"; // Place a default avatar in your public/ directory

export function PostCard({
  avatarUrl,
  displayName,
  username,
  postedAt,
  content,
}: PostCardProps) {
  return (
    <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/profile/${username}`}
            aria-label={`Go to @${username}'s profile`}
          >
            <Image
              src={avatarUrl || fallbackAvatar}
              alt={displayName}
              width={40}
              height={40}
              className="rounded-full object-cover hover:opacity-80 transition"
            />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${username}`}
                aria-label={`Go to @${username}'s profile`}
              >
                <span className="font-semibold hover:underline cursor-pointer">
                  {displayName}
                </span>
              </Link>
              <Link
                href={`/profile/${username}`}
                aria-label={`Go to @${username}'s profile`}
              >
                <span className="text-muted-foreground text-sm hover:underline cursor-pointer">
                  @{username}
                </span>
              </Link>
              <span className="text-muted-foreground text-xs">
                · {formatTime(postedAt)}
              </span>
            </div>
          </div>
        </div>
        <button
          className="p-2 rounded-full hover:bg-muted transition"
          aria-label="Post options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      <div className="text-base py-2">{content}</div>
      <div className="flex items-center justify-between gap-2 mt-2">
        <Button size="sm" variant="ghost" aria-label="Comment">
          <MessageCircle className="w-5 h-5" /> Comment
        </Button>
        <Button size="sm" variant="ghost" aria-label="Like">
          <Heart className="w-5 h-5" /> Like
        </Button>
        <Button size="sm" variant="ghost" aria-label="Save">
          <Bookmark className="w-5 h-5" /> Save
        </Button>
      </div>
    </div>
  );
}
