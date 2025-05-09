"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function UpdateFranchisePhonesTablePage() {
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const supabase = createClientComponentClient()

  const sql = `
-- Agregar nuevas columnas a la tabla franchise_phones
ALTER TABLE public.franchise_phones 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Primero eliminar la función existente
DROP FUNCTION IF EXISTS get_franchise_phones(UUID);

-- Luego recrear la función con los nuevos campos
CREATE OR REPLACE FUNCTION get_franchise_phones(p_franchise_id UUID)
RETURNS TABLE (
  id UUID,
  franchise_id UUID,
  phone_number VARCHAR(20),
  order_number INTEGER,
  is_active BOOLEAN,
  daily_goal INTEGER,
  notes TEXT,
  category VARCHAR(50),
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fp.id,
    fp.franchise_id,
    fp.phone_number,
    fp.order_number,
    fp.is_active,
    fp.daily_goal,
    fp.notes,
    fp.category,
    fp.tags,
    fp.created_at,
    fp.updated_at
  FROM 
    public.franchise_phones fp
  WHERE 
    fp.franchise_id = p_franchise_id
  ORDER BY 
    fp.order_number ASC;
END;
$$ LANGUAGE plpgsql;
  `

  const executeSQL = async () => {
    try {
      setIsExecuting(true)
      setResult(null)

      const { error } = await supabase.rpc("execute_sql", { sql_query: sql })

      if (error) {
        throw error
      }

      setResult({
        success: true,
        message: "La tabla de teléfonos de franquicias se ha actualizado correctamente.",
      })
    } catch (error: any) {
      console.error("Error executing SQL:", error)
      setResult({
        success: false,
        message: `Error al ejecutar el SQL: ${error.message || "Error desconocido"}`,
      })
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Actualizar Tabla de Teléfonos de Franquicias</CardTitle>
          <CardDescription>
            Este script agregará nuevos campos a la tabla de teléfonos de franquicias: notas, categoría y etiquetas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
            <code>{sql}</code>
          </pre>

          {result && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className={`mt-4 ${result.success ? "bg-green-50 border-green-200" : ""}`}
            >
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={executeSQL} disabled={isExecuting}>
            {isExecuting ? "Ejecutando..." : "Ejecutar SQL"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
