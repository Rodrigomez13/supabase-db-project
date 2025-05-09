import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase.from("franchises").select("id, name").order("name")

    if (error) {
      console.error("Error al obtener franquicias:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener franquicias" },
      { status: 500 },
    )
  }
}
