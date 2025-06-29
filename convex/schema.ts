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
  .index("byLastLoginAt", ["lastLoginAt"])
  .index("byUsername", ["username"])
  .index("byFullName", ["fullName"]),
  
  posts: defineTable({
    userId: v.string(),
    content: v.string(),
    createdAt: v.number(),
    likeCount: v.number(),
    replyCount: v.number(),
    repostCount: v.number(),
    parentId: v.optional(v.id("posts")),
    authorName: v.string(),
    authorId: v.string(),
    authorUsername: v.string(),
    authorImageUrl: v.string(),
  })
  .index("byUser", ["userId"])
  .index("byCreatedAt", ["createdAt"])
  .index("byParent", ["parentId"]),
  
  likes: defineTable({
    postId: v.id("posts"),
    userId: v.string(),
    createdAt: v.number(),
  })
  .index("byPostAndUser", ["postId", "userId"])
  .index("byUser", ["userId"])
  .index("byPost", ["postId"]),
  
  saves: defineTable({
    postId: v.id("posts"),
    userId: v.string(),
    createdAt: v.number(),
  })
  .index("byPostAndUser", ["postId", "userId"])
  .index("byUser", ["userId"])
  .index("byPost", ["postId"]),
  
  follows: defineTable({
    followerId: v.string(),
    followingId: v.string(),
    createdAt: v.number(),
  })
  .index("byFollower", ["followerId"])
  .index("byFollowing", ["followingId"])
  .index("byPair", ["followerId", "followingId"]),
});