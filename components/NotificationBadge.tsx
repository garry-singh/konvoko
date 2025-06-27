"use client";

import { useNotifications } from "./NotificationProvider";

export default function NotificationBadge() {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) {
    return null; // Don't show badge if no unread notifications
  }

  return (
    <div className="relative">
      <span className="absolute -top-2 -left-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    </div>
  );
}
