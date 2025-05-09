import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/components/ui/use-toast"

export async function updateActiveFranchise(
  franchiseId: string,
  franchiseName: string,
  showToast = true,
): Promise<boolean> {
  const supabase = createClientComponentClient()

  try {
    if (!franchiseId) {
      console.error("ID de franquicia inválido:", franchiseId)
      return false
    }

    console.log("Actualizando franquicia activa:", { franchiseId, franchiseName })

    // Verificar si existe la tabla system_config
    const { count, error: countError } = await supabase
      .from("system_config")
      .select("*", { count: "exact", head: true })
      .eq("key", "active_franchise")

    if (countError) {
      console.error("Error al verificar tabla system_config:", countError)

      // Intentar crear la entrada directamente con RPC para evitar problemas de RLS
      try {
        const { error: rpcError } = await supabase.rpc("upsert_system_config", {
          config_key: "active_franchise",
          config_value: { id: franchiseId, name: franchiseName },
        })

        if (rpcError) {
          console.error("Error al usar RPC para actualizar configuración:", rpcError)
          throw rpcError
        }

        if (showToast) {
          toast({
            title: "Franquicia actualizada",
            description: `Ahora estás distribuyendo conversiones a ${franchiseName}`,
          })
        }

        return true
      } catch (rpcErr) {
        console.error("Error en RPC:", rpcErr)
        throw rpcErr
      }
    }

    // Si existe la tabla, actualizar o insertar
    if (count && count > 0) {
      // Actualizar configuración global
      const { error } = await supabase
        .from("system_config")
        .update({
          value: { id: franchiseId, name: franchiseName },
          updated_at: new Date().toISOString(),
        })
        .eq("key", "active_franchise")

      if (error) {
        console.error("Error al actualizar configuración:", error)
        throw error
      }
    } else {
      // Insertar nueva configuración
      const { error } = await supabase.from("system_config").insert({
        key: "active_franchise",
        value: { id: franchiseId, name: franchiseName },
      })

      if (error) {
        console.error("Error al insertar configuración:", error)
        throw error
      }
    }

    if (showToast) {
      toast({
        title: "Franquicia actualizada",
        description: `Ahora estás distribuyendo conversiones a ${franchiseName}`,
      })
    }

    return true
  } catch (error: any) {
    console.error("Error al actualizar la franquicia activa:", error)

    if (showToast) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la franquicia de distribución",
        variant: "destructive",
      })
    }

    return false
  }
}

/**
 * Obtiene la franquicia activa del sistema
 * @returns Objeto con la información de la franquicia activa o null si no hay ninguna
 */
export async function getActiveFranchise() {
  const supabase = createClientComponentClient()
  try {
    console.log("Obteniendo franquicia activa...")

    // Obtener la configuración global del sistema
    const { data, error } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "active_franchise")
      .maybeSingle()

    if (error) {
      console.error("Error al obtener la franquicia activa:", error)
      return null
    }

    if (!data || !data.value) {
      console.warn("No hay franquicia activa configurada")
      return null
    }

    console.log("Franquicia activa encontrada:", data.value)

    // Si el valor es un objeto con id y name, usarlo directamente
    if (typeof data.value === "object" && data.value.id) {
      return {
        id: data.value.id,
        name: data.value.name,
      }
    }

    // Si solo tenemos el ID, obtener los detalles de la franquicia
    const franchiseId = typeof data.value === "string" ? data.value : data.value.id

    const { data: franchiseData, error: franchiseError } = await supabase
      .from("franchises")
      .select("id, name")
      .eq("id", franchiseId)
      .single()

    if (franchiseError || !franchiseData) {
      console.error("Error al obtener detalles de la franquicia:", franchiseError)
      return null
    }

    return franchiseData
  } catch (error) {
    console.error("Error en getActiveFranchise:", error)
    return null
  }
}
