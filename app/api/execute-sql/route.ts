import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { sql, sqlPath, action } = data

    // Si se proporciona una ruta de archivo SQL, leer el contenido
    let sqlContent = sql
    if (sqlPath) {
      const filePath = path.join(process.cwd(), "app", sqlPath)
      if (fs.existsSync(filePath)) {
        sqlContent = fs.readFileSync(filePath, "utf8")
      } else {
        return NextResponse.json({ error: `Archivo SQL no encontrado: ${sqlPath}` }, { status: 404 })
      }
    }

    // Verificar si se proporciona SQL
    if (!sqlContent) {
      return NextResponse.json({ error: "No se proporcionó SQL para ejecutar" }, { status: 400 })
    }

    // Acciones especiales
    if (action === "check_function_exists") {
      const { data, error } = await supabase.rpc("check_function_exists", {
        function_name: "generate_daily_report_and_reset",
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ exists: data })
    }

    // Ejecutar SQL
    const { data: result, error } = await supabase.rpc("exec_sql", {
      sql_query: sqlContent,
    })

    if (error) {
      console.error("Error al ejecutar SQL:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `SQL ejecutado correctamente: ${action || "execute_sql"}`,
      result,
    })
  } catch (error: any) {
    console.error("Error en el endpoint execute-sql:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
