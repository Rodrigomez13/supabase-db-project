import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Crear cliente de Supabase con la clave de servicio para tener permisos completos
    const supabaseAdmin = createRouteHandlerClient(
      {
        cookies,
      },
      {
        options: {
          db: { schema: "public" },
        },
      },
    )

    // Script SQL para corregir los permisos de las vistas
    const sql = `
    DO $$
    DECLARE
        vista_nombre text;
        vista_definicion text;
    BEGIN
        -- Otorgar permisos en el esquema auth si es posible
        BEGIN
            EXECUTE 'GRANT USAGE ON SCHEMA auth TO authenticated';
            EXECUTE 'GRANT SELECT ON auth.users TO authenticated';
            RAISE NOTICE 'Permisos otorgados en el esquema auth';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'No se pudieron otorgar permisos en el esquema auth: %', SQLERRM;
        END;

        -- Recrear las vistas como SECURITY DEFINER
        FOR vista_nombre, vista_definicion IN 
            SELECT table_name, view_definition
            FROM information_schema.views 
            WHERE table_schema = 'public'
        LOOP
            BEGIN
                -- Recrear la vista con SECURITY DEFINER
                EXECUTE format('CREATE OR REPLACE VIEW public.%I AS %s SECURITY DEFINER', 
                            vista_nombre, 
                            vista_definicion);
                
                -- Otorgar todos los permisos al rol authenticated
                EXECUTE format('GRANT ALL ON public.%I TO authenticated', vista_nombre);
                
                RAISE NOTICE 'Permisos corregidos para la vista: %', vista_nombre;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Error al corregir la vista %: %', vista_nombre, SQLERRM;
            END;
        END LOOP;
    END $$;
    `

    // Ejecutar el script SQL
    const { error } = await supabaseAdmin.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error al corregir permisos:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: "Permisos de vistas corregidos correctamente",
    })
  } catch (error: any) {
    console.error("Error en la API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
