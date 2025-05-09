"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

export default function CreateImprovedViewsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function createImprovedViews() {
    try {
      setLoading(true)
      setResult(null)

      // SQL para crear la vista mejorada de server_ads
      const serverAdsViewSQL = `
        CREATE OR REPLACE VIEW server_ads_view AS
        SELECT 
            sa.id,
            sa.server_id,
            sa.ad_id,
            sa.api_id,
            sa.daily_budget,
            sa.leads,
            sa.loads,
            sa.spent,
            sa.date,
            sa.created_at,
            sa.updated_at,
            a.name AS ad_name,
            a.description AS ad_description,
            a.adset_id,
            ads.name AS adset_name,
            ads.business_manager_id,
            bm.name AS bm_name,
            api.name AS api_name,
            CASE 
                WHEN sa.leads > 0 THEN (sa.loads::float / sa.leads) * 100 
                ELSE 0 
            END AS conversion_rate,
            CASE 
                WHEN sa.leads > 0 THEN sa.spent / sa.leads 
                ELSE 0 
            END AS cost_per_lead,
            CASE 
                WHEN sa.loads > 0 THEN sa.spent / sa.loads 
                ELSE 0 
            END AS cost_per_load
        FROM 
            server_ads sa
        LEFT JOIN 
            ads a ON sa.ad_id = a.id
        LEFT JOIN 
            ad_sets ads ON a.adset_id = ads.id
        LEFT JOIN 
            business_managers bm ON ads.business_manager_id = bm.id
        LEFT JOIN 
            apis api ON sa.api_id = api.id;

        GRANT SELECT ON server_ads_view TO authenticated;
        GRANT SELECT ON server_ads_view TO anon;
      `

      // SQL para crear la vista mejorada de server_performance
      const serverPerformanceViewSQL = `
        CREATE OR REPLACE VIEW server_performance AS
        SELECT 
            s.id AS server_id,
            s.name AS server_name,
            sdr.date,
            sdr.total_leads,
            sdr.total_conversions AS total_loads,
            sdr.total_spent,
            sdr.total_cost,
            sdr.conversion_rate,
            sdr.cost_per_lead,
            sdr.cost_per_conversion AS cost_per_load
        FROM 
            servers s
        LEFT JOIN 
            server_daily_records sdr ON s.id = sdr.server_id
        WHERE 
            sdr.id IS NOT NULL
        ORDER BY 
            sdr.date DESC;

        GRANT SELECT ON server_performance TO authenticated;
        GRANT SELECT ON server_performance TO anon;
      `

      // Ejecutar las consultas SQL
      const { error: error1 } = await supabase.rpc("exec_sql", { sql: serverAdsViewSQL })
      if (error1) throw new Error(`Error al crear server_ads_view: ${error1.message}`)

      const { error: error2 } = await supabase.rpc("exec_sql", { sql: serverPerformanceViewSQL })
      if (error2) throw new Error(`Error al crear server_performance: ${error2.message}`)

      setResult("Vistas mejoradas creadas correctamente")
      toast({
        title: "Éxito",
        description: "Las vistas mejoradas se han creado correctamente",
      })
    } catch (error: any) {
      console.error("Error creating improved views:", error)
      setResult(`Error: ${error.message}`)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Crear Vistas Mejoradas</CardTitle>
          <CardDescription>
            Crea vistas SQL mejoradas para optimizar las consultas de anuncios de servidor y métricas de rendimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Este proceso creará o actualizará las siguientes vistas:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>
              <strong>server_ads_view</strong>: Vista mejorada de anuncios de servidor con información relacionada
            </li>
            <li>
              <strong>server_performance</strong>: Vista de rendimiento de servidores con métricas agregadas
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Nota: Este proceso sobrescribirá las vistas existentes si ya existen.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <Button onClick={createImprovedViews} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando vistas...
              </>
            ) : (
              "Crear Vistas Mejoradas"
            )}
          </Button>

          {result && (
            <div
              className={`p-4 rounded-md w-full ${result.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
            >
              {result}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
