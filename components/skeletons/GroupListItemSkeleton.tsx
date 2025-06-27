import { Skeleton } from "@/components/ui/skeleton";

export default function GroupListItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
