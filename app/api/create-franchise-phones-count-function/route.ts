import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Leer el archivo SQL
    const sqlFilePath = path.join(process.cwd(), "sql", "create-franchise-phones-count-function.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Ejecutar el SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlQuery })

    if (error) {
      console.error("Error al ejecutar SQL:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Error al crear la función de conteo de teléfonos" },
      { status: 500 },
    )
  }
}
