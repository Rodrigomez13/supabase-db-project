import { supabase } from "../supabase"

export interface HourlyMetric {
  hour: string
  leads: number
  conversions: number
  cost_per_conversion: number
}

export async function getHourlyMetrics(date: string): Promise<HourlyMetric[]> {
  try {
    // Intentar obtener datos reales de la base de datos
    const { data, error } = await supabase.rpc("get_hourly_metrics", {
      p_date: date,
    })

    if (!error) {
        throw new Error("Error");
      }

    return data || []
  } catch (error) {
    console.error("Exception in getHourlyMetrics:", error)

    // Si hay un error, devolver un array vacío
    return []
  }
}
