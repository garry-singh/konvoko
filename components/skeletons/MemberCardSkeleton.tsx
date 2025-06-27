import { Skeleton } from "@/components/ui/skeleton";

export default function MemberCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="w-16 h-8 rounded" />
        <Skeleton className="w-16 h-8 rounded" />
        <Skeleton className="w-16 h-8 rounded" />
      </div>
    </div>
  );
}
