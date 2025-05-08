import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    // SQL para crear la función de distribución de franquicias
    const sql = `
    -- Función para obtener la distribución de conversiones por franquicia
    CREATE OR REPLACE FUNCTION public.get_franchise_distribution(p_date date)
    RETURNS TABLE (
      franchise_name text,
      conversions bigint,
      percentage numeric,
      phones bigint,
      active_phones bigint
    ) AS $$
    DECLARE
      total_conversions bigint;
    BEGIN
      -- Obtener el total de conversiones para la fecha
      SELECT COUNT(*) INTO total_conversions FROM conversions WHERE date = p_date;
      
      -- Si no hay conversiones, devolver un conjunto vacío
      IF total_conversions = 0 THEN
        RETURN;
      END IF;
      
      -- Devolver la distribución
      RETURN QUERY
      WITH franchise_conversions AS (
        SELECT 
          f.name AS franchise_name,
          COUNT(c.id) AS conversions
        FROM 
          franchises f
        LEFT JOIN 
          conversions c ON c.franchise_id = f.id AND c.date = p_date
        GROUP BY 
          f.name
      ),
      franchise_phones AS (
        SELECT 
          f.name AS franchise_name,
          COUNT(fp.id) AS phones,
          COUNT(fp.id) FILTER (WHERE fp.active = true) AS active_phones
        FROM 
          franchises f
        LEFT JOIN 
          franchise_phones fp ON fp.franchise_id = f.id
        GROUP BY 
          f.name
      )
      SELECT 
        fc.franchise_name,
        fc.conversions,
        CASE 
          WHEN total_conversions > 0 THEN (fc.conversions::numeric / total_conversions) * 100
          ELSE 0
        END AS percentage,
        COALESCE(fp.phones, 0) AS phones,
        COALESCE(fp.active_phones, 0) AS active_phones
      FROM 
        franchise_conversions fc
      LEFT JOIN 
        franchise_phones fp ON fp.franchise_name = fc.franchise_name
      ORDER BY 
        fc.conversions DESC;
    END;
    $$ LANGUAGE plpgsql;

    -- Otorgar permisos para ejecutar la función
    GRANT EXECUTE ON FUNCTION public.get_franchise_distribution(date) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_franchise_distribution(date) TO service_role;
    `

    // Ejecutar el SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error creating function:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Exception in create-franchise-distribution-function:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
