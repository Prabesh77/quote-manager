import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
    />
  );
}

// Predefined skeleton components
export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className="p-2 bg-gray-200 rounded-lg w-10 h-10 animate-pulse" />
        <div className="ml-4 flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function DeliveryRowSkeleton() {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-3 w-3 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="h-3 w-3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
                <div className="flex items-center space-x-1">
                  <div className="h-3 w-3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                </div>
                <div className="flex items-center space-x-1">
                  <div className="h-3 w-3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchBarSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-200 rounded-lg w-10 h-10 animate-pulse" />
            <div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-1 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-9 bg-gray-200 rounded w-32 animate-pulse" />
            <div className="h-9 bg-gray-200 rounded w-20 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
} 