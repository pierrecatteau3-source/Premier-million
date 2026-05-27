import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyseLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Score global skeleton */}
      <Skeleton className="h-36 w-full rounded-2xl" />
      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      {/* Chart skeleton */}
      <Skeleton className="h-56 w-full rounded-xl" />
      {/* Detail rows skeleton */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
