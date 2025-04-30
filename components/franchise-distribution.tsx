import { Skeleton } from "@/components/ui/skeleton";

interface FranchiseProps {
  id: string;
  name: string;
  percentage: number;
}

interface FranchiseDistributionProps {
  franchises: FranchiseProps[];
  loading?: boolean;
}

export function FranchiseDistribution({
  franchises,
  loading = false,
}: FranchiseDistributionProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!franchises || franchises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No hay datos disponibles.</p>
    );
  }

  return (
    <div className="space-y-4">
      {franchises.map((franchise) => (
        <div key={franchise.id} className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">{franchise.name}</span>
            <span className="text-sm text-muted-foreground">
              {franchise.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${franchise.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
