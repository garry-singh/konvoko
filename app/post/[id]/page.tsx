"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CreatePostTextArea } from "@/components/CreatePostTextArea";
import { PostCard } from "@/components/post/PostCard";
import { Id } from "@/convex/_generated/dataModel";

export default function PostPage() {
  const params = useParams();
  let postId: Id<"posts"> | undefined = undefined;
  if (params && "id" in params) {
    const id = params.id;
    const strId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
    if (strId) {
      postId = strId as Id<"posts">;
    }
  }

  // Fetch the post and its replies
  const post = useQuery(api.posts.getPostById, postId ? { postId } : "skip");
  const replies = useQuery(
    api.posts.getRepliesToPost,
    postId ? { postId } : "skip"
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Main Post */}
      {post ? (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src={post.authorImageUrl || "/default-avatar.png"}
              alt={post.authorName}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div>
              <Link
                href={`/profile/${post.authorUsername}`}
                className="font-semibold hover:underline"
              >
                {post.authorName}
              </Link>
              <span className="text-muted-foreground text-sm ml-2">
                @{post.authorUsername}
              </span>
            </div>
            <span className="ml-auto text-xs text-muted-foreground">
              {new Date(post.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="text-lg mb-8 whitespace-pre-line">{post.content}</div>
        </div>
      ) : (
        <div className="mb-8 text-center text-muted-foreground">
          Loading post...
        </div>
      )}

      {/* Reply Area */}
      {postId && (
        <div className="mb-8">
          <CreatePostTextArea parentId={postId} />
        </div>
      )}

      {/* Replies */}
      <div className="border-t pt-6 mt-6">
        <h2 className="text-base font-semibold mb-4">Replies</h2>
        {replies === undefined ? (
          <div className="text-muted-foreground">Loading replies...</div>
        ) : replies.length === 0 ? (
          <div className="text-muted-foreground">
            No replies yet. Be the first to reply!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {replies.map((reply) => (
              <PostCard
                key={reply._id}
                postId={reply._id}
                avatarUrl={reply.authorImageUrl || "/default-avatar.png"}
                displayName={reply.authorName}
                username={reply.authorUsername}
                postedAt={new Date(reply.createdAt)}
                content={reply.content}
                likeCount={reply.likeCount}
                replyCount={reply.replyCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
