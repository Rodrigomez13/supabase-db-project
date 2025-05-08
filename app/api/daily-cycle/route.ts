import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    // Verificar autorización (puedes implementar una clave API o similar)
    const authHeader = request.headers.get("authorization")
    if (!process.env.DAILY_CYCLE_API_KEY || authHeader !== `Bearer ${process.env.DAILY_CYCLE_API_KEY}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Ejecutar la función para generar reportes y reiniciar contadores
    const { error } = await supabase.rpc("generate_daily_report_and_reset")

    if (error) {
      console.error("Error al ejecutar el ciclo diario:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Ciclo diario completado: reportes generados y contadores reiniciados",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error en el endpoint daily-cycle:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
