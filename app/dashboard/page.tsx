"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Chart } from "@/components/chart";
import { ActivityFeed } from "@/components/activity-feed";
import { FranchiseDistribution } from "@/components/franchise-distribution";
import { FranchiseBalance } from "@/components/franchise-balance";
import {
  getDashboardStats,
  getDailyProgressData,
  getExpenseDistributionData,
  getCashFlowData,
  getFranchiseDistribution,
  getFranchiseBalances,
  getRecentActivities,
} from "@/lib/supabase-queries";

interface DashboardStats {
  totalLeads: number;
  totalConversions: number;
  conversionRate: number;
  totalSpend: number;
  totalBudget: number;
  costPerConversion: number;
  leadChange: number;
  conversionChange: number;
  spendChange: number;
  costChange: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalConversions: 0,
    conversionRate: 0,
    totalSpend: 0,
    totalBudget: 0,
    costPerConversion: 0,
    leadChange: 0,
    conversionChange: 0,
    spendChange: 0,
    costChange: 0,
  });
  const [dailyData, setDailyData] = useState<any>(null);
  const [expenseData, setExpenseData] = useState<any>(null);
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [franchiseDistribution, setFranchiseDistribution] = useState<
    Array<{ id: string; name: string; percentage: number }>
  >([]);
  const [franchiseBalances, setFranchiseBalances] = useState<
    Array<{ id: string; name: string; balance: number }>
  >([]);
  const [activities, setActivities] = useState<
    Array<{
      id: string;
      user: string;
      action: string;
      target: string;
      server?: string;
      time: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar useEffect con un array de dependencias vacío para cargar los datos solo una vez
  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // Cargar todas las métricas en paralelo
        const [
          statsData,
          dailyProgressData,
          expenseDistData,
          cashFlowDataResult,
          franchiseDistData,
          franchiseBalData,
          activitiesData,
        ] = await Promise.all([
          getDashboardStats(),
          getDailyProgressData(),
          getExpenseDistributionData(),
          getCashFlowData(),
          getFranchiseDistribution(),
          getFranchiseBalances(),
          getRecentActivities(5),
        ]);

        setStats(
          statsData ?? {
            totalLeads: 0,
            totalConversions: 0,
            conversionRate: 0,
            totalSpend: 0,
            totalBudget: 0,
            costPerConversion: 0,
            leadChange: 0,
            conversionChange: 0,
            spendChange: 0,
            costChange: 0,
          }
        );
        setDailyData(dailyProgressData);
        setExpenseData(expenseDistData);
        setCashFlowData(cashFlowDataResult);
        setFranchiseDistribution(franchiseDistData ?? []);
        setFranchiseBalances(franchiseBalData ?? []);
        setActivities(activitiesData ?? []);
        setError(null);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError(
          "Error al cargar los datos del dashboard. Por favor, intenta de nuevo más tarde."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
    // No incluir dependencias para que solo se ejecute una vez al montar el componente
  }, []);

  return (
    <div className="flex flex-col gap-5 p-4 md:p-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Leads Totales"
          value={stats?.totalLeads ?? 0}
          trend={(stats?.leadChange ?? 0) > 0 ? "up" : "down"}
        />
        <StatCard
          title="Conversiones"
          value={stats?.totalConversions ?? 0}
          trend={(stats?.conversionChange ?? 0) > 0 ? "up" : "down"}
        />
        <StatCard
          title="Gasto Total"
          value={`$${(stats?.totalSpend ?? 0).toFixed(2)}`}
          trend={(stats?.spendChange ?? 0) > 0 ? "up" : "down"}
        />
        <StatCard
          title="Costo por Conversión"
          value={`$${(stats?.costPerConversion ?? 0).toFixed(2)}`}
          trend={(stats?.costChange ?? 0) > 0 ? "down" : "up"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-5 border-usina-card bg-background/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-usina-text-primary">
              Progreso Diario
            </CardTitle>
            <CardDescription className="text-usina-text-secondary">
              Leads y conversiones de los últimos 7 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              type="line"
              data={
                dailyData ?? {
                  labels: [],
                  datasets: [],
                }
              }
              loading={loading}
              height={250}
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-1 lg:col-span-2 border-usina-card bg-background/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-usina-text-primary">
              Distribución de Franquicias
            </CardTitle>
            <CardDescription className="text-usina-text-secondary">
              Porcentaje de conversiones por franquicia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FranchiseDistribution
              franchises={franchiseDistribution}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Usamos grid-rows para asegurar que todas las tarjetas tengan la misma altura */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 grid-rows-1">
        <Card className="md:col-span-1 lg:col-span-2 border-usina-card bg-background/5 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-usina-text-primary">
              Actividad Reciente
            </CardTitle>
            <CardDescription className="text-usina-text-secondary">
              Últimas acciones en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <ActivityFeed activities={activities} loading={loading} />
          </CardContent>
        </Card>

        <Card className="md:col-span-1 lg:col-span-3 border-usina-card bg-background/5 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-usina-text-primary">
              Flujo de Caja
            </CardTitle>
            <CardDescription className="text-usina-text-secondary">
              Ingresos y gastos de los últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <Chart
              type="line"
              data={
                cashFlowData ?? {
                  labels: [],
                  datasets: [],
                }
              }
              loading={loading}
              height={200}
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-2 border-usina-card bg-background/5 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-usina-text-primary">
              Balance de Franquicias
            </CardTitle>
            <CardDescription className="text-usina-text-secondary">
              Balance actual por franquicia
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <FranchiseBalance
              franchises={franchiseBalances}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-usina-card bg-background/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-usina-text-primary">
              Distribución de Gastos
            </CardTitle>
            <CardDescription className="text-usina-text-secondary">
              Porcentaje de gastos por categoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              type="doughnut"
              data={
                expenseData ?? {
                  labels: [],
                  datasets: [],
                }
              }
              loading={loading}
              height={200}
            />
          </CardContent>
        </Card>

        <Card className="border-usina-card bg-background/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-usina-text-primary">
              Rendimiento de Campañas
            </CardTitle>
            <CardDescription className="text-usina-text-secondary">
              Efectividad de las campañas activas
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center">
            <p className="text-usina-text-secondary">Próximamente</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
