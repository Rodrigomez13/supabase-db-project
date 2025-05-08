import { supabase } from "../supabase"

export interface HourlyMetric {
  hour: string
  leads: number
  conversions: number
  cost_per_conversion: number
}

/**
 * Obtiene las métricas por hora para una fecha específica
 * @param date Fecha en formato YYYY-MM-DD
 * @returns Array de métricas por hora
 */
export async function getHourlyMetrics(date: string): Promise<HourlyMetric[]> {
  try {
    // Intentar obtener datos reales de la base de datos
    const { data, error } = await supabase.rpc("get_hourly_metrics", {
      p_date: date,
    })

    if (error) {
      console.error("Error fetching hourly metrics:", error)
      // En lugar de lanzar el error, registramos y devolvemos un array vacío
      return []
    }

    // Verificar y normalizar los datos para asegurarnos de que tienen la estructura correcta
    if (data && Array.isArray(data)) {
      return data.map((item) => ({
        hour: item.hour || "",
        leads: typeof item.leads === "number" ? item.leads : 0,
        conversions: typeof item.conversions === "number" ? item.conversions : 0,
        cost_per_conversion: typeof item.cost_per_conversion === "number" ? item.cost_per_conversion : 0,
      }))
    }

    return []
  } catch (error) {
    console.error("Exception in getHourlyMetrics:", error)
    // Si hay un error, devolver un array vacío
    return []
  }
}
