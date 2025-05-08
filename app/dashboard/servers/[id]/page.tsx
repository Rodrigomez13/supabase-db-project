"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getServerById,
  getDailyServerMetrics,
  getDailyProgressData,
} from "@/lib/queries/server-queries";
import { Chart } from "@/components/chart";
import { ServerAdsList } from "@/components/server-ads-list";
import { Pencil, PlusCircle, BarChart3, Users } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export interface Server {
  id: string;
  name: string;
  default_franchise_id?: string | null;
  // otras propiedades existentes
}

export default function ServerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.id as string;

  const [server, setServer] = useState<Server | null>(null);
  const [metrics, setMetrics] = useState({
    leads: 0,
    conversions: 0,
    conversion_rate: 0,
    spend: 0,
    cost_per_lead: 0,
    cost_per_conversion: 0,
  });
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [defaultFranchise, setDefaultFranchise] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        console.log("Iniciando carga de datos para servidor:", serverId);

        // Fetch server details
        const serverData = await getServerById(serverId);
        setServer(serverData);
        console.log("Datos del servidor cargados:", serverData);

        if (serverData?.default_franchise_id) {
          // Fetch franchise name
          const { data } = await supabase
            .from("franchises")
            .select("name")
            .eq("id", serverData.default_franchise_id)
            .single();

          if (data) {
            setDefaultFranchise(data.name);
            console.log("Franquicia por defecto:", data.name);
          }
        }

        // Fetch daily metrics - USANDO LA FUNCIÓN UNIFICADA
        console.log("Obteniendo métricas del servidor...");
        const metricsData = await getDailyServerMetrics(serverId);
        setMetrics(metricsData);
        console.log("Métricas obtenidas:", metricsData);

        // Fetch chart data - USANDO LA FUNCIÓN UNIFICADA
        console.log("Obteniendo datos para el gráfico...");
        const progressData = await getDailyProgressData(serverId);
        setChartData(progressData);
        console.log("Datos del gráfico obtenidos:", progressData);
      } catch (error) {
        console.error("Error fetching server details:", error);
      } finally {
        setLoading(false);
      }
    }

    if (serverId) {
      fetchData();
    }
  }, [serverId, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Cargando detalles del servidor...</p>
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-red-500">No se encontró el servidor</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/dashboard/servers")}
          >
            Volver a Servidores
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{server.name}</h1>
        <div className="flex space-x-2">
          <Button
            variant={defaultFranchise ? "default" : "outline"}
            onClick={() =>
              router.push(`/dashboard/servers/${serverId}/assign-franchise`)
            }
            className={
              defaultFranchise ? "bg-green-600 hover:bg-green-700" : ""
            }
          >
            <Users className="mr-2 h-4 w-4" />
            {defaultFranchise ? (
              <span className="flex items-center">
                Franquicia:{" "}
                <span className="font-bold ml-1">{defaultFranchise}</span>
              </span>
            ) : (
              "Asignar Franquicia"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/servers/${serverId}/edit`)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            onClick={() => router.push(`/dashboard/servers/${serverId}/add-ad`)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Anuncio
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.leads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversions}</div>
            <p className="text-xs text-muted-foreground">
              Tasa: {metrics.conversion_rate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gasto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.spend.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Costo por Conversión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.cost_per_conversion.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              CPL: ${metrics.cost_per_lead.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="ads">Anuncios</TabsTrigger>
          <TabsTrigger value="daily-records">Registros Diarios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Progreso Diario</CardTitle>
              <CardDescription>
                Leads y conversiones de los últimos 7 días
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData ? (
                <div className="h-[300px]">
                  <Chart type="line" data={chartData} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">
                    No hay datos disponibles
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads">
          <Card>
            <CardHeader>
              <CardTitle>Anuncios Activos</CardTitle>
              <CardDescription>
                Anuncios asociados a este servidor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServerAdsList serverId={serverId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily-records">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Registros Diarios</CardTitle>
                <CardDescription>Historial de métricas diarias</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/dashboard/servers/${serverId}/daily-records`)
                }
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Ver Todos
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Haz clic en "Ver Todos" para acceder al historial completo de
                registros diarios.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
