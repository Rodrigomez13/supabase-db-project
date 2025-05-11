import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

interface AdSpendData {
  adset_id: string
  spend: number
  date: string
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autorización (puedes implementar un sistema más robusto)
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener datos del cuerpo
    const data = await request.json()

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Formato inválido. Se espera un array de datos" }, { status: 400 })
    }

    console.log(`Recibidos ${data.length} registros de gasto`)

    // Validar estructura de datos
    const validData: AdSpendData[] = data.filter((item) => {
      return item.adset_id && typeof item.spend === "number" && item.date
    })

    if (validData.length === 0) {
      return NextResponse.json({ error: "No hay datos válidos para importar" }, { status: 400 })
    }

    // Procesar cada registro
    const results = await Promise.all(
      validData.map(async (item) => {
        try {
          // Buscar el adset por ID
          const { data: adsetData, error: adsetError } = await supabase
            .from("ad_sets")
            .select("id")
            .eq("adset_id", item.adset_id)
            .maybeSingle()

          if (adsetError) {
            console.error(`Error al buscar adset ${item.adset_id}:`, adsetError)
            return { adset_id: item.adset_id, success: false, error: "Error al buscar adset" }
          }

          if (!adsetData) {
            return { adset_id: item.adset_id, success: false, error: "Adset no encontrado" }
          }

          // Actualizar gasto en server_ads
          const { data: serverAdsData, error: serverAdsError } = await supabase
            .from("server_ads")
            .select("id, spent")
            .eq("adset_id", adsetData.id)
            .eq("date", item.date)

          if (serverAdsError) {
            console.error(`Error al buscar server_ads para adset ${item.adset_id}:`, serverAdsError)
            return { adset_id: item.adset_id, success: false, error: "Error al buscar server_ads" }
          }

          if (serverAdsData && serverAdsData.length > 0) {
            // Actualizar registros existentes
            const updatePromises = serverAdsData.map(async (serverAd) => {
              const { error: updateError } = await supabase
                .from("server_ads")
                .update({ spent: item.spend })
                .eq("id", serverAd.id)

              if (updateError) {
                console.error(`Error al actualizar server_ad ${serverAd.id}:`, updateError)
                return { id: serverAd.id, success: false, error: updateError.message }
              }

              return { id: serverAd.id, success: true }
            })

            const updateResults = await Promise.all(updatePromises)
            return { adset_id: item.adset_id, success: true, updates: updateResults }
          } else {
            // No hay registros para actualizar
            return { adset_id: item.adset_id, success: true, message: "No hay registros para actualizar" }
          }
        } catch (error: any) {
          console.error(`Error procesando adset ${item.adset_id}:`, error)
          return { adset_id: item.adset_id, success: false, error: error.message }
        }
      }),
    )

    // Contar resultados
    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Procesados ${results.length} registros: ${successCount} exitosos, ${failCount} fallidos`,
      results,
    })
  } catch (error: any) {
    console.error("Error en importación de gastos:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
