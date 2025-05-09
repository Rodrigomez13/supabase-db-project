import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación y rol de administrador
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si el usuario es administrador
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single()

    if (rolesError || !userRoles) {
      return NextResponse.json({ error: "Acceso denegado: Se requiere rol de administrador" }, { status: 403 })
    }

    // Leer el archivo SQL
    const sqlFilePath = path.join(process.cwd(), "sql", "create-get-next-phone-function.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Ejecutar la consulta SQL
    const { error: sqlError } = await supabase.rpc("exec_sql", { sql_query: sqlQuery })

    if (sqlError) {
      console.error("Error al ejecutar SQL:", sqlError)
      return NextResponse.json({ error: `Error al crear la función: ${sqlError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error en API:", error)
    return NextResponse.json({ error: `Error interno del servidor: ${error.message}` }, { status: 500 })
  }
}
