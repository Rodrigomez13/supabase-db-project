"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign } from "lucide-react"
import { StatCard } from "@/components/stat-card"

interface DashboardMetrics {
  leads: number
  conversions: number
  conversion_rate: number
  spend: number
  cost_per_lead: number
  cost_per_conversion: number
  leadChange?: number
  conversionChange?: number
  spendChange?: number
  costChange?: number
}

export function DashboardStats() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true)

        // Obtener fecha actual en formato ISO
        const today = new Date().toISOString().split("T")[0]

        // Aquí normalmente llamarías a una función para obtener métricas
        // Como ejemplo, usaré datos simulados
        // En un caso real, reemplazarías esto con una llamada a tu API o a Supabase

        // Ejemplo de consulta a Supabase (ajustar según tu estructura de datos)
        const { data: leadsData, error: leadsError } = await supabase
          .from("leads")
          .select("id, status")
          .eq("date", today)

        if (leadsError) throw leadsError

        const totalLeads = leadsData?.length || 0
        const totalConversions = leadsData?.filter((lead) => lead.status === "converted").length || 0

        // Obtener datos de gasto (ajustar según tu estructura)
        const { data: spendData, error: spendError } = await supabase
          .from("daily_metrics")
          .select("spend")
          .eq("date", today)
          .single()

        const spend = spendData?.spend || 0

        // Calcular métricas
        const conversion_rate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0
        const cost_per_lead = totalLeads > 0 ? spend / totalLeads : 0
        const cost_per_conversion = totalConversions > 0 ? spend / totalConversions : 0

        // Simular cambios (en un caso real, compararías con el día anterior)
        const leadChange = Math.floor(Math.random() * 20) - 10
        const conversionChange = Math.floor(Math.random() * 20) - 10
        const spendChange = Math.floor(Math.random() * 20) - 10
        const costChange = Math.floor(Math.random() * 20) - 10

        setMetrics({
          leads: totalLeads,
          conversions: totalConversions,
          conversion_rate,
          spend,
          cost_per_lead,
          cost_per_conversion,
          leadChange,
          conversionChange,
          spendChange,
          costChange,
        })
      } catch (error) {
        console.error("Error fetching metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [supabase])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border bg-background/5">
            <CardContent className="p-6">
              <div className="h-16 bg-[#133936] animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Leads Generados"
        value={metrics?.leads || 0}
        description="Hoy"
        trend={metrics?.leadChange && metrics.leadChange > 0 ? "up" : "down"}
        trendValue={`${Math.abs(metrics?.leadChange || 0)}%`}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <StatCard
        title="Conversiones"
        value={metrics?.conversions || 0}
        description="Hoy"
        trend={metrics?.conversionChange && metrics.conversionChange > 0 ? "up" : "down"}
        trendValue={`${Math.abs(metrics?.conversionChange || 0)}%`}
        icon={<ArrowUpRight className="h-4 w-4" />}
      />
      <StatCard
        title="Tasa de Conversión"
        value={`${(metrics?.conversion_rate || 0).toFixed(1)}%`}
        description="Hoy"
        trend={metrics?.costChange && metrics.costChange > 0 ? "up" : "down"}
        trendValue={`${Math.abs(metrics?.costChange || 0)}%`}
        icon={<ArrowDownRight className="h-4 w-4" />}
      />
      <StatCard
        title="Gasto Total"
        value={`$${(metrics?.spend || 0).toFixed(2)}`}
        description="Hoy"
        trend={metrics?.spendChange && metrics.spendChange > 0 ? "up" : "down"}
        trendValue={`${Math.abs(metrics?.spendChange || 0)}%`}
        icon={<DollarSign className="h-4 w-4" />}
      />
    </div>
  )
}
