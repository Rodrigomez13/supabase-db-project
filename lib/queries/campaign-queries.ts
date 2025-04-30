import { safeQuery, safeInsert, safeUpdate, safeDelete } from "../safe-query"

export interface Campaign {
  id: string
  name: string
  campaign_id: string
  objective: string
  status: string
  bm_id: string
  created_at: string
  business_managers?: {
    name: string
  }
}

/**
 * Obtiene todas las campañas
 */
export async function getCampaigns(): Promise<Campaign[]> {
  return safeQuery<Campaign>("campaigns", {
    orderBy: { column: "created_at", ascending: false },
    relationships: "business_managers (name)",
  })
}

/**
 * Obtiene una campaña por su ID
 */
export async function getCampaignById(id: string): Promise<Campaign | null> {
  try {
    const campaigns = await safeQuery<Campaign>("campaigns", {
      where: { id },
      relationships: "business_managers (name)",
      single: true,
    })
    return campaigns[0] || null
  } catch (error) {
    console.error("Error en getCampaignById:", error)
    return null
  }
}

/**
 * Crea una nueva campaña
 */
export async function createCampaign(data: Omit<Campaign, "id" | "created_at">): Promise<Campaign> {
  return safeInsert<Campaign>("campaigns", data)
}

/**
 * Actualiza una campaña existente
 */
export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
  return safeUpdate<Campaign>("campaigns", id, data)
}

/**
 * Elimina una campaña
 */
export async function deleteCampaign(id: string): Promise<{ success: boolean; error?: string }> {
  return safeDelete("campaigns", id)
}
