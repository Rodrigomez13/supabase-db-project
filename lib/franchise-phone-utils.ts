import { supabase } from "@/lib/supabase"

/**
 * Ejecuta una consulta SQL para actualizar la relación entre franquicias y teléfonos.
 * Crea una vista y una función para obtener el conteo de teléfonos activos y totales por franquicia.
 * @returns Un objeto con un campo success (booleano) indicando si la operación fue exitosa y un campo error (opcional) con un mensaje de error.
 */
export async function updateFranchisePhonesRelation(): Promise<{ success: boolean; error?: string }> {
  try {
    // SQL para crear la función
    const sql = `
      -- Función para contar teléfonos por franquicia
      CREATE OR REPLACE FUNCTION get_franchise_phones_count()
      RETURNS TABLE (
        franchise_id UUID,
        active_phones BIGINT,
        total_phones BIGINT
      ) 
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          f.id AS franchise_id,
          COUNT(fp.id) FILTER (WHERE fp.is_active = true) AS active_phones,
          COUNT(fp.id) AS total_phones
        FROM 
          franchises f
          LEFT JOIN franchise_phones fp ON f.id = fp.franchise_id
        GROUP BY 
          f.id;
      END;
      $$;
    `

    // Ejecutar el SQL usando la función exec_sql
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: sql,
    })

    if (error) {
      console.error("Error al ejecutar SQL:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error en updateFranchisePhonesRelation:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtiene el conteo de teléfonos activos y totales para todas las franquicias
 * @returns Un objeto con campos success (booleano), data (array de conteos) y error (opcional)
 */
export async function getFranchisePhonesCount() {
  try {
    // Intentar llamar directamente a la función
    const { data, error } = await supabase.rpc("get_franchise_phones_count")

    if (error) {
      // Si hay error, intentar crear la función primero
      console.error("Error al obtener conteo de teléfonos, intentando crear función:", error)

      const { success, error: updateError } = await updateFranchisePhonesRelation()

      if (!success) {
        console.error("Error al crear función:", updateError)
        return {
          success: false,
          error: updateError,
          data: [],
        }
      }

      // Intentar nuevamente después de crear la función
      const { data: retryData, error: retryError } = await supabase.rpc("get_franchise_phones_count")

      if (retryError) {
        console.error("Error al obtener conteo de teléfonos después de crear función:", retryError)
        return {
          success: false,
          error: retryError.message,
          data: [],
        }
      }

      return {
        success: true,
        data: retryData,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    console.error("Error en getFranchisePhonesCount:", error)
    return {
      success: false,
      error: error.message,
      data: [],
    }
  }
}
