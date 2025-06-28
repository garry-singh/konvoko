"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";

// Define breadcrumb mappings for different routes
const breadcrumbMap: Record<string, string> = {
  "/": "Home",
  "/friends": "Friends",
  "/notifications": "Notifications",
  "/subscription": "Subscription",
  "/create-group": "Create Group",
  "/join-group": "Join Group",
  "/profile": "Profile",
  "/groups": "Groups",
  "/settings": "Settings",
};

// Helper function to generate breadcrumb items from pathname
function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [
    { label: "Home", href: "/", isCurrent: segments.length === 0 },
  ];

  if (segments.length === 0) {
    return breadcrumbs;
  }

  // Handle specific route patterns
  if (segments[0] === "profile" && segments.length === 2) {
    // /profile/[id] -> Home > Profile
    breadcrumbs.push({
      label: "Profile",
      href: pathname,
      isCurrent: true,
    });
  } else if (segments[0] === "groups" && segments.length === 2) {
    // /groups/[id] -> Home > Group
    breadcrumbs.push({
      label: "Group",
      href: pathname,
      isCurrent: true,
    });
  } else if (
    segments[0] === "groups" &&
    segments.length === 3 &&
    segments[2] === "settings"
  ) {
    // /groups/[id]/settings -> Home > Group > Settings
    const groupPath = `/${segments[0]}/${segments[1]}`;
    breadcrumbs.push(
      {
        label: "Group",
        href: groupPath,
        isCurrent: false,
      },
      {
        label: "Settings",
        href: pathname,
        isCurrent: true,
      }
    );
  } else {
    // Handle other routes using the breadcrumb map
    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;
      const label = breadcrumbMap[currentPath] || segment;

      breadcrumbs.push({
        label,
        href: currentPath,
        isCurrent: isLast,
      });
    });
  }

  return breadcrumbs;
}

export default function BreadcrumbHeader() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname || "");

  // Don't show breadcrumbs on the home page
  if (pathname === "/") {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.href}>
                  <BreadcrumbItem className="hidden md:block">
                    {breadcrumb.isCurrent ? (
                      <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && (
                    <BreadcrumbSeparator className="hidden md:block" />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
    </SidebarInset>
  );
}
