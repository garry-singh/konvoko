"use client";

import { PostCard } from "@/components/post/PostCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const user = useQuery(api.users.currentUser);
  console.log(user);
  // TODO: Replace with real queries
  const followerCount = 123;
  const followingCount = 45;

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
            <div className="flex flex-col items-center gap-2 mb-6">
              <Image
                src={user.imageUrl || "/default-avatar.png"}
                alt={user.fullName}
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover border-4 border-card"
              />
              <div className="text-xl font-bold">{user.fullName}</div>
              <div className="text-muted-foreground text-sm">
                @{user.username}
              </div>
              <div className="flex gap-6 mt-2">
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
              {/* <Button size="sm" className="mt-2">Edit Profile</Button> */}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="feed" className="w-full">
              <TabsList className="w-full flex justify-center mb-4">
                <TabsTrigger value="feed" className="flex-1">
                  Feed
                </TabsTrigger>
                <TabsTrigger value="posts" className="flex-1">
                  Posts
                </TabsTrigger>
                <TabsTrigger value="liked" className="flex-1">
                  Liked
                </TabsTrigger>
              </TabsList>
              <TabsContent value="feed">
                {/* Replace with real feed data */}
                <PostCard
                  avatarUrl={user.imageUrl ?? ""}
                  displayName={user.fullName ?? ""}
                  username={user.username ?? ""}
                  postedAt={new Date()}
                  content="This is a post from your feed."
                />
              </TabsContent>
              <TabsContent value="posts">
                {/* Replace with user's own posts */}
                <PostCard
                  avatarUrl={user.imageUrl ?? ""}
                  displayName={user.fullName ?? ""}
                  username={user.username ?? ""}
                  postedAt={new Date()}
                  content="This is one of your own posts."
                />
              </TabsContent>
              <TabsContent value="liked">
                {/* Replace with liked posts */}
                <PostCard
                  avatarUrl={user.imageUrl ?? ""}
                  displayName={user.fullName ?? ""}
                  username={user.username ?? ""}
                  postedAt={new Date()}
                  content="This is a post you liked."
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </Authenticated>
    </>
  );
}
