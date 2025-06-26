"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createGroup } from "@/lib/actions/groups.actions";
import { redirect, useRouter } from "next/navigation";

const formSchema = z.object({
  groupName: z
    .string()
    .min(4, { message: "Username must be at least 4 characters" })
    .max(64, { message: "Username must be less than 64 characters" }),
  groupDescription: z.string(),
});

export default function CreateGroupForm() {
  const router = useRouter();
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupName: "",
      groupDescription: "",
    },
  });

  // 2. Define a submit handler.
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const result = await createGroup(
        values.groupName,
        values.groupDescription
      );

      console.log(result);

      if (result.error) {
        console.error("Failed to create group:", result.error);
        // You might want to show this error to the user via a toast or alert
        return;
      }

      if (result.data) {
        router.push(`/groups/${result.data.id}`);
      } else {
        console.log("Failed to create group - no data returned.");
        redirect("/");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      // Handle any unexpected errors
    }
  };

  // 3. Build the form.
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="groupName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input placeholder="Close Friends" {...field} />
              </FormControl>
              <FormDescription>
                This is your group display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="groupDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this group is about..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief description of your group&apos;s purpose.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full cursor-pointer">
          Create Group
        </Button>
      </form>
    </Form>
  );
}
