import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar si el usuario es administrador
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si el usuario tiene rol de administrador
    const { data: userRoleData, error: userRoleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .single()

    if (userRoleError || userRoleData?.role !== "admin") {
      return NextResponse.json({ error: "Se requiere rol de administrador" }, { status: 403 })
    }

    // Leer el archivo SQL
    const sqlFilePath = path.join(process.cwd(), "sql", "create-user-preferences-table.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Ejecutar la consulta SQL
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sqlQuery })

    if (error) {
      console.error("Error al ejecutar SQL:", error)
      return NextResponse.json({ error: "Error al crear la tabla" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Tabla creada correctamente", data })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
