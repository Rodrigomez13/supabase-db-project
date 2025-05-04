import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validar datos requeridos
    if (!data.ad_id || !data.amount || !data.date) {
      return NextResponse.json({ error: "Se requieren ad_id, amount y date" }, { status: 400 })
    }

    // Registrar el gasto de Facebook
    const { data: result, error } = await supabase
      .from("fb_spend")
      .insert({
        ad_id: data.ad_id,
        amount: data.amount,
        date: data.date,
        notes: data.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error al registrar gasto de FB:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Actualizar el gasto en server_ads si existe un registro para ese anuncio en esa fecha
    if (data.server_id) {
      const { error: updateError } = await supabase
        .from("server_ads")
        .update({ spent: data.amount })
        .eq("server_id", data.server_id)
        .eq("ad_id", data.ad_id)
        .eq("date", data.date)

      if (updateError) {
        console.warn("Error al actualizar server_ads:", updateError)
      }
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("Error en el endpoint register-fb-spend:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
