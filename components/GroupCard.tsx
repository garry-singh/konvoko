"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MessageCircle } from "lucide-react";

interface GroupMember {
  user_id: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface Group {
  id: string;
  name: string;
  description: string;
  type: "public" | "private";
  member_count?: number;
  max_members?: number;
  creator_username?: string;
  members?: GroupMember[];
}

interface GroupCardProps {
  group: Group;
}

export default function GroupCard({ group }: GroupCardProps) {
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
                {group.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={group.type === "public" ? "default" : "secondary"}
                >
                  {group.type === "public" ? "Public" : "Private"}
                </Badge>
                {group.creator_username && (
                  <span className="text-sm text-muted-foreground">
                    by {group.creator_username}
                  </span>
                )}
              </div>
            </div>

            {/* Member Avatars - Top Right */}
            {group.members && group.members.length > 0 && (
              <div className="*:data-[slot=avatar]:ring-background flex -space-x-1 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
                {group.members.map((member) => (
                  <Avatar key={member.user_id} className="h-6 w-6">
                    <AvatarImage
                      src={member.profiles.avatar_url || undefined}
                      alt={member.profiles.full_name}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(member.profiles.full_name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {group.member_count || 0}
                {group.max_members && ` / ${group.max_members}`}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>Active</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
