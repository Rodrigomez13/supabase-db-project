"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface ServerAd {
  id: string
  server_id: string
  ad_id: string
  api_id: string
  daily_budget: number
  leads: number
  loads: number
  spent: number
  date: string
  name?: string
  adset_name?: string
  bm_name?: string
  api_name?: string
  conversion_rate?: number
  cost_per_lead?: number
  cost_per_load?: number
}

export interface ServerMetrics {
  total_leads: number
  total_loads: number
  total_spent: number
  total_cost: number
  cost_per_lead: number
  conversion_rate: number
}

export function useServerAds(serverId: string) {
  const [ads, setAds] = useState<ServerAd[]>([])
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!serverId) return

      setLoading(true)
      setError(null)

      try {
        // 1. Obtener anuncios del servidor
        const { data: adsData, error: adsError } = await supabase
          .from("server_ads_view")
          .select("*")
          .eq("server_id", serverId)

        if (adsError) {
          console.error("Error fetching server ads:", adsError)
          throw new Error(`Error al obtener anuncios: ${adsError.message}`)
        }

        // 2. Si no hay datos en la vista, intentar con la tabla original
        if (!adsData || adsData.length === 0) {
          const { data: rawAdsData, error: rawAdsError } = await supabase
            .from("server_ads")
            .select(`
              *,
              ads:ad_id (name, adset_id),
              apis:api_id (name)
            `)
            .eq("server_id", serverId)

          if (rawAdsError) {
            console.error("Error fetching raw server ads:", rawAdsError)
            throw new Error(`Error al obtener anuncios: ${rawAdsError.message}`)
          }

          // Procesar datos crudos
          if (rawAdsData) {
            const processedAds = await Promise.all(
              rawAdsData.map(async (ad) => {
                let adsetName = ""
                let bmName = ""

                // Obtener información del adset si existe
                if (ad.ads?.adset_id) {
                  const { data: adsetData } = await supabase
                    .from("ad_sets")
                    .select("name, business_manager_id")
                    .eq("id", ad.ads.adset_id)
                    .maybeSingle()

                  if (adsetData) {
                    adsetName = adsetData.name

                    // Obtener nombre del business manager
                    if (adsetData.business_manager_id) {
                      const { data: bmData } = await supabase
                        .from("business_managers")
                        .select("name")
                        .eq("id", adsetData.business_manager_id)
                        .maybeSingle()

                      if (bmData) {
                        bmName = bmData.name
                      }
                    }
                  }
                }

                // Calcular métricas
                const leads = ad.leads || 0
                const loads = ad.loads || 0
                const spent = ad.spent || 0
                const conversion_rate = leads > 0 ? (loads / leads) * 100 : 0
                const cost_per_lead = leads > 0 ? spent / leads : 0
                const cost_per_load = loads > 0 ? spent / loads : 0

                return {
                  ...ad,
                  name: ad.ads?.name || "Anuncio sin nombre",
                  adset_name: adsetName || "-",
                  bm_name: bmName || "-",
                  api_name: ad.apis?.name || "API desconocida",
                  conversion_rate,
                  cost_per_lead,
                  cost_per_load,
                }
              }),
            )
            setAds(processedAds)
          }
        } else {
          // Usar datos de la vista
          setAds(adsData)
        }

        // 3. Obtener métricas del servidor
        const { data: metricsData, error: metricsError } = await supabase
          .from("server_performance")
          .select("*")
          .eq("server_id", serverId)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (metricsError) {
          console.error("Error fetching server metrics:", metricsError)
          // No lanzamos error aquí para no interrumpir la carga de anuncios
        }

        if (metricsData) {
          setMetrics({
            total_leads: metricsData.total_leads || 0,
            total_loads: metricsData.total_loads || 0,
            total_spent: metricsData.total_spent || 0,
            total_cost: metricsData.total_cost || 0,
            cost_per_lead: metricsData.cost_per_lead || 0,
            conversion_rate: metricsData.conversion_rate || 0,
          })
        } else {
          // Si no hay datos en server_performance, intentar con server_metrics
          const { data: altMetricsData } = await supabase
            .from("server_metrics")
            .select("*")
            .eq("server_id", serverId)
            .maybeSingle()

          if (altMetricsData) {
            setMetrics({
              total_leads: altMetricsData.leads || 0,
              total_loads: altMetricsData.conversions || 0,
              total_spent: altMetricsData.spent || 0,
              total_cost: altMetricsData.cost || 0,
              cost_per_lead: altMetricsData.cost_per_lead || 0,
              conversion_rate: altMetricsData.conversion_rate || 0,
            })
          }
        }
      } catch (err: any) {
        console.error("Error in useServerAds:", err)
        setError(err.message || "Error desconocido al cargar datos")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [serverId])

  return { ads, metrics, loading, error }
}
