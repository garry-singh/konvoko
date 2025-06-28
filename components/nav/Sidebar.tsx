"use client";

import * as React from "react";
import Link from "next/link";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { CreditCard, User, Bell } from "lucide-react";

const navItems = [
  {
    title: "Friends",
    url: "/friends",
    icon: User,
  },
  {
    title: "Pricing",
    url: "/subscription",
    icon: CreditCard,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex items-center justify-center group-data-[collapsible=icon]:justify-center">
        <Link href="/" className="flex items-center justify-center">
          <span className="font-bold text-lg group-data-[collapsible=icon]:mx-auto">
            {isCollapsed ? "K" : "Konvoko"}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex items-center group-data-[collapsible=icon]:items-center">
        <SignedIn>
          {/* Notifications */}
          <Link
            href="/notifications"
            className="w-full flex justify-center group-data-[collapsible=icon]:justify-center"
          >
            <SidebarMenuButton className="group-data-[collapsible=icon]:mx-auto">
              <Bell />
              Notifications
            </SidebarMenuButton>
          </Link>
          {/* Main nav items */}
          {navItems.map((item) => (
            <Link
              href={item.url}
              key={item.title}
              className="w-full flex justify-center group-data-[collapsible=icon]:justify-center"
            >
              <SidebarMenuButton className="group-data-[collapsible=icon]:mx-auto">
                <item.icon />
                {item.title}
              </SidebarMenuButton>
            </Link>
          ))}
        </SignedIn>
        <SignedOut>
          <Link
            href="/sign-in"
            className="w-full flex justify-center group-data-[collapsible=icon]:justify-center"
          >
            <SidebarMenuButton className="group-data-[collapsible=icon]:mx-auto">
              <User />
              Sign In
            </SidebarMenuButton>
          </Link>
          <Link
            href="/sign-up"
            className="w-full flex justify-center group-data-[collapsible=icon]:justify-center"
          >
            <SidebarMenuButton className="group-data-[collapsible=icon]:mx-auto">
              <User />
              Sign Up
            </SidebarMenuButton>
          </Link>
        </SignedOut>
      </SidebarContent>
      <SidebarFooter className="flex items-center justify-center group-data-[collapsible=icon]:justify-center">
        <SignedIn>
          <UserButton />
        </SignedIn>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
