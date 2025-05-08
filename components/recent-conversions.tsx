"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Eye, Loader2 } from "lucide-react"
import Link from "next/link"

interface Conversion {
  id: string
  lead_id: string
  amount: number
  description: string
  date: string
  franchise_name: string
  phone_number: string
  created_at: string
}

export function RecentConversions() {
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchConversions() {
      try {
        setLoading(true)

        // Obtener conversiones recientes
        const { data, error } = await supabase
          .from("leads")
          .select(`
            id, date, created_at, status,
            franchises (name),
            franchise_phones (phone_number),
            conversions (id, amount, description)
          `)
          .eq("status", "converted")
          .order("created_at", { ascending: false })
          .limit(10)

        if (error) throw error

        // Formatear los datos
        const formattedConversions = data
          .filter((lead) => lead.conversions && lead.conversions.length > 0)
          .map((lead) => ({
            id: lead.conversions[0].id,
            lead_id: lead.id,
            amount: lead.conversions[0].amount || 0,
            description: lead.conversions[0].description || "",
            date: lead.date,
            franchise_name: lead.franchises?.[0]?.name || "Sin franquicia",
            phone_number: lead.franchise_phones?.[0]?.phone_number || "Sin teléfono asignado",
            created_at: lead.created_at,
          }))

        setConversions(formattedConversions)
      } catch (error) {
        console.error("Error fetching conversions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversions()
  }, [supabase])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversiones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Conversiones Recientes</CardTitle>
        <Link href="/dashboard/conversions">
          <Button variant="outline" size="sm">
            Ver todas
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {conversions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No hay conversiones recientes para mostrar</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Franquicia</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversions.map((conversion) => (
                  <TableRow key={conversion.id}>
                    <TableCell>{new Date(conversion.date).toLocaleDateString()}</TableCell>
                    <TableCell>{conversion.franchise_name}</TableCell>
                    <TableCell>{conversion.phone_number}</TableCell>
                    <TableCell>${conversion.amount.toFixed(2)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{conversion.description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/leads/${conversion.lead_id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
