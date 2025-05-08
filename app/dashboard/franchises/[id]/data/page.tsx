"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Download, Phone, MessageSquare, CreditCard } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function FranchiseDataPage() {
  const params = useParams()
  const franchiseId = params.id as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>({
    phones: [],
    conversions: [],
    finances: [],
  })

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch phone data
        const { data: phoneData, error: phoneError } = await supabase
          .from("franchise_phones")
          .select("*")
          .eq("franchise_id", franchiseId)
          .order("date", { ascending: false })
          .limit(100)

        if (phoneError) throw new Error(`Error al cargar datos de teléfonos: ${phoneError.message}`)

        // Fetch conversions data
        const { data: conversionsData, error: conversionsError } = await supabase
          .from("conversions")
          .select("*")
          .eq("franchise_id", franchiseId)
          .order("created_at", { ascending: false })
          .limit(100)

        if (conversionsError) throw new Error(`Error al cargar conversiones: ${conversionsError.message}`)

        // Fetch financial data (example query - adjust based on your schema)
        const { data: financeData, error: financeError } = await supabase
          .from("server_daily_records")
          .select("*")
          .eq("franchise_id", franchiseId)
          .order("date", { ascending: false })
          .limit(100)

        if (financeError) throw new Error(`Error al cargar datos financieros: ${financeError.message}`)

        setData({
          phones: phoneData || [],
          conversions: conversionsData || [],
          finances: financeData || [],
        })
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Error al cargar los datos")
      } finally {
        setLoading(false)
      }
    }

    if (franchiseId) {
      fetchData()
    }
  }, [franchiseId])

  const downloadCSV = (dataArray: any[], filename: string) => {
    if (!dataArray.length) return

    // Get headers from first object
    const headers = Object.keys(dataArray[0])

    // Create CSV content
    const csvContent = [
      headers.join(","), // Header row
      ...dataArray.map((row) =>
        headers
          .map((header) => {
            // Handle values that might contain commas or quotes
            const value = row[header] === null ? "" : String(row[header])
            return `"${value.replace(/"/g, '""')}"`
          })
          .join(","),
      ),
    ].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-10 w-full max-w-md mb-6" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Datos de la Franquicia</h1>

      <Tabs defaultValue="phones" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="phones">
            <Phone className="h-4 w-4 mr-2" />
            Teléfonos
          </TabsTrigger>
          <TabsTrigger value="conversions">
            <MessageSquare className="h-4 w-4 mr-2" />
            Conversiones
          </TabsTrigger>
          <TabsTrigger value="finances">
            <CreditCard className="h-4 w-4 mr-2" />
            Finanzas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="phones">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Datos de Teléfonos</CardTitle>
                <CardDescription>Registros de llamadas y métricas telefónicas</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => downloadCSV(data.phones, "telefonos-franquicia")}
                disabled={data.phones.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              {data.phones.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No hay datos de teléfonos disponibles</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Número</TableHead>
                        <TableHead>Llamadas</TableHead>
                        <TableHead>Duración (min)</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.phones.map((item: any, index: number) => (
                        <TableRow key={item.id || index}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell>{item.phone_number || "N/A"}</TableCell>
                          <TableCell>{item.calls || 0}</TableCell>
                          <TableCell>{item.duration || 0}</TableCell>
                          <TableCell>
                            <Badge variant={item.active ? "default" : "secondary"}>
                              {item.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Datos de Conversiones</CardTitle>
                <CardDescription>Registros de conversiones y leads</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => downloadCSV(data.conversions, "conversiones-franquicia")}
                disabled={data.conversions.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              {data.conversions.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No hay datos de conversiones disponibles</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Fuente</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.conversions.map((item: any, index: number) => (
                        <TableRow key={item.id || index}>
                          <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                          <TableCell>{item.type || "N/A"}</TableCell>
                          <TableCell>${item.value || "0.00"}</TableCell>
                          <TableCell>{item.source || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                              {item.status || "Pendiente"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finances">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Datos Financieros</CardTitle>
                <CardDescription>Registros de gastos e ingresos</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => downloadCSV(data.finances, "finanzas-franquicia")}
                disabled={data.finances.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              {data.finances.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No hay datos financieros disponibles</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Servidor</TableHead>
                        <TableHead>Gasto</TableHead>
                        <TableHead>Impresiones</TableHead>
                        <TableHead>Clics</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.finances.map((item: any, index: number) => (
                        <TableRow key={item.id || index}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell>{item.server_name || "N/A"}</TableCell>
                          <TableCell>${item.spend || "0.00"}</TableCell>
                          <TableCell>{item.impressions || 0}</TableCell>
                          <TableCell>{item.clicks || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
