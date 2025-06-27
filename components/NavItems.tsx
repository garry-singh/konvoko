"use client";

import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBadge from "./NotificationBadge";

const navItems = [
  { label: "Friends", href: "/friends" },
  { label: "Notifications", href: "/notifications" },
  { label: "Pricing", href: "/subscription" },
];

export default function NavItems() {
  const pathname = usePathname();
  const { user } = useUser();
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
          {item.label === "Notifications" && <NotificationBadge />}
        </Link>
      ))}
    </div>
  );
}
