"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Friends", href: "/friends" },
  { label: "Profile", href: "/profile" },
  { label: "Notifications", href: "/notifications" },
  { label: "Pricing", href: "/subscription" },
];

export default function NavItems() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex items-center gap-6">
      {navItems.map((item) => (
        <Link
          href={item.href}
          key={item.label}
          className={cn(isActive(item.href) && "text-primary font-semibold")}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
