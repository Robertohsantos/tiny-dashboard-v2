import { Skeleton } from '@/components/ui/skeleton'

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative">
            <Skeleton className="h-[140px] rounded-lg bg-gray-100">
              <div className="p-4 space-y-3">
                <Skeleton className="h-3 w-24 bg-gray-200" />
                <Skeleton className="h-8 w-32 bg-gray-200" />
                <div className="absolute top-4 right-4">
                  <Skeleton className="h-6 w-16 rounded-md bg-gray-200" />
                </div>
                <div className="pt-2 space-y-1">
                  <Skeleton className="h-3 w-28 bg-gray-200" />
                  <Skeleton className="h-2 w-20 bg-gray-200" />
                </div>
              </div>
            </Skeleton>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <Skeleton className="h-[400px] rounded-lg bg-gray-100">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 bg-gray-200" />
              <Skeleton className="h-4 w-48 bg-gray-200" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md bg-gray-200" />
          </div>
          <Skeleton className="h-[280px] w-full bg-gray-200 rounded" />
        </div>
      </Skeleton>

      {/* Financial Metrics Skeleton */}
      <Skeleton className="h-[120px] rounded-lg bg-gray-100">
        <div className="flex divide-x h-full">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 p-4 space-y-2">
              <Skeleton className="h-3 w-20 bg-gray-200" />
              <Skeleton className="h-6 w-24 bg-gray-200" />
              <Skeleton className="h-2 w-16 bg-gray-200" />
            </div>
          ))}
        </div>
      </Skeleton>

      {/* Shipping Difference Skeleton */}
      <Skeleton className="h-[60px] rounded-lg bg-gray-100">
        <div className="flex items-center gap-3 p-3">
          <Skeleton className="h-4 w-32 bg-gray-200" />
          <Skeleton className="h-5 w-24 bg-gray-200" />
          <Skeleton className="h-4 w-4 rounded bg-gray-200" />
          <Skeleton className="h-3 w-40 bg-gray-200" />
        </div>
      </Skeleton>
    </div>
  )
}
