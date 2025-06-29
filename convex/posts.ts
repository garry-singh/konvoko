import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";

export const createPost = mutation({
    args: {
      content: v.string(),
      parentId: v.optional(v.id("posts")),
      authorName: v.string(),
      authorUsername: v.string(),
      authorImageUrl: v.string(),
    },
    handler: async (ctx, args) => {
      // Get the current user
      const user = await getCurrentUserOrThrow(ctx);
  
      // Insert the post
      const postId = await ctx.db.insert("posts", {
        content: args.content,
        userId: user._id,
        createdAt: Date.now(),
        likeCount: 0,
        replyCount: 0,
        repostCount: 0,
        parentId: args.parentId,
        authorName: args.authorName,
        authorId: user.clerkUserId,
        authorUsername: args.authorUsername,
        authorImageUrl: args.authorImageUrl,
      });
  
      // If this is a reply, increment the reply count on the parent post
      if (args.parentId) {
        const parentPost = await ctx.db.get(args.parentId);
        if (parentPost) {
          await ctx.db.patch(args.parentId, {
            replyCount: parentPost.replyCount + 1,
          });
        }
      }
  
      return postId;
    },
  });
  
  export const deletePost = mutation({
    args: {
      postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
      const user = await getCurrentUserOrThrow(ctx);
      const post = await ctx.db.get(args.postId);
      
      if (!post) {
        throw new Error("Post not found");
      }
      
      // Check if the user is the author of the post
      if (post.userId.toString() !== user._id.toString()) {
        throw new Error("Not authorized to delete this post");
      }
      
      // If this is a reply, decrement the reply count on the parent post
      if (post.parentId) {
        const parentPost = await ctx.db.get(post.parentId);
        if (parentPost) {
          await ctx.db.patch(post.parentId, {
            replyCount: Math.max(0, parentPost.replyCount - 1),
          });
        }
      }
      
      // Delete the post
      await ctx.db.delete(args.postId);
      
      return { success: true };
    },
  });
  
  export const updatePost = mutation({
    args: {
      postId: v.id("posts"),
      content: v.string(),
    },
    handler: async (ctx, args) => {
      const user = await getCurrentUserOrThrow(ctx);
      const post = await ctx.db.get(args.postId);
      
      if (!post) {
        throw new Error("Post not found");
      }
      
      // Check if the user is the author of the post
      if (post.userId.toString() !== user._id.toString()) {
        throw new Error("Not authorized to edit this post");
      }
      
      // Update the post
      await ctx.db.patch(args.postId, {
        content: args.content,
      });
      
      return { success: true };
    },
  });
  
  export const likePost = mutation({
    args: {
      postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
      const user = await getCurrentUserOrThrow(ctx);
      const post = await ctx.db.get(args.postId);
      
      if (!post) {
        throw new Error("Post not found");
      }
  
      // Check if user already liked the post
      const existingLike = await ctx.db
        .query("likes")
        .withIndex("byPostAndUser", (q) => 
          q.eq("postId", args.postId).eq("userId", user._id)
        )
        .unique();
  
      if (existingLike) {
        // Unlike: Delete the like record and decrement count
        await ctx.db.delete(existingLike._id);
        await ctx.db.patch(args.postId, {
          likeCount: Math.max(0, post.likeCount - 1),
        });
        return { liked: false };
      } else {
        // Like: Create a new like record and increment count
        await ctx.db.insert("likes", {
          postId: args.postId,
          userId: user._id,
          createdAt: Date.now(),
        });
        await ctx.db.patch(args.postId, {
          likeCount: post.likeCount + 1,
        });
        return { liked: true };
      }
    },
  });
  
  export const savePost = mutation({
    args: {
      postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
      const user = await getCurrentUserOrThrow(ctx);
      const post = await ctx.db.get(args.postId);
      
      if (!post) {
        throw new Error("Post not found");
      }
  
      // Check if user already saved the post
      const existingSave = await ctx.db
        .query("saves")
        .withIndex("byPostAndUser", (q) => 
          q.eq("postId", args.postId).eq("userId", user._id)
        )
        .unique();
  
      if (existingSave) {
        // Unsave: Delete the save record
        await ctx.db.delete(existingSave._id);
        return { saved: false };
      } else {
        // Save: Create a new save record
        await ctx.db.insert("saves", {
          postId: args.postId,
          userId: user._id,
          createdAt: Date.now(),
        });
        return { saved: true };
      }
    },
  });

export const getPostById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.postId);
  },
});

export const getPostsWithUserStatus = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const posts = await ctx.db
      .query("posts")
      .withIndex("byCreatedAt")
      .order("desc")
      .collect();
    
    // Add like/save status to each post
    const postsWithStatus = await Promise.all(
      posts.map(async (post) => {
        const isLiked = await ctx.db
          .query("likes")
          .withIndex("byPostAndUser", (q) => 
            q.eq("postId", post._id).eq("userId", user._id)
          )
          .unique();
        
        const isSaved = await ctx.db
          .query("saves")
          .withIndex("byPostAndUser", (q) => 
            q.eq("postId", post._id).eq("userId", user._id)
          )
          .unique();
        
        return {
          ...post,
          isLiked: isLiked !== null,
          isSaved: isSaved !== null,
        };
      })
    );
    
    return postsWithStatus;
  },
});

export const getRepliesToPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("byParent", (q) => q.eq("parentId", args.postId))
      .order("asc")
      .collect();
  },
});

export const getFeedPosts = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    // Get users that the current user follows
    const follows = await ctx.db
      .query("follows")
      .withIndex("byFollower", (q) => q.eq("followerId", user._id))
      .collect();
    
    const followingIds = follows.map(follow => follow.followingId);
    const allUserIds = [...followingIds, user._id];
    
    return await getPostsByUserIds(ctx, allUserIds);
  },
});

export const getUserPosts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("byUser", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getUserLikedPosts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await getPostsByRelation(ctx, args.userId, "likes");
  },
});

export const getUserSavedPosts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await getPostsByRelation(ctx, args.userId, "saves");
  },
});

export const hasUserLikedPost = query({
  args: { userId: v.string(), postId: v.id("posts") },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("likes")
      .withIndex("byPostAndUser", (q) => 
        q.eq("postId", args.postId).eq("userId", args.userId)
      )
      .unique();
    
    return like !== null;
  },
});

export const hasUserSavedPost = query({
  args: { userId: v.string(), postId: v.id("posts") },
  handler: async (ctx, args) => {
    const save = await ctx.db
      .query("saves")
      .withIndex("byPostAndUser", (q) => 
        q.eq("postId", args.postId).eq("userId", args.userId)
      )
      .unique();
    
    return save !== null;
  },
});

export const getPostsByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    // First find the user by username
    const user = await ctx.db
      .query("users")
      .withIndex("byUsername", (q) => q.eq("username", args.username))
      .unique();
    
    if (!user) {
      return [];
    }
    
    // Then get their posts
    return await ctx.db
      .query("posts")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Generic function to get posts by user IDs
async function getPostsByUserIds(ctx: QueryCtx, userIds: string[]) {
  const allPosts = [];
  for (const userId of userIds) {
    const userPosts = await ctx.db
      .query("posts")
      .withIndex("byUser", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    allPosts.push(...userPosts);
  }
  
  return allPosts
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50); // Limit to 50 most recent posts
}

// Generic function to get posts by relation (likes/saves)
async function getPostsByRelation(
  ctx: QueryCtx, 
  userId: string, 
  relationTable: "likes" | "saves"
) {
  const relations = await ctx.db
    .query(relationTable)
    .withIndex("byUser", (q) => q.eq("userId", userId))
    .order("desc")
    .collect();
  
  const postIds = relations.map(rel => rel.postId);
  const posts = await Promise.all(
    postIds.map(id => ctx.db.get(id))
  );
  
  return posts.filter(Boolean);
}