import { Skeleton } from "@/components/ui/skeleton";

export default function GroupCardSkeleton() {
  return (
    <div className="min-w-[250px] bg-white rounded shadow p-4 flex flex-col">
      <Skeleton className="h-6 w-32 mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-10 w-full mt-auto" />
    </div>
  );
}
