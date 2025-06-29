import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";

export const follow = mutation({
  args: { followingId: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const followerId = currentUser._id;
    
    // Prevent duplicate follows
    const existing = await ctx.db
      .query("follows")
      .withIndex("byPair", (q) => q.eq("followerId", followerId).eq("followingId", args.followingId))
      .unique();
    if (!existing) {
      await ctx.db.insert("follows", {
        followerId,
        followingId: args.followingId,
        createdAt: Date.now(),
      });
    }
  },
});

export const unfollow = mutation({
  args: { followingId: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const followerId = currentUser._id;
    
    const follow = await ctx.db
      .query("follows")
      .withIndex("byPair", (q) => q.eq("followerId", followerId).eq("followingId", args.followingId))
      .unique();
    if (follow) {
      await ctx.db.delete(follow._id);
    }
  },
});

export const followerCount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("follows")
      .withIndex("byFollowing", (q) => q.eq("followingId", args.userId))
      .collect();
  },
});

export const followingCount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("follows")
      .withIndex("byFollower", (q) => q.eq("followerId", args.userId))
      .collect();
  },
});

export const isFollowing = query({
  args: { followerId: v.string(), followingId: v.string() },
  handler: async (ctx, args) => {
    const follow = await ctx.db
      .query("follows")
      .withIndex("byPair", (q) => 
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .unique();
    
    return follow !== null;
  },
});