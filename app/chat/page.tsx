"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Plus } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Doc, Id } from "@/convex/_generated/dataModel";

export default function ChatPage() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch real chats for the current user
  const userChats = useQuery(api.chats.getUserChats);

  // Search users you follow (or all users, here using searchUsers for scalability)
  const users = useQuery(
    api.users.searchUsers,
    searchTerm.length >= 3 ? { search: searchTerm } : "skip"
  );

  // Mutation to create a chat
  const createChat = useMutation(api.chats.createChat);

  // Handle search submit in dialog
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(search.trim());
  };

  // Handle create chat
  const handleCreateChat = async (userId: Id<"users">) => {
    try {
      const chatId = await createChat({ otherUserId: userId });
      setIsDialogOpen(false);
      toast.success("Chat created!");
      router.push(`/chat/${chatId}`);
    } catch {
      toast.error("Failed to create chat");
    }
  };

  const filteredUsers = users?.page as Doc<"users">[] | undefined;

  return (
    <div className="mx-auto w-full flex flex-col py-8 px-4 md:px-12">
      <div className="flex items-center justify-between gap-2 mb-6">
        <h2 className="text-lg font-semibold flex-1 text-left">Chats</h2>
        <div className="flex-1 flex justify-center">
          <Input placeholder="Search chats..." className="max-w-xs w-full" />
        </div>
        <div className="flex-1 flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                aria-label="Create new chat"
                className="gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Create New Chat</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start a new chat</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">Search</Button>
              </form>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchTerm.length < 3 ? (
                  <div className="text-muted-foreground text-center py-4">
                    Enter at least 3 characters to search.
                  </div>
                ) : users === undefined ? (
                  <div className="text-muted-foreground text-center py-4">
                    Loading users...
                  </div>
                ) : filteredUsers && filteredUsers.length === 0 ? (
                  <div className="text-muted-foreground text-center py-4">
                    No users found.
                  </div>
                ) : (
                  filteredUsers?.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => handleCreateChat(user._id)}
                    >
                      <Image
                        src={user.imageUrl || "/default-avatar.png"}
                        alt={user.fullName}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {user.fullName}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div
        className="flex flex-col gap-2 overflow-y-auto"
        style={{ maxHeight: "70vh" }}
      >
        {userChats === undefined ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : userChats.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">
              No chats yet. Start a conversation!
            </div>
          </div>
        ) : (
          userChats.map(
            (chat: {
              chat: Doc<"chats">;
              otherParticipant: Doc<"users"> | null;
              lastMessage: Doc<"messages"> | null;
              unreadCount: number;
            }) => {
              const {
                chat: chatObj,
                otherParticipant,
                lastMessage,
                unreadCount,
              } = chat;
              if (!otherParticipant) return null;
              return (
                <div
                  key={chatObj._id}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition cursor-pointer"
                  onClick={() => router.push(`/chat/${chatObj._id}`)}
                >
                  <Image
                    src={otherParticipant.imageUrl || "/default-avatar.png"}
                    alt={otherParticipant.fullName}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">
                        {otherParticipant.fullName}
                      </span>
                      <div className="flex flex-col items-end min-w-[56px] ml-2">
                        <span className="text-xs text-muted-foreground">
                          {lastMessage
                            ? new Date(
                                lastMessage.createdAt
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "New chat"}
                        </span>
                        {unreadCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="mt-1 text-xs px-1.5 py-0.5"
                          >
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {lastMessage
                        ? lastMessage.content
                        : "Start a conversation"}
                    </div>
                  </div>
                </div>
              );
            }
          )
        )}
      </div>
    </div>
  );
}
