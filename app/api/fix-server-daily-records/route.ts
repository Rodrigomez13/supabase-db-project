import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    // SQL para corregir la tabla server_daily_records
    const sql = `
  -- Verificar si la tabla existe y tiene la estructura correcta
  DO $$
  BEGIN
    -- Verificar si hay alguna columna con nombre incorrecto (por ejemplo, total_leads en lugar de leads)
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'server_daily_records' 
      AND column_name = 'total_leads'
    ) THEN
      -- Renombrar la columna si existe
      ALTER TABLE server_daily_records RENAME COLUMN total_leads TO leads;
    END IF;
    
    -- Verificar si hay alguna columna con nombre incorrecto (por ejemplo, total_conversions en lugar de conversions)
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'server_daily_records' 
      AND column_name = 'total_conversions'
    ) THEN
      -- Renombrar la columna si existe
      ALTER TABLE server_daily_records RENAME COLUMN total_conversions TO conversions;
    END IF;
  END
  $$;
`

    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error fixing server_daily_records table:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Tabla server_daily_records corregida correctamente" })
  } catch (error: any) {
    console.error("Error in fix-server-daily-records API:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
