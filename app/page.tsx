"use client";

import { Button } from "@/components/ui/button";
import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Unauthenticated>
        <section className="text-center py-20 px-4">
          <h1 className="text-4xl font-bold">Welcome to Konvoko</h1>
          <p className="mt-4 text-lg">
            Konvoko is a social memory app to capture, organize, and search your
            thoughts, combining Twitter style posting with a personal mind
            palace.
          </p>
          <div className="mt-8">
            <Link href="/sign-in">
              <Button>Get Started</Button>
            </Link>
          </div>
        </section>
      </Unauthenticated>

      <Authenticated>
        <main className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Your Feed</h1>
            <div className="flex gap-4 justify-center">
              <p>Welcome to your feed!</p>
            </div>
          </div>
        </main>
      </Authenticated>
    </>
  );
}
