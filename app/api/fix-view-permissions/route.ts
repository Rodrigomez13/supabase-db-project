import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Creamos un cliente con la clave de servicio para tener acceso completo
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: Request) {
  try {
    // Ejecutar el script SQL para corregir los permisos
    const { error: usageError } = await supabaseAdmin.rpc("exec_sql", {
      sql: "GRANT USAGE ON SCHEMA auth TO authenticated;",
    })

    if (usageError) {
      console.error("Error granting USAGE on auth schema:", usageError)
      return NextResponse.json({ error: usageError.message }, { status: 500 })
    }

    const { error: selectError } = await supabaseAdmin.rpc("exec_sql", {
      sql: "GRANT SELECT ON auth.users TO authenticated;",
    })

    if (selectError) {
      console.error("Error granting SELECT on auth.users:", selectError)
      return NextResponse.json({ error: selectError.message }, { status: 500 })
    }

    // Obtener todas las vistas
    const { data: views, error: viewsError } = await supabaseAdmin
      .from("information_schema.views")
      .select("table_name")
      .eq("table_schema", "public")

    if (viewsError) {
      console.error("Error getting views:", viewsError)
      return NextResponse.json({ error: viewsError.message }, { status: 500 })
    }

    // Corregir cada vista
    const results = []
    for (const view of views || []) {
      const viewName = view.table_name

      // Establecer SECURITY DEFINER
      const { error: definerError } = await supabaseAdmin.rpc("exec_sql", {
        sql: `ALTER VIEW public.${viewName} SET (security_definer = true);`,
      })

      // Otorgar permisos
      const { error: grantError } = await supabaseAdmin.rpc("exec_sql", {
        sql: `GRANT ALL ON public.${viewName} TO authenticated;`,
      })

      results.push({
        view: viewName,
        definerError: definerError?.message,
        grantError: grantError?.message,
        success: !definerError && !grantError,
      })
    }

    return NextResponse.json({
      success: true,
      message: "View permissions fixed successfully",
      results,
    })
  } catch (error: any) {
    console.error("Error in fix-view-permissions route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
