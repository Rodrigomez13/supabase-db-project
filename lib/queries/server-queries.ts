import { supabase } from "../supabase"
import { safeQuery, safeInsert, safeUpdate, safeDelete } from "../safe-query"

export interface Server {
  id: string
  name: string
  coefficient: number
  is_active: boolean
  description?: string
  created_at: string
}

export interface ServerMetrics {
  leads: number
  conversions: number
  conversion_rate: number
  spend: number
  cost_per_lead: number
  cost_per_conversion: number
}

// Función para obtener todos los servidores
export async function getServers(): Promise<Server[]> {
  try {
    const data = await safeQuery<Server>("servers", {
      orderBy: { column: "created_at", order: "desc" },
    })
    return data
  } catch (error) {
    console.error("Error in getServers:", error)
    throw error
  }
}

// Función para obtener un servidor por ID
export async function getServerById(id: string): Promise<Server | null> {
  try {
    const data = await safeQuery<Server>("servers", {
      filter: { column: "id", operator: "eq", value: id },
    })
    return data.length > 0 ? data[0] : null
  } catch (error) {
    console.error(`Error in getServerById for id ${id}:`, error)
    throw error
  }
}

// Función para crear un nuevo servidor
export async function createServer(serverData: Omit<Server, "id" | "created_at">) {
  try {
    return await safeInsert("servers", serverData)
  } catch (error) {
    console.error("Error in createServer:", error)
    throw error
  }
}

// Función para actualizar un servidor
export async function updateServer(id: string, serverData: Partial<Server>) {
  try {
    return await safeUpdate("servers", id, serverData)
  } catch (error) {
    console.error(`Error in updateServer for id ${id}:`, error)
    throw error
  }
}

// Función para eliminar un servidor
export async function deleteServer(id: string) {
  try {
    return await safeDelete("servers", id)
  } catch (error) {
    console.error(`Error in deleteServer for id ${id}:`, error)
    throw error
  }
}

// Función para obtener métricas de un servidor
export async function getServerMetrics(serverId: string): Promise<ServerMetrics> {
  try {
    // Intentamos obtener métricas de la vista server_metrics
    const data = await safeQuery<ServerMetrics>("server_metrics", {
      filter: { column: "server_id", operator: "eq", value: serverId },
    })

    if (data.length > 0) {
      return data[0]
    }

    // Si no hay datos en la vista, calculamos métricas básicas desde server_ads
    const serverAds = await safeQuery("server_ads", {
      select: "leads, loads, spent",
      filter: { column: "server_id", operator: "eq", value: serverId },
    })

    // Calculamos métricas básicas
    const leads = serverAds.reduce((sum, item) => sum + (item.leads || 0), 0)
    const conversions = serverAds.reduce((sum, item) => sum + (item.loads || 0), 0)
    const spend = serverAds.reduce((sum, item) => sum + (item.spent || 0), 0)

    return {
      leads,
      conversions,
      conversion_rate: leads > 0 ? (conversions / leads) * 100 : 0,
      spend,
      cost_per_lead: leads > 0 ? spend / leads : 0,
      cost_per_conversion: conversions > 0 ? spend / conversions : 0,
    }
  } catch (error) {
    console.error(`Error in getServerMetrics for serverId ${serverId}:`, error)
    // Devolvemos métricas vacías en caso de error
    return {
      leads: 0,
      conversions: 0,
      conversion_rate: 0,
      spend: 0,
      cost_per_lead: 0,
      cost_per_conversion: 0,
    }
  }
}

// Función para obtener datos para gráficos de progreso diario
export async function getDailyProgressData(serverId: string) {
  try {
    // Obtenemos datos de los últimos 7 días
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 6) // 7 días incluyendo hoy

    // Formateamos las fechas para la consulta
    const startDateStr = startDate.toISOString().split("T")[0]
    const endDateStr = endDate.toISOString().split("T")[0]

    // Consultamos datos diarios
    const { data, error } = await supabase
      .from("server_ads")
      .select("date, leads, loads, spent")
      .eq("server_id", serverId)
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date")

    if (error) {
      console.error(`Error fetching daily progress data: ${error.message}`)
      throw error
    }

    // Agrupamos por fecha
    const dailyData = {}
    data?.forEach((item) => {
      const date = item.date
      if (!dailyData[date]) {
        dailyData[date] = { leads: 0, loads: 0, spent: 0 }
      }
      dailyData[date].leads += item.leads || 0
      dailyData[date].loads += item.loads || 0
      dailyData[date].spent += item.spent || 0
    })

    // Generamos array de fechas para los últimos 7 días
    const dates = []
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split("T")[0])
    }

    // Preparamos datos para el gráfico
    const chartData = {
      labels: dates.map((date) => {
        const d = new Date(date)
        return d.toLocaleDateString("es-ES", { weekday: "short" })
      }),
      datasets: [
        {
          label: "Leads",
          data: dates.map((date) => dailyData[date]?.leads || 0),
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.2)",
          tension: 0.4,
        },
        {
          label: "Cargas",
          data: dates.map((date) => dailyData[date]?.loads || 0),
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          tension: 0.4,
        },
      ],
    }

    return chartData
  } catch (error) {
    console.error(`Error in getDailyProgressData: ${error}`)
    return null
  }
}
