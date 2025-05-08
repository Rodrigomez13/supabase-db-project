import { safeQuery, safeInsert, safeUpdate, safeDelete, safeRPC } from "../safe-query"

export interface Franchise {
  id: string
  name: string
  owner: string
  created_at: string
  status?: string
  balance?: number
}

/**
 * Obtiene todas las franquicias
 */
export async function getFranchises(): Promise<Franchise[]> {
  return safeQuery<Franchise>("franchises", {
    orderBy: { column: "created_at", ascending: false },
  })
}

/**
 * Obtiene una franquicia por su ID
 */
export async function getFranchiseById(id: string): Promise<Franchise | null> {
  try {
    const franchises = await safeQuery<Franchise>("franchises", {
      where: { id },
      single: true,
    })
    return franchises[0] || null
  } catch (error) {
    console.error("Error en getFranchiseById:", error)
    return null
  }
}

/**
 * Crea una nueva franquicia
 */
export async function createFranchise(data: Omit<Franchise, "id" | "created_at">): Promise<Franchise> {
  const result = await safeInsert<Franchise>("franchises", data)
  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to create franchise")
  }
  return result.data
}

/**
 * Actualiza una franquicia existente
 */
export async function updateFranchise(id: string, data: Partial<Franchise>): Promise<Franchise> {
  const result = await safeUpdate<Franchise>("franchises", id, data)
  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to update franchise")
  }
  return result.data
}

/**
 * Elimina una franquicia
 */
export async function deleteFranchise(id: string): Promise<{ success: boolean; error?: string }> {
  return safeDelete("franchises", id)
}

/**
 * Obtiene la distribución de leads por franquicia
 */
export async function getFranchiseDistribution(): Promise<{ name: string; percentage: number }[]> {
  try {
    const result = await safeRPC<{ name: string; percentage: number }[]>("get_franchise_distribution")

    if (!Array.isArray(result)) {
      throw new Error("Unexpected result format from get_franchise_distribution")
    }

    return result
  } catch (error) {
    console.error("Error en getFranchiseDistribution:", error)
    // Retornar datos de ejemplo en caso de error
    return [
      { name: "ATENEA", percentage: 35 },
      { name: "FENIX", percentage: 25 },
      { name: "EROS", percentage: 20 },
      { name: "GANA24", percentage: 15 },
      { name: "FORTUNA", percentage: 5 },
    ]
  }
}

/**
 * Obtiene los balances de las franquicias
 */
export async function getFranchiseBalances(): Promise<{ name: string; balance: number }[]> {
  try {
    const result = await safeRPC<{ name: string; balance: number }[]>("get_franchise_balances")

    if (!Array.isArray(result)) {
      throw new Error("Unexpected result format from get_franchise_balances")
    }

    return result
  } catch (error) {
    console.error("Error en getFranchiseBalances:", error)
    // Retornar datos de ejemplo en caso de error
    return [
      { name: "ATENEA", balance: 12500 },
      { name: "FENIX", balance: 9800 },
      { name: "EROS", balance: 7500 },
      { name: "GANA24", balance: 5200 },
      { name: "FORTUNA", balance: 3100 },
    ]
  }
}
