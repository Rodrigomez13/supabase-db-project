"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, PlusIcon } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { Chart } from "@/components/chart";
import {
  type Server,
  type ServerMetrics,
  getActiveServers,
  getDailyServerMetrics,
  getDailyProgressData,
} from "@/lib/queries/server-queries";
import { ServerAdsList } from "@/components/server-ads-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "@/components/ui/use-toast";
import { updateActiveFranchise } from "@/lib/update-active-franchise";

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
  const [franchises, setFranchises] = useState<{ id: string; name: string }[]>(
    []
  );
  const [franchisesLoading, setFranchisesLoading] = useState(true);
  const [activeFranchise, setActiveFranchise] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Cargar franquicias
  const fetchFranchises = useCallback(async () => {
    try {
      setFranchisesLoading(true);

      // Intentar usar la función RPC primero
      let data: any[] = [];
      let error: any = null;

      try {
        // Intentar usar la función RPC
        const rpcResult = await supabase.rpc("get_active_franchises");
        if (rpcResult.error) {
          console.log(
            "Error al usar RPC, intentando consulta directa:",
            rpcResult.error
          );
          throw rpcResult.error;
        }
        data = rpcResult.data || [];
      } catch (rpcError) {
        console.log("Fallback a consulta directa");
        // Si falla, usar consulta directa
        const directResult = await supabase
          .from("franchises")
          .select("id, name")
          .eq("status", "Activo")
          .order("name");
        error = directResult.error;
        data = directResult.data || [];
      }

      console.log("Franquicias obtenidas:", data);

      if (error) {
        console.error("Error al cargar franquicias:", error);
        return;
      }

      // Si no hay franquicias activas, intentar obtener todas
      if (data.length === 0) {
        console.log("No hay franquicias activas, obteniendo todas");
        const { data: allFranchises, error: allError } = await supabase
          .from("franchises")
          .select("id, name")
          .order("name");

        if (allError) {
          console.error("Error al obtener todas las franquicias:", allError);
        } else {
          data = allFranchises || [];
        }
      }

      setFranchises(data);

      // Obtener la franquicia activa para distribución
      try {
        const { data: configData, error: configError } = await supabase
          .from("system_config")
          .select("value")
          .eq("key", "active_franchise")
          .single();

        console.log("Configuración actual:", configData);

        if (configError && configError.code !== "PGRST116") {
          console.error("Error al cargar configuración:", configError);
        }

        // Verificar si hay una franquicia activa válida en la configuración
        const hasValidActiveFranchise =
          configData?.value?.id &&
          configData.value.id !== "null" &&
          data.some((f) => f.id === configData.value.id);

        if (hasValidActiveFranchise) {
          setActiveFranchise(configData.value.id);
        } else if (data && data.length > 0) {
          // Si no hay configuración válida, usar la primera franquicia
          setActiveFranchise(data[0].id);

          // Y guardarla como configuración global
          await updateActiveFranchise(data[0].id, data[0].name, false);
        }
      } catch (configErr) {
        console.error("Error al obtener configuración:", configErr);

        // Si hay un error al obtener la configuración pero tenemos franquicias,
        // usar la primera franquicia como activa
        if (data && data.length > 0) {
          setActiveFranchise(data[0].id);
          await updateActiveFranchise(data[0].id, data[0].name, false);
        }
      }
    } catch (err: any) {
      console.error("Error loading franchises:", err);
    } finally {
      setFranchisesLoading(false);
    }
  }, [supabase]);

  const fetchServers = useCallback(async () => {
    try {
      setLoading(true);
      // Obtener solo servidores activos
      const activeServers = await getActiveServers();
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
      const metrics = await getDailyServerMetrics(serverId);
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
    fetchFranchises();
  }, [fetchServers, fetchFranchises]);

  useEffect(() => {
    if (selectedServer) {
      fetchServerMetrics(selectedServer);
      fetchDailyProgressData(selectedServer);
    }
  }, [selectedServer, fetchServerMetrics, fetchDailyProgressData]);

  // Suscribirse a cambios en la configuración
  useEffect(() => {
    const channel = supabase
      .channel("system_config_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "system_config",
          filter: "key=eq.active_franchise",
        },
        (payload) => {
          if (payload.new && payload.new.value) {
            const { id } = payload.new.value;
            if (id && id !== activeFranchise) {
              setActiveFranchise(id);

              // Notificar al usuario del cambio
              toast({
                title: "Franquicia actualizada",
                description: `La franquicia activa ha sido cambiada`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, activeFranchise]);

  const handleFranchiseChange = async (franchiseId: string) => {
    const franchise = franchises.find((f) => f.id === franchiseId);
    if (franchise) {
      const success = await updateActiveFranchise(franchiseId, franchise.name);
      if (success) {
        setActiveFranchise(franchiseId);
      }
    }
  };

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
            Gestiona los servidores activos y sus anuncios.
          </p>
        </div>
        <div className="flex space-x-2">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="distribution-franchise">Distribuyendo a:</Label>
            <Select
              value={activeFranchise || ""}
              onValueChange={handleFranchiseChange}
              disabled={franchisesLoading}
            >
              <SelectTrigger className="w-[200px]" id="distribution-franchise">
                <SelectValue
                  placeholder={
                    franchisesLoading
                      ? "Cargando..."
                      : franchises.length === 0
                      ? "No hay franquicias"
                      : "Seleccionar franquicia"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {franchises.length > 0 ? (
                  franchises.map((franchise) => (
                    <SelectItem key={franchise.id} value={franchise.id}>
                      {franchise.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-franchises" disabled>
                    No hay franquicias activas
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
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
