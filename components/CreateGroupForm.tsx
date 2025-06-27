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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  groupName: z
    .string()
    .min(4, { message: "Username must be at least 4 characters" })
    .max(64, { message: "Username must be less than 64 characters" }),
  groupDescription: z.string(),
  groupType: z.enum(["public", "private"]),
  groupMinMembers: z.number().min(2),
  groupMaxMembers: z.number().max(6),
});

export default function CreateGroupForm() {
  const router = useRouter();
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupName: "",
      groupDescription: "",
      groupType: "public",
      groupMinMembers: 2,
      groupMaxMembers: 6,
    },
  });

  // 2. Define a submit handler.
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const result = await createGroup(
        values.groupName,
        values.groupDescription,
        values.groupType,
        values.groupMinMembers,
        values.groupMaxMembers
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

        <FormField
          control={form.control}
          name="groupType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Type</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                A public group is visible to everyone, while a private group is
                only visible to your friends and you.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="groupMinMembers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Members</FormLabel>
              <FormControl>
                <Input placeholder="2" type="number" {...field} min={2} />
              </FormControl>
              <FormDescription>
                The minimum number of members in your group.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="groupMaxMembers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Members</FormLabel>
              <FormControl>
                <Input placeholder="4" type="number" {...field} max={6} />
              </FormControl>
              <FormDescription>
                The maximum number of members in your group.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Creating..." : "Create Group"}
        </Button>
      </form>
    </Form>
  );
}
