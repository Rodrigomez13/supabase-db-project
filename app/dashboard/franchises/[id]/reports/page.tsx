"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  FileBarChart,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Chart } from "@/components/chart";

export default function FranchiseReportsPage() {
  const params = useParams();
  const franchiseId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>({
    conversions: [],
    finances: [],
    phones: [],
  });

  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch conversions data
        const { data: conversionsData, error: conversionsError } =
          await supabase
            .from("conversions")
            .select("*")
            .eq("franchise_id", franchiseId)
            .order("created_at", { ascending: false })
            .limit(100);

        if (conversionsError)
          throw new Error(
            `Error al cargar conversiones: ${conversionsError.message}`
          );

        // Fetch phone data
        const { data: phoneData, error: phoneError } = await supabase
          .from("franchise_phones")
          .select("*")
          .eq("franchise_id", franchiseId)
          .order("date", { ascending: false })
          .limit(100);

        if (phoneError)
          throw new Error(
            `Error al cargar datos de teléfonos: ${phoneError.message}`
          );

        // Fetch financial data (example query - adjust based on your schema)
        const { data: financeData, error: financeError } = await supabase
          .from("server_daily_records")
          .select("*")
          .eq("franchise_id", franchiseId)
          .order("date", { ascending: false })
          .limit(100);

        if (financeError)
          throw new Error(
            `Error al cargar datos financieros: ${financeError.message}`
          );

        setReportData({
          conversions: conversionsData || [],
          phones: phoneData || [],
          finances: financeData || [],
        });
      } catch (err: any) {
        console.error("Error fetching report data:", err);
        setError(err.message || "Error al cargar los datos del reporte");
      } finally {
        setLoading(false);
      }
    }

    if (franchiseId) {
      fetchReportData();
    }
  }, [franchiseId]);

  // Prepare chart data
  const prepareConversionChartData = () => {
    if (!reportData.conversions.length) return { labels: [], datasets: [] };

    // Group by date and count
    const grouped = reportData.conversions.reduce((acc: any, item: any) => {
      const date = new Date(item.created_at).toLocaleDateString();
      if (!acc[date]) acc[date] = 0;
      acc[date]++;
      return acc;
    }, {});

    const labels = Object.keys(grouped).slice(-30); // Last 30 days
    const data = labels.map((label) => grouped[label] || 0);

    return {
      labels,
      datasets: [
        {
          label: "Conversiones",
          data,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
        },
      ],
    };
  };

  const preparePhoneChartData = () => {
    if (!reportData.phones.length) return { labels: [], datasets: [] };

    // Group by date and sum calls
    const grouped = reportData.phones.reduce((acc: any, item: any) => {
      const date = new Date(item.date).toLocaleDateString();
      if (!acc[date]) acc[date] = 0;
      acc[date] += item.calls || 0;
      return acc;
    }, {});

    const labels = Object.keys(grouped).slice(-30); // Last 30 days
    const data = labels.map((label) => grouped[label] || 0);

    return {
      labels,
      datasets: [
        {
          label: "Llamadas",
          data,
          borderColor: "rgb(153, 102, 255)",
          backgroundColor: "rgba(153, 102, 255, 0.2)",
        },
      ],
    };
  };

  const prepareFinanceChartData = () => {
    if (!reportData.finances.length) return { labels: [], datasets: [] };

    // Group by date and sum spend
    const grouped = reportData.finances.reduce((acc: any, item: any) => {
      const date = new Date(item.date).toLocaleDateString();
      if (!acc[date]) acc[date] = 0;
      acc[date] += item.spend || 0;
      return acc;
    }, {});

    const labels = Object.keys(grouped).slice(-30); // Last 30 days
    const data = labels.map((label) => grouped[label] || 0);

    return {
      labels,
      datasets: [
        {
          label: "Gasto ($)",
          data,
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[300px] rounded-lg" />
          <Skeleton className="h-[300px] rounded-lg" />
          <Skeleton className="h-[300px] rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Reportes y Análisis</h1>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="conversions">Conversiones</TabsTrigger>
          <TabsTrigger value="phones">Teléfonos</TabsTrigger>
          <TabsTrigger value="finances">Finanzas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversiones Totales
                </CardTitle>
                <FileBarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.conversions.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  +
                  {
                    reportData.conversions.filter(
                      (c: any) =>
                        new Date(c.created_at) >
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length
                  }{" "}
                  en los últimos 7 días
                </p>
                <div className="h-[180px] mt-4">
                  <Chart
                    type="line"
                    data={prepareConversionChartData()}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0,
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Llamadas Totales
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.phones.reduce(
                    (sum: number, item: any) => sum + (item.calls || 0),
                    0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Promedio diario:{" "}
                  {Math.round(
                    reportData.phones.reduce(
                      (sum: number, item: any) => sum + (item.calls || 0),
                      0
                    ) / (reportData.phones.length || 1)
                  )}
                </p>
                <div className="h-[180px] mt-4">
                  <Chart
                    type="line"
                    data={preparePhoneChartData()}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0,
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Gasto Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {reportData.finances
                    .reduce(
                      (sum: number, item: any) => sum + (item.spend || 0),
                      0
                    )
                    .toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Promedio diario: $
                  {(
                    reportData.finances.reduce(
                      (sum: number, item: any) => sum + (item.spend || 0),
                      0
                    ) / (reportData.finances.length || 1)
                  ).toFixed(2)}
                </p>
                <div className="h-[180px] mt-4">
                  <Chart
                    type="line"
                    data={prepareFinanceChartData()}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversions">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Conversiones</CardTitle>
              <CardDescription>
                Detalle de las conversiones registradas para esta franquicia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <Chart
                  type="line"
                  data={prepareConversionChartData()}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0,
                        },
                      },
                    },
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phones">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Llamadas</CardTitle>
              <CardDescription>
                Detalle de las llamadas registradas para esta franquicia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <Chart
                  type="line"
                  data={preparePhoneChartData()}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0,
                        },
                      },
                    },
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finances">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Financiero</CardTitle>
              <CardDescription>
                Detalle de los gastos registrados para esta franquicia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <Chart
                  type="line"
                  data={prepareFinanceChartData()}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
