"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { SidebarMenuButton } from "@/components/ui/sidebar";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <SidebarMenuButton
      className="flex justify-center group-data-[collapsible=icon]:justify-center"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      tooltip="Dark Mode Toggle"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Dark Mode Toggle</span>
    </SidebarMenuButton>
  );
}
