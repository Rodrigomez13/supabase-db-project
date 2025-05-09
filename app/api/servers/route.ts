import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase.from("servers").select("id, name").eq("is_active", true).order("name")

    if (error) {
      console.error("Error al obtener servidores:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json({ success: false, error: error.message || "Error al obtener servidores" }, { status: 500 })
  }
}
