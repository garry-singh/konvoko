"use client";

import * as React from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  CreditCard,
  User,
  Bell,
  UserPlus,
  Brain,
  User as UserIcon,
  MessageCircle,
  Search,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ModeToggle } from "../ModeToggle";

const navItems = [
  {
    title: "Explore",
    url: "/explore",
    icon: Search,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageCircle,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
  },
  {
    title: "Friends",
    url: "/friends",
    icon: User,
  },
  {
    title: "Mind Palace",
    url: "/mind-palace",
    icon: Brain,
  },
  {
    title: "Pricing",
    url: "/subscription",
    icon: CreditCard,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex items-center justify-center group-data-[collapsible=icon]:justify-center">
        <Link href="/" className="flex items-center justify-center">
          <span className="font-bold text-lg group-data-[collapsible=icon]:mx-auto">
            {isMobile ? "Konvoko" : isCollapsed ? "K" : "Konvoko"}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex items-center group-data-[collapsible=icon]:items-center">
        <Authenticated>
          {navItems.map((item) => (
            <Link
              href={item.url}
              key={item.title}
              className="w-full flex justify-center group-data-[collapsible=icon]:justify-center"
            >
              <SidebarMenuButton
                className="group-data-[collapsible=icon]:mx-auto"
                tooltip={item.title}
              >
                <item.icon />
                {item.title}
              </SidebarMenuButton>
            </Link>
          ))}
        </Authenticated>
        <Unauthenticated>
          <Link
            href="/sign-in"
            className="w-full flex justify-center group-data-[collapsible=icon]:justify-center"
          >
            <SidebarMenuButton
              className="group-data-[collapsible=icon]:mx-auto"
              tooltip="Sign In"
            >
              <UserIcon />
              Sign In
            </SidebarMenuButton>
          </Link>
          <Link
            href="/sign-up"
            className="w-full flex justify-center group-data-[collapsible=icon]:justify-center"
          >
            <SidebarMenuButton
              className="group-data-[collapsible=icon]:mx-auto"
              tooltip="Sign Up"
            >
              <UserPlus />
              Sign Up
            </SidebarMenuButton>
          </Link>
        </Unauthenticated>
      </SidebarContent>
      <SidebarFooter className="flex items-center justify-center group-data-[collapsible=icon]:justify-center">
        <ModeToggle />
        <Authenticated>
          <UserButton />
        </Authenticated>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
