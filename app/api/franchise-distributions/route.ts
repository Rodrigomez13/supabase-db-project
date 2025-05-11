import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]
    const serverId = searchParams.get("server_id") || null

    console.log("Obteniendo distribuciones para:", { date, serverId })

    // Intentar usar la función get_franchise_distribution
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_franchise_distribution", {
        p_date: date,
        ...(serverId ? { p_server_id: serverId } : {}),
      })

      if (!rpcError && rpcData && rpcData.length > 0) {
        return NextResponse.json({ success: true, data: rpcData })
      } else if (rpcError) {
        console.warn("Error al usar get_franchise_distribution:", rpcError)
      }
    } catch (rpcErr) {
      console.warn("Error al usar get_franchise_distribution:", rpcErr)
    }

    // Intentar con get_lead_distribution si la primera falló
    try {
      const { data: leadData, error: leadError } = await supabase.rpc("get_lead_distribution", {
        p_date: date,
        ...(serverId ? { p_server_id: serverId } : {}),
      })

      if (!leadError && leadData && leadData.length > 0) {
        return NextResponse.json({ success: true, data: leadData })
      } else if (leadError) {
        console.warn("Error al usar get_lead_distribution:", leadError)
      }
    } catch (leadErr) {
      console.warn("Error al usar get_lead_distribution:", leadErr)
    }

    // Método alternativo: consulta directa a la tabla lead_distributions
    let query = supabase
      .from("lead_distributions")
      .select(
        `
        id,
        date,
        franchise_id,
        server_id,
        leads_count,
        conversions_count,
        franchises:franchise_id (id, name)
      `,
      )
      .eq("date", date)

    if (serverId) {
      query = query.eq("server_id", serverId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error al obtener distribuciones:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Procesar los datos para el formato esperado
    const totalLeads = data.reduce((sum, item) => sum + (item.leads_count || 0), 0)

    const processedData = data.reduce((acc: any[], item) => {
      const franchiseId = item.franchise_id
      const franchiseName = Array.isArray(item.franchises) && item.franchises[0]?.name || "Desconocida"

      // Buscar si ya existe esta franquicia en el acumulador
      const existingIndex = acc.findIndex((f) => f.franchise_id === franchiseId)

      if (existingIndex >= 0) {
        // Actualizar franquicia existente
        acc[existingIndex].leads_count += item.leads_count || 0
        acc[existingIndex].conversions_count += item.conversions_count || 0
      } else {
        // Agregar nueva franquicia
        acc.push({
          franchise_id: franchiseId,
          franchise_name: franchiseName,
          leads_count: item.leads_count || 0,
          conversions_count: item.conversions_count || 0,
          percentage: totalLeads > 0 ? ((item.leads_count || 0) / totalLeads) * 100 : 0,
        })
      }

      return acc
    }, [])

    // Recalcular porcentajes
    if (totalLeads > 0) {
      processedData.forEach((item) => {
        item.percentage = (item.leads_count / totalLeads) * 100
      })
    }

    // Ordenar por cantidad de leads
    processedData.sort((a, b) => b.leads_count - a.leads_count)

    return NextResponse.json({ success: true, data: processedData })
  } catch (error: any) {
    console.error("Error en API de distribuciones:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
