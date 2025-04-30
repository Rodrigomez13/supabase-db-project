"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Chart } from "@/components/chart";
import { supabase } from "@/lib/supabase";
import { safeQuery } from "@/lib/safe-query";

interface FinancialSummary {
  report_date: string;
  leads: number;
  loads: number;
  ad_spend: number;
  income: number;
  balance: number;
}

interface FranchiseLeadSummary {
  franchise_id: string;
  franchise_name: string;
  total_leads: number;
  total_phones: number;
}

interface ServerPerformance {
  server_id: string;
  server_name: string;
  total_leads: number;
  total_loads: number;
  total_spent: number;
  total_cost: number;
  cost_per_lead: number;
}

export default function ReportsPage() {
  const [financialData, setFinancialData] = useState<FinancialSummary[]>([]);
  const [franchiseData, setFranchiseData] = useState<FranchiseLeadSummary[]>(
    []
  );
  const [serverData, setServerData] = useState<ServerPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("month");
  const [serverChartData, setServerChartData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [period]);

  async function fetchData() {
    try {
      setLoading(true);

      // Consultar la vista financial_summary
      const { data: financialData, error: financialError } = await supabase
        .from("financial_summary")
        .select("*")
        .order("report_date", { ascending: false })
        .limit(10);

      if (financialError) {
        console.error(
          `Error al consultar financial_summary: ${financialError.message}`
        );
        // Continuamos con el resto de consultas aunque esta falle
      }

      // Consultar la vista franchise_lead_summary
      const { data: franchiseData, error: franchiseError } = await supabase
        .from("franchise_lead_summary")
        .select("*")
        .order("total_leads", { ascending: false });

      if (franchiseError) {
        console.error(
          `Error al consultar franchise_lead_summary: ${franchiseError.message}`
        );
        // Continuamos con el resto de consultas aunque esta falle
      }

      // Consultar datos de rendimiento de servidores
      let serverData: ServerPerformance[] = [];
      try {
        serverData = await safeQuery<ServerPerformance>("server_performance", {
          orderBy: { column: "total_leads", order: "desc" },
        });
      } catch (err) {
        console.error("Error al consultar server_performance:", err);
        // Intentamos obtener datos básicos de servidores si la vista falla
        const servers = await safeQuery("servers", { select: "id, name" });
        serverData = servers.map((server: any) => ({
          server_id: server.id,
          server_name: server.name,
          total_leads: 0,
          total_loads: 0,
          total_spent: 0,
          total_cost: 0,
          cost_per_lead: 0,
        }));
      }

      // Preparar datos para el gráfico de servidores
      const chartData = prepareServerChartData(serverData || []);

      setFinancialData(financialData || []);
      setFranchiseData(franchiseData || []);
      setServerData(serverData || []);
      setServerChartData(chartData);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching report data:", err);
      setError(
        "No se pudieron cargar los datos de reportes. Por favor, intenta de nuevo más tarde."
      );
    } finally {
      setLoading(false);
    }
  }

  // Función para preparar datos para el gráfico de servidores
  function prepareServerChartData(servers: ServerPerformance[]) {
    if (!servers || servers.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: "Leads",
            data: [],
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            borderColor: "rgb(59, 130, 246)",
            borderWidth: 1,
          },
          {
            label: "Cargas",
            data: [],
            backgroundColor: "rgba(16, 185, 129, 0.5)",
            borderColor: "rgb(16, 185, 129)",
            borderWidth: 1,
          },
        ],
      };
    }

    // Tomar los 5 servidores con más leads
    const topServers = [...servers]
      .sort((a, b) => (b.total_leads || 0) - (a.total_leads || 0))
      .slice(0, 5);

    return {
      labels: topServers.map((server) => server.server_name || "Sin nombre"),
      datasets: [
        {
          label: "Leads",
          data: topServers.map((server) => server.total_leads || 0),
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
        {
          label: "Cargas",
          data: topServers.map((server) => server.total_loads || 0),
          backgroundColor: "rgba(16, 185, 129, 0.5)",
          borderColor: "rgb(16, 185, 129)",
          borderWidth: 1,
        },
      ],
    };
  }

  // Filtrar datos según el período seleccionado
  function filterDataByPeriod(data: any[]) {
    if (!data || data.length === 0) return [];

    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "week":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
      }

      return data.filter((item) => {
        if (!item.report_date) return true;
        try {
          const itemDate = new Date(item.report_date);
          return itemDate >= startDate && itemDate <= now;
        } catch (e) {
          console.error("Error parsing date:", e);
          return true;
        }
      });
    } catch (e) {
      console.error("Error filtering by period:", e);
      return data;
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reportes</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Label htmlFor="period">Período:</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecciona un período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Año</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="financial">
          <TabsList>
            <TabsTrigger value="financial">Resumen Financiero</TabsTrigger>
            <TabsTrigger value="franchises">Franquicias</TabsTrigger>
            <TabsTrigger value="servers">Servidores</TabsTrigger>
          </TabsList>
          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Resumen Financiero</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center">
                    Cargando datos financieros...
                  </div>
                ) : financialData.length === 0 ? (
                  <div className="text-center">
                    No hay datos financieros disponibles
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Leads</TableHead>
                        <TableHead>Cargas</TableHead>
                        <TableHead>Gasto en Anuncios</TableHead>
                        <TableHead>Ingresos</TableHead>
                        <TableHead>Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterDataByPeriod(financialData).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(item.report_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{item.leads || 0}</TableCell>
                          <TableCell>{item.loads || 0}</TableCell>
                          <TableCell>
                            ${(item.ad_spend || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            ${(item.income || 0).toFixed(2)}
                          </TableCell>
                          <TableCell
                            className={
                              (item.balance || 0) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            ${(item.balance || 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="franchises">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Franquicias</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center">
                    Cargando datos de franquicias...
                  </div>
                ) : franchiseData.length === 0 ? (
                  <div className="text-center">
                    No hay datos de franquicias disponibles
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Franquicia</TableHead>
                        <TableHead>Total de Leads</TableHead>
                        <TableHead>Teléfonos Activos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {franchiseData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {item.franchise_name || "Sin nombre"}
                          </TableCell>
                          <TableCell>{item.total_leads || 0}</TableCell>
                          <TableCell>{item.total_phones || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="servers">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento de Servidores</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center">
                    Cargando datos de servidores...
                  </div>
                ) : serverData.length === 0 ? (
                  <div className="text-center">
                    No hay datos de servidores disponibles
                  </div>
                ) : (
                  <div className="space-y-6">
                    {serverChartData && serverChartData.labels.length > 0 && (
                      <div className="h-80">
                        <Chart type="bar" data={serverChartData} height={300} />
                      </div>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Servidor</TableHead>
                          <TableHead>Leads</TableHead>
                          <TableHead>Cargas</TableHead>
                          <TableHead>Gasto</TableHead>
                          <TableHead>Costo Total</TableHead>
                          <TableHead>Costo por Lead</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serverData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {item.server_name || "Sin nombre"}
                            </TableCell>
                            <TableCell>{item.total_leads || 0}</TableCell>
                            <TableCell>{item.total_loads || 0}</TableCell>
                            <TableCell>
                              ${(item.total_spent || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              ${(item.total_cost || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              ${(item.cost_per_lead || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
