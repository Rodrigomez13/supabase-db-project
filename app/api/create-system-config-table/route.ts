import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Leer el archivo SQL
    const sqlFilePath = path.join(process.cwd(), "sql", "create-system-config-table.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Ejecutar la consulta SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlQuery })

    if (error) {
      console.error("Error al ejecutar SQL:", error)
      return NextResponse.json({ error: `Error al crear la tabla: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error en API:", error)
    return NextResponse.json({ error: `Error interno del servidor: ${error.message}` }, { status: 500 })
  }
}
