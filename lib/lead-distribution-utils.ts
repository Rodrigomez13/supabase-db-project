import { supabase } from "@/lib/supabase"

/**
 * Obtiene un teléfono válido para una franquicia
 * @param franchiseId ID de la franquicia
 * @returns Objeto con el resultado de la operación
 */
async function getValidFranchisePhone(franchiseId: string) {
  try {
    console.log("Buscando teléfono válido para franquicia:", franchiseId)

    // Consulta directa a la tabla de teléfonos
    const { data, error } = await supabase
      .from("franchise_phones")
      .select("id, phone_number")
      .eq("franchise_id", franchiseId)
      .eq("is_active", true)
      .order("id")
      .limit(1)

    if (error) {
      console.error("Error al consultar teléfonos:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      console.error("No se encontraron teléfonos activos para la franquicia")
      return { success: false, error: "No hay teléfonos activos para esta franquicia" }
    }

    console.log("Teléfono encontrado:", data[0])
    return {
      success: true,
      data: {
        phone_id: data[0].id,
        phone_number: data[0].phone_number,
      },
    }
  } catch (error: any) {
    console.error("Error en getValidFranchisePhone:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Asigna leads a un teléfono de una franquicia específica
 * @param serverId ID del servidor
 * @param franchiseId ID de la franquicia
 * @param leadsCount Cantidad de leads a asignar
 * @param date Fecha de asignación (opcional, por defecto es la fecha actual)
 * @returns Objeto con el resultado de la operación
 */
export async function assignLeadsToFranchise(serverId: string, franchiseId: string, leadsCount: number, date?: Date) {
  try {
    console.log("Asignando leads:", { serverId, franchiseId, leadsCount })

    if (!franchiseId) {
      console.error("ID de franquicia inválido")
      return { success: false, error: "ID de franquicia inválido" }
    }

    const assignDate = date ? date.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]

    // Verificar si la franquicia existe
    const { data: franchiseCheck, error: franchiseError } = await supabase
      .from("franchises")
      .select("id, name")
      .eq("id", franchiseId)
      .single()

    if (franchiseError || !franchiseCheck) {
      console.error("Error al verificar franquicia:", franchiseError)
      return { success: false, error: "Franquicia no encontrada" }
    }

    console.log("Franquicia verificada:", franchiseCheck)

    // Obtener un teléfono válido para la franquicia
    const phoneResult = await getValidFranchisePhone(franchiseId)

    if (!phoneResult.success || !phoneResult.data) {
      console.error("Error al obtener teléfono válido:", phoneResult.error)
      return { success: false, error: phoneResult.error || "No se pudo obtener un teléfono válido" }
    }

    const selectedPhoneId = phoneResult.data.phone_id
    console.log("Teléfono seleccionado:", selectedPhoneId)

    // Verificar que el teléfono existe en la base de datos
    const { data: phoneCheck, error: phoneCheckError } = await supabase
      .from("franchise_phones")
      .select("id")
      .eq("id", selectedPhoneId)
      .single()

    if (phoneCheckError || !phoneCheck) {
      console.error("Error al verificar teléfono:", phoneCheckError)
      return { success: false, error: "El teléfono seleccionado no existe en la base de datos" }
    }

    // Insertar la distribución de leads
    try {
      // Verificar que todos los campos necesarios estén presentes
      if (!serverId || !franchiseId || !selectedPhoneId) {
        const missingFields = []
        if (!serverId) missingFields.push("serverId")
        if (!franchiseId) missingFields.push("franchiseId")
        if (!selectedPhoneId) missingFields.push("selectedPhoneId")

        const errorMsg = `Faltan campos requeridos: ${missingFields.join(", ")}`
        console.error(errorMsg)
        return { success: false, error: errorMsg }
      }

      // Insertar usando la API directa de Supabase
      const { data, error } = await supabase
        .from("lead_distributions")
        .insert({
          date: assignDate,
          server_id: serverId,
          franchise_id: franchiseId,
          franchise_phone_id: selectedPhoneId,
          leads_count: leadsCount,
        })
        .select()

      if (error) {
        console.error("Error al asignar leads:", error)
        return { success: false, error: error.message }
      }

      console.log("Asignación exitosa:", data)
      return { success: true, data }
    } catch (insertError: any) {
      console.error("Error en la inserción:", insertError)
      return { success: false, error: insertError.message }
    }
  } catch (error: any) {
    console.error("Error en assignLeadsToFranchise:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtiene las distribuciones de leads para una fecha específica
 * @param date Fecha para la que se quieren obtener las distribuciones
 * @param serverId ID del servidor (opcional)
 * @param franchiseId ID de la franquicia (opcional)
 * @returns Objeto con el resultado de la operación
 */
export async function getLeadDistributions(date: Date, serverId?: string, franchiseId?: string) {
  try {
    const queryDate = date.toISOString().split("T")[0]

    let query = supabase
      .from("lead_distributions")
      .select(`
        id, date, server_id, franchise_id, franchise_phone_id, leads_count, created_at,
        servers:server_id(name),
        franchises:franchise_id(name),
        franchise_phones:franchise_phone_id(phone_number)
      `)
      .eq("date", queryDate)
      .order("created_at", { ascending: false })

    if (serverId) {
      query = query.eq("server_id", serverId)
    }

    if (franchiseId) {
      query = query.eq("franchise_id", franchiseId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error al obtener distribuciones:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getLeadDistributions:", error)
    return { success: false, error: error.message, data: [] }
  }
}
