import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { franchiseId } = await request.json()

    if (!franchiseId) {
      return NextResponse.json({ success: false, error: "ID de franquicia no proporcionado" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Llamar a la función RPC directamente
    const { data, error } = await supabase.rpc("get_valid_franchise_phone", {
      p_franchise_id: franchiseId,
    })

    if (error) {
      console.error("Error al llamar a la función RPC:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "No se encontró ningún teléfono válido para esta franquicia" },
        { status: 404 },
      )
    }

    // La función devuelve un array de objetos con phone_id y phone_number
    return NextResponse.json({
      success: true,
      data: data[0], // Devolvemos el primer resultado
    })
  } catch (error: any) {
    console.error("Error en get-valid-franchise-phone:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
