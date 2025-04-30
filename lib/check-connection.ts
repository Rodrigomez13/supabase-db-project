import { supabase, getCurrentUser } from "./supabase"

export async function checkSupabaseConnection() {
  try {
    // Intentamos obtener el usuario actual
    const user = await getCurrentUser()

    // Intentamos una consulta simple para verificar la conexión
    const { data, error } = await supabase.from("franchises").select("count")

    if (error) {
      console.error("Error de conexión a Supabase:", error)
      return {
        success: false,
        error: error.message,
        user,
      }
    }

    return {
      success: true,
      data,
      user,
    }
  } catch (err: any) {
    console.error("Excepción al conectar con Supabase:", err)
    return {
      success: false,
      error: err.message,
    }
  }
}

export async function getTableData(tableName: string) {
  try {
    const { data, error } = await supabase.from(tableName).select("*")

    if (error) {
      console.error(`Error al obtener datos de ${tableName}:`, error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data,
      count: data?.length || 0,
    }
  } catch (err: any) {
    console.error(`Excepción al obtener datos de ${tableName}:`, err)
    return {
      success: false,
      error: err.message,
    }
  }
}
