import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface MenuSkeletonProps {
  viewMode: "table" | "list"
  count?: number
}

export function MenuSkeleton({ viewMode, count = 8 }: MenuSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-6",
        viewMode === "table" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2",
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-lg shadow-sm border p-4 flex flex-col gap-4">
          <div className="relative">
            <Skeleton className={cn("rounded-lg", viewMode === "list" ? "w-40 h-32" : "w-full h-48")} />
            <div className="absolute top-2 right-2">
              <Skeleton className="w-16 h-6 rounded-full" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
