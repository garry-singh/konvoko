"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateGroupSettings } from "@/lib/actions/groups.actions";

interface Group {
  id: string;
  name: string;
  description: string;
  type: "public" | "private";
  min_members: number;
  max_members: number;
}

export default function GroupSettingsForm({ group }: { group: Group }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description,
    type: group.type,
    min_members: group.min_members,
    max_members: group.max_members,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateGroupSettings(group.id, formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Refresh the page to show updated data
        router.refresh();
      }
    } catch (err) {
      setError("Failed to update group settings. Please try again.");
      console.error("Error updating group settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Group settings updated successfully!
        </div>
      )}

      <div>
        <Label htmlFor="name">Group Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="Enter group name"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Describe your group..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="type">Group Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => handleInputChange("type", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min_members">Minimum Members</Label>
          <Input
            id="min_members"
            type="number"
            min={2}
            max={formData.max_members}
            value={formData.min_members}
            onChange={(e) =>
              handleInputChange("min_members", parseInt(e.target.value))
            }
          />
        </div>

        <div>
          <Label htmlFor="max_members">Maximum Members</Label>
          <Input
            id="max_members"
            type="number"
            min={formData.min_members}
            max={6}
            value={formData.max_members}
            onChange={(e) =>
              handleInputChange("max_members", parseInt(e.target.value))
            }
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Updating..." : "Update Settings"}
      </Button>
    </form>
  );
}
