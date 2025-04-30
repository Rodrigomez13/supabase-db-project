"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase, getCurrentUser } from "@/lib/supabase";
import { getTableData } from "@/lib/check-connection";

export default function DiagnosticsPage() {
  const [connectionStatus, setConnectionStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [tableStatuses, setTableStatuses] = useState<
    Record<string, { status: "loading" | "success" | "error"; count: number }>
  >({});
  const [logs, setLogs] = useState<string[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);

  const tables = [
    "servers",
    "franchises",
    "campaigns",
    "ads",
    "employees",
    "lead_distributions",
  ];

  useEffect(() => {
    checkConnections();
  }, []);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  const checkConnections = async () => {
    // Reiniciar estados
    setConnectionStatus("loading");
    setTableStatuses({});
    setLogs([]);
    setUserInfo(null);

    addLog("Iniciando diagnóstico de conexiones...");

    // Comprobar conexión a Supabase
    try {
      addLog("Comprobando conexión a Supabase...");

      // Obtenemos información del usuario actual
      const user = await getCurrentUser();

      if (user) {
        setUserInfo(user);
        addLog(`Usuario autenticado: ${user.email} (ID: ${user.id})`);
        addLog(`Audiencia (aud): ${user.aud || "No especificado"}`);
        addLog(`Rol: ${user.role || "NULL"}`);

        // Mostrar raw_app_meta_data
        if (user.app_metadata) {
          addLog(
            `Metadata de aplicación: ${JSON.stringify(user.app_metadata)}`
          );
        }

        // Mostrar raw_user_meta_data
        if (user.user_metadata) {
          addLog(`Metadata de usuario: ${JSON.stringify(user.user_metadata)}`);
        }
      } else {
        addLog("⚠️ No hay usuario autenticado");
      }

      // Intentamos una consulta simple para verificar la conexión
      const { data, error } = await supabase.from("franchises").select("count");

      if (error) {
        addLog(`❌ Error en conexión: ${error.message}`);
        setConnectionStatus("error");
      } else {
        addLog("✅ Conexión a Supabase establecida correctamente");
        setConnectionStatus("success");
      }
    } catch (err: any) {
      addLog(`❌ Excepción en conexión: ${err.message}`);
      setConnectionStatus("error");
    }

    // Comprobar tablas
    for (const table of tables) {
      try {
        addLog(`Comprobando tabla ${table}...`);
        setTableStatuses((prev) => ({
          ...prev,
          [table]: { status: "loading", count: 0 },
        }));

        // Obtenemos datos de la tabla
        const result = await getTableData(table);

        if (!result.success) {
          addLog(`❌ Error en tabla ${table}: ${result.error}`);
          setTableStatuses((prev) => ({
            ...prev,
            [table]: { status: "error", count: 0 },
          }));
        } else {
          const count = result.count || 0;
          addLog(
            `✅ Tabla ${table}: ${
              count > 0 ? `${count} registros encontrados` : "Sin datos"
            }`
          );
          setTableStatuses((prev) => ({
            ...prev,
            [table]: { status: "success", count },
          }));
        }
      } catch (err: any) {
        addLog(`❌ Error en tabla ${table}: ${err.message}`);
        setTableStatuses((prev) => ({
          ...prev,
          [table]: { status: "error", count: 0 },
        }));
      }
    }

    addLog("Diagnóstico completado");
  };

  // Función para desactivar RLS temporalmente (solo para pruebas)
  const disableRLS = async (tableName: string) => {
    try {
      addLog(`Intentando desactivar RLS para tabla ${tableName}...`);

      const { error } = await supabase.rpc("disable_rls", {
        table_name: tableName,
      });

      if (error) {
        addLog(`❌ Error al desactivar RLS: ${error.message}`);
      } else {
        addLog(`✅ RLS desactivado temporalmente para ${tableName}`);
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico de Supabase</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Conexión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Conexión a Supabase:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    connectionStatus === "loading"
                      ? "bg-gray-100"
                      : connectionStatus === "success"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {connectionStatus === "loading"
                    ? "Comprobando..."
                    : connectionStatus === "success"
                    ? "Conectado"
                    : "Error"}
                </span>
              </div>

              {userInfo && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">Información de Usuario</h3>
                  <p>
                    <span className="font-medium">Email:</span> {userInfo.email}
                  </p>
                  <p>
                    <span className="font-medium">Audiencia (aud):</span>{" "}
                    {userInfo.aud || "No especificado"}
                  </p>
                  <p>
                    <span className="font-medium">ID:</span> {userInfo.id}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Tablas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tables.map((table) => (
                <div key={table} className="flex items-center justify-between">
                  <span>{table}:</span>
                  <div className="flex items-center gap-2">
                    {tableStatuses[table]?.count > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {tableStatuses[table]?.count} registros
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        !tableStatuses[table] ||
                        tableStatuses[table]?.status === "loading"
                          ? "bg-gray-100"
                          : tableStatuses[table]?.status === "success"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {!tableStatuses[table] ||
                      tableStatuses[table]?.status === "loading"
                        ? "Comprobando..."
                        : tableStatuses[table]?.status === "success"
                        ? "Accesible"
                        : "Error"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs de Diagnóstico</CardTitle>
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

          <div className="mt-4 flex gap-2">
            <Button onClick={checkConnections}>Ejecutar Diagnóstico</Button>
            <Button
              variant="outline"
              onClick={() => disableRLS("franchises")}
              className="text-amber-600 border-amber-600 hover:bg-amber-50"
            >
              Desactivar RLS (Franchises)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
