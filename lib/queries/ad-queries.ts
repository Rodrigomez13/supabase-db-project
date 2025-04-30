import { safeQuery, safeInsert, safeUpdate, safeDelete } from "../safe-query"

export interface Ad {
  id: string
  name: string
  ad_id: string
  creative_type: string
  status: string
  adset_id: string
  created_at: string
  ad_sets?: {
    name: string
  }
}

/**
 * Obtiene todos los anuncios
 */
export async function getAds(): Promise<Ad[]> {
  return safeQuery<Ad>("ads", {
    orderBy: { column: "created_at", ascending: false },
    relationships: "ad_sets (name)",
  })
}

/**
 * Obtiene un anuncio por su ID
 */
export async function getAdById(id: string): Promise<Ad | null> {
  try {
    const ads = await safeQuery<Ad>("ads", {
      where: { id },
      relationships: "ad_sets (name)",
      single: true,
    })
    return ads[0] || null
  } catch (error) {
    console.error("Error en getAdById:", error)
    return null
  }
}

/**
 * Crea un nuevo anuncio
 */
export async function createAd(data: Omit<Ad, "id" | "created_at">): Promise<Ad> {
  return safeInsert<Ad>("ads", data)
}

/**
 * Actualiza un anuncio existente
 */
export async function updateAd(id: string, data: Partial<Ad>): Promise<Ad> {
  return safeUpdate<Ad>("ads", id, data)
}

/**
 * Elimina un anuncio
 */
export async function deleteAd(id: string): Promise<{ success: boolean; error?: string }> {
  return safeDelete("ads", id)
}
