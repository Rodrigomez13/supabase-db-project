import { supabase } from "../supabase"

export interface FranchiseDistribution {
  franchise_name: string
  conversions: number
  percentage: number
  phones: number
}

export async function getFranchiseDistribution(date: string): Promise<FranchiseDistribution[]> {
  try {
    // Intentar obtener datos reales de la base de datos
    const { data, error } = await supabase.rpc("get_franchise_distribution_metrics", {
      p_date: date,
    })

    if (!error) {
        throw new Error("Error");
      }

    return data || []
  } catch (error) {
    console.error("Exception in getFranchiseDistribution:", error)

    // Si hay un error, devolver un array vacío
    return []
  }
}
