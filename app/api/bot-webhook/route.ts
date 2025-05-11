import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log("Webhook recibido:", data)

    // Validar el formato de los datos
    if (!data.type || !data.server_id || !data.ad_id) {
      return NextResponse.json(
        { error: "Formato de datos inválido. Se requieren type, server_id y ad_id" },
        { status: 400 },
      )
    }

    // Buscar el anuncio por emoji
    const { data: adData, error: adError } = await supabase
      .from("ads")
      .select("id")
      .eq("emoji", data.ad_id)
      .maybeSingle()

    if (adError) {
      console.error("Error al buscar anuncio:", adError)
      return NextResponse.json({ error: "Error al buscar anuncio" }, { status: 500 })
    }

    if (!adData) {
      return NextResponse.json({ error: `No se encontró anuncio con emoji: ${data.ad_id}` }, { status: 404 })
    }

    const adId = adData.id

    // Procesar según el tipo de evento
    if (data.type === "new_lead") {
      // Registrar nuevo lead
      const result = await processNewLead(data, adId)
      return NextResponse.json(result)
    } else if (data.type === "new_load") {
      // Registrar nueva conversión
      const result = await processNewLoad(data, adId)
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: `Tipo de evento desconocido: ${data.type}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error en webhook:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

async function processNewLead(data: any, adId: string) {
  try {
    // Verificar si existe el servidor
    const { data: serverData, error: serverError } = await supabase
      .from("servers")
      .select("id")
      .eq("id", data.server_id)
      .maybeSingle()

    if (serverError || !serverData) {
      throw new Error(`Servidor no encontrado: ${data.server_id}`)
    }

    // Verificar si existe la franquicia
    let franchiseId = data.agency_id
    if (franchiseId) {
      const { data: franchiseData, error: franchiseError } = await supabase
        .from("franchises")
        .select("id")
        .eq("id", franchiseId)
        .maybeSingle()

      if (franchiseError || !franchiseData) {
        console.warn(`Franquicia no encontrada: ${franchiseId}, usando null`)
        franchiseId = null
      }
    }

    // Actualizar contador de leads en server_ads
    let serverAdId: string | null = null

    // Buscar o crear server_ad
    const { data: existingServerAd, error: findError } = await supabase
      .from("server_ads")
      .select("id, leads")
      .eq("server_id", data.server_id)
      .eq("ad_id", adId)
      .maybeSingle()

    if (findError) {
      console.error("Error al buscar server_ad:", findError)
    }

    if (existingServerAd) {
      // Actualizar server_ad existente
      const { data: updatedServerAd, error: updateError } = await supabase
        .from("server_ads")
        .update({ leads: (existingServerAd.leads || 0) + 1 })
        .eq("id", existingServerAd.id)
        .select()

      if (updateError) {
        console.error("Error al actualizar server_ad:", updateError)
      } else {
        serverAdId = existingServerAd.id
      }
    } else {
      // Crear nuevo server_ad
      const { data: newServerAd, error: insertError } = await supabase
        .from("server_ads")
        .insert({
          server_id: data.server_id,
          ad_id: adId,
          leads: 1,
          loads: 0,
          date: new Date().toISOString().split("T")[0],
        })
        .select()

      if (insertError) {
        console.error("Error al crear server_ad:", insertError)
      } else if (newServerAd && newServerAd.length > 0) {
        serverAdId = newServerAd[0].id
      }
    }

    // Si tenemos una franquicia, registrar en lead_distributions
    if (franchiseId) {
      // Obtener un teléfono activo para la franquicia
      const { data: phoneData, error: phoneError } = await supabase
        .from("franchise_phones")
        .select("id")
        .eq("franchise_id", franchiseId)
        .eq("is_active", true)
        .order("order_number", { ascending: true })
        .limit(1)
        .single()

      if (phoneError) {
        console.error("Error al obtener teléfono:", phoneError)
      } else {
        const today = new Date().toISOString().split("T")[0]

        // Registrar en daily_distribution
        const { error: distError } = await supabase.from("daily_distribution").insert({
          date: today,
          server_id: data.server_id,
          franchise_id: franchiseId,
          franchise_phone_id: phoneData.id,
          leads_count: 1,
        })

        if (distError) {
          console.error("Error al registrar en daily_distribution:", distError)
        }

        // Registrar en lead_distributions
        const { error: leadDistError } = await supabase.from("lead_distributions").insert({
          date: today,
          server_id: data.server_id,
          franchise_id: franchiseId,
          franchise_phone_id: phoneData.id,
          leads_count: 1,
        })

        if (leadDistError) {
          console.error("Error al registrar en lead_distributions:", leadDistError)
        }
      }
    }

    // Registrar en lead_tracking si existe la tabla
    try {
      await supabase.from("lead_tracking").insert({
        server_id: data.server_id,
        ad_id: adId,
        franchise_id: franchiseId,
        source: "bot",
        metadata: data,
      })
    } catch (trackingError) {
      console.warn("No se pudo registrar en lead_tracking:", trackingError)
      // Continuamos aunque falle el tracking
    }

    return {
      success: true,
      message: "Lead registrado correctamente",
      details: {
        serverAdId,
        franchiseId,
        adId,
      },
    }
  } catch (error: any) {
    console.error("Error procesando lead:", error)
    throw error
  }
}

async function processNewLoad(data: any, adId: string) {
  try {
    // Verificar si existe el servidor
    const { data: serverData, error: serverError } = await supabase
      .from("servers")
      .select("id")
      .eq("id", data.server_id)
      .maybeSingle()

    if (serverError || !serverData) {
      throw new Error(`Servidor no encontrado: ${data.server_id}`)
    }

    // Verificar si existe la franquicia
    let franchiseId = data.agency_id
    if (franchiseId) {
      const { data: franchiseData, error: franchiseError } = await supabase
        .from("franchises")
        .select("id")
        .eq("id", franchiseId)
        .maybeSingle()

      if (franchiseError || !franchiseData) {
        console.warn(`Franquicia no encontrada: ${franchiseId}, usando null`)
        franchiseId = null
      }
    }

    // Normalizar el número de teléfono
    const phoneNumber = normalizePhoneNumber(data.cahiser_phone)
    let franchisePhoneId = null

    // Buscar el teléfono en franchise_phones
    if (phoneNumber && franchiseId) {
      // Primero intentamos buscar el teléfono exacto
      const { data: phoneData, error: phoneError } = await supabase
        .from("franchise_phones")
        .select("id")
        .eq("franchise_id", franchiseId)
        .eq("phone_number", phoneNumber)
        .maybeSingle()

      if (!phoneError && phoneData) {
        franchisePhoneId = phoneData.id
      } else {
        // Si no encontramos el teléfono exacto, buscamos uno similar
        const { data: allPhones, error: allPhonesError } = await supabase
          .from("franchise_phones")
          .select("id, phone_number")
          .eq("franchise_id", franchiseId)
          .eq("is_active", true)

        if (!allPhonesError && allPhones && allPhones.length > 0) {
          // Limpiar el número de teléfono para comparación
          const cleanPhone = phoneNumber.replace(/\D/g, "")

          // Buscar un teléfono que coincida después de limpiar
          const matchingPhone = allPhones.find((phone) => phone.phone_number.replace(/\D/g, "") === cleanPhone)

          if (matchingPhone) {
            franchisePhoneId = matchingPhone.id
          } else if (allPhones.length > 0) {
            // Si no encontramos coincidencia, usar el primer teléfono activo
            franchisePhoneId = allPhones[0].id
            console.log(
              `No se encontró teléfono coincidente, usando el primero disponible: ${allPhones[0].phone_number}`,
            )
          }
        }
      }
    }

    // Si no tenemos un teléfono pero tenemos franquicia, obtener el primer teléfono activo
    if (!franchisePhoneId && franchiseId) {
      const { data: firstPhone, error: firstPhoneError } = await supabase
        .from("franchise_phones")
        .select("id")
        .eq("franchise_id", franchiseId)
        .eq("is_active", true)
        .order("order_number", { ascending: true })
        .limit(1)
        .maybeSingle()

      if (!firstPhoneError && firstPhone) {
        franchisePhoneId = firstPhone.id
        console.log(`Usando primer teléfono disponible: ${firstPhone.id}`)
      }
    }

    // Actualizar contador de loads en server_ads
    let serverAdId: string | null = null

    // Buscar o crear server_ad
    const { data: existingServerAd, error: findError } = await supabase
      .from("server_ads")
      .select("id, loads")
      .eq("server_id", data.server_id)
      .eq("ad_id", adId)
      .maybeSingle()

    if (findError) {
      console.error("Error al buscar server_ad:", findError)
    }

    if (existingServerAd) {
      // Actualizar server_ad existente
      const { data: updatedServerAd, error: updateError } = await supabase
        .from("server_ads")
        .update({ loads: (existingServerAd.loads || 0) + 1 })
        .eq("id", existingServerAd.id)
        .select()

      if (updateError) {
        console.error("Error al actualizar server_ad:", updateError)
      } else {
        serverAdId = existingServerAd.id
      }
    } else {
      // Crear nuevo server_ad
      const { data: newServerAd, error: insertError } = await supabase
        .from("server_ads")
        .insert({
          server_id: data.server_id,
          ad_id: adId,
          leads: 0,
          loads: 1,
          date: new Date().toISOString().split("T")[0],
        })
        .select()

      if (insertError) {
        console.error("Error al crear server_ad:", insertError)
      } else if (newServerAd && newServerAd.length > 0) {
        serverAdId = newServerAd[0].id
      }
    }

    // Registrar la conversión en daily_distribution
    if (franchiseId && franchisePhoneId) {
      const today = new Date().toISOString().split("T")[0]

      // Verificar si ya existe una distribución para hoy
      const { data: existingDist, error: checkDistError } = await supabase
        .from("daily_distribution")
        .select("id, conversions_count")
        .eq("date", today)
        .eq("franchise_id", franchiseId)
        .eq("franchise_phone_id", franchisePhoneId)
        .maybeSingle()

      if (checkDistError) {
        console.error("Error al verificar daily_distribution:", checkDistError)
      }

      if (existingDist) {
        // Actualizar distribución existente
        const { error: updateDistError } = await supabase
          .from("daily_distribution")
          .update({
            conversions_count: (existingDist.conversions_count || 0) + 1,
          })
          .eq("id", existingDist.id)

        if (updateDistError) {
          console.error("Error al actualizar daily_distribution:", updateDistError)
        }
      } else {
        // Crear nueva distribución
        const { error: newDistError } = await supabase.from("daily_distribution").insert({
          date: today,
          server_id: data.server_id,
          franchise_id: franchiseId,
          franchise_phone_id: franchisePhoneId,
          conversions_count: 1,
        })

        if (newDistError) {
          console.error("Error al crear daily_distribution:", newDistError)
        }
      }
    }

    // Registrar en conversions si existe la tabla
    try {
      await supabase.from("conversions").insert({
        date: new Date().toISOString().split("T")[0],
        server_id: data.server_id,
        franchise_id: franchiseId,
        franchise_phone_id: franchisePhoneId,
        amount: 0, // Valor por defecto
        source: "bot",
        metadata: data,
      })
    } catch (conversionError) {
      console.warn("No se pudo registrar en conversions:", conversionError)
      // Continuamos aunque falle el registro de conversión
    }

    return {
      success: true,
      message: "Conversión registrada correctamente",
      details: {
        serverAdId,
        franchiseId,
        franchisePhoneId,
        normalizedPhone: phoneNumber,
      },
    }
  } catch (error: any) {
    console.error("Error procesando load:", error)
    throw error
  }
}

// Función para normalizar números de teléfono
function normalizePhoneNumber(phone: string): string | null {
  if (!phone) return null

  // Eliminar todos los caracteres no numéricos
  let normalized = phone.replace(/\D/g, "")

  // Si comienza con 54, asumimos que es un número argentino
  if (normalized.startsWith("54")) {
    normalized = normalized.substring(2)
  }

  // Si comienza con 9, asumimos que es un número móvil argentino
  if (normalized.startsWith("9")) {
    normalized = normalized.substring(1)
  }

  // Si tiene 10 dígitos, asumimos que es un número argentino completo (código de área + número)
  if (normalized.length === 10) {
    return normalized
  }

  // Si tiene menos de 8 dígitos, probablemente no es un número válido
  if (normalized.length < 8) {
    return null
  }

  return normalized
}
