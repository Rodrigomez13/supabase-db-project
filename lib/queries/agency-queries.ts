import { safeQuery, safeInsert, safeUpdate, safeDelete, safeRPC } from "../safe-query"

export interface Agency {
  id: string
  name: string
  owner: string
  is_active: boolean
  balance?: number
  created_at: string
  updated_at: string
}

export async function getAgencies(): Promise<Agency[]> {
  return safeQuery<Agency>("restructured.agencies", {
    orderBy: { column: "created_at", ascending: false },
  })
}

export async function getAgencyById(id: string): Promise<Agency | null> {
  try {
    const agencies = await safeQuery<Agency>("restructured.agencies", {
      where: { id },
      single: true,
    })
    return agencies[0] || null
  } catch (error) {
    console.error("Error en getAgencyById:", error)
    return null
  }
}

export async function createAgency(data: Omit<Agency, "id" | "created_at" | "updated_at">): Promise<Agency> {
  const result = await safeInsert<Agency>("restructured.agencies", data)
  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to create agency")
  }
  return result.data
}

export async function updateAgency(id: string, data: Partial<Agency>): Promise<Agency> {
  const result = await safeUpdate<Agency>("restructured.agencies", id, data)
  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to update agency")
  }
  return result.data
}

export async function deleteAgency(id: string): Promise<{ success: boolean; error?: string }> {
  return safeDelete("restructured.agencies", id)
} 