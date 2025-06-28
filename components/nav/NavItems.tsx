"use client";

import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBadge from "../NotificationBadge";
import { useNotifications } from "../providers/NotificationProvider";

const navItems = [
  { label: "Friends", href: "/friends" },
  { label: "Pricing", href: "/subscription" },
];

export default function NavItems() {
  const pathname = usePathname();
  const { user } = useUser();
  const { unreadCount } = useNotifications();
  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex items-center gap-6">
      {user && (
        <Link
          href={`/profile/${user.id}`}
          className={cn(
            isActive(`/profile/${user.id}`) && "text-primary font-semibold"
          )}
        >
          Profile
        </Link>
      )}
      {navItems.map((item) => (
        <Link
          href={item.href}
          key={item.label}
          className={cn(
            "relative",
            isActive(item.href) && "text-primary font-semibold"
          )}
        >
          {item.label}
        </Link>
      ))}

      {/* Notifications link with badge */}
      <Link
        href="/notifications"
        className={cn(
          "relative",
          isActive("/notifications") && "text-primary font-semibold"
        )}
      >
        <NotificationBadge count={unreadCount}>Notifications</NotificationBadge>
      </Link>
    </div>
  );
}
