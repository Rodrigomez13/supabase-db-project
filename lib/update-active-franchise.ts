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
