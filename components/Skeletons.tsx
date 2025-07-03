export const CategorySkeleton = () => (
  <div className="animate-pulse">
    <div className="p-4 rounded-xl bg-gray-200">
      <div className="rounded-full w-10 h-10 bg-gray-300 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
    </div>
  </div>
)

export const TableSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 rounded-md m-2 p-4 flex flex-wrap gap-2">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="w-20 h-20 rounded-xl bg-gray-300 mb-3 flex items-center justify-center flex-col">
          <div className="h-2 bg-gray-400 rounded w-1/2 mb-2 mt-1"></div>
          <div className="h-2 bg-gray-400 rounded w-1/2 mb-2 mt-1"></div>
        </div>
      ))}
    </div>
  </div>
)

export const OrderSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 rounded-xl p-4">
      <div className="w-12 h-12 rounded-xl bg-gray-300 mb-3"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/4"></div>
    </div>
  </div>
)

export const CustomerSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 rounded-lg p-4">
      <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  </div>
)
