"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"

export default function CreateUserDistributionSettingsPage() {
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const sqlScript = `
-- Crear tabla para almacenar la configuración de distribución del usuario
CREATE TABLE IF NOT EXISTS user_distribution_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active_franchise_id UUID REFERENCES franchises(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Crear índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_user_distribution_settings_user_id ON user_distribution_settings(user_id);

-- Trigger para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION update_user_distribution_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_distribution_settings_updated_at_trigger ON user_distribution_settings;
CREATE TRIGGER update_user_distribution_settings_updated_at_trigger
BEFORE UPDATE ON user_distribution_settings
FOR EACH ROW
EXECUTE FUNCTION update_user_distribution_settings_updated_at();
`

  async function executeSQL() {
    setIsExecuting(true)
    setResult(null)
    setError(null)

    try {
      const { data, error } = await supabase.rpc("execute_sql", {
        sql_query: sqlScript,
      })

      if (error) throw error

      setResult("Tabla de configuración de distribución creada correctamente")
      toast({
        title: "Éxito",
        description: "Tabla de configuración de distribución creada correctamente",
      })
    } catch (err: any) {
      console.error("Error executing SQL:", err)
      setError(err.message || "Error al ejecutar el script SQL")
      toast({
        title: "Error",
        description: err.message || "Error al ejecutar el script SQL",
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Crear Tabla de Configuración de Distribución</h1>

      <Card>
        <CardHeader>
          <CardTitle>Crear Tabla de Configuración de Distribución</CardTitle>
          <CardDescription>
            Este script creará la tabla necesaria para almacenar la configuración de distribución de cada usuario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={sqlScript} readOnly className="min-h-[300px] font-mono text-sm" />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={executeSQL} disabled={isExecuting}>
            {isExecuting ? "Ejecutando..." : "Ejecutar Script SQL"}
          </Button>
        </CardFooter>
      </Card>

      {result && (
        <Card className="mt-6 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700">{result}</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="mt-6 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
