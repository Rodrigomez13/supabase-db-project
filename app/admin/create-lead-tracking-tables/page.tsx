"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function CreateLeadTrackingTablesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  async function createTables() {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/create-lead-tracking-tables", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear las tablas")
      }

      setResult({
        success: true,
        message: "Tablas creadas correctamente",
      })
    } catch (error: any) {
      console.error("Error:", error)
      setResult({
        success: false,
        message: error.message || "Error al crear las tablas",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Crear Tablas para Seguimiento de Leads</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Este proceso creará las siguientes tablas en la base de datos:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>
              <strong>leads</strong> - Para almacenar información de leads generados
            </li>
            <li>
              <strong>conversions</strong> - Para registrar cuando un lead se convierte en cliente
            </li>
          </ul>
          <p className="mb-4">También creará las siguientes funciones SQL:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>get_lead_distribution</strong> - Para obtener la distribución de leads por franquicia
            </li>
            <li>
              <strong>get_conversion_distribution</strong> - Para obtener la distribución de conversiones por franquicia
            </li>
            <li>
              <strong>get_franchise_conversion_rates</strong> - Para calcular tasas de conversión por franquicia
            </li>
          </ul>
        </CardContent>
      </Card>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"} className="mb-6">
          {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      <Button onClick={createTables} disabled={isLoading} className="w-full md:w-auto">
        {isLoading ? "Creando tablas..." : "Crear Tablas"}
      </Button>
    </div>
  )
}
