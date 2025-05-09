"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

export default function FixServerDailyRecordsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const fixTable = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // SQL para corregir la tabla server_daily_records
      const sql = `
  -- Verificar si la tabla existe y tiene la estructura correcta
  DO $$
  BEGIN
    -- Verificar si hay alguna columna con nombre incorrecto (por ejemplo, total_leads en lugar de leads)
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'server_daily_records' 
      AND column_name = 'total_leads'
    ) THEN
      -- Renombrar la columna si existe
      ALTER TABLE server_daily_records RENAME COLUMN total_leads TO leads;
    END IF;
    
    -- Verificar si hay alguna columna con nombre incorrecto (por ejemplo, total_conversions en lugar de conversions)
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'server_daily_records' 
      AND column_name = 'total_conversions'
    ) THEN
      -- Renombrar la columna si existe
      ALTER TABLE server_daily_records RENAME COLUMN total_conversions TO conversions;
    END IF;
  END
  $$;
`

      const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

      if (error) throw error

      setResult({
        success: true,
        message: "Tabla server_daily_records corregida correctamente",
      })
    } catch (error: any) {
      console.error("Error fixing table:", error)
      setResult({
        success: false,
        message: `Error al corregir la tabla: ${error.message}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Corregir Tabla de Registros Diarios</CardTitle>
          <CardDescription>
            Esta acción corregirá la estructura de la tabla server_daily_records para asegurar que tenga todas las
            columnas necesarias con los nombres correctos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <p>Esta operación realizará las siguientes correcciones:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Verificar y corregir nombres de columnas para que coincidan con la estructura de la tabla</li>
              <li>Renombrar `total_leads` a `leads` si existe</li>
              <li>Renombrar `total_conversions` a `conversions` si existe</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={fixTable} disabled={isLoading}>
            {isLoading ? "Corrigiendo..." : "Corregir Tabla"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
