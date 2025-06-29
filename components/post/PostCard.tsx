"use client";

import { Heart, Bookmark, MoreHorizontal, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

export interface PostCardProps {
  postId: Id<"posts">;
  avatarUrl: string;
  displayName: string;
  username: string;
  postedAt: Date | string;
  content: string;
  likeCount?: number;
  replyCount?: number;
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

const editPostSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(500, "Post must be less than 500 characters"),
});
type EditPostForm = z.infer<typeof editPostSchema>;

export function PostCard({
  postId,
  avatarUrl,
  displayName,
  username,
  postedAt,
  content,
  likeCount = 0,
  replyCount = 0,
}: PostCardProps) {
  const { user } = useUser();
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const updatePost = useMutation(api.posts.updatePost);
  const [isEditing, setIsEditing] = useState(false);
  const form = useForm<EditPostForm>({
    resolver: zodResolver(editPostSchema),
    defaultValues: { content },
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  // Convex mutations
  const likePost = useMutation(api.posts.likePost);
  const savePost = useMutation(api.posts.savePost);
  const deletePost = useMutation(api.posts.deletePost);

  // Get current user's like/save status for this post
  const currentUser = useQuery(api.users.currentUser);
  const isLiked = useQuery(
    api.posts.hasUserLikedPost,
    currentUser && user ? { userId: currentUser._id, postId } : "skip"
  );
  const isSaved = useQuery(
    api.posts.hasUserSavedPost,
    currentUser && user ? { userId: currentUser._id, postId } : "skip"
  );

  const isAuthor = currentUser && currentUser.username === username;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isLiking) return;
    setIsLiking(true);
    try {
      const result = await likePost({ postId });
      if (result && result.liked) {
        toast.success("Post liked!");
      } else {
        toast.success("Like removed!");
      }
    } catch (error) {
      console.error("Failed to like post:", error);
      toast.error("Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isSaving) return;
    setIsSaving(true);
    try {
      const result = await savePost({ postId });
      if (result && result.saved) {
        toast.success("Post saved!");
      } else {
        toast.success("Save removed!");
      }
    } catch (error) {
      console.error("Failed to save post:", error);
      toast.error("Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/post/${postId}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    form.reset({ content });
    setIsEditing(true);
    setTimeout(() => {
      const textarea = document.querySelector(
        `textarea[name='content']`
      ) as HTMLTextAreaElement | null;
      textarea?.focus();
    }, 0);
  };

  const handleEditCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    form.reset({ content });
  };

  const handleEditSave = async (data: EditPostForm) => {
    if (!data.content.trim()) {
      toast.error("Post cannot be empty");
      return;
    }
    setIsUpdating(true);
    try {
      await updatePost({ postId, content: data.content.trim() });
      toast.success("Post updated!");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update post:", error);
      toast.error("Failed to update post");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthor) return;
    try {
      await deletePost({ postId });
      toast.success("Post deleted!");
      // Optionally, trigger a refresh or show a toast
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-col gap-2 hover:bg-muted transition">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/profile/${username}`}
            aria-label={`Go to @${username}'s profile`}
            onClick={(e) => e.stopPropagation()}
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
                onClick={(e) => e.stopPropagation()}
              >
                <span className="font-semibold hover:underline cursor-pointer">
                  {displayName}
                </span>
              </Link>
              <Link
                href={`/profile/${username}`}
                aria-label={`Go to @${username}'s profile`}
                onClick={(e) => e.stopPropagation()}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="p-2 rounded-full cursor-pointer"
              aria-label="Post options"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isAuthor && (
              <DropdownMenuItem
                onClick={handleEdit}
                className="text-blue-600 focus:text-blue-700"
              >
                Edit post
              </DropdownMenuItem>
            )}
            {isAuthor && (
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600 focus:text-red-700"
              >
                Delete post
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Inline edit mode */}
      {isEditing ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleEditSave)}
            className="flex flex-col gap-2 py-2"
          >
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <textarea
                      className="w-full rounded border p-2 text-base resize-none focus:outline-none focus:ring pr-24"
                      rows={3}
                      disabled={isUpdating}
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="absolute -bottom-6 left-0" />
                </FormItem>
              )}
            />
            <Separator orientation="horizontal" className="!my-2" />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={handleEditCancel}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                type="submit"
                disabled={isUpdating || !form.formState.isValid}
              >
                {isUpdating ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <Link
          href={`/post/${postId}`}
          className="block text-base py-2 group-hover:underline focus:outline-none"
          aria-label="View post"
          tabIndex={0}
        >
          {content}
        </Link>
      )}
      <div className="flex items-center justify-between gap-2 mt-2">
        <Button
          size="sm"
          variant="ghost"
          aria-label="Comment"
          onClick={handleComment}
          disabled={!user}
          className="cursor-pointer"
        >
          <MessageCircle className="w-5 h-5" />
          {replyCount > 0 && <span className="ml-1">{replyCount}</span>}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label={isLiked ? "Unlike" : "Like"}
          onClick={handleLike}
          disabled={!user || isLiking}
          className={
            isLiked
              ? "text-red-500 hover:text-red-600 cursor-pointer"
              : "cursor-pointer"
          }
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
          {likeCount > 0 && <span className="ml-1">{likeCount}</span>}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label={isSaved ? "Unsave" : "Save"}
          onClick={handleSave}
          disabled={!user || isSaving}
          className={
            isSaved
              ? "text-blue-500 hover:text-blue-600 cursor-pointer"
              : "cursor-pointer"
          }
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
