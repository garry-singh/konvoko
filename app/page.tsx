"use client";

import { PostCard } from "@/components/post/PostCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { CreatePostTextArea } from "@/components/CreatePostTextArea";
import { Doc } from "@/convex/_generated/dataModel";

export default function Home() {
  const user = useQuery(api.users.currentUser);
  const feedPosts = useQuery(api.posts.getFeedPosts);
  const userPosts = useQuery(
    api.posts.getUserPosts,
    user ? { userId: user._id } : "skip"
  );
  const likedPosts = useQuery(
    api.posts.getUserLikedPosts,
    user ? { userId: user._id } : "skip"
  );

  // TODO: Replace with real queries
  const followerCount = 123;
  const followingCount = 45;

  const renderPosts = (
    posts: (Doc<"posts"> | null)[] | undefined,
    emptyMessage: string
  ) => {
    if (posts === undefined) {
      return (
        <div className="flex justify-center items-center h-32">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      );
    }

    // Filter out null posts
    const validPosts = posts.filter(
      (post): post is Doc<"posts"> => post !== null
    );

    if (validPosts.length === 0) {
      return (
        <div className="flex justify-center items-center h-32">
          <div className="text-muted-foreground">{emptyMessage}</div>
        </div>
      );
    }

    return validPosts.map((post) => (
      <PostCard
        key={post._id}
        postId={post._id}
        avatarUrl={post.authorImageUrl || "/default-avatar.png"}
        displayName={post.authorName}
        username={post.authorUsername}
        postedAt={new Date(post.createdAt)}
        content={post.content}
        likeCount={post.likeCount}
        replyCount={post.replyCount}
      />
    ));
  };

  return (
    <>
      <Unauthenticated>
        <section className="text-center py-20 px-4">
          <h1 className="text-4xl font-bold">Welcome to Konvoko</h1>
          <p className="mt-4 text-lg">
            Konvoko is a social memory app to capture, organize, and search your
            thoughts, combining Twitter style posting with a personal mind
            palace.
          </p>
          <div className="mt-8">
            <Link href="/sign-in">
              <Button>Get Started</Button>
            </Link>
          </div>
        </section>
      </Unauthenticated>
      <Authenticated>
        {!user ? (
          <div className="flex justify-center items-center h-64">
            Loading...
          </div>
        ) : (
          <div className="max-w-2xl mx-auto py-8 px-4">
            {/* Profile Header */}
            <div className="flex items-center gap-6 mb-8">
              <Image
                src={user.imageUrl || "/default-avatar.png"}
                alt={user.fullName}
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover border-4 border-card"
              />
              <div className="flex flex-col gap-1 min-w-0">
                <div className="text-xl font-bold truncate">
                  {user.fullName}
                </div>
                <div className="text-muted-foreground text-sm truncate">
                  @{user.username}
                </div>
              </div>
              <div className="flex gap-6 ml-auto">
                <div className="flex flex-col items-center">
                  <span className="font-semibold">{followerCount}</span>
                  <span className="text-xs text-muted-foreground">
                    Followers
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-semibold">{followingCount}</span>
                  <span className="text-xs text-muted-foreground">
                    Following
                  </span>
                </div>
              </div>
            </div>

            {/* Post Create Box */}
            <CreatePostTextArea />

            {/* Tabs */}
            <Tabs defaultValue="feed" className="w-full">
              <TabsList className="w-full flex justify-center mb-4">
                <TabsTrigger value="feed" className="flex-1">
                  Feed
                </TabsTrigger>
                <TabsTrigger value="posts" className="flex-1">
                  Posts
                </TabsTrigger>
                <TabsTrigger value="replies" className="flex-1">
                  Replies
                </TabsTrigger>
                <TabsTrigger value="liked" className="flex-1">
                  Liked
                </TabsTrigger>
              </TabsList>
              <TabsContent value="feed" className="space-y-4">
                {renderPosts(
                  feedPosts,
                  "No posts in your feed yet. Follow some users to see their posts!"
                )}
              </TabsContent>
              <TabsContent value="posts" className="space-y-4">
                {renderPosts(
                  userPosts
                    ? userPosts.filter((post) => post && !post.parentId)
                    : userPosts,
                  "You haven't posted anything yet. Share your first thought!"
                )}
              </TabsContent>
              <TabsContent value="replies" className="space-y-4">
                {renderPosts(
                  userPosts
                    ? userPosts.filter((post) => post && post.parentId)
                    : userPosts,
                  "You haven't replied to any posts yet. Start exploring!"
                )}
              </TabsContent>
              <TabsContent value="liked" className="space-y-4">
                {renderPosts(
                  likedPosts,
                  "You haven't liked any posts yet. Start exploring!"
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </Authenticated>
    </>
  );
}
