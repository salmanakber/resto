import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface TableSkeletonProps {
  columns: number
  rows?: number
  searchable?: boolean
  filterable?: boolean
  title?: string
}

export function TableSkeleton({ 
  columns, 
  rows = 5, 
  searchable = true, 
  filterable = true,
  title 
}: TableSkeletonProps) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        {title && <Skeleton className="h-6 w-[200px]" />}
        <div className="flex items-center justify-between">
          {searchable && <Skeleton className="h-10 w-[300px]" />}
          <div className="flex items-center gap-2">
            {filterable && <Skeleton className="h-10 w-[150px]" />}
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Table Header */}
          <div className="flex items-center gap-4 border-b pb-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-[100px]" />
            ))}
          </div>
          {/* Table Rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-12 w-[100px]" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 