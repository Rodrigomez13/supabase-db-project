"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, PlusIcon } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { Chart } from "@/components/chart";
import {
  type Server,
  type ServerMetrics,
  getServers,
  getServerMetrics,
  getDailyProgressData,
} from "@/lib/queries/server-queries";
import { ServerAdsList } from "@/components/server-ads-list";

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [serverMetrics, setServerMetrics] = useState<ServerMetrics | null>(
    null
  );
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
  const [chartLoading, setChartLoading] = useState(false);

  const fetchServers = useCallback(async () => {
    try {
      setLoading(true);
      const allServers = await getServers();
      // Filtrar solo servidores activos
      const activeServers = allServers.filter((server) => server.is_active);
      setServers(activeServers);

      // Seleccionar el primer servidor activo por defecto
      if (activeServers.length > 0 && !selectedServer) {
        setSelectedServer(activeServers[0].id);
      }

      setError(null);
    } catch (err: any) {
      console.error("Error loading servers:", err);
      setError(
        "No se pudieron cargar los servidores. Por favor, intenta de nuevo más tarde."
      );
      setServers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedServer]);

  const fetchServerMetrics = useCallback(async (serverId: string) => {
    try {
      const metrics = await getServerMetrics(serverId);
      setServerMetrics(metrics);
    } catch (err: any) {
      console.error("Error loading server metrics:", err);
      setServerMetrics(null);
    }
  }, []);

  const fetchDailyProgressData = useCallback(async (serverId: string) => {
    try {
      setChartLoading(true);
      const data = await getDailyProgressData(serverId);
      // Asignación necesaria para los datos del gráfico
      setChartData(data);
    } catch (err: any) {
      console.error("Error loading daily progress data:", err);
      setChartData(null);
    } finally {
      setChartLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  useEffect(() => {
    if (selectedServer) {
      fetchServerMetrics(selectedServer);
      fetchDailyProgressData(selectedServer);
    }
  }, [selectedServer, fetchServerMetrics, fetchDailyProgressData]);

  const handleServerSelect = (serverId: string) => {
    setSelectedServer(serverId);
  };

  // Función para manejar valores nulos o indefinidos en métricas
  const safeNumber = (value: number | null | undefined) => {
    return value !== null && value !== undefined ? value : 0;
  };

  const selectedServerData = servers.find((s) => s.id === selectedServer);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-usina-text-primary">
            Servidores
          </h1>
          <p className="text-usina-text-secondary">
            Gestiona los servidores y sus anuncios activos.
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/dashboard/servers/config">
            <Button
              variant="outline"
              size="icon"
              className="border-usina-card/30"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard/servers/new">
            <Button className="bg-usina-primary hover:bg-usina-secondary">
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuevo Servidor
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        {servers.map((server) => (
          <Button
            key={server.id}
            variant={selectedServer === server.id ? "default" : "outline"}
            onClick={() => handleServerSelect(server.id)}
            className={`rounded-md whitespace-nowrap ${
              selectedServer === server.id
                ? "bg-usina-primary hover:bg-usina-secondary"
                : "border-usina-card/30"
            }`}
          >
            {server.name}
          </Button>
        ))}
      </div>

      {selectedServer && serverMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Leads Generados"
            value={safeNumber(serverMetrics.leads)}
            trend="up"
          />
          <StatCard
            title="Conversiones"
            value={safeNumber(serverMetrics.conversions)}
            trend="up"
          />
          <StatCard
            title="Tasa de Conversión"
            value={`${safeNumber(serverMetrics.conversion_rate).toFixed(1)}%`}
            trend="neutral"
          />
          <StatCard
            title="Gasto Total"
            value={safeNumber(serverMetrics.spend).toFixed(2)}
            prefix="$"
            trend="up"
          />
        </div>
      )}

      {selectedServer && selectedServerData && (
        <>
          <Card className="border-usina-card bg-background/5 mb-6">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-usina-text-primary">
                  {selectedServerData.name}
                </h3>
                <span className="text-sm text-usina-text-secondary">
                  Coeficiente: {selectedServerData.coefficient}
                </span>
              </div>
              <ServerAdsList serverId={selectedServer} />
            </CardContent>
          </Card>

          <Card className="border-usina-card bg-background/5 mb-6">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-2 text-usina-text-primary">
                Registro Diario
              </h3>
              <p className="text-sm text-usina-text-secondary mb-3">
                Métricas del día actual para {selectedServerData.name}
              </p>
              <Chart
                type="line"
                data={chartData}
                height={180}
                loading={chartLoading}
                options={{
                  animation: {
                    duration: 0,
                  },
                  plugins: {
                    legend: {
                      display: true,
                      position: "top",
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </>
      )}

      {servers.length === 0 && !loading && (
        <Card className="border-usina-card bg-background/5">
          <CardContent className="p-6 text-center">
            <p className="text-usina-text-secondary mb-4">
              No hay servidores activos disponibles
            </p>
            <Link href="/dashboard/servers/new">
              <Button className="bg-usina-primary hover:bg-usina-secondary">
                <PlusIcon className="h-4 w-4 mr-2" />
                Crear Nuevo Servidor
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
