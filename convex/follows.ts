import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const follow = mutation({
  args: { followingId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const followerId = identity.subject;
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const followerId = identity.subject;
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