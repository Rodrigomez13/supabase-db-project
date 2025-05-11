import { supabase } from "./supabase"

/**
 * Ejecuta una consulta SQL de forma segura
 * @param sql Consulta SQL a ejecutar
 * @returns Resultado de la consulta
 */
export async function execSQL(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar si existe la función exec_sql
    const { data: functionExists, error: checkError } = await supabase
      .from("pg_proc")
      .select("proname")
      .eq("proname", "exec_sql")
      .limit(1)

    if (checkError) {
      console.error("Error checking for exec_sql function:", checkError)
      return { success: false, error: "Error al verificar la función exec_sql" }
    }

    // Si la función no existe, crearla
    if (!functionExists || functionExists.length === 0) {
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
        RETURNS void AS $$
        BEGIN
          EXECUTE sql_query;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
      `

      const { error: createError } = await supabase.rpc("exec_sql", { sql_query: createFunctionSQL })

      if (createError) {
        console.error("Error creating exec_sql function:", createError)
        return { success: false, error: "Error al crear la función exec_sql" }
      }
    }

    // Ejecutar la consulta SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error executing SQL:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Exception in execSQL:", error)
    return { success: false, error: error.message }
  }
}
