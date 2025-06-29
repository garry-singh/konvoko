"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export interface CreatePostTextAreaProps {
  parentId?: Id<"posts">;
}

const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(500, "Post must be less than 500 characters"),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

export function CreatePostTextArea({ parentId }: CreatePostTextAreaProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const createPost = useMutation(api.posts.createPost);

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (data: CreatePostForm) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      await createPost({
        content: data.content.trim(),
        authorName: user.fullName || user.firstName || "Anonymous",
        authorUsername:
          user.username || user.emailAddresses[0]?.emailAddress || "user",
        authorImageUrl: user.imageUrl,
        ...(parentId ? { parentId } : {}),
      });

      // Reset the form
      form.reset();
      toast.success("Post created!");
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  const isDisabled = isSubmitting || !user;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="relative mb-6">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder={
                    parentId ? "Post your reply" : "What's on your mind?"
                  }
                  rows={3}
                  className="pr-24 resize-none"
                  style={{ minHeight: 48 }}
                  disabled={isDisabled}
                  onKeyDown={handleKeyDown}
                  {...field}
                />
              </FormControl>
              <FormMessage className="absolute -bottom-6 left-0" />
            </FormItem>
          )}
        />

        <Separator
          orientation="vertical"
          className="absolute bottom-3 right-20 !h-6"
        />

        {/* Button */}
        <div className="absolute bottom-2 right-2">
          <Button
            type="submit"
            size="sm"
            disabled={isDisabled || !form.formState.isValid}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : parentId ? (
              "Reply"
            ) : (
              "Post"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
