import { Skeleton } from "@/components/ui/skeleton"

export function CategorySkeleton() {
  return (
    <nav className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse px-3 py-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-4 w-32" />
          {i % 2 === 0 && (
            <div className="ml-auto">
              <Skeleton className="w-4 h-4" />
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}
