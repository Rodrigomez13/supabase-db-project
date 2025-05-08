import { Skeleton } from "@/components/ui/skeleton"

export default function AssignmentsLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Skeleton className="h-8 w-64 mb-6" />
      <Skeleton className="h-[200px] w-full mb-6 rounded-lg" />
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  )
}
