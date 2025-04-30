import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { tableName } = await request.json()

    if (!tableName) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 })
    }

    // Ejecutamos SQL para desactivar RLS temporalmente
    const { error } = await supabase.rpc("exec_sql", {
      sql: `ALTER TABLE public.${tableName} DISABLE ROW LEVEL SECURITY;`,
    })

    if (error) {
      console.error("Error disabling RLS:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `RLS disabled for ${tableName}` })
  } catch (error: any) {
    console.error("Error in disable-rls route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
