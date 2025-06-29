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
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Define breadcrumb mappings for different routes
const breadcrumbMap: Record<string, string> = {
  "/": "Home",
  "/friends": "Friends",
  "/notifications": "Notifications",
  "/subscription": "Subscription",
  "/profile": "Profile",
  "/sign-in": "Sign In",
  "/sign-up": "Sign Up",
  "/mind-palace": "Mind Palace",
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
    breadcrumbs.push({
      label: "Profile",
      href: pathname,
      isCurrent: true,
    });
  } else {
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
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);

  // Always call useQuery, but only use result if on /post/[id]
  const postId =
    segments[0] === "post" && segments[1] ? segments[1] : undefined;
  // @ts-expect-error: postId may be string, Convex will handle it or skip
  const post = useQuery(api.posts.getPostById, postId ? { postId } : "skip");
  const currentUser = useQuery(api.users.currentUser);

  let breadcrumbs;
  if (segments[0] === "post" && segments[1]) {
    let isOwnPost = false;
    if (
      post &&
      post.authorUsername &&
      currentUser &&
      post.authorUsername === currentUser.username
    ) {
      isOwnPost = true;
    }
    breadcrumbs = [
      { label: "Home", href: "/" },
      ...(!isOwnPost && post && post.authorUsername
        ? [
            {
              label: `@${post.authorUsername}`,
              href: `/profile/${post.authorUsername}`,
            },
          ]
        : []),
      { label: "Post", isCurrent: true },
    ];
  } else {
    breadcrumbs = generateBreadcrumbs(pathname);
  }

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
                <React.Fragment
                  key={`${breadcrumb.href || ""}-${breadcrumb.label}-${index}`}
                >
                  <BreadcrumbItem className="hidden md:block">
                    {breadcrumb.isCurrent ? (
                      <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                    ) : breadcrumb.href ? (
                      <BreadcrumbLink asChild>
                        <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
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
