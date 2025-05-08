import { supabase } from "../supabase"
import { safeQuery, safeInsert, safeUpdate, safeDelete } from "../safe-query"

export interface Server {
  id: string
  name: string
  coefficient: number
  is_active: boolean
  description?: string
  created_at: string
  default_franchise_id?: string | null
}

export interface ServerMetrics {
  leads: number
  conversions: number
  conversion_rate: number
  spend: number
  cost_per_lead: number
  cost_per_conversion: number
}

// Definimos interfaces para las opciones de consulta
interface QueryOptions {
  filter?: {
    column: string
    operator: string
    value: any
  }
  orderBy?: {
    column: string
    order: "asc" | "desc"
  }
  select?: string
  ascending?: boolean
}

// Función para obtener todos los servidores
export async function getServers(): Promise<Server[]> {
  try {
    const data = await safeQuery<Server>("servers", {
      orderBy: { column: "created_at", ascending: false },
    })
    return data
  } catch (error) {
    console.error("Error in getServers:", error)
    throw error
  }
}

// Función para obtener servidores activos
export async function getActiveServers(): Promise<Server[]> {
  try {
    const data = await safeQuery<Server>("servers", {
      where: { is_active: true },
      orderBy: { column: "created_at", ascending: false },
    })
    return data
  } catch (error) {
    console.error("Error in getActiveServers:", error)
    return []
  }
}

// Función para obtener un servidor por ID
export async function getServerById(id: string): Promise<Server | null> {
  try {
    const data = await safeQuery<Server>("servers", {
      where: { id },
      single: true,
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

// FUNCIÓN UNIFICADA: Obtiene todas las métricas de un servidor sumando todos sus anuncios activos
export async function getDailyServerMetrics(serverId: string, date?: string): Promise<ServerMetrics> {
  try {
    console.log(`Obteniendo métricas para servidor: ${serverId}, fecha: ${date || "actual"}`)

    // Si no se proporciona fecha, usar la fecha actual
    const targetDate = date ?? new Date().toISOString().split("T")[0]

    // Obtener todos los anuncios del servidor sin filtrar por fecha para tener datos más completos
    const { data: serverAdsData, error: serverAdsError } = await supabase
      .from("server_ads")
      .select("leads, loads, spent")
      .eq("server_id", serverId)

    if (serverAdsError) {
      console.error("Error al obtener anuncios del servidor:", serverAdsError)
      throw serverAdsError
    }

    console.log(`Anuncios encontrados para servidor ${serverId}:`, serverAdsData?.length || 0)

    // Calcular métricas sumando todos los anuncios
    const leads = serverAdsData?.reduce((sum, item) => sum + (Number(item.leads) || 0), 0) || 0
    const conversions = serverAdsData?.reduce((sum, item) => sum + (Number(item.loads) || 0), 0) || 0
    const spend = serverAdsData?.reduce((sum, item) => sum + (Number(item.spent) || 0), 0) || 0

    // Calcular tasas y costos
    const conversion_rate = leads > 0 ? (conversions / leads) * 100 : 0
    const cost_per_lead = leads > 0 ? spend / leads : 0
    const cost_per_conversion = conversions > 0 ? spend / conversions : 0

    console.log(`Métricas calculadas para servidor ${serverId}:`, {
      leads,
      conversions,
      conversion_rate,
      spend,
      cost_per_lead,
      cost_per_conversion,
    })

    return {
      leads,
      conversions,
      conversion_rate,
      spend,
      cost_per_lead,
      cost_per_conversion,
    }
  } catch (error) {
    console.error(`Error in getDailyServerMetrics for serverId ${serverId}:`, error)
    // Devolver métricas vacías en caso de error
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

// Función para obtener métricas diarias de todos los servidores activos
export async function getAllActiveServersDailyMetrics(date?: string): Promise<ServerMetrics> {
  try {
    // Si no se proporciona fecha, usar la fecha actual
    const targetDate = date ?? new Date().toISOString().split("T")[0]

    // Primero obtenemos todos los servidores activos
    const activeServers = await getActiveServers()

    if (activeServers.length === 0) {
      return {
        leads: 0,
        conversions: 0,
        conversion_rate: 0,
        spend: 0,
        cost_per_lead: 0,
        cost_per_conversion: 0,
      }
    }

    // Obtenemos los IDs de los servidores activos
    const activeServerIds = activeServers.map((server) => server.id)

    // Consultar datos de todos los servidores activos sin filtrar por fecha
    const { data: adsData, error: adsError } = await supabase
      .from("server_ads")
      .select("leads, loads, spent")
      .in("server_id", activeServerIds)

    if (adsError) {
      console.error("Error al consultar server_ads para todos los servidores:", adsError)
      throw adsError
    }

    // Calcular métricas totales
    const leads = adsData?.reduce((sum, item) => sum + (Number(item.leads) || 0), 0) || 0
    const conversions = adsData?.reduce((sum, item) => sum + (Number(item.loads) || 0), 0) || 0
    const spend = adsData?.reduce((sum, item) => sum + (Number(item.spent) || 0), 0) || 0

    // Calcular tasas y costos
    const conversion_rate = leads > 0 ? (conversions / leads) * 100 : 0
    const cost_per_lead = leads > 0 ? spend / leads : 0
    const cost_per_conversion = conversions > 0 ? spend / conversions : 0

    return {
      leads,
      conversions,
      conversion_rate,
      spend,
      cost_per_lead,
      cost_per_conversion,
    }
  } catch (error) {
    console.error(`Error in getAllActiveServersDailyMetrics:`, error)
    // Devolver métricas vacías en caso de error
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
    console.log(`Obteniendo datos de progreso diario para servidor: ${serverId}`)

    // Obtenemos datos de los últimos 7 días
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 6) // 7 días incluyendo hoy

    // Formateamos las fechas para la consulta
    const startDateStr = startDate.toISOString().split("T")[0]
    const endDateStr = endDate.toISOString().split("T")[0]

    // Consultamos todos los anuncios del servidor
    const { data, error } = await supabase
      .from("server_ads")
      .select("date, leads, loads, spent")
      .eq("server_id", serverId)
      .order("date")

    if (error) {
      console.error(`Error fetching daily progress data: ${error.message}`)
      throw error
    }

    console.log(`Anuncios encontrados para gráfico: ${data?.length || 0}`)

    // Agrupamos por fecha
    const dailyData: Record<string, { leads: number; loads: number; spent: number }> = {}

    // Inicializamos todas las fechas con valores cero
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = new Date(d).toISOString().split("T")[0]
      dailyData[dateStr] = { leads: 0, loads: 0, spent: 0 }
    }

    // Sumamos los datos de todos los anuncios por fecha
    data?.forEach((item) => {
      const date = item.date
      if (dailyData[date]) {
        dailyData[date].leads += Number(item.leads) || 0
        dailyData[date].loads += Number(item.loads) || 0
        dailyData[date].spent += Number(item.spent) || 0
      }
    })

    // Generamos array de fechas para los últimos 7 días
    const dates: string[] = []
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
          label: "Conversiones",
          data: dates.map((date) => dailyData[date]?.loads || 0),
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          tension: 0.4,
        },
      ],
    }

    console.log("Datos de gráfico generados:", chartData)
    return chartData
  } catch (error) {
    console.error(`Error in getDailyProgressData: ${error}`)

    // Devolver datos vacíos para el gráfico
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 6)

    const dates: string[] = []
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split("T")[0])
    }

    return {
      labels: dates.map((date) => {
        const d = new Date(date)
        return d.toLocaleDateString("es-ES", { weekday: "short" })
      }),
      datasets: [
        {
          label: "Leads",
          data: dates.map(() => 0),
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.2)",
          tension: 0.4,
        },
        {
          label: "Conversiones",
          data: dates.map(() => 0),
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          tension: 0.4,
        },
      ],
    }
  }
}

// Función para obtener los anuncios de un servidor
export async function getServerAds(serverId: string) {
  try {
    console.log(`Obteniendo anuncios para servidor: ${serverId}`)

    const { data, error } = await supabase
      .from("server_ads")
      .select(`
        id,
        server_id,
        ad_id,
        leads,
        loads,
        spent,
        date,
        ads (
          name,
          ad_id,
          description
        )
      `)
      .eq("server_id", serverId)
      .order("date", { ascending: false })

    if (error) {
      console.error(`Error al obtener anuncios del servidor: ${error.message}`)
      throw error
    }

    console.log(`Anuncios obtenidos: ${data?.length || 0}`)
    return data || []
  } catch (error) {
    console.error(`Error in getServerAds for serverId ${serverId}:`, error)
    return []
  }
}

export async function updateServerFranchise(
  serverId: string,
  franchiseId: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("servers").update({ default_franchise_id: franchiseId }).eq("id", serverId)

    if (error) {
      console.error(`Error updating server's default franchise:`, error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error(`Error in updateServerFranchise for serverId ${serverId}:`, error)
    return { success: false, error: error.message }
  }
}
