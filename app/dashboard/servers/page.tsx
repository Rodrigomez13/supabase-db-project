"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, Pencil, Trash2, Settings } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/stat-card";
import { Chart } from "@/components/chart";
import {
  type Server,
  type ServerMetrics,
  getServers,
  deleteServer,
  getServerMetrics,
  getDailyProgressData,
} from "@/lib/queries/server-queries";

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [serverMetrics, setServerMetrics] = useState<ServerMetrics | null>(
    null
  );
  const [chartData, setChartData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [chartLoading, setChartLoading] = useState(false);

  // Memoizar los servidores filtrados para evitar recálculos innecesarios
  const filteredServers = useMemo(() => {
    return servers.filter(
      (server) =>
        server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (server.description &&
          server.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [servers, searchTerm]);

  const fetchServers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getServers();
      setServers(data);

      // Seleccionar el primer servidor por defecto
      if (data.length > 0 && !selectedServer) {
        setSelectedServer(data[0].id);
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

  const handleDeleteServer = async (id: string) => {
    try {
      const result = await deleteServer(id);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Actualizamos la lista localmente para evitar otra consulta
      setServers(servers.filter((server) => server.id !== id));

      // Si el servidor eliminado era el seleccionado, seleccionamos otro
      if (selectedServer === id && servers.length > 1) {
        const newSelectedServer = servers.find((s) => s.id !== id)?.id;
        if (newSelectedServer) {
          setSelectedServer(newSelectedServer);
        } else {
          setSelectedServer(null);
        }
      }
    } catch (err: any) {
      console.error("Error deleting server:", err);
      setError(
        `Error al eliminar servidor: ${err.message || "Error desconocido"}`
      );
    }
  };

  const handleServerSelect = (serverId: string) => {
    setSelectedServer(serverId);
  };

  // Función para manejar valores nulos o indefinidos en métricas
  const safeNumber = (value: number | null | undefined) => {
    return value !== null && value !== undefined ? value : 0;
  };

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
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Link href="/dashboard/servers/new">
            <Button>
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
            className="rounded-md whitespace-nowrap"
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

      {selectedServer && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-2 text-usina-text-primary">
              Registro Diario
            </h3>
            <p className="text-sm text-usina-text-secondary mb-3">
              Métricas del día actual para{" "}
              {servers.find((s) => s.id === selectedServer)?.name}
            </p>
            <Chart
              type="line"
              data={chartData}
              height={180} // Reducido a 180px
              loading={chartLoading}
              options={{
                animation: {
                  duration: 0, // Desactivar animaciones completamente
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
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-usina-text-primary">
          Lista de Servidores
        </h2>
        <div className="w-64">
          <Input
            placeholder="Buscar servidores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-secondary/50 border-border/30"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-usina-text-secondary">
              Cargando servidores...
            </div>
          ) : filteredServers.length === 0 ? (
            <div className="p-6 text-center text-usina-text-secondary">
              No hay servidores registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-usina-text-secondary">
                    Nombre
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Coeficiente
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Estado
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Descripción
                  </TableHead>
                  <TableHead className="text-right text-usina-text-secondary">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServers.map((server) => (
                  <TableRow key={server.id}>
                    <TableCell className="font-medium text-usina-text-primary">
                      {server.name}
                    </TableCell>
                    <TableCell className="text-usina-text-primary">
                      {server.coefficient}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          server.is_active
                            ? "bg-usina-success/20 text-usina-success"
                            : "bg-usina-danger/20 text-usina-danger"
                        }`}
                      >
                        {server.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-usina-text-primary">
                      {server.description || "Sin descripción"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/dashboard/servers/${server.id}`}>
                          <Button variant="outline" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (
                              confirm(
                                "¿Estás seguro de eliminar este servidor?"
                              )
                            ) {
                              handleDeleteServer(server.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
