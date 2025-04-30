"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase, getCurrentUser } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FixUserRolePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  const loadUserData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    addLog("Cargando información del usuario...");

    try {
      const user = await getCurrentUser();
      setUser(user);

      if (user) {
        addLog(`Usuario cargado: ${user.email} (ID: ${user.id})`);
        addLog(`Audiencia (aud): ${user.aud || "No especificado"}`);
        addLog(`Rol: ${user.role || "NULL"}`);
      } else {
        addLog("No se encontró usuario autenticado");
        setError(
          "No hay usuario autenticado. Por favor, inicia sesión primero."
        );
      }
    } catch (err: any) {
      addLog(`Error al cargar usuario: ${err.message}`);
      setError(err.message || "Error al cargar información del usuario");
    } finally {
      setLoading(false);
    }
  };

  const fixUserRole = async () => {
    if (!user) {
      setError("No hay usuario para actualizar");
      return;
    }

    setUpdating(true);
    setError(null);
    setSuccess(null);
    addLog("Intentando arreglar el rol del usuario...");

    try {
      // Llamamos a nuestra API para actualizar el rol
      const response = await fetch("/api/fix-user-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar el rol del usuario");
      }

      addLog("Rol de usuario actualizado correctamente");
      setSuccess(
        "El rol del usuario ha sido actualizado a 'authenticated'. Por favor, cierra sesión y vuelve a iniciar sesión."
      );
    } catch (err: any) {
      addLog(`Error al actualizar rol: ${err.message}`);
      setError(err.message || "Error al actualizar el rol del usuario");
    } finally {
      setUpdating(false);
    }
  };

  const createRpcFunction = async () => {
    setUpdating(true);
    setError(null);
    addLog("Creando función RPC para actualizar roles...");

    try {
      // Usamos el cliente de Supabase para ejecutar SQL directamente
      const { error } = await supabase.rpc("exec_sql", {
        sql: `
          CREATE OR REPLACE FUNCTION update_user_role(user_id UUID, new_role TEXT)
          RETURNS VOID
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            UPDATE auth.users
            SET role = new_role
            WHERE id = user_id;
          END;
          $$;
        `,
      });

      if (error) {
        throw error;
      }

      addLog("Función RPC creada correctamente");
      setSuccess(
        "La función RPC para actualizar roles ha sido creada correctamente"
      );
    } catch (err: any) {
      addLog(`Error al crear función RPC: ${err.message}`);
      setError(err.message || "Error al crear la función RPC");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Arreglar Rol de Usuario</h1>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                Cargando información del usuario...
              </div>
            ) : !user ? (
              <div className="text-center py-4 text-red-500">
                No hay usuario autenticado
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">Detalles del Usuario</h3>
                  <p>
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                  <p>
                    <span className="font-medium">ID:</span> {user.id}
                  </p>
                  <p>
                    <span className="font-medium">Audiencia (aud):</span>{" "}
                    {user.aud || "No especificado"}
                  </p>
                  <p>
                    <span className="font-medium">Rol:</span>{" "}
                    {user.role || "NULL"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={loadUserData} disabled={loading}>
                    Recargar Información
                  </Button>
                  <Button
                    onClick={createRpcFunction}
                    disabled={updating}
                    variant="outline"
                  >
                    Crear Función RPC
                  </Button>
                  <Button onClick={fixUserRole} disabled={updating || !user}>
                    {updating ? "Actualizando..." : "Arreglar Rol de Usuario"}
                  </Button>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert
                    variant="default"
                    className="bg-green-50 text-green-800 border-green-200"
                  >
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
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
