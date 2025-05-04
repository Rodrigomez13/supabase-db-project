"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, BarChart2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getServerById,
  getServerMetrics,
  getDailyProgressData,
} from "@/lib/queries/server-queries";
import { ServerAdsList } from "@/components/server-ads-list";

interface Server {
  id: string;
  name: string;
  coefficient: number;
  is_active: boolean;
  description?: string;
  created_at: string;
}

interface ServerMetrics {
  leads: number;
  conversions: number;
  conversion_rate: number;
  spend: number;
  cost_per_lead: number;
  cost_per_conversion: number;
}

export default function ServerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [server, setServer] = useState<Server | null>(null);
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension?: number;
    }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadServerData() {
      try {
        setLoading(true);
        setError(null);

        // Cargar datos del servidor
        const serverData = await getServerById(params.id);
        if (!serverData) {
          throw new Error("Servidor no encontrado");
        }
        setServer(serverData);

        // Cargar métricas
        const metricsData = await getServerMetrics(params.id);
        setMetrics(metricsData);

        // Cargar datos para gráficos
        const progressData = await getDailyProgressData(params.id);
        setChartData(progressData);
      } catch (err: any) {
        console.error("Error loading server data:", err);
        setError(`Error al cargar datos del servidor: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadServerData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Cargando datos del servidor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        {error}
        <div className="mt-4">
          <Button onClick={() => router.push("/dashboard/servers")}>
            Volver a Servidores
          </Button>
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Servidor no encontrado</h2>
        <Button onClick={() => router.push("/dashboard/servers")}>
          Volver a Servidores
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/servers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-usina-text-primary">
              {server.name}
            </h1>
            <p className="text-usina-text-secondary">
              {server.description || "Sin descripción"} • Coeficiente:{" "}
              {server.coefficient}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/dashboard/servers/${server.id}/daily-records`}>
            <Button variant="outline">
              <BarChart2 className="h-4 w-4 mr-2" />
              Registros Diarios
            </Button>
          </Link>
          <Link href={`/dashboard/servers/${server.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button
            variant="outline"
            className="border-usina-danger/30 text-usina-danger hover:bg-usina-danger/10"
            onClick={() => {
              if (confirm("¿Estás seguro de eliminar este servidor?")) {
                // Implementar lógica de eliminación
                router.push("/dashboard/servers");
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-usina-card bg-background/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-usina-text-primary">Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-usina-text-primary">
              {metrics?.leads || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-usina-card bg-background/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-usina-text-primary">
              Conversiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-usina-text-primary">
              {metrics?.conversions || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-usina-card bg-background/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-usina-text-primary">
              Tasa de Conversión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-usina-text-primary">
              {metrics?.conversion_rate?.toFixed(2) || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ads">Anuncios</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>
        <TabsContent value="ads" className="space-y-4">
          <ServerAdsList serverId={server.id} />
        </TabsContent>
        <TabsContent value="metrics" className="space-y-4">
          <Card className="border-usina-card bg-background/5">
            <CardHeader>
              <CardTitle className="text-usina-text-primary">
                Métricas de Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-usina-text-secondary">
                    Gasto Total
                  </h3>
                  <p className="text-2xl font-bold text-usina-text-primary">
                    ${metrics?.spend?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-usina-text-secondary">
                    Costo por Lead
                  </h3>
                  <p className="text-2xl font-bold text-usina-text-primary">
                    ${metrics?.cost_per_lead?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-usina-text-secondary">
                    Costo por Conversión
                  </h3>
                  <p className="text-2xl font-bold text-usina-text-primary">
                    ${metrics?.cost_per_conversion?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card className="border-usina-card bg-background/5">
            <CardHeader>
              <CardTitle className="text-usina-text-primary">
                Configuración del Servidor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-usina-text-secondary">
                    ID del Servidor
                  </h3>
                  <p className="text-usina-text-primary">{server.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-usina-text-secondary">
                    Estado
                  </h3>
                  <p className="text-usina-text-primary">
                    {server.is_active ? "Activo" : "Inactivo"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-usina-text-secondary">
                    Fecha de Creación
                  </h3>
                  <p className="text-usina-text-primary">
                    {new Date(server.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
