"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { getAllActiveServersDailyMetrics } from "@/lib/queries/server-queries";
import { ActivityFeed } from "@/components/activity-feed";
import { StatCard } from "@/components/stat-card";
import { CombinedChart } from "@/components/combined-chart";
import Link from "next/link";
import { getHourlyMetrics } from "@/lib/queries/hourly-metrics";
import { getFranchiseDistribution } from "@/lib/queries/franchise-distribution";
import {
  getFranchiseById,
  getFranchiseBalances,
  getFranchises,
} from "@/lib/queries/franchise-queries";
import { DashboardStats } from "@/components/dashboard-stats";
import { RecentLeads } from "@/components/recent-leads";
import { RecentConversions } from "@/components/recent-conversions";
import { FranchiseSelector } from "@/components/franchise-selector";

interface DashboardMetrics {
  leads: number;
  conversions: number;
  conversion_rate: number;
  spend: number;
  cost_per_lead: number;
  cost_per_conversion: number;
  leadChange?: number;
  conversionChange?: number;
  spendChange?: number;
  costChange?: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateString, setDateString] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [franchiseDistribution, setFranchiseDistribution] = useState<any[]>([]); // Changed to any[] for compatibility
  const [hourlyData, setHourlyData] = useState<any>(null);
  const [loadingHourly, setLoadingHourly] = useState(true);
  const [loadingDistribution, setLoadingDistribution] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setLoadingHourly(true);
        setLoadingDistribution(true);

        // Cargar métricas diarias de todos los servidores activos
        const metricsData = await getAllActiveServersDailyMetrics(dateString);
        setMetrics(metricsData);

        // Cargar datos de distribución de franquicias
        try {
          const distributionData = await getFranchiseDistribution(dateString);
          setFranchiseDistribution(distributionData || []);
        } catch (error) {
          console.error("Error loading franchise distribution:", error);
          setFranchiseDistribution([]);
        } finally {
          setLoadingDistribution(false);
        }

        // Cargar datos de métricas por hora
        try {
          const hourlyMetrics = await getHourlyMetrics(dateString);

          if (hourlyMetrics && hourlyMetrics.length > 0) {
            const chartData = {
              labels: hourlyMetrics.map((item) => item.hour),
              datasets: [
                {
                  type: "bar" as const,
                  label: "Leads",
                  data: hourlyMetrics.map((item) => item.leads),
                  backgroundColor: "rgba(255, 99, 132, 0.5)",
                  yAxisID: "y",
                },
                {
                  type: "bar" as const,
                  label: "Conversiones",
                  data: hourlyMetrics.map((item) => item.conversions),
                  backgroundColor: "rgba(54, 162, 235, 0.5)",
                  yAxisID: "y",
                },
                {
                  type: "line" as const,
                  label: "Costo por Conversión ($)",
                  data: hourlyMetrics.map((item) => item.cost_per_conversion),
                  borderColor: "rgba(255, 159, 64, 1)",
                  backgroundColor: "rgba(255, 159, 64, 0.2)",
                  yAxisID: "y1",
                  tension: 0.4,
                  fill: false,
                  pointRadius: 3,
                  pointHoverRadius: 5,
                },
              ],
            };

            setHourlyData(chartData);
          }
        } catch (error) {
          console.error("Error loading hourly metrics:", error);
          setHourlyData(null);
        } finally {
          setLoadingHourly(false);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [dateString]);

  // Función para manejar el cambio de fecha
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setDateString(date.toISOString().split("T")[0]);
    }
  };

  // Calcular totales para la tabla de distribución
  const totalConversions = franchiseDistribution.reduce(
    (sum, item) => sum + (item.conversions || 0),
    0
  );
  const totalPhones = franchiseDistribution.reduce(
    (sum, item) => sum + (item.active_phones || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(selectedDate, "dd/MM/yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border bg-background/5">
              <CardHeader className="pb-2">
                <div className="h-6 bg-[#133936] animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-[#133936] animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Leads Generados"
            value={metrics?.leads || 0}
            description={format(selectedDate, "dd 'de' MMMM, yyyy", {
              locale: es,
            })}
            trend={
              metrics?.leadChange && metrics.leadChange > 0 ? "up" : "down"
            }
            trendValue={`${Math.abs(metrics?.leadChange || 0)}%`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            title="Conversiones"
            value={metrics?.conversions || 0}
            description={format(selectedDate, "dd 'de' MMMM, yyyy", {
              locale: es,
            })}
            trend={
              metrics?.conversionChange && metrics.conversionChange > 0
                ? "up"
                : "down"
            }
            trendValue={`${Math.abs(metrics?.conversionChange || 0)}%`}
            icon={<ArrowUpRight className="h-4 w-4" />}
          />
          <StatCard
            title="Tasa de Conversión"
            value={`${metrics?.conversion_rate?.toFixed(1) || 0}%`}
            description={format(selectedDate, "dd 'de' MMMM, yyyy", {
              locale: es,
            })}
            trend={
              metrics?.costChange && metrics.costChange > 0 ? "up" : "down"
            }
            trendValue={`${Math.abs(metrics?.costChange || 0)}%`}
            icon={<ArrowDownRight className="h-4 w-4" />}
          />
          <StatCard
            title="Gasto Total"
            value={`$${metrics?.spend?.toFixed(2) || "0.00"}`}
            description={format(selectedDate, "dd 'de' MMMM, yyyy", {
              locale: es,
            })}
            trend={
              metrics?.spendChange && metrics.spendChange > 0 ? "up" : "down"
            }
            trendValue={`${Math.abs(metrics?.spendChange || 0)}%`}
            icon={<ArrowUpRight className="h-4 w-4" />}
          />
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="distribution">Distribución</TabsTrigger>
          <TabsTrigger value="activity">Actividad Reciente</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="border bg-background/5">
            <CardHeader>
              <CardTitle>Progreso Diario</CardTitle>
              <p className="text-sm text-muted-foreground">
                Evolución de leads y cargas durante el día
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {loadingHourly ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Cargando datos...</p>
                  </div>
                ) : hourlyData ? (
                  <CombinedChart data={hourlyData} loading={loadingHourly} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">
                      No hay datos disponibles para esta fecha
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border bg-background/5">
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Gasto Total
                    </h3>
                    <p className="text-2xl font-bold">
                      ${metrics?.spend?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Costo por Lead
                    </h3>
                    <p className="text-2xl font-bold">
                      ${metrics?.cost_per_lead?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Costo por Conversión
                    </h3>
                    <p className="text-2xl font-bold">
                      ${metrics?.cost_per_conversion?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-background/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Distribución por Franquicia</CardTitle>
                <Link href="/dashboard/franchises">
                  <Button variant="outline" size="sm">
                    Ver todas
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loadingDistribution ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center"
                      >
                        <div className="h-4 bg-gray-200 animate-pulse rounded w-24"></div>
                        <div className="h-4 bg-gray-200 animate-pulse rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : franchiseDistribution.length > 0 ? (
                  <div className="space-y-4">
                    {franchiseDistribution.slice(0, 4).map((franchise) => (
                      <div
                        key={
                          franchise.franchise_name ||
                          `franchise-${franchise.franchise_id}`
                        }
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                          <span>
                            {franchise.franchise_name || "Sin nombre"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-4">
                            {franchise.conversions || 0}
                          </span>
                          <span className="text-muted-foreground">
                            {(franchise.percentage || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">
                    No hay datos disponibles para esta fecha
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card className="border bg-background/5">
            <CardHeader>
              <CardTitle>Distribución por Franquicia</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDistribution ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-muted-foreground">Cargando datos...</p>
                </div>
              ) : franchiseDistribution.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Franquicia</th>
                        <th className="text-center py-2 px-4">Conversiones</th>
                        <th className="text-center py-2 px-4">Porcentaje</th>
                        <th className="text-center py-2 px-4">Teléfonos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {franchiseDistribution.map((franchise) => (
                        <tr
                          key={
                            franchise.franchise_name ||
                            `franchise-${franchise.franchise_id}`
                          }
                          className="border-b"
                        >
                          <td className="py-2 px-4">
                            {franchise.franchise_name || "Sin nombre"}
                          </td>
                          <td className="text-center py-2 px-4">
                            {franchise.conversions || 0}
                          </td>
                          <td className="text-center py-2 px-4">
                            {(franchise.percentage || 0).toFixed(1)}%
                          </td>
                          <td className="text-center py-2 px-4">
                            {franchise.active_phones || 0}/
                            {franchise.total_phones ||
                              franchise.active_phones ||
                              0}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-muted/20">
                        <td className="py-2 px-4">TOTALES</td>
                        <td className="text-center py-2 px-4">
                          {totalConversions}
                        </td>
                        <td className="text-center py-2 px-4">100%</td>
                        <td className="text-center py-2 px-4">{totalPhones}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  No hay datos disponibles para esta fecha
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <ActivityFeed activities={[]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
