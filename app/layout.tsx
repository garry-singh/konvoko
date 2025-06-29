import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/nav/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import BreadcrumbHeader from "@/components/nav/BreadcrumbHeader";
import { ThemeProvider } from "@/providers/ThemeProvider";
import ConvexClientProvider from "@/providers/ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Konvoko",
  description:
    "Konvoko is a social memory app to capture, organize, and search your thoughts, combining Twitter style posting with a personal mind palace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ConvexClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <SidebarProvider>
                <div className="flex min-h-screen w-full">
                  <AppSidebar />
                  <main className="flex-1 flex flex-col min-h-0">
                    <div className="sticky top-0 z-30 bg-background">
                      <BreadcrumbHeader />
                    </div>
                    <div className="flex-1 min-h-0">{children}</div>
                  </main>
                </div>
                <Toaster />
              </SidebarProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
