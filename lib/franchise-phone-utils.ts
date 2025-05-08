import { supabase } from "@/lib/supabase"

/**
 * Actualiza la relación entre franquicias y teléfonos en la consulta
 * para mostrar correctamente el conteo de teléfonos activos
 */
export async function updateFranchisePhonesRelation() {
  try {
    const { error: rpcError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE OR REPLACE VIEW franchise_phones_summary AS
        SELECT 
          f.id AS franchise_id,
          f.name AS franchise_name,
          COUNT(fp.id) AS total_phones,
          COUNT(fp.id) FILTER (WHERE fp.is_active = true) AS active_phones
        FROM 
          franchises f
        LEFT JOIN 
          franchise_phones fp ON f.id = fp.franchise_id
        GROUP BY 
          f.id, f.name;
      `,
    });

    if (rpcError) {
      throw new Error(`Error al crear vista franchise_phones_summary: ${rpcError.message}`);
    }

    const { error: funcError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE OR REPLACE FUNCTION get_franchise_phones_summary()
        RETURNS TABLE (
          franchise_id UUID,
          franchise_name TEXT,
          total_phones BIGINT,
          active_phones BIGINT
        )
        LANGUAGE SQL
        SECURITY DEFINER
        AS $$
          SELECT * FROM franchise_phones_summary;
        $$;
      `,
    });

    if (funcError) {
      throw new Error(`Error al crear función get_franchise_phones_summary: ${funcError.message}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error en updateFranchisePhonesRelation:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene el resumen de teléfonos para todas las franquicias
 */
export async function getFranchisePhonesCount(): Promise<{ success: boolean; data: any[]; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("get_franchise_phones_summary")

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getFranchisePhonesCount:", error)
    return { success: false, error: error?.message || "Unknown error", data: [] }
  }
}
