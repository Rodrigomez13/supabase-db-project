"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface FranchiseProps {
  franchise_id: string;
  franchise_name: string;
  leads_count: number;
  conversions_count: number;
  percentage: number;
}

interface FranchiseDistributionProps {
  date?: string;
  serverId?: string;
  loading?: boolean;
}

export function FranchiseDistribution({
  date = new Date().toISOString().split("T")[0],
  serverId,
  loading: initialLoading = false,
}: FranchiseDistributionProps) {
  const [franchises, setFranchises] = useState<FranchiseProps[]>([]);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDistributions() {
      try {
        setLoading(true);
        setError(null);

        // Construir URL con parámetros
        let url = `/api/franchise-distributions?date=${date}`;
        if (serverId) {
          url += `&server_id=${serverId}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Error al obtener distribuciones");
        }

        if (result.success && result.data) {
          setFranchises(result.data);
        } else {
          setFranchises([]);
        }
      } catch (err: any) {
        console.error("Error fetching franchise distribution:", err);
        setError(err.message || "Error desconocido");
        setFranchises([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDistributions();
  }, [date, serverId]);

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

  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>;
  }

  if (!franchises || franchises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay datos disponibles para esta fecha.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {franchises.map((franchise) => (
        <div key={franchise.franchise_id} className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">
              {franchise.franchise_name}
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {franchise.leads_count} leads
              </span>
              <span className="text-sm text-muted-foreground">
                {franchise.percentage.toFixed(1)}%
              </span>
            </div>
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
