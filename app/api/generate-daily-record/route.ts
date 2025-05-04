import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validar datos requeridos
    if (!data.server_id) {
      return NextResponse.json({ error: "Se requiere server_id" }, { status: 400 })
    }

    const date = data.date || new Date().toISOString().split("T")[0]

    // Llamar a la función para generar el registro diario
    const { data: result, error } = await supabase.rpc("generate_server_daily_record", {
      server_id_param: data.server_id,
      date_param: date,
    })

    if (error) {
      console.error("Error al generar registro diario:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, record_id: result })
  } catch (error: any) {
    console.error("Error en el endpoint generate-daily-record:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
