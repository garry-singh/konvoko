import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";

export const getUserChats = query({
  handler: async (ctx) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    // Get all chats where the current user is a participant
    const chatsAsParticipant1 = await ctx.db
      .query("chats")
      .withIndex("byParticipant1", (q) => q.eq("participant1Id", currentUser._id))
      .collect();
    const chatsAsParticipant2 = await ctx.db
      .query("chats")
      .withIndex("byParticipant2", (q) => q.eq("participant2Id", currentUser._id))
      .collect();
    const allChats = [...chatsAsParticipant1, ...chatsAsParticipant2];
    // Get the other participant for each chat and their last message
    const chatsWithParticipants = await Promise.all(
      allChats.map(async (chat) => {
        const otherParticipantId = chat.participant1Id === currentUser._id
          ? chat.participant2Id
          : chat.participant1Id;
        const otherParticipant = await ctx.db.get(otherParticipantId);
        
        // Get the last message in this chat
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("byChat", (q) => q.eq("chatId", chat._id))
          .order("desc")
          .first();
        
        // Calculate unread count
        const lastReadAt = chat.participant1Id === currentUser._id 
          ? chat.participant1LastReadAt 
          : chat.participant2LastReadAt;
        
        let unreadCount = 0;
        if (lastMessage) {
          // Get all messages in this chat
          const allMessages = await ctx.db
            .query("messages")
            .withIndex("byChat", (q) => q.eq("chatId", chat._id))
            .collect();
          
          // Filter to only messages from the other participant
          const otherUserMessages = allMessages.filter(msg => msg.senderId !== currentUser._id);
          
          if (lastReadAt) {
            // Count messages from other user created after lastReadAt
            unreadCount = otherUserMessages.filter(msg => msg.createdAt > lastReadAt).length;
          } else {
            // If no lastReadAt, count all messages from other user
            unreadCount = otherUserMessages.length;
          }
        }
        
        return {
          chat,
          otherParticipant,
          lastMessage,
          unreadCount,
        };
      })
    );
    // Sort by last message time
    return chatsWithParticipants
      .filter((item) => item.otherParticipant !== null)
      .sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ?? a.chat.createdAt;
        const bTime = b.lastMessage?.createdAt ?? b.chat.createdAt;
        return bTime - aTime;
      });
  },
});

export const getChat = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return null;
    
    // Check if current user is a participant
    if (chat.participant1Id !== currentUser._id && chat.participant2Id !== currentUser._id) {
      return null;
    }
    
    const otherParticipantId = chat.participant1Id === currentUser._id
      ? chat.participant2Id
      : chat.participant1Id;
    const otherParticipant = await ctx.db.get(otherParticipantId);
    
    return {
      chat,
      otherParticipant,
      currentUserId: currentUser._id,
    };
  },
});

export const getChatMessages = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return [];
    
    // Check if current user is a participant
    if (chat.participant1Id !== currentUser._id && chat.participant2Id !== currentUser._id) {
      return [];
    }
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("byChat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
    
    return messages;
  },
});

export const createChat = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    // Check if a chat already exists between these users
    const existingChat = await ctx.db
      .query("chats")
      .withIndex("byParticipants", (q) =>
        q.eq("participant1Id", currentUser._id).eq("participant2Id", args.otherUserId)
      )
      .unique();
    if (existingChat) {
      return existingChat._id;
    }
    // Check the reverse order too
    const existingChatReverse = await ctx.db
      .query("chats")
      .withIndex("byParticipants", (q) =>
        q.eq("participant1Id", args.otherUserId).eq("participant2Id", currentUser._id)
      )
      .unique();
    if (existingChatReverse) {
      return existingChatReverse._id;
    }
    // Create new chat
    const chatId = await ctx.db.insert("chats", {
      participant1Id: currentUser._id,
      participant2Id: args.otherUserId,
      createdAt: Date.now(),
    });
    return chatId;
  },
});

export const sendMessage = mutation({
  args: { 
    chatId: v.id("chats"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");
    
    // Check if current user is a participant
    if (chat.participant1Id !== currentUser._id && chat.participant2Id !== currentUser._id) {
      throw new Error("Not a participant in this chat");
    }
    
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      senderId: currentUser._id,
      content: args.content,
      createdAt: Date.now(),
    });
    
    return messageId;
  },
});

export const markChatAsRead = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");
    
    // Check if current user is a participant
    if (chat.participant1Id !== currentUser._id && chat.participant2Id !== currentUser._id) {
      throw new Error("Not a participant in this chat");
    }
    
    const now = Date.now();
    
    if (chat.participant1Id === currentUser._id) {
      await ctx.db.patch(args.chatId, { participant1LastReadAt: now });
    } else {
      await ctx.db.patch(args.chatId, { participant2LastReadAt: now });
    }
  },
}); 