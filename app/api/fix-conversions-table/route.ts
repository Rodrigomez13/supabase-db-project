import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    // Verificar si la tabla conversions existe
    const { data: tableExists, error: tableError } = await supabase.rpc("check_table_exists", {
      table_name: "conversions",
    })

    if (tableError) {
      throw new Error(`Error al verificar la tabla: ${tableError.message}`)
    }

    // SQL para crear o corregir la tabla
    const sql = `
    -- Verificar si la tabla conversions ya existe
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversions') THEN
            -- Crear tabla de conversiones
            CREATE TABLE conversions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                lead_id UUID,
                date DATE NOT NULL,
                amount NUMERIC NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        ELSE
            -- Verificar si la columna lead_id existe
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'conversions' AND column_name = 'lead_id'
            ) THEN
                -- Añadir la columna lead_id
                ALTER TABLE conversions ADD COLUMN lead_id UUID;
            END IF;
        END IF;

        -- Añadir la restricción de clave foránea solo si la tabla leads existe y la restricción no existe
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') 
           AND NOT EXISTS (
               SELECT FROM pg_constraint 
               WHERE conname = 'conversions_lead_id_fkey'
           ) THEN
            ALTER TABLE conversions 
            ADD CONSTRAINT conversions_lead_id_fkey 
            FOREIGN KEY (lead_id) REFERENCES leads(id);
        END IF;

        -- Crear índices si no existen
        IF NOT EXISTS (
            SELECT FROM pg_indexes 
            WHERE tablename = 'conversions' AND indexname = 'conversions_lead_id_idx'
        ) THEN
            CREATE INDEX conversions_lead_id_idx ON conversions(lead_id);
        END IF;

        IF NOT EXISTS (
            SELECT FROM pg_indexes 
            WHERE tablename = 'conversions' AND indexname = 'conversions_date_idx'
        ) THEN
            CREATE INDEX conversions_date_idx ON conversions(date);
        END IF;
    END
    $$;
    `

    // Ejecutar el SQL
    const { error: sqlError } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (sqlError) {
      throw new Error(`Error al ejecutar SQL: ${sqlError.message}`)
    }

    // Verificar que la tabla y columnas existen después de la corrección
    const { data: tableExistsAfter, error: tableErrorAfter } = await supabase.rpc("check_table_exists", {
      table_name: "conversions",
    })

    if (tableErrorAfter) {
      throw new Error(`Error al verificar la tabla después de la corrección: ${tableErrorAfter.message}`)
    }

    if (!tableExistsAfter) {
      throw new Error("La tabla conversions no se creó correctamente")
    }

    // Verificar que la columna lead_id existe
    const { data: columns, error: columnError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "conversions")
      .eq("column_name", "lead_id")

    if (columnError) {
      throw new Error(`Error al verificar columnas: ${columnError.message}`)
    }

    const leadIdExists = columns && columns.length > 0

    if (!leadIdExists) {
      throw new Error("La columna lead_id no se creó correctamente")
    }

    return NextResponse.json({
      success: true,
      message: "Tabla de conversiones corregida exitosamente",
    })
  } catch (error) {
    console.error("Error al corregir la tabla de conversiones:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido al corregir la tabla de conversiones",
      },
      { status: 500 },
    )
  }
}
