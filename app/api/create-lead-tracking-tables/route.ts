import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    // Leer el archivo SQL
    const sqlFilePath = path.join(process.cwd(), "create-lead-tracking-tables.sql")
    let sqlContent

    try {
      sqlContent = fs.readFileSync(sqlFilePath, "utf8")
    } catch (readError) {
      // Si no podemos leer el archivo, usamos el SQL embebido
      sqlContent = `
      -- Crear tabla de leads si no existe
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        date DATE NOT NULL,
        server_id UUID NOT NULL REFERENCES servers(id),
        franchise_id UUID NOT NULL REFERENCES franchises(id),
        franchise_phone_id UUID NOT NULL REFERENCES franchise_phones(id),
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Crear índices para mejorar el rendimiento de las consultas
      CREATE INDEX IF NOT EXISTS leads_server_id_idx ON leads(server_id);
      CREATE INDEX IF NOT EXISTS leads_franchise_id_idx ON leads(franchise_id);
      CREATE INDEX IF NOT EXISTS leads_franchise_phone_id_idx ON leads(franchise_phone_id);
      CREATE INDEX IF NOT EXISTS leads_date_idx ON leads(date);
      CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
      
      -- Crear tabla de conversiones si no existe
      CREATE TABLE IF NOT EXISTS conversions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID NOT NULL REFERENCES leads(id),
        date DATE NOT NULL,
        amount NUMERIC NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Crear índices para la tabla de conversiones
      CREATE INDEX IF NOT EXISTS conversions_lead_id_idx ON conversions(lead_id);
      CREATE INDEX IF NOT EXISTS conversions_date_idx ON conversions(date);
      
      -- Crear función para obtener la distribución de leads por franquicia
      CREATE OR REPLACE FUNCTION get_lead_distribution(p_date DATE)
      RETURNS TABLE (
        franchise_name TEXT,
        lead_count BIGINT,
        percentage NUMERIC
      ) AS $$
      DECLARE
        total_leads BIGINT;
      BEGIN
        -- Obtener el total de leads para la fecha especificada
        SELECT COUNT(*) INTO total_leads FROM leads WHERE date = p_date;
        
        -- Si no hay leads, retornar vacío
        IF total_leads = 0 THEN
          RETURN;
        END IF;
        
        -- Retornar la distribución
        RETURN QUERY
        SELECT 
          f.name AS franchise_name,
          COUNT(l.id) AS lead_count,
          ROUND((COUNT(l.id)::NUMERIC / total_leads) * 100, 1) AS percentage
        FROM 
          leads l
          JOIN franchises f ON l.franchise_id = f.id
        WHERE 
          l.date = p_date
        GROUP BY 
          f.name
        ORDER BY 
          lead_count DESC;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Crear función para obtener la distribución de conversiones por franquicia
      CREATE OR REPLACE FUNCTION get_conversion_distribution(p_date DATE)
      RETURNS TABLE (
        franchise_name TEXT,
        conversion_count BIGINT,
        percentage NUMERIC,
        total_amount NUMERIC
      ) AS $$
      DECLARE
        total_conversions BIGINT;
      BEGIN
        -- Obtener el total de conversiones para la fecha especificada
        SELECT COUNT(*) INTO total_conversions 
        FROM conversions c
        JOIN leads l ON c.lead_id = l.id
        WHERE c.date = p_date;
        
        -- Si no hay conversiones, retornar vacío
        IF total_conversions = 0 THEN
          RETURN;
        END IF;
        
        -- Retornar la distribución
        RETURN QUERY
        SELECT 
          f.name AS franchise_name,
          COUNT(c.id) AS conversion_count,
          ROUND((COUNT(c.id)::NUMERIC / total_conversions) * 100, 1) AS percentage,
          SUM(c.amount) AS total_amount
        FROM 
          conversions c
          JOIN leads l ON c.lead_id = l.id
          JOIN franchises f ON l.franchise_id = f.id
        WHERE 
          c.date = p_date
        GROUP BY 
          f.name
        ORDER BY 
          conversion_count DESC;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Crear función para obtener la tasa de conversión por franquicia
      CREATE OR REPLACE FUNCTION get_franchise_conversion_rates(p_start_date DATE, p_end_date DATE)
      RETURNS TABLE (
        franchise_name TEXT,
        lead_count BIGINT,
        conversion_count BIGINT,
        conversion_rate NUMERIC,
        total_amount NUMERIC
      ) AS $$
      DECLARE
        total_leads BIGINT;
        total_conversions BIGINT;
      BEGIN
        -- Obtener el total de leads y conversiones para el rango de fechas
        SELECT COUNT(*) INTO total_leads 
        FROM leads 
        WHERE date BETWEEN p_start_date AND p_end_date;
        
        SELECT COUNT(*) INTO total_conversions 
        FROM conversions 
        WHERE date BETWEEN p_start_date AND p_end_date;
        
        -- Si no hay leads, retornar vacío
        IF total_leads = 0 THEN
          RETURN;
        END IF;
        
        -- Retornar las tasas de conversión por franquicia
        RETURN QUERY
        SELECT 
          f.name AS franchise_name,
          COUNT(DISTINCT l.id) AS lead_count,
          COUNT(DISTINCT c.id) AS conversion_count,
          CASE 
            WHEN COUNT(DISTINCT l.id) > 0 THEN 
              ROUND((COUNT(DISTINCT c.id)::NUMERIC / COUNT(DISTINCT l.id)) * 100, 1)
            ELSE 0
          END AS conversion_rate,
          COALESCE(SUM(c.amount), 0) AS total_amount
        FROM 
          franchises f
          LEFT JOIN leads l ON f.id = l.franchise_id AND l.date BETWEEN p_start_date AND p_end_date
          LEFT JOIN conversions c ON l.id = c.lead_id AND c.date BETWEEN p_start_date AND p_end_date
        GROUP BY 
          f.name
        ORDER BY 
          conversion_rate DESC;
      END;
      $$ LANGUAGE plpgsql;
      `
    }

    // Ejecutar el script SQL
    const { error } = await supabase.rpc("exec_sql", { sql: sqlContent })

    if (error) {
      console.error("Error al ejecutar SQL:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
