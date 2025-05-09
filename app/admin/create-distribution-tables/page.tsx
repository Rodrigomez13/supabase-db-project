"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function CreateDistributionTablesPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const createTables = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)
      setLog([])

      addLog("Iniciando creación de tablas de distribución...")

      // Crear tabla distribution_goals si no existe
      addLog("Creando tabla distribution_goals...")
      const { error: goalsError } = await supabase.rpc("execute_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS distribution_goals (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
            daily_goal INTEGER NOT NULL DEFAULT 0,
            priority INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(franchise_id)
          );
        `,
      })

      if (goalsError) throw new Error(`Error al crear tabla distribution_goals: ${goalsError.message}`)
      addLog("✅ Tabla distribution_goals creada correctamente")

      // Crear tabla daily_distribution si no existe
      addLog("Creando tabla daily_distribution...")
      const { error: dailyError } = await supabase.rpc("execute_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS daily_distribution (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            date DATE NOT NULL,
            franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
            franchise_phone_id UUID NOT NULL REFERENCES franchise_phones(id) ON DELETE CASCADE,
            conversions_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(date, franchise_id, franchise_phone_id)
          );
        `,
      })

      if (dailyError) throw new Error(`Error al crear tabla daily_distribution: ${dailyError.message}`)
      addLog("✅ Tabla daily_distribution creada correctamente")

      // Crear función get_next_franchise_phone
      addLog("Creando función get_next_franchise_phone...")
      const { error: functionError } = await supabase.rpc("execute_sql", {
        sql_query: `
          CREATE OR REPLACE FUNCTION get_next_franchise_phone(p_franchise_id UUID)
          RETURNS UUID
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            v_phone_id UUID;
            v_today DATE := CURRENT_DATE;
            v_count INTEGER;
          BEGIN
            -- Verificar si hay teléfonos activos para esta franquicia
            SELECT COUNT(*) INTO v_count
            FROM franchise_phones
            WHERE franchise_id = p_franchise_id AND is_active = true;
            
            IF v_count = 0 THEN
              RETURN NULL; -- No hay teléfonos activos
            END IF;
            
            -- Buscar teléfono con menos conversiones hoy
            SELECT fp.id INTO v_phone_id
            FROM franchise_phones fp
            LEFT JOIN (
              SELECT franchise_phone_id, SUM(conversions_count) as total
              FROM daily_distribution
              WHERE date = v_today AND franchise_id = p_franchise_id
              GROUP BY franchise_phone_id
            ) dd ON fp.id = dd.franchise_phone_id
            WHERE fp.franchise_id = p_franchise_id AND fp.is_active = true
            ORDER BY dd.total NULLS FIRST, fp.order_number
            LIMIT 1;
            
            RETURN v_phone_id;
          END;
          $$;
        `,
      })

      if (functionError) throw new Error(`Error al crear función get_next_franchise_phone: ${functionError.message}`)
      addLog("✅ Función get_next_franchise_phone creada correctamente")

      // Crear función get_next_franchise
      addLog("Creando función get_next_franchise...")
      const { error: nextFranchiseError } = await supabase.rpc("execute_sql", {
        sql_query: `
          CREATE OR REPLACE FUNCTION get_next_franchise()
          RETURNS UUID
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            v_franchise_id UUID;
            v_today DATE := CURRENT_DATE;
          BEGIN
            -- Buscar la primera franquicia activa que no haya alcanzado su meta diaria
            SELECT dg.franchise_id INTO v_franchise_id
            FROM distribution_goals dg
            LEFT JOIN (
              SELECT franchise_id, SUM(conversions_count) as total
              FROM daily_distribution
              WHERE date = v_today
              GROUP BY franchise_id
            ) dd ON dg.franchise_id = dd.franchise_id
            WHERE dg.is_active = true
            AND (dd.total IS NULL OR dd.total < dg.daily_goal)
            ORDER BY dg.priority
            LIMIT 1;
            
            -- Si todas alcanzaron sus metas, usar la primera por prioridad
            IF v_franchise_id IS NULL THEN
              SELECT franchise_id INTO v_franchise_id
              FROM distribution_goals
              WHERE is_active = true
              ORDER BY priority
              LIMIT 1;
            END IF;
            
            RETURN v_franchise_id;
          END;
          $$;
        `,
      })

      if (nextFranchiseError)
        throw new Error(`Error al crear función get_next_franchise: ${nextFranchiseError.message}`)
      addLog("✅ Función get_next_franchise creada correctamente")

      // Configurar políticas RLS
      addLog("Configurando políticas de seguridad...")
      const { error: rlsError } = await supabase.rpc("execute_sql", {
        sql_query: `
          -- Habilitar RLS en las tablas
          ALTER TABLE distribution_goals ENABLE ROW LEVEL SECURITY;
          ALTER TABLE daily_distribution ENABLE ROW LEVEL SECURITY;
          
          -- Crear políticas para distribution_goals
          DROP POLICY IF EXISTS "Todos pueden ver metas" ON distribution_goals;
          CREATE POLICY "Todos pueden ver metas" ON distribution_goals FOR SELECT USING (true);
          
          DROP POLICY IF EXISTS "Administradores pueden gestionar metas" ON distribution_goals;
          CREATE POLICY "Administradores pueden gestionar metas" ON distribution_goals 
            USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
            WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
          
          -- Crear políticas para daily_distribution
          DROP POLICY IF EXISTS "Todos pueden ver distribuciones" ON daily_distribution;
          CREATE POLICY "Todos pueden ver distribuciones" ON daily_distribution FOR SELECT USING (true);
          
          DROP POLICY IF EXISTS "Usuarios autenticados pueden gestionar distribuciones" ON daily_distribution;
          CREATE POLICY "Usuarios autenticados pueden gestionar distribuciones" ON daily_distribution 
            USING (auth.uid() IN (SELECT id FROM users))
            WITH CHECK (auth.uid() IN (SELECT id FROM users));
        `,
      })

      if (rlsError) throw new Error(`Error al configurar políticas RLS: ${rlsError.message}`)
      addLog("✅ Políticas de seguridad configuradas correctamente")

      setSuccess(true)
      addLog("✅ Todas las tablas y funciones de distribución creadas correctamente")
    } catch (err: any) {
      console.error("Error creating distribution tables:", err)
      setError(err.message)
      addLog(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const addLog = (message: string) => {
    setLog((prev) => [...prev, message])
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Crear Tablas de Distribución</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuración de Tablas de Distribución</CardTitle>
          <CardDescription>
            Este proceso creará las tablas y funciones necesarias para la distribución de conversiones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Este proceso creará:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Tabla <code>distribution_goals</code> para configurar metas diarias por franquicia
              </li>
              <li>
                Tabla <code>daily_distribution</code> para registrar distribuciones diarias
              </li>
              <li>
                Función <code>get_next_franchise_phone</code> para determinar el siguiente teléfono a asignar
              </li>
              <li>
                Función <code>get_next_franchise</code> para determinar la siguiente franquicia a asignar
              </li>
              <li>Políticas de seguridad para las nuevas tablas</li>
            </ul>

            <Button onClick={createTables} disabled={loading} className="mt-4">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando tablas...
                </>
              ) : (
                "Crear Tablas de Distribución"
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Éxito</AlertTitle>
              <AlertDescription>
                Tablas y funciones de distribución creadas correctamente. Ahora puedes configurar las metas de
                distribución en la página de administración.
              </AlertDescription>
            </Alert>
          )}

          {log.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Registro de operaciones:</h3>
              <div className="bg-muted p-4 rounded-md max-h-60 overflow-y-auto">
                {log.map((entry, index) => (
                  <div key={index} className="py-1 border-b border-muted-foreground/20 last:border-0">
                    <code className="text-sm font-mono">{entry}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
