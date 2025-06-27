"use client";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle } from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string;
  type: "public" | "private";
  member_count?: number;
  max_members?: number;
  creator_username?: string;
}

interface GroupCardProps {
  group: Group;
}

export default function GroupCard({ group }: GroupCardProps) {
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
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-sm line-clamp-2 mb-4">
            {group.description || "No description available"}
          </CardDescription>

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
