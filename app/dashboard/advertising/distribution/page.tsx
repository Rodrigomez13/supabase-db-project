"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { safeQuery } from "@/lib/safe-query"
import { DatePicker } from "@/components/ui/date-picker"
import { PlusCircle, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

interface Server {
  id: string
  name: string
}

interface Franchise {
  id: string
  name: string
}

interface FranchisePhone {
  id: string
  franchise_id: string
  phone_number: string
  order_number: number
}

interface LeadDistribution {
  id: string
  date: string
  server_id: string
  franchise_id: string
  franchise_phone_id: string
  leads_count: number
  created_at: string
  servers?: {
    name: string
  }
  franchises?: {
    name: string
  }
  franchise_phones?: {
    phone_number: string
  }
}

export default function LeadDistributionPage() {
  const router = useRouter()
  const [servers, setServers] = useState<Server[]>([])
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [distributions, setDistributions] = useState<LeadDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState<Date | undefined>(new Date())
  const [filterServer, setFilterServer] = useState<string>("")
  const [filterFranchise, setFilterFranchise] = useState<string>("")

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchDistributions()
  }, [filterDate, filterServer, filterFranchise])

  async function fetchData() {
    try {
      setLoading(true)

      // Fetch servers
      const serversData = await safeQuery<Server>("servers", {
        where: { is_active: true },
        orderBy: { column: "name" },
      })

      // Fetch franchises
      const franchisesData = await safeQuery<Franchise>("franchises", {
        orderBy: { column: "name" },
      })

      setServers(serversData)
      setFranchises(franchisesData)
      setError(null)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("No se pudieron cargar los datos. Por favor, intenta de nuevo más tarde.")
    } finally {
      setLoading(false)
    }
  }

  async function fetchDistributions() {
    try {
      setLoading(true)

      // Construir filtros
      const filters: any = {}

      if (filterDate) {
        filters.date = filterDate.toISOString().split("T")[0]
      }

      if (filterServer) {
        filters.server_id = filterServer
      }

      if (filterFranchise) {
        filters.franchise_id = filterFranchise
      }

      // Fetch distributions with filters
      const distributionsData = await safeQuery<LeadDistribution>("lead_distributions", {
        relationships: "servers(name), franchises(name), franchise_phones(phone_number)",
        where: filters,
        orderBy: { column: "created_at", ascending: false },
        limit: 50,
      })

      setDistributions(distributionsData)
      setError(null)
    } catch (error) {
      console.error("Error fetching distributions:", error)
      setError("No se pudieron cargar las distribuciones. Por favor, intenta de nuevo más tarde.")
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = () => {
    setFilterDate(new Date())
    setFilterServer("")
    setFilterFranchise("")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Distribución de Leads</h1>
        <Button
          onClick={() => router.push("/dashboard/advertising/distribution/assign")}
          className="bg-primary hover:bg-primary/90"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Asignar Leads
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Filtros</span>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-filter">Fecha</Label>
              <DatePicker date={filterDate} setDate={setFilterDate} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="server-filter">Servidor</Label>
              <Select value={filterServer} onValueChange={setFilterServer}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los servidores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los servidores</SelectItem>
                  {servers.map((server) => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="franchise-filter">Franquicia</Label>
              <Select value={filterFranchise} onValueChange={setFilterFranchise}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las franquicias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las franquicias</SelectItem>
                  {franchises.map((franchise) => (
                    <SelectItem key={franchise.id} value={franchise.id}>
                      {franchise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuciones de Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Cargando distribuciones...</div>
          ) : distributions.length === 0 ? (
            <div className="text-center py-4">No hay distribuciones para los filtros seleccionados</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Servidor</TableHead>
                    <TableHead>Franquicia</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Creado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributions.map((dist) => (
                    <TableRow key={dist.id}>
                      <TableCell>{new Date(dist.date).toLocaleDateString()}</TableCell>
                      <TableCell>{dist.servers?.name}</TableCell>
                      <TableCell>{dist.franchises?.name}</TableCell>
                      <TableCell>{dist.franchise_phones?.phone_number}</TableCell>
                      <TableCell>{dist.leads_count}</TableCell>
                      <TableCell>{new Date(dist.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
