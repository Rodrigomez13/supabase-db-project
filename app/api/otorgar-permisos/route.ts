import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { vista } = await request.json()

    if (!vista) {
      return NextResponse.json({ error: "Nombre de vista requerido" }, { status: 400 })
    }

    // Crear cliente de Supabase con la clave de servicio para tener permisos completos
    const supabaseAdmin = createRouteHandlerClient(
      { cookies },
      {
        options: {
          db: { schema: "public" },
        },
      },
    )

    // Script SQL para otorgar permisos a una vista específica
    const sql = `
    BEGIN;
    
    -- Otorgar permiso SELECT en la vista específica
    GRANT SELECT ON public.${vista} TO authenticated;
    
    COMMIT;
    `

    // Ejecutar el script SQL
    const { error } = await supabaseAdmin.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error al otorgar permisos:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `Permisos otorgados correctamente a la vista ${vista}`,
    })
  } catch (error: any) {
    console.error("Error en la API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
