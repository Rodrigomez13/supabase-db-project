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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

interface ViewPermission {
  view_name: string;
  security_definer: boolean;
  has_auth_permissions: boolean;
}

export default function FixViewPermissionsPage() {
  const [viewPermissions, setViewPermissions] = useState<ViewPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchViewPermissions();
  }, []);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  const fetchViewPermissions = async () => {
    try {
      setLoading(true);
      addLog("Obteniendo información de permisos de vistas...");

      const { data, error } = await supabase.rpc("check_view_permissions");

      if (error) {
        throw error;
      }

      setViewPermissions(data || []);
      addLog(
        `Se encontraron ${data?.length || 0} vistas en el esquema público`
      );
    } catch (err: any) {
      setError(
        err.message || "Error al obtener información de permisos de vistas"
      );
      addLog(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fixViewPermissions = async () => {
    try {
      setFixing(true);
      setError(null);
      setSuccess(null);
      addLog("Iniciando corrección de permisos de vistas...");

      // Ejecutar el script SQL para corregir los permisos
      const { error: usageError } = await supabase.rpc("exec_sql", {
        sql: "GRANT USAGE ON SCHEMA auth TO authenticated;",
      });

      if (usageError) {
        addLog(`Error al otorgar USAGE en schema auth: ${usageError.message}`);
      } else {
        addLog("USAGE otorgado en schema auth");
      }

      const { error: selectError } = await supabase.rpc("exec_sql", {
        sql: "GRANT SELECT ON auth.users TO authenticated;",
      });

      if (selectError) {
        addLog(`Error al otorgar SELECT en auth.users: ${selectError.message}`);
      } else {
        addLog("SELECT otorgado en auth.users");
      }

      // Corregir cada vista
      for (const view of viewPermissions) {
        addLog(`Corrigiendo vista: ${view.view_name}...`);

        // Establecer SECURITY DEFINER
        const { error: definerError } = await supabase.rpc("exec_sql", {
          sql: `ALTER VIEW public.${view.view_name} SET (security_definer = true);`,
        });

        if (definerError) {
          addLog(
            `Error al establecer SECURITY DEFINER en ${view.view_name}: ${definerError.message}`
          );
        } else {
          addLog(`SECURITY DEFINER establecido en ${view.view_name}`);
        }

        // Otorgar permisos
        const { error: grantError } = await supabase.rpc("exec_sql", {
          sql: `GRANT ALL ON public.${view.view_name} TO authenticated;`,
        });

        if (grantError) {
          addLog(
            `Error al otorgar permisos en ${view.view_name}: ${grantError.message}`
          );
        } else {
          addLog(`Permisos otorgados en ${view.view_name}`);
        }
      }

      addLog("Corrección de permisos completada");
      setSuccess(
        "Los permisos de las vistas han sido corregidos correctamente"
      );

      // Actualizar la lista de permisos
      await fetchViewPermissions();
    } catch (err: any) {
      setError(err.message || "Error al corregir permisos de vistas");
      addLog(`Error: ${err.message}`);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        Corrección de Permisos de Vistas
      </h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Permisos de Vistas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                Cargando información de permisos...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vista</TableHead>
                    <TableHead>SECURITY DEFINER</TableHead>
                    <TableHead>Permisos para Authenticated</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewPermissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No se encontraron vistas en el esquema público
                      </TableCell>
                    </TableRow>
                  ) : (
                    viewPermissions.map((view) => (
                      <TableRow key={view.view_name}>
                        <TableCell className="font-medium">
                          {view.view_name}
                        </TableCell>
                        <TableCell>
                          {view.security_definer ? (
                            <span className="text-green-600">Sí</span>
                          ) : (
                            <span className="text-red-600">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {view.has_auth_permissions ? (
                            <span className="text-green-600">Sí</span>
                          ) : (
                            <span className="text-red-600">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {view.security_definer &&
                          view.has_auth_permissions ? (
                            <span className="text-green-600">Correcto</span>
                          ) : (
                            <span className="text-red-600">
                              Necesita corrección
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            <div className="mt-4 flex gap-2">
              <Button onClick={fetchViewPermissions} disabled={loading}>
                Actualizar
              </Button>
              <Button onClick={fixViewPermissions} disabled={loading || fixing}>
                {fixing ? "Corrigiendo..." : "Corregir Permisos"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-md h-64 overflow-y-auto font-mono text-sm">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
