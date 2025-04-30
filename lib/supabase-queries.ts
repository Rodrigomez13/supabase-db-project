import { supabase } from "./supabase"

// Definir interfaces para los tipos de datos
interface DashboardStats {
  totalLeads: number
  totalConversions: number
  conversionRate: number
  totalSpend: number
  totalBudget: number
  costPerConversion: number
  leadChange: number
  conversionChange: number
  spendChange: number
  costChange: number
}

interface ServerMetrics {
  leads: number
  conversions: number
  conversion_rate: number
  spend: number
  cost_per_lead: number
  cost_per_conversion: number
}

interface FranchiseData {
  id: string
  name: string
  percentage: number
}

interface FranchiseBalance {
  id: string
  name: string
  balance: number
}

interface Activity {
  id: string
  user: string
  action: string
  target: string
  server?: string
  time: string
  created_at?: string
  user_name?: string
  server_name?: string
}

interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    tension: number
  }>
}

interface DoughnutChartData {
  labels: string[]
  datasets: Array<{
    data: number[]
    backgroundColor: string[]
    borderColor: string[]
    borderWidth: number
  }>
}

// Función para obtener estadísticas generales del dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const { data, error } = await supabase.rpc("get_dashboard_stats")

    if (error) {
      console.error("Error fetching dashboard stats:", error)
      return {
        totalLeads: 0,
        totalConversions: 0,
        conversionRate: 0,
        totalSpend: 0,
        totalBudget: 0,
        costPerConversion: 0,
        leadChange: 0,
        conversionChange: 0,
        spendChange: 0,
        costChange: 0,
      }
    }

    return {
      totalLeads: data.total_leads ?? 0,
      totalConversions: data.total_conversions ?? 0,
      conversionRate: data.conversion_rate ?? 0,
      totalSpend: data.total_spend ?? 0,
      totalBudget: data.total_budget ?? 0,
      costPerConversion: data.cost_per_conversion ?? 0,
      leadChange: data.lead_change ?? 0,
      conversionChange: data.conversion_change ?? 0,
      spendChange: data.spend_change ?? 0,
      costChange: data.cost_change ?? 0,
    }
  } catch (error) {
    console.error("Exception in getDashboardStats:", error)
    return {
      totalLeads: 0,
      totalConversions: 0,
      conversionRate: 0,
      totalSpend: 0,
      totalBudget: 0,
      costPerConversion: 0,
      leadChange: 0,
      conversionChange: 0,
      spendChange: 0,
      costChange: 0,
    }
  }
}

// Función para obtener datos de servidores
export async function getServers(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from("servers").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching servers:", error)
      return []
    }

    return data ?? []
  } catch (error) {
    console.error("Exception in getServers:", error)
    return []
  }
}

// Función para obtener métricas de un servidor específico
export async function getServerMetrics(serverId: string): Promise<ServerMetrics> {
  try {
    const { data, error } = await supabase.rpc("get_server_metrics", {
      p_server_id: serverId,
    })

    if (error) {
      console.error("Error fetching server metrics:", error)
      return {
        leads: 0,
        conversions: 0,
        conversion_rate: 0,
        spend: 0,
        cost_per_lead: 0,
        cost_per_conversion: 0,
      }
    }

    return data
  } catch (error) {
    console.error("Exception in getServerMetrics:", error)
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

// Función para obtener distribución de franquicias
export async function getFranchiseDistribution(): Promise<FranchiseData[]> {
  try {
    const { data, error } = await supabase.rpc("get_franchise_distribution")

    if (error) {
      console.error("Error fetching franchise distribution:", error)
      return []
    }

    // Asegurarse de que cada franquicia tenga un ID único
    return (data ?? []).map((franchise: any, index: number) => ({
      id: `franchise-dist-${index}`,
      name: franchise.name ?? "",
      percentage: franchise.percentage ?? 0,
    }))
  } catch (error) {
    console.error("Exception in getFranchiseDistribution:", error)
    return []
  }
}

// Función para obtener balance de franquicias
export async function getFranchiseBalances(): Promise<FranchiseBalance[]> {
  try {
    const { data, error } = await supabase.rpc("get_franchise_balances")

    if (error) {
      console.error("Error fetching franchise balances:", error)
      return []
    }

    // Asegurarse de que cada franquicia tenga un ID único
    return (data ?? []).map((franchise: any, index: number) => ({
      id: `franchise-balance-${index}`,
      name: franchise.name ?? "",
      balance: franchise.balance ?? 0,
    }))
  } catch (error) {
    console.error("Exception in getFranchiseBalances:", error)
    return []
  }
}

// Función para obtener actividades recientes
export async function getRecentActivities(limit = 5): Promise<Activity[]> {
  try {
    const { data, error } = await supabase.rpc("get_recent_activities", {
      p_limit: limit,
    })

    if (error) {
      console.error("Error fetching recent activities:", error)
      return []
    }

    // Formatear actividades
    return (data ?? []).map((act: any, index: number) => {
      // Calcular tiempo relativo
      const createdAt = new Date(act.created_at)
      const now = new Date()
      const diffMs = now.getTime() - createdAt.getTime()
      const diffMins = Math.round(diffMs / 60000)

      let timeAgo
      if (diffMins < 60) {
        timeAgo = `hace ${diffMins} minutos`
      } else if (diffMins < 1440) {
        timeAgo = `hace ${Math.round(diffMins / 60)} horas`
      } else {
        timeAgo = `hace ${Math.round(diffMins / 1440)} días`
      }

      return {
        id: act.id ?? `activity-${index}`,
        user: act.user_name ?? "Sistema",
        action: act.action ?? "",
        target: act.target ?? "",
        server: act.server_name ? `Server ${act.server_name}` : undefined,
        time: timeAgo,
      }
    })
  } catch (error) {
    console.error("Exception in getRecentActivities:", error)
    return []
  }
}

// Función para obtener datos para gráficos de progreso diario
export async function getDailyProgressData(serverId?: string): Promise<ChartData | null> {
  try {
    const { data, error } = await supabase.rpc("get_daily_progress_data", {
      p_server_id: serverId ?? null,
    })

    if (error) {
      console.error("Error fetching daily progress data:", error)
      return null
    }

    // Formatear datos para el gráfico
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

    return {
      labels: data.map((item: any) => {
        const date = new Date(item.date)
        return days[date.getDay()]
      }),
      datasets: [
        {
          label: "Leads",
          data: data.map((item: any) => item.leads ?? 0),
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.2)",
          tension: 0.4,
        },
        {
          label: "Conversiones",
          data: data.map((item: any) => item.conversions ?? 0),
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          tension: 0.4,
        },
      ],
    }
  } catch (error) {
    console.error("Exception in getDailyProgressData:", error)
    return null
  }
}

// Función para obtener datos para gráficos de distribución de gastos
export async function getExpenseDistributionData(): Promise<DoughnutChartData | null> {
  try {
    // Obtenemos datos de gastos por servidor
    const { data: serverSpend, error: serverError } = await supabase.from("server_ads").select("server_id, spent")

    if (serverError) {
      console.error("Error fetching server spend data:", serverError)
      return null
    }

    // Agrupamos gastos por servidor
    const serverSpendMap: Record<string, number> = {}

    if (serverSpend) {
      serverSpend.forEach((item: any) => {
        const serverId = item.server_id
        if (!serverSpendMap[serverId]) {
          serverSpendMap[serverId] = 0
        }
        serverSpendMap[serverId] += Number(item.spent) || 0
      })
    }

    // Obtenemos nombres de servidores
    const serverIds = Object.keys(serverSpendMap)

    if (serverIds.length === 0) {
      // Si no hay datos, devolvemos datos de ejemplo
      return {
        labels: ["Publicidad", "Servidores", "Personal", "Software", "Otros"],
        datasets: [
          {
            data: [45, 25, 15, 10, 5],
            backgroundColor: [
              "rgba(16, 185, 129, 0.8)",
              "rgba(59, 130, 246, 0.8)",
              "rgba(249, 115, 22, 0.8)",
              "rgba(139, 92, 246, 0.8)",
              "rgba(236, 72, 153, 0.8)",
            ],
            borderColor: [
              "rgba(16, 185, 129, 1)",
              "rgba(59, 130, 246, 1)",
              "rgba(249, 115, 22, 1)",
              "rgba(139, 92, 246, 1)",
              "rgba(236, 72, 153, 1)",
            ],
            borderWidth: 1,
          },
        ],
      }
    }

    const { data: servers, error: serversError } = await supabase.from("servers").select("id, name").in("id", serverIds)

    if (serversError) {
      console.error("Error fetching server names:", serversError)
      return null
    }

    // Preparamos datos para el gráfico
    const chartData = servers
      .map((server: any) => ({
        name: server.name,
        amount: serverSpendMap[server.id] || 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    // Calculamos el total
    const total = chartData.reduce((sum, item) => sum + item.amount, 0)

    // Formatear datos para el gráfico
    return {
      labels: chartData.map((item) => item.name),
      datasets: [
        {
          data: chartData.map((item) => (total > 0 ? (item.amount / total) * 100 : 0)),
          backgroundColor: [
            "rgba(16, 185, 129, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(249, 115, 22, 0.8)",
            "rgba(139, 92, 246, 0.8)",
            "rgba(236, 72, 153, 0.8)",
            "rgba(220, 38, 38, 0.8)",
            "rgba(251, 191, 36, 0.8)",
          ].slice(0, chartData.length),
          borderColor: [
            "rgba(16, 185, 129, 1)",
            "rgba(59, 130, 246, 1)",
            "rgba(249, 115, 22, 1)",
            "rgba(139, 92, 246, 1)",
            "rgba(236, 72, 153, 1)",
            "rgba(220, 38, 38, 1)",
            "rgba(251, 191, 36, 1)",
          ].slice(0, chartData.length),
          borderWidth: 1,
        },
      ],
    }
  } catch (error) {
    console.error("Exception in getExpenseDistributionData:", error)
    return null
  }
}

// Función para obtener datos para gráficos de flujo de caja
export async function getCashFlowData(): Promise<ChartData | null> {
  try {
    // Obtenemos datos de los últimos 6 meses
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 5) // 6 meses incluyendo el actual

    // Formateamos las fechas para la consulta
    const months: string[] = []
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
      months.push(new Date(d).toISOString().split("T")[0].substring(0, 7)) // YYYY-MM
    }

    // Obtenemos datos de gastos por mes
    const expenseData = await Promise.all(
      months.map(async (month) => {
        const startOfMonth = `${month}-01`
        const endOfMonth = new Date(new Date(startOfMonth).setMonth(new Date(startOfMonth).getMonth() + 1) - 1)
          .toISOString()
          .split("T")[0]

        const { data, error } = await supabase
          .from("server_ads")
          .select("spent")
          .gte("created_at", startOfMonth)
          .lte("created_at", endOfMonth)

        if (error) {
          console.error(`Error fetching expenses for month ${month}:`, error)
          return { month, expenses: 0 }
        }

        const totalExpenses = data ? data.reduce((sum, item) => sum + (Number(item.spent) || 0), 0) : 0

        return { month, expenses: totalExpenses }
      }),
    )

    // Simulamos ingresos basados en gastos (ingresos = gastos * 1.5)
    const chartData = expenseData.map((item) => ({
      month: item.month,
      expenses: item.expenses,
      income: item.expenses * 1.5,
    }))

    // Formatear datos para el gráfico
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

    return {
      labels: chartData.map((item) => {
        const [year, month] = item.month.split("-")
        return `${monthNames[Number.parseInt(month) - 1]} ${year.substring(2)}`
      }),
      datasets: [
        {
          label: "Ingresos",
          data: chartData.map((item) => item.income),
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.2)",
          tension: 0.4,
        },
        {
          label: "Gastos",
          data: chartData.map((item) => item.expenses),
          borderColor: "#EF4444",
          backgroundColor: "rgba(239, 68, 68, 0.2)",
          tension: 0.4,
        },
      ],
    }
  } catch (error) {
    console.error("Exception in getCashFlowData:", error)
    return null
  }
}
