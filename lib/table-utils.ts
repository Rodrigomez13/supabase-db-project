import { supabase } from "./supabase"

export async function tableExists(tableName: string): Promise<boolean> {
  try {
    // Intentamos obtener información sobre la tabla
    const { data, error } = await supabase.from(tableName).select("*").limit(1)

    // Si no hay error, la tabla existe y tenemos acceso
    return !error
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

export async function initializeTable(tableName: string, schema: string): Promise<boolean> {
  try {
    const exists = await tableExists(tableName)
    if (!exists) {
      // Si la tabla no existe, podríamos crearla aquí
      console.log(`Table ${tableName} does not exist or is not accessible`)
      // Aquí podríamos implementar la lógica para crear la tabla si es necesario
    }
    return exists
  } catch (error) {
    console.error(`Error initializing table ${tableName}:`, error)
    return false
  }
}
