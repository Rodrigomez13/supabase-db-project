import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Creamos un cliente con la clave de servicio para tener acceso completo
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Actualizar el rol del usuario a 'authenticated' en lugar de NULL
    const { error } = await supabaseAdmin.rpc("update_user_role", {
      user_id: userId,
      new_role: "authenticated",
    })

    if (error) {
      console.error("Error updating user role:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "User role updated successfully" })
  } catch (error: any) {
    console.error("Error in fix-user-role route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
