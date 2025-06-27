"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z
  .object({
    name: z
      .string()
      .min(4, { message: "Group name must be at least 4 characters" })
      .max(64, { message: "Group name must be less than 64 characters" }),
    description: z.string(),
    type: z.enum(["public", "private"]),
    min_members: z.number().min(2),
    max_members: z.number().max(6),
  })
  .refine((data) => data.min_members <= data.max_members, {
    message: "Minimum members cannot be greater than maximum members",
    path: ["min_members"],
  });

type FormData = z.infer<typeof formSchema>;

interface GroupFormProps {
  mode: "create" | "update";
  defaultValues?: Partial<FormData>;
  onSubmit: (values: FormData) => Promise<void>;
  submitLabel?: string;
  loadingLabel?: string;
}

export default function GroupForm({
  mode,
  defaultValues = {},
  onSubmit,
  submitLabel,
  loadingLabel,
}: GroupFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "public",
      min_members: 2,
      max_members: 6,
      ...defaultValues,
    },
  });

  const handleSubmit = async (values: FormData) => {
    try {
      await onSubmit(values);
    } catch (error) {
      console.error(
        `Error ${mode === "create" ? "creating" : "updating"} group:`,
        error
      );
    }
  };

  const defaultSubmitLabel =
    mode === "create" ? "Create Group" : "Update Settings";
  const defaultLoadingLabel = mode === "create" ? "Creating..." : "Updating...";

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Tooltip>
                    <TooltipTrigger>Group Name</TooltipTrigger>
                    <TooltipContent>
                      This is your group display name.
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      mode === "create" ? "Close Friends" : "Enter group name"
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Tooltip>
                    <TooltipTrigger>Description</TooltipTrigger>
                    <TooltipContent>
                      A brief description of your group&apos;s purpose.
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={
                      mode === "create"
                        ? "Describe what this group is about..."
                        : "Describe your group..."
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Tooltip>
                    <TooltipTrigger>Group Type</TooltipTrigger>
                    <TooltipContent>
                      A public group is visible to everyone, while a private
                      group is only visible to your friends and you.
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
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
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="min_members"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Tooltip>
                      <TooltipTrigger>Minimum Members</TooltipTrigger>
                      <TooltipContent>
                        The minimum number of members required.
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={2}
                      max={form.watch("max_members")}
                      placeholder="2"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_members"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Tooltip>
                      <TooltipTrigger>Maximum Members</TooltipTrigger>
                      <TooltipContent>
                        The maximum number of members allowed.
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={form.watch("min_members")}
                      max={6}
                      placeholder="6"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? loadingLabel || defaultLoadingLabel
              : submitLabel || defaultSubmitLabel}
          </Button>
        </form>
      </Form>
    </TooltipProvider>
  );
}
