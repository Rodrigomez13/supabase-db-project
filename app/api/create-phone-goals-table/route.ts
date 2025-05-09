import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar si el usuario tiene permisos de administrador
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si el usuario es administrador
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // SQL para crear la tabla de metas de teléfonos
    const sql = `
    -- Crear tabla para almacenar las metas de los teléfonos
    CREATE TABLE IF NOT EXISTS phone_goals (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      franchise_phone_id UUID NOT NULL REFERENCES franchise_phones(id) ON DELETE CASCADE,
      daily_goal INTEGER NOT NULL DEFAULT 5,
      weekly_goal INTEGER NOT NULL DEFAULT 30,
      monthly_goal INTEGER NOT NULL DEFAULT 120,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(franchise_phone_id)
    );
    
    -- Crear índice para búsquedas rápidas por teléfono
    CREATE INDEX IF NOT EXISTS idx_phone_goals_phone_id ON phone_goals(franchise_phone_id);
    
    -- Trigger para actualizar el campo updated_at
    CREATE OR REPLACE FUNCTION update_phone_goals_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS update_phone_goals_updated_at_trigger ON phone_goals;
    CREATE TRIGGER update_phone_goals_updated_at_trigger
    BEFORE UPDATE ON phone_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_phone_goals_updated_at();
    
    -- Función para obtener el siguiente teléfono disponible para una franquicia
    CREATE OR REPLACE FUNCTION get_next_available_phone(franchise_id UUID)
    RETURNS UUID AS $$
    DECLARE
      next_phone_id UUID;
    BEGIN
      -- Obtener el siguiente teléfono activo que no haya superado su meta diaria
      SELECT fp.id INTO next_phone_id
      FROM franchise_phones fp
      LEFT JOIN phone_goals pg ON fp.id = pg.franchise_phone_id
      LEFT JOIN (
        -- Contar conversiones de hoy para cada teléfono
        SELECT l.franchise_phone_id, COUNT(*) as daily_count
        FROM leads l
        JOIN conversions c ON l.id = c.lead_id
        WHERE l.franchise_id = franchise_id
        AND c.date = CURRENT_DATE
        GROUP BY l.franchise_phone_id
      ) daily ON fp.id = daily.franchise_phone_id
      WHERE fp.franchise_id = franchise_id
      AND fp.is_active = true
      AND (daily.daily_count IS NULL OR daily.daily_count < COALESCE(pg.daily_goal, 5))
      ORDER BY fp.order_number
      LIMIT 1;
    
      -- Si no hay teléfonos disponibles que no hayan superado su meta, simplemente tomar el siguiente en orden
      IF next_phone_id IS NULL THEN
        SELECT fp.id INTO next_phone_id
        FROM franchise_phones fp
        WHERE fp.franchise_id = franchise_id
        AND fp.is_active = true
        ORDER BY fp.order_number
        LIMIT 1;
      END IF;
    
      RETURN next_phone_id;
    END;
    $$ LANGUAGE plpgsql;
    `

    // Ejecutar el SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error creating phone goals table:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Inicializar metas para todos los teléfonos existentes
    const initSql = `
    -- Insertar metas predeterminadas para todos los teléfonos que no tienen metas
    INSERT INTO phone_goals (franchise_phone_id, daily_goal, weekly_goal, monthly_goal)
    SELECT id, 5, 30, 120
    FROM franchise_phones
    WHERE id NOT IN (SELECT franchise_phone_id FROM phone_goals);
    `

    const { error: initError } = await supabase.rpc("exec_sql", { sql_query: initSql })

    if (initError) {
      console.error("Error initializing phone goals:", initError)
      return NextResponse.json(
        { error: "Tabla creada pero no se pudieron inicializar las metas: " + initError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, message: "Tabla de metas de teléfonos creada correctamente" })
  } catch (error: any) {
    console.error("Error en la API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
