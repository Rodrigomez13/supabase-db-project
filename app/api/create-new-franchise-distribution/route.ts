import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const sqlScript = `
    -- Crear una nueva función para la distribución de franquicias
    DROP FUNCTION IF EXISTS get_franchise_distribution_v2(date);

    CREATE OR REPLACE FUNCTION get_franchise_distribution_v2(p_date date)
    RETURNS TABLE (
      franchise_name text,
      conversions bigint,
      percentage numeric,
      phones bigint,
      active_phones bigint
    ) AS $$
    DECLARE
      total_conv bigint;
    BEGIN
      -- Calcular el total de conversiones para la fecha dada
      SELECT COUNT(*) INTO total_conv
      FROM conversions
      WHERE DATE(created_at) = p_date;

      -- Si no hay total, establecerlo a 1 para evitar división por cero
      IF total_conv = 0 THEN
        total_conv := 1;
      END IF;

      RETURN QUERY
      SELECT 
        f.name AS franchise_name,
        COUNT(c.id)::bigint AS conversions,
        ROUND((COUNT(c.id)::numeric / total_conv) * 100, 2) AS percentage,
        COUNT(DISTINCT fp.id)::bigint AS phones,
        COUNT(DISTINCT CASE WHEN fp.active = TRUE THEN fp.id ELSE NULL END)::bigint AS active_phones
      FROM 
        franchises f
      LEFT JOIN 
        conversions c ON c.franchise_id = f.id AND DATE(c.created_at) = p_date
      LEFT JOIN 
        franchise_phones fp ON fp.franchise_id = f.id
      GROUP BY 
        f.name
      ORDER BY 
        conversions DESC;
    END;
    $$ LANGUAGE plpgsql;
    `

    // Ejecutar el script SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlScript })

    if (error) {
      console.error("Error al crear la nueva función de distribución:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Nueva función de distribución de franquicias creada correctamente",
    })
  } catch (error) {
    console.error("Error al crear la nueva función de distribución:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
