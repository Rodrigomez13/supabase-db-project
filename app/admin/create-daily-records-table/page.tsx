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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

export default function CreateDailyRecordsTablePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const createTable = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // SQL para crear la tabla de registros diarios
      const sql = `
        -- Crear tabla para registros diarios de servidores
        CREATE TABLE IF NOT EXISTS server_daily_records (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          total_leads INTEGER NOT NULL DEFAULT 0,
          total_conversions INTEGER NOT NULL DEFAULT 0,
          total_spent DECIMAL(10, 2) NOT NULL DEFAULT 0,
          conversion_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
          cost_per_lead DECIMAL(10, 2) NOT NULL DEFAULT 0,
          cost_per_conversion DECIMAL(10, 2) NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(server_id, date)
        );

        -- Agregar columnas para totales en la tabla ads
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS total_leads INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS total_conversions INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10, 2) NOT NULL DEFAULT 0;

        -- Crear índices para mejorar el rendimiento
        CREATE INDEX IF NOT EXISTS idx_server_daily_records_server_id ON server_daily_records(server_id);
        CREATE INDEX IF NOT EXISTS idx_server_daily_records_date ON server_daily_records(date);
      `;

      const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

      if (error) throw error;

      setResult({
        success: true,
        message: "Tabla de registros diarios creada correctamente",
      });
    } catch (error: any) {
      console.error("Error creating table:", error);
      setResult({
        success: false,
        message: `Error al crear la tabla: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Crear Tabla de Registros Diarios</CardTitle>
          <CardDescription>
            Esta acción creará la tabla para almacenar los registros diarios de
            los servidores y agregará columnas para totales en la tabla de
            anuncios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className="mb-4"
            >
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <p>Esta operación creará:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Una tabla `server_daily_records` para almacenar los registros
                diarios de cada servidor
              </li>
              <li>
                Columnas adicionales en la tabla `ads` para llevar un histórico
                de totales
              </li>
              <li>Índices para optimizar las consultas</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={createTable} disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Tabla"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
