"use client";

import React from "react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";

export interface NotificationBadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  count: number;
  children?: React.ReactNode;
}

export default function NotificationBadge({
  count,
  className,
  children,
  ...props
}: NotificationBadgeProps) {
  if (count === 0) {
    return null; // Don't show badge if no unread notifications
  }

  return (
    <div className="inline-flex relative">
      {children}
      <Badge
        className={cn(
          "absolute top-0 right-0 rounded-full translate-x-1.5 -translate-y-1.5 px-2",
          className
        )}
        {...props}
      >
        {count > 99 ? "99+" : count}
      </Badge>
    </div>
  );
}
