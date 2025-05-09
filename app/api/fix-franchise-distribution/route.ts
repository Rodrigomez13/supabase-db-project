import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Ejecutar el script SQL para corregir la función de distribución de franquicias
    const sqlScript = `
    -- Función para obtener la distribución de franquicias
    CREATE OR REPLACE FUNCTION get_franchise_distribution_metrics(p_date DATE)
    RETURNS TABLE (
      franchise_name TEXT,
      conversions BIGINT,
      percentage NUMERIC,
      phones BIGINT,
      active_phones BIGINT
    ) AS $$
    BEGIN
      RETURN QUERY
      WITH franchise_data AS (
        SELECT 
          f.name AS franchise_name,
          COUNT(c.id) AS conversions,
          COUNT(fp.id) AS phones,
          COUNT(fp.id) FILTER (WHERE fp.active = TRUE) AS active_phones
        FROM 
          franchises f
        LEFT JOIN 
          conversions c ON c.franchise_id = f.id AND DATE(c.created_at) = p_date
        LEFT JOIN 
          franchise_phones fp ON fp.franchise_id = f.id
        GROUP BY 
          f.name
      ),
      total_conversions AS (
        SELECT COALESCE(SUM(conversions), 0) AS total FROM franchise_data
      )
      SELECT 
        fd.franchise_name,
        fd.conversions,
        CASE 
          WHEN (SELECT total FROM total_conversions) > 0 
          THEN ROUND((fd.conversions::NUMERIC / (SELECT total FROM total_conversions)) * 100, 2)
          ELSE 0 
        END AS percentage,
        fd.phones,
        fd.active_phones
      FROM 
        franchise_data fd
      ORDER BY 
        fd.conversions DESC;
    END;
    $$ LANGUAGE plpgsql;
    `

    const { error } = await supabase.rpc("exec_sql", { sql: sqlScript })

    if (error) {
      console.error("Error al ejecutar el script SQL:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Función de distribución de franquicias corregida correctamente",
    })
  } catch (error) {
    console.error("Error al corregir la función de distribución de franquicias:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
