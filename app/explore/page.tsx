"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Doc } from "@/convex/_generated/dataModel";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const currentUser = useQuery(api.users.currentUser);
  const users = useQuery(
    api.users.searchUsers,
    searchTerm.length >= 3 ? { search: searchTerm } : "skip"
  );

  const form = useForm({
    defaultValues: { search: "" },
  });

  const handleSearch = (data: { search: string }) => {
    if (data.search.trim().length < 3) {
      toast.error("Please enter at least 3 characters to search.");
      return;
    }
    setSearchTerm(data.search.trim());
  };

  const isSearchTooShort = searchTerm !== "" && searchTerm.length < 3;
  const filteredUsers = (users?.page as Doc<"users">[] | undefined)?.filter(
    (u) => u._id !== currentUser?._id
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Find Friends</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSearch)}
          className="flex gap-2 mb-6"
        >
          <FormField
            control={form.control}
            name="search"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Search users..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Search</Button>
        </form>
      </Form>
      <div className="flex flex-col gap-4">
        {searchTerm === "" ? (
          <div className="text-muted-foreground">
            Enter a search to find users.
          </div>
        ) : isSearchTooShort ? (
          <div className="text-muted-foreground">
            Please enter at least 3 characters to search.
          </div>
        ) : users === undefined ? (
          <div className="text-muted-foreground">Loading users...</div>
        ) : filteredUsers && filteredUsers.length === 0 ? (
          <div className="text-muted-foreground">No users found.</div>
        ) : (
          filteredUsers?.map((user) => (
            <Link
              key={user._id}
              href={`/profile/${user.username}`}
              className="flex items-center gap-4 p-3 rounded-lg border bg-card shadow-sm hover:bg-muted transition"
            >
              <Image
                src={user.imageUrl || "/default-avatar.png"}
                alt={user.fullName}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate block">
                  {user.fullName}
                </div>
                <div className="text-muted-foreground text-sm truncate">
                  @{user.username}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
