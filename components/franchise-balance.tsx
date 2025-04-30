import { Skeleton } from "@/components/ui/skeleton";

interface FranchiseProps {
  id: string;
  name: string;
  balance: number;
}

interface FranchiseBalanceProps {
  franchises: FranchiseProps[];
  loading?: boolean;
}

export function FranchiseBalance({
  franchises,
  loading = false,
}: FranchiseBalanceProps) {
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
        <div key={franchise.id} className="flex items-center justify-between">
          <span className="text-sm font-medium">{franchise.name}</span>
          <span
            className={`text-sm font-medium ${
              franchise.balance >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ${Math.abs(franchise.balance).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}
