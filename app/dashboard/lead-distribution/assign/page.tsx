"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "@/components/ui/use-toast"
import { safeQuery, safeInsert } from "@/lib/safe-query"

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

export default function AssignLeadsPage() {
  const router = useRouter()
  const [servers, setServers] = useState<Server[]>([])
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [franchisePhones, setFranchisePhones] = useState<FranchisePhone[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [date, setDate] = useState<Date>(new Date())

  const [formData, setFormData] = useState({
    server_id: "",
    franchise_id: "",
    franchise_phone_id: "",
    leads_count: 1,
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (formData.franchise_id) {
      fetchFranchisePhones(formData.franchise_id)
    } else {
      setFranchisePhones([])
    }
  }, [formData.franchise_id])

  async function fetchData() {
    try {
      setLoading(true)

      // Fetch active servers
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
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchFranchisePhones(franchiseId: string) {
    try {
      const data = await safeQuery<FranchisePhone>("franchise_phones", {
        where: { franchise_id: franchiseId },
        orderBy: { column: "order_number" },
      })

      setFranchisePhones(data)

      // Si hay teléfonos disponibles, seleccionar el primero por defecto
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, franchise_phone_id: data[0].id }))
      }
    } catch (error) {
      console.error("Error fetching franchise phones:", error)
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.server_id || !formData.franchise_id || !formData.franchise_phone_id) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      // Formatear la fecha para la base de datos
      const formattedDate = date.toISOString().split("T")[0]

      // Crear la distribución de leads
      const result = await safeInsert("lead_distributions", {
        ...formData,
        date: formattedDate,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      // Crear los leads individuales
      for (let i = 0; i < Number(formData.leads_count); i++) {
        await safeInsert("leads", {
          server_id: formData.server_id,
          franchise_id: formData.franchise_id,
          franchise_phone_id: formData.franchise_phone_id,
          date: formattedDate,
          status: "pending",
        })
      }

      toast({
        title: "Leads asignados",
        description: `Se han asignado ${formData.leads_count} leads correctamente.`,
      })

      // Redireccionar a la página principal de distribución
      router.push("/dashboard/lead-distribution")
    } catch (error: any) {
      console.error("Error assigning leads:", error)
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al asignar los leads.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Asignar Leads</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard/lead-distribution")}>
          Volver
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Asignación de Leads</CardTitle>
          <CardDescription>Asigne leads a una franquicia específica desde un servidor.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <DatePicker date={date} setDate={(selectedDate) => setDate(selectedDate || new Date())} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="server_id">Servidor</Label>
              <Select value={formData.server_id} onValueChange={(value) => handleSelectChange("server_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un servidor" />
                </SelectTrigger>
                <SelectContent>
                  {servers.map((server) => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="franchise_id">Franquicia</Label>
              <Select
                value={formData.franchise_id}
                onValueChange={(value) => handleSelectChange("franchise_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una franquicia" />
                </SelectTrigger>
                <SelectContent>
                  {franchises.map((franchise) => (
                    <SelectItem key={franchise.id} value={franchise.id}>
                      {franchise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="franchise_phone_id">Teléfono</Label>
              <Select
                value={formData.franchise_phone_id}
                onValueChange={(value) => handleSelectChange("franchise_phone_id", value)}
                disabled={franchisePhones.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un teléfono" />
                </SelectTrigger>
                <SelectContent>
                  {franchisePhones.map((phone) => (
                    <SelectItem key={phone.id} value={phone.id}>
                      {phone.phone_number} (#{phone.order_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {franchisePhones.length === 0 && formData.franchise_id && (
                <p className="text-sm text-red-500">
                  Esta franquicia no tiene teléfonos registrados. Por favor, agregue teléfonos primero.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="leads_count">Cantidad de Leads</Label>
              <Input
                id="leads_count"
                name="leads_count"
                type="number"
                min="1"
                value={formData.leads_count}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting || franchisePhones.length === 0}>
                {submitting ? "Asignando..." : "Asignar Leads"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
