import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Plus } from "lucide-react";

const chats = [
  {
    id: 1,
    name: "Olivia Martin",
    avatar: "/avatars/olivia.png",
    lastMessage: "Hi, how can I help you today?",
    time: "Yesterday",
    unread: 1,
  },
  {
    id: 2,
    name: "Isabella Nguyen",
    avatar: "/avatars/isabella.png",
    lastMessage: "Wohoo!",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: 3,
    name: "Emma Wilson",
    avatar: "/avatars/emma.png",
    lastMessage: "What seems to be the problem?",
    time: "Yesterday",
    unread: 3,
  },
  {
    id: 4,
    name: "Jackson Lee",
    avatar: "/avatars/jackson.png",
    lastMessage: "Today?",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: 5,
    name: "William Kim",
    avatar: "/avatars/william.png",
    lastMessage: "I can't log in.",
    time: "Yesterday",
    unread: 0,
  },
  // Additional chats for scroll testing
  {
    id: 6,
    name: "Sophia Turner",
    avatar: "/avatars/sophia.png",
    lastMessage: "Thanks for your help!",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: 7,
    name: "Liam Patel",
    avatar: "/avatars/liam.png",
    lastMessage: "See you tomorrow!",
    time: "Yesterday",
    unread: 2,
  },
  {
    id: 8,
    name: "Mia Chen",
    avatar: "/avatars/mia.png",
    lastMessage: "Can you send the file?",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: 9,
    name: "Noah Smith",
    avatar: "/avatars/noah.png",
    lastMessage: "Let's catch up soon.",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: 10,
    name: "Ava Brown",
    avatar: "/avatars/ava.png",
    lastMessage: "Got it, thank you!",
    time: "Yesterday",
    unread: 1,
  },
  {
    id: 11,
    name: "Lucas Garcia",
    avatar: "/avatars/lucas.png",
    lastMessage: "I'll be late to the meeting.",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: 12,
    name: "Charlotte Davis",
    avatar: "/avatars/charlotte.png",
    lastMessage: "No worries!",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: 13,
    name: "Benjamin Miller",
    avatar: "/avatars/benjamin.png",
    lastMessage: "Can we reschedule?",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: 14,
    name: "Amelia Wilson",
    avatar: "/avatars/amelia.png",
    lastMessage: "Thank you for the update.",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: 15,
    name: "Elijah Martinez",
    avatar: "/avatars/elijah.png",
    lastMessage: "Let's discuss this further.",
    time: "Yesterday",
    unread: 0,
  },
];

export default function ChatPage() {
  return (
    <div className="mx-auto w-full flex flex-col py-8 px-4 md:px-12">
      <div className="flex items-center justify-between gap-2 mb-6">
        <h2 className="text-lg font-semibold flex-1 text-left">Chats</h2>
        <div className="flex-1 flex justify-center">
          <Input placeholder="Search chats..." className="max-w-xs w-full" />
        </div>
        <div className="flex-1 flex justify-end">
          <Button
            variant="outline"
            aria-label="Create new chat"
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Create New Chat</span>
          </Button>
        </div>
      </div>
      <div
        className="flex flex-col gap-2 overflow-y-auto"
        style={{ maxHeight: "70vh" }}
      >
        {chats.map((chat) => (
          <div
            key={chat.id}
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition cursor-pointer"
          >
            <Image
              src={chat.avatar}
              alt={chat.name}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium truncate">{chat.name}</span>
                <div className="flex flex-col items-end min-w-[56px] ml-2">
                  <span className="text-xs text-muted-foreground">
                    {chat.time}
                  </span>
                  {chat.unread > 0 && (
                    <Badge className="mt-1 bg-green-500 text-white px-2 py-0.5 rounded-full">
                      {chat.unread}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {chat.lastMessage}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
