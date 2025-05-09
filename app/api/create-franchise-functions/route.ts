import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado. Debe iniciar sesión." }, { status: 401 })
    }

    // Verificar si el usuario es administrador
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado. Se requiere rol de administrador." }, { status: 403 })
    }

    // Leer el archivo SQL
    const sqlFilePath = path.join(process.cwd(), "sql", "create-get-active-franchises-function.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Ejecutar la consulta SQL
    const { error: sqlError } = await supabase.rpc("exec_sql", { sql_query: sqlQuery })

    if (sqlError) {
      console.error("Error al ejecutar SQL:", sqlError)

      // Intentar ejecutar directamente si la función exec_sql no existe
      const { error: directError } = await supabase.rpc("exec_sql_query", { query: sqlQuery })

      if (directError) {
        console.error("Error al ejecutar SQL directamente:", directError)

        // Último intento: ejecutar como consulta SQL normal
        const { error: rawError } = await supabase.query(sqlQuery)

        if (rawError) {
          console.error("Error al ejecutar SQL raw:", rawError)
          return NextResponse.json({ error: `Error al crear las funciones: ${rawError.message}` }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ message: "Funciones creadas correctamente" })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json({ error: `Error inesperado: ${error.message}` }, { status: 500 })
  }
}
