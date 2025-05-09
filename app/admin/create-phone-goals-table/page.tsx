"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/components/ui/use-toast"

export default function CreatePhoneGoalsTablePage() {
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const supabase = createClientComponentClient()

  const handleCreateTable = async () => {
    setIsCreating(true)
    setResult(null)

    try {
      // Leer el contenido del archivo SQL
      const response = await fetch("/api/create-phone-goals-table")
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setResult({
        success: true,
        message: "Tabla de metas de teléfonos creada correctamente",
      })

      toast({
        title: "Éxito",
        description: "Tabla de metas de teléfonos creada correctamente",
      })
    } catch (error: any) {
      console.error("Error creating phone goals table:", error)
      setResult({
        success: false,
        message: `Error: ${error.message}`,
      })

      toast({
        title: "Error",
        description: `No se pudo crear la tabla: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Crear Tabla de Metas de Teléfonos</CardTitle>
          <CardDescription>
            Esta operación creará la tabla para almacenar las metas de conversiones para cada teléfono de franquicia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCreateTable} disabled={isCreating}>
            {isCreating ? "Creando..." : "Crear Tabla"}
          </Button>

          {result && (
            <div
              className={`mt-4 p-4 rounded-md ${
                result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {result.message}
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-medium">Detalles de la Tabla</h3>
            <pre className="mt-2 p-4 bg-gray-100 rounded-md overflow-auto text-sm">
              {`
CREATE TABLE IF NOT EXISTS phone_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_phone_id UUID NOT NULL REFERENCES franchise_phones(id) ON DELETE CASCADE,
  daily_goal INTEGER NOT NULL DEFAULT 5,
  weekly_goal INTEGER NOT NULL DEFAULT 30,
  monthly_goal INTEGER NOT NULL DEFAULT 120,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(franchise_phone_id)
);

-- Función para obtener el siguiente teléfono disponible para una franquicia
CREATE OR REPLACE FUNCTION get_next_available_phone(franchise_id UUID)
RETURNS UUID AS $$
DECLARE
  next_phone_id UUID;
BEGIN
  -- Obtener el siguiente teléfono activo que no haya superado su meta diaria
  SELECT fp.id INTO next_phone_id
  FROM franchise_phones fp
  LEFT JOIN phone_goals pg ON fp.id = pg.franchise_phone_id
  LEFT JOIN (
    -- Contar conversiones de hoy para cada teléfono
    SELECT l.franchise_phone_id, COUNT(*) as daily_count
    FROM leads l
    JOIN conversions c ON l.id = c.lead_id
    WHERE l.franchise_id = franchise_id
    AND c.date = CURRENT_DATE
    GROUP BY l.franchise_phone_id
  ) daily ON fp.id = daily.franchise_phone_id
  WHERE fp.franchise_id = franchise_id
  AND fp.is_active = true
  AND (daily.daily_count IS NULL OR daily.daily_count < COALESCE(pg.daily_goal, 5))
  ORDER BY fp.order_number
  LIMIT 1;

  -- Si no hay teléfonos disponibles que no hayan superado su meta, simplemente tomar el siguiente en orden
  IF next_phone_id IS NULL THEN
    SELECT fp.id INTO next_phone_id
    FROM franchise_phones fp
    WHERE fp.franchise_id = franchise_id
    AND fp.is_active = true
    ORDER BY fp.order_number
    LIMIT 1;
  END IF;

  RETURN next_phone_id;
END;
$$ LANGUAGE plpgsql;
              `}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
