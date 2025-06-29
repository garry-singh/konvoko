"use client";

import { PostCard } from "@/components/post/PostCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import {
  Authenticated,
  Unauthenticated,
  useQuery,
  useMutation,
} from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export default function ProfilePage() {
  const params = useParams();
  const username = params?.id as string;

  const currentUser = useQuery(api.users.currentUser);
  const profileUser = useQuery(api.users.getUserByUsername, { username });
  const userPosts = useQuery(api.posts.getPostsByUsername, { username });

  // Get follow status
  const isFollowing = useQuery(
    api.follows.isFollowing,
    currentUser && profileUser
      ? { followerId: currentUser._id, followingId: profileUser._id }
      : "skip"
  );

  // Get follower/following counts
  const followerCount = useQuery(
    api.follows.followerCount,
    profileUser ? { userId: profileUser._id } : "skip"
  );

  const followingCount = useQuery(
    api.follows.followingCount,
    profileUser ? { userId: profileUser._id } : "skip"
  );

  // Get feed posts for own profile
  const feedPosts = useQuery(api.posts.getFeedPosts);

  // Get liked posts for own profile
  const likedPosts = useQuery(
    api.posts.getUserLikedPosts,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  const followMutation = useMutation(api.follows.follow);
  const unfollowMutation = useMutation(api.follows.unfollow);

  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;

    try {
      await followMutation({ followingId: profileUser._id });
      toast.success(`You are now following @${profileUser.username}`);
    } catch {
      toast.error("Failed to follow user");
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser || !profileUser) return;

    try {
      await unfollowMutation({ followingId: profileUser._id });
      toast.success(`You unfollowed @${profileUser.username}`);
    } catch {
      toast.error("Failed to unfollow user");
    }
  };

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

  if (!profileUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">User not found</div>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === profileUser._id;

  return (
    <>
      <Unauthenticated>
        <section className="text-center py-20 px-4">
          <h1 className="text-4xl font-bold">Welcome to Konvoko</h1>
          <p className="mt-4 text-lg">
            Sign in to view profiles and connect with others.
          </p>
          <div className="mt-8">
            <Link href="/sign-in">
              <Button>Sign In</Button>
            </Link>
          </div>
        </section>
      </Unauthenticated>
      <Authenticated>
        <div className="max-w-2xl mx-auto py-4 px-4">
          {/* Profile Header */}
          <div className="flex items-center gap-6 mb-8">
            <Image
              src={profileUser.imageUrl || "/default-avatar.png"}
              alt={profileUser.fullName}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-4 border-card"
            />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="text-xl font-bold truncate">
                {profileUser.fullName}
              </div>
              <div className="text-muted-foreground text-sm truncate">
                @{profileUser.username}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <span className="font-semibold">
                  {(followerCount as Doc<"follows">[])?.length ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">Followers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-semibold">
                  {(followingCount as Doc<"follows">[])?.length ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">Following</span>
              </div>
            </div>

            {/* Follow/Unfollow Button */}
            {!isOwnProfile && currentUser && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={isFollowing ? handleUnfollow : handleFollow}
                className="ml-auto"
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
          </div>

          {/* Tabs - Only show Posts and Replies for other users */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full flex justify-center mb-4">
              <TabsTrigger value="posts" className="flex-1">
                Posts
              </TabsTrigger>
              <TabsTrigger value="replies" className="flex-1">
                Replies
              </TabsTrigger>
              {isOwnProfile && (
                <>
                  <TabsTrigger value="feed" className="flex-1">
                    Feed
                  </TabsTrigger>
                  <TabsTrigger value="liked" className="flex-1">
                    Liked
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {isOwnProfile && (
              <TabsContent value="feed" className="space-y-4">
                {renderPosts(
                  feedPosts,
                  "No posts in your feed yet. Follow some users to see their posts!"
                )}
              </TabsContent>
            )}

            <TabsContent value="posts" className="space-y-4">
              {renderPosts(
                userPosts
                  ? userPosts.filter((post) => post && !post.parentId)
                  : userPosts,
                `${profileUser.fullName} hasn't posted anything yet.`
              )}
            </TabsContent>

            <TabsContent value="replies" className="space-y-4">
              {renderPosts(
                userPosts
                  ? userPosts.filter((post) => post && post.parentId)
                  : userPosts,
                `${profileUser.fullName} hasn't replied to any posts yet.`
              )}
            </TabsContent>

            {isOwnProfile && (
              <TabsContent value="liked" className="space-y-4">
                {renderPosts(
                  likedPosts,
                  "You haven't liked any posts yet. Start exploring!"
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Authenticated>
    </>
  );
}
