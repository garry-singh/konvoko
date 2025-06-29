import { v, Validator } from "convex/values";
import { internalMutation, query, QueryCtx } from "./_generated/server";
import { UserJSON } from '@clerk/backend';

export const getUsers = query({
    args: {},
    handler: async ctx => {
        return await ctx.db.query('users').collect()
    }
})

export const getRecentUsers = query({
    args: {},
    handler: async ctx => {
        return await ctx.db.query('users')
            .withIndex('byLastLoginAt')
            .order('desc')
            .take(10);
    }
});

export const currentUser = query({
    args: {},
    handler: async ctx => {
        return await getCurrentUser(ctx)
    }
})

export const upsertFromClerk = internalMutation({
    args: { data: v.any() as Validator<UserJSON> },
    async handler(ctx, { data }) {
        const userAttributes = {
            email: data.email_addresses[0].email_address,
            clerkUserId: data.id,
            firstName: data.first_name ?? undefined,
            lastName: data.last_name ?? undefined,
            imageUrl: data.image_url ?? "",
            fullName: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
            lastLoginAt: Date.now(),
            username: data.username ?? "",
        }

        const user = await userByClerkUserId(ctx, data.id);
        if (user === null) {
            await ctx.db.insert("users", userAttributes);
          } else {
            await ctx.db.patch(user._id, userAttributes);
          }
    }
})

export const deleteFromClerk = internalMutation({
    args: { clerkUserId: v.string() },
    async handler(ctx, { clerkUserId }) {
      const user = await userByClerkUserId(ctx, clerkUserId);
  
      if (user !== null) {
        await ctx.db.delete(user._id);
      } else {
        console.warn(
          `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
        );
      }
    },
  });
  
  export async function getCurrentUserOrThrow(ctx: QueryCtx) {
    const userRecord = await getCurrentUser(ctx);
    if (!userRecord) throw new Error("Can't get current user");
    return userRecord;
  }
  
  export async function getCurrentUser(ctx: QueryCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }
    return await userByClerkUserId(ctx, identity.subject);
  }
  
  export async function userByClerkUserId(ctx: QueryCtx, clerkUserId: string) {
    return await ctx.db
      .query("users")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
  }

export const userByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", args.clerkId))
      .unique();
  },
});

export const getUserByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("byUsername", (q) => q.eq("username", args.username))
      .unique();
  },
});

export const searchUsers = query({
  args: { 
    search: v.string(),
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.optional(v.union(v.string(), v.null()))
    }))
  },
  handler: async (ctx, args) => {
    const search = args.search.toLowerCase().trim();
    
    // Use pagination for scalability
    const paginationOpts = args.paginationOpts ?? { numItems: 20 };
    const paginationOptions = {
      numItems: paginationOpts.numItems,
      cursor: paginationOpts.cursor ?? null
    };
    
    // Use a single paginated query with username index
    const users = await ctx.db
      .query("users")
      .withIndex("byUsername", (q) => 
        q.gte("username", search).lt("username", search + "\uffff")
      )
      .paginate(paginationOptions);
    
    // If we don't have enough results, get more from fullName search
    // but we need to do this without pagination to avoid the multiple pagination error
    if (users.page.length < paginationOpts.numItems) {
      const additionalUsers = await ctx.db
        .query("users")
        .withIndex("byFullName", (q) => 
          q.gte("fullName", search).lt("fullName", search + "\uffff")
        )
        .collect();
      
      // Filter out users already in the first results and limit to what we need
      const existingIds = new Set(users.page.map(u => u._id));
      const additionalFiltered = additionalUsers
        .filter(user => !existingIds.has(user._id))
        .slice(0, paginationOpts.numItems - users.page.length);
      
      return {
        page: [...users.page, ...additionalFiltered],
        isDone: users.isDone,
        continueCursor: users.continueCursor
      };
    }
    
    return users;
  }
});