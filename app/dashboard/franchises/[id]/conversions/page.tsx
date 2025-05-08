"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusIcon, MessageSquare, BarChart2, CalendarDays, Search } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Conversion {
  id: string
  franchise_id: string
  date: string
  phone_number: string
  source: string
  amount: number
  notes?: string
  status?: string
}

export default function FranchiseConversionsPage() {
  const params = useParams()
  const franchiseId = params.id as string
  const [loading, setLoading] = useState<boolean>(true)
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [stats, setStats] = useState({
    total: 0,
    dailyAverage: 0,
    bestDay: 0,
    growthRate: 0,
  })
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState("all")
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadConversions = async () => {
      try {
        setLoading(true)

        // Intentar cargar datos reales de Supabase
        const { data: realData, error } = await supabase
          .from("conversions")
          .select("*")
          .eq("franchise_id", franchiseId)
          .gte("date", dateRange.from.toISOString().split("T")[0])
          .lte("date", dateRange.to.toISOString().split("T")[0])
          .order("date", { ascending: false })

        // Si hay datos reales, usarlos
        if (realData && realData.length > 0) {
          setConversions(realData)

          // Calcular estadísticas reales
          const total = realData.length
          const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) || 1
          const dailyAverage = total / days

          // Agrupar por fecha para encontrar el mejor día
          const countsByDate: Record<string, number> = realData.reduce(
            (acc, item) => {
              const date = item.date
              acc[date] = (acc[date] || 0) + 1
              return acc
            },
            {},
          )

          const bestDay = Math.max(...Object.values(countsByDate) as number[])

          setStats({
            total,
            dailyAverage: Number.parseFloat(dailyAverage.toFixed(2)),
            bestDay,
            growthRate: 0, // Esto requeriría datos históricos para calcularlo
          })
        } else {
          // Usar datos de ejemplo si no hay datos reales
          const mockConversions: Conversion[] = [
            {
              id: "1",
              franchise_id: franchiseId,
              date: "2023-05-05",
              phone_number: "+54 91134567890",
              source: "Facebook",
              amount: 2500,
              status: "completed",
            },
            {
              id: "2",
              franchise_id: franchiseId,
              date: "2023-05-04",
              phone_number: "+54 91187654321",
              source: "Instagram",
              amount: 1800,
              status: "completed",
            },
            {
              id: "3",
              franchise_id: franchiseId,
              date: "2023-05-04",
              phone_number: "+54 91145678901",
              source: "Google",
              amount: 3200,
              status: "completed",
            },
            {
              id: "4",
              franchise_id: franchiseId,
              date: "2023-05-03",
              phone_number: "+54 91156789012",
              source: "Facebook",
              amount: 1500,
              status: "completed",
            },
            {
              id: "5",
              franchise_id: franchiseId,
              date: "2023-05-02",
              phone_number: "+54 91167890123",
              source: "TikTok",
              amount: 2100,
              status: "completed",
            },
          ]

          setConversions(mockConversions)

          // Calcular estadísticas de ejemplo
          setStats({
            total: mockConversions.length,
            dailyAverage: 4.27,
            bestDay: 12,
            growthRate: 18,
          })
        }
      } catch (error) {
        console.error("Error loading franchise conversions:", error)
      } finally {
        setLoading(false)
      }
    }

    if (franchiseId) {
      loadConversions()
    }
  }, [franchiseId, dateRange, supabase])

  // Filtrar conversiones
  const filteredConversions = conversions.filter((conversion) => {
    const matchesSearch =
      searchQuery === "" ||
      conversion.phone_number?.includes(searchQuery) ||
      conversion.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conversion.notes && conversion.notes.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSource = sourceFilter === "all" || conversion.source === sourceFilter

    return matchesSearch && matchesSource
  })

  // Obtener fuentes únicas para el filtro
  const uniqueSources = Array.from(new Set(conversions.map((c) => c.source).filter(Boolean)))

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Conversiones</h2>
          <p className="text-muted-foreground">Gestiona y analiza las conversiones de esta franquicia</p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Registrar Conversión
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="w-full md:w-1/4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <CalendarDays className="mr-2 h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rango de fechas</label>
              <div className="mt-1">
                <DateRangePicker
                  value={dateRange}
                  onChange={(range: { from?: Date; to?: Date }) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to })
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Teléfono, fuente, notas..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Fuente</label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todas las fuentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fuentes</SelectItem>
                  {uniqueSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="w-full md:w-3/4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium flex items-center">
                <BarChart2 className="mr-2 h-5 w-5" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total de conversiones</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Promedio diario</p>
                    <p className="text-2xl font-bold">{stats.dailyAverage}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Mejor día</p>
                    <p className="text-2xl font-bold">{stats.bestDay}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Tasa de crecimiento</p>
                    <p className="text-2xl font-bold">+{stats.growthRate}%</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Conversiones Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="table">
                <TabsList className="mb-4">
                  <TabsTrigger value="table">Tabla</TabsTrigger>
                  <TabsTrigger value="graph">Gráfico</TabsTrigger>
                </TabsList>

                <TabsContent value="table">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <p>Cargando conversiones...</p>
                    </div>
                  ) : filteredConversions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-2" />
                      <h3 className="text-lg font-medium">No hay conversiones</h3>
                      <p className="text-muted-foreground">
                        {searchQuery || sourceFilter !== "all"
                          ? "No hay conversiones que coincidan con los filtros aplicados."
                          : "No hay conversiones registradas para esta franquicia."}
                      </p>
                      <Button className="mt-4">
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Registrar Conversión
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="py-2 px-4 text-left font-medium">Fecha</th>
                            <th className="py-2 px-4 text-left font-medium">Teléfono</th>
                            <th className="py-2 px-4 text-left font-medium">Fuente</th>
                            <th className="py-2 px-4 text-right font-medium">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredConversions.map((conversion) => (
                            <tr key={conversion.id} className="border-b">
                              <td className="py-2 px-4">{conversion.date}</td>
                              <td className="py-2 px-4">{conversion.phone_number}</td>
                              <td className="py-2 px-4">{conversion.source}</td>
                              <td className="py-2 px-4 text-right">${conversion.amount?.toLocaleString() || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="graph">
                  <div className="h-80 flex items-center justify-center border rounded">
                    <p className="text-muted-foreground">Gráfico de conversiones (pendiente de implementación)</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
