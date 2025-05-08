import { Skeleton } from "@/components/ui/skeleton"

export default function ConversionsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Skeleton className="h-[400px] w-full md:w-1/4" />
        <div className="w-full md:w-3/4 space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    </div>
  )
}
