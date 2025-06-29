import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.string(),
    fullName: v.string(),
    lastLoginAt: v.number(),
    username: v.string(),
  })
  .index("byClerkUserId", ["clerkUserId"])
  .index("byLastLoginAt", ["lastLoginAt"]),
  follows: defineTable({
    followerId: v.string(),
    followingId: v.string(),
    createdAt: v.number(),
  })
  .index("byFollower", ["followerId"])
  .index("byFollowing", ["followingId"])
  .index("byPair", ["followerId", "followingId"]),
});