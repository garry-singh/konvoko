"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

export default function ChatIdPage() {
  const params = useParams();
  const chatId = params?.id as Id<"chats">;
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useConvexAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch chat data
  const chat = useQuery(api.chats.getChat, { chatId });

  // Fetch messages for this chat
  const messages = useQuery(api.chats.getChatMessages, { chatId });

  // Mutations
  const sendMessage = useMutation(api.chats.sendMessage);
  const markChatAsRead = useMutation(api.chats.markChatAsRead);
  const deleteChat = useMutation(api.chats.deleteChat);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark chat as read when messages are loaded
  useEffect(() => {
    let isMounted = true;

    if (
      chat &&
      messages !== undefined &&
      messages.length > 0 &&
      isAuthenticated
    ) {
      // Only mark as read if component is still mounted and user is authenticated
      if (isMounted) {
        markChatAsRead({ chatId }).catch(() => {
          // Silently ignore errors (like user logged out)
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [chat, messages, markChatAsRead, chatId, isAuthenticated]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage({ chatId, content: message.trim() });
      setMessage("");
      // Mark as read when sending a message
      markChatAsRead({ chatId }).catch(() => {
        // Silently ignore errors (like user logged out)
      });
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleDeleteChat = async () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteChat({ chatId });
      toast.success("Chat deleted successfully");
      // Redirect to chat list
      window.location.href = "/chat";
    } catch {
      toast.error("Failed to delete chat");
    } finally {
      setIsDeleting(false);
    }
  };

  // Format message time with relative time for recent messages
  const formatMessageTime = (timestamp: number) => {
    const now = Date.now();
    const messageDate = new Date(timestamp);
    const diffInHours = (now - timestamp) / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    // If message is from today, show time only
    if (
      diffInHours < 24 &&
      messageDate.toDateString() === new Date().toDateString()
    ) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // If message is from yesterday, show "Yesterday" + time
    if (
      diffInDays < 2 &&
      messageDate.toDateString() ===
        new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
    ) {
      return `Yesterday ${messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // If message is from this week, show day name + time
    if (diffInDays < 7) {
      return `${messageDate.toLocaleDateString([], { weekday: "short" })} ${messageDate.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      )}`;
    }

    // For older messages, show full date and time
    return messageDate.toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date header for message groups
  const formatDateHeader = (timestamp: number) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    );
  }

  const { otherParticipant } = chat;
  if (!otherParticipant) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Chat not found</div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* Chat Header (fixed relative to scrollable container) */}
      <div className="sticky top-[var(--breadcrumb-header-height,56px)] z-20 bg-background border-b px-4 py-3 flex items-center gap-4">
        <Link href="/chat" className="mr-2">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <Image
          src={otherParticipant.imageUrl || "/default-avatar.png"}
          alt={otherParticipant.fullName}
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold truncate">
            {otherParticipant.fullName}
          </span>
          <span className="text-xs text-muted-foreground">
            @{otherParticipant.username}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleDeleteChat}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Scrollable messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-muted/50">
        {messages === undefined ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-32 gap-2">
            <div className="text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const showDateHeader =
              index === 0 ||
              new Date(msg.createdAt).toDateString() !==
                new Date(messages[index - 1].createdAt).toDateString();

            return (
              <div key={msg._id}>
                {showDateHeader && (
                  <div className="flex justify-center my-4">
                    <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                      {formatDateHeader(msg.createdAt)}
                    </div>
                  </div>
                )}
                <div
                  className={`flex ${msg.senderId === chat.currentUserId ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 text-sm shadow-sm whitespace-pre-line ${
                      msg.senderId === chat.currentUserId
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-background border rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                    <div className="text-xs text-muted-foreground mt-1 text-right">
                      {formatMessageTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area (fixed relative to page layout) */}
      <div className="sticky bottom-0 z-20 bg-background border-t px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            placeholder="Type your message..."
            className="flex-1"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!chat}
          />
          <Button type="submit" size="icon" disabled={!message.trim() || !chat}>
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Chat"
        description="Are you sure you want to delete this chat? This action cannot be undone and all messages will be permanently deleted."
        isLoading={isDeleting}
      />
    </div>
  );
}
