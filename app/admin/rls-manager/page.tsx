"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";

interface TableInfo {
  name: string;
  rls_enabled: boolean;
  policies: {
    name: string;
    definition: string;
  }[];
}

export default function RlsManagerPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchTables();
  }, []);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  const fetchTables = async () => {
    try {
      setLoading(true);
      addLog("Obteniendo información de tablas...");

      // Consulta para obtener tablas y su estado de RLS
      const { data: tablesData, error: tablesError } = await supabase.rpc(
        "get_tables_info"
      );

      if (tablesError) {
        throw tablesError;
      }

      // Procesamos los datos para obtener las políticas de cada tabla
      const tablesWithPolicies: TableInfo[] = [];

      for (const table of tablesData || []) {
        addLog(`Obteniendo políticas para tabla ${table.name}...`);

        const { data: policiesData, error: policiesError } = await supabase.rpc(
          "get_table_policies",
          {
            table_name: table.name,
          }
        );

        if (policiesError) {
          addLog(
            `Error al obtener políticas para ${table.name}: ${policiesError.message}`
          );
        }

        tablesWithPolicies.push({
          ...table,
          policies: policiesData || [],
        });
      }

      setTables(tablesWithPolicies);
      addLog("Información de tablas obtenida correctamente");
    } catch (err: any) {
      setError(err.message || "Error al obtener información de tablas");
      addLog(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleRls = async (tableName: string, enable: boolean) => {
    try {
      addLog(
        `${
          enable ? "Activando" : "Desactivando"
        } RLS para tabla ${tableName}...`
      );

      const { error } = await supabase.rpc("toggle_rls", {
        table_name: tableName,
        enable,
      });

      if (error) {
        throw error;
      }

      // Actualizamos el estado local
      setTables(
        tables.map((table) =>
          table.name === tableName ? { ...table, rls_enabled: enable } : table
        )
      );

      addLog(
        `RLS ${
          enable ? "activado" : "desactivado"
        } correctamente para ${tableName}`
      );
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Administrador de RLS</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tablas y Políticas RLS</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                Cargando información de tablas...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tabla</TableHead>
                    <TableHead>RLS Activado</TableHead>
                    <TableHead>Políticas</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.map((table) => (
                    <TableRow key={table.name}>
                      <TableCell className="font-medium">
                        {table.name}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={table.rls_enabled}
                          onCheckedChange={(checked) =>
                            toggleRls(table.name, checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {table.policies.length === 0 ? (
                          <span className="text-gray-500">Sin políticas</span>
                        ) : (
                          <ul className="list-disc list-inside">
                            {table.policies.map((policy, index) => (
                              <li key={index} className="text-sm">
                                {policy.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toggleRls(table.name, !table.rls_enabled)
                          }
                        >
                          {table.rls_enabled ? "Desactivar RLS" : "Activar RLS"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-md h-48 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-500">No hay logs disponibles</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>

            <div className="mt-4">
              <Button onClick={fetchTables}>Actualizar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
