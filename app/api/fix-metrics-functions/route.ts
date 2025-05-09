import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    // Leer el archivo SQL
    const sqlFilePath = path.join(process.cwd(), "fix-metrics-functions.sql")
    let sqlScript: string

    try {
      sqlScript = fs.readFileSync(sqlFilePath, "utf8")
    } catch (error) {
      // Si no podemos leer el archivo, usamos el script embebido
      sqlScript = `
      -- Primero, eliminamos las funciones existentes si existen
      DROP FUNCTION IF EXISTS get_hourly_metrics(date);
      DROP FUNCTION IF EXISTS get_franchise_distribution_metrics(date);

      -- Recreamos la función get_hourly_metrics con las columnas correctas
      CREATE OR REPLACE FUNCTION get_hourly_metrics(p_date date)
      RETURNS TABLE (
          hour integer,
          total_calls integer,
          total_leads integer,
          total_spend numeric,
          conversion_rate numeric
      ) AS $$
      BEGIN
          RETURN QUERY
          WITH hourly_data AS (
              SELECT
                  EXTRACT(HOUR FROM c.created_at)::integer AS hour,
                  COUNT(DISTINCT c.id) AS total_calls,
                  COUNT(DISTINCT CASE WHEN c.is_lead THEN c.id END) AS total_leads,
                  COALESCE(SUM(s.spend), 0) AS total_spend
              FROM
                  conversions c
              LEFT JOIN
                  server_daily_records s ON DATE(c.created_at) = s.date
              WHERE
                  DATE(c.created_at) = p_date
              GROUP BY
                  EXTRACT(HOUR FROM c.created_at)::integer
          )
          SELECT
              h.hour,
              COALESCE(d.total_calls, 0) AS total_calls,
              COALESCE(d.total_leads, 0) AS total_leads,
              COALESCE(d.total_spend, 0) AS total_spend,
              CASE
                  WHEN COALESCE(d.total_calls, 0) > 0 THEN
                      (COALESCE(d.total_leads, 0)::numeric / COALESCE(d.total_calls, 0)) * 100
                  ELSE 0
              END AS conversion_rate
          FROM
              generate_series(0, 23) AS h(hour)
          LEFT JOIN
              hourly_data d ON h.hour = d.hour
          ORDER BY
              h.hour;
      END;
      $$ LANGUAGE plpgsql;

      -- Recreamos la función get_franchise_distribution_metrics con las columnas correctas
      CREATE OR REPLACE FUNCTION get_franchise_distribution_metrics(p_date date)
      RETURNS TABLE (
          franchise_id uuid,
          franchise_name text,
          total_calls integer,
          total_leads integer,
          conversion_rate numeric
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT
              f.id AS franchise_id,
              f.name AS franchise_name,
              COUNT(DISTINCT c.id) AS total_calls,
              COUNT(DISTINCT CASE WHEN c.is_lead THEN c.id END) AS total_leads,
              CASE
                  WHEN COUNT(DISTINCT c.id) > 0 THEN
                      (COUNT(DISTINCT CASE WHEN c.is_lead THEN c.id END)::numeric / COUNT(DISTINCT c.id)) * 100
                  ELSE 0
              END AS conversion_rate
          FROM
              franchises f
          LEFT JOIN
              conversions c ON c.franchise_id = f.id AND DATE(c.created_at) = p_date
          GROUP BY
              f.id, f.name
          ORDER BY
              total_calls DESC;
      END;
      $$ LANGUAGE plpgsql;
      `
    }

    // Ejecutar el script SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlScript })

    if (error) {
      console.error("Error al ejecutar el script SQL:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error en la API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
