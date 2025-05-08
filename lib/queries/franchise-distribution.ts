import { supabase } from "../supabase"

export interface FranchiseDistribution {
  franchise_name: string
  conversions: number
  percentage: number
  phones: number
  active_phones: number
}

/**
 * Obtiene la distribución de conversiones por franquicia para una fecha específica
 * @param date Fecha en formato YYYY-MM-DD
 * @returns Array con la distribución de conversiones por franquicia
 */
export async function getFranchiseDistribution(date: string): Promise<FranchiseDistribution[]> {
  try {
    // Consulta para obtener conversiones por franquicia
    const { data, error } = await supabase
      .from("franchises")
      .select(`
        id,
        name,
        conversions:conversions!inner(id)
      `)
      .order("name")

    if (error) {
      console.error("Error fetching franchise distribution:", error.message || error || "Unknown error")
      return []
    }

    // Procesar los datos para contar conversiones por franquicia
    const franchiseData = data.map((franchise) => {
      const conversionCount = Array.isArray(franchise.conversions) ? franchise.conversions.length : 0
      return {
        franchise_id: franchise.id,
        franchise_name: franchise.name,
        conversions: conversionCount,
      }
    })

    // Calcular el total de conversiones para los porcentajes
    const totalConversions = franchiseData.reduce((sum, item) => sum + item.conversions, 0)

    // Obtener información de teléfonos por franquicia
    const { data: phonesData, error: phonesError } = await supabase
      .from("franchise_phones")
      .select("franchise_id, is_active")

    if (phonesError) {
      console.error("Error fetching phones data:", phonesError)
    }

    // Crear un mapa de franquicias a teléfonos
    const phonesByFranchiseId: Record<string, { total: number; Activo: number }> = {}

    if (phonesData) {
      // Agrupar teléfonos por franchise_id
      phonesData.forEach((item: { franchise_id: string; is_active: boolean }) => {
        const franchiseId = item.franchise_id
        if (!phonesByFranchiseId[franchiseId]) {
          phonesByFranchiseId[franchiseId] = { total: 0, Activo: 0 }
        }
        phonesByFranchiseId[franchiseId].total += 1
        if (item.is_active) {
          phonesByFranchiseId[franchiseId].Activo += 1
        }
      })
    }

    // Formatear los datos finales
    return franchiseData.map((item) => {
      const phones = phonesByFranchiseId[item.franchise_id] || { total: 0, Activo: 0 }

      return {
        franchise_name: item.franchise_name,
        conversions: item.conversions,
        percentage: totalConversions > 0 ? (item.conversions / totalConversions) * 100 : 0,
        phones: phones.total,
        active_phones: phones.Activo,
      }
    })
  } catch (error) {
    console.error("Exception in getFranchiseDistribution:", error)
    return []
  }
}
