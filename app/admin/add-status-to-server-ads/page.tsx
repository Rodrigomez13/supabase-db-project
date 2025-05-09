"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AddStatusToServerAdsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function runMigration() {
    try {
      setLoading(true);
      setResult(null);

      // Verificar si la columna ya existe
      const { data: columnExists, error: checkError } = await supabase.rpc(
        "check_column_exists",
        {
          p_table_name: "server_ads",
          p_column_name: "status",
        }
      );

      if (checkError) {
        throw new Error(`Error al verificar la columna: ${checkError.message}`);
      }

      if (columnExists) {
        setResult({
          success: true,
          message: "La columna 'status' ya existe en la tabla server_ads.",
        });
        return;
      }

      // Ejecutar la migración para agregar la columna
      const { error } = await supabase.rpc("execute_sql", {
        sql_query: `
          ALTER TABLE server_ads ADD COLUMN status TEXT DEFAULT 'Activo';
          COMMENT ON COLUMN server_ads.status IS 'Estado del anuncio en el servidor (Activo, Inactivo, Error, Error_de_Entrega, BM_Deshabilitado, etc.)';
        `,
      });

      if (error) {
        throw new Error(`Error al ejecutar la migración: ${error.message}`);
      }

      setResult({
        success: true,
        message:
          "La columna 'status' ha sido agregada correctamente a la tabla server_ads.",
      });
    } catch (err: any) {
      console.error("Error:", err);
      setResult({
        success: false,
        message:
          err.message || "Ha ocurrido un error al ejecutar la migración.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">
        Agregar Estado a Anuncios de Servidor
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Migración de Base de Datos</CardTitle>
          <CardDescription>
            Esta operación agregará una columna 'status' a la tabla server_ads
            para permitir gestionar el estado de los anuncios en cada servidor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            La columna 'status' permitirá establecer diferentes estados para los
            anuncios en los servidores, como:
          </p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Activo - Anuncio activo y funcionando</li>
            <li>Inactivo - Anuncio pausado temporalmente</li>
            <li>Error - Error en el anuncio</li>
            <li>Error_de_Entrega - Error en la entrega de mensajes</li>
            <li>Deshabilitado - Business Manager deshabilitado</li>
            <li>Cuenta_deshabilitada - Cuenta deshabilitada</li>
            <li>Violación_de_políticas - Violación de políticas</li>
          </ul>

          {result && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className="mb-4"
            >
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={runMigration} disabled={loading}>
            {loading ? "Ejecutando..." : "Ejecutar Migración"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
