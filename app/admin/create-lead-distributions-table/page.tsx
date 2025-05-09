"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function CreateLeadDistributionsTablePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleCreateTable = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // Obtener el SQL del archivo
      const response = await fetch("/api/create-lead-distributions-table")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Error al crear la tabla de distribuciones de leads")
      }

      setResult({
        success: true,
        message: "Tabla de distribuciones de leads creada correctamente",
      })
    } catch (error: any) {
      console.error("Error:", error)
      setResult({
        success: false,
        message: error.message || "Error al crear la tabla de distribuciones de leads",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Crear Tabla de Distribuciones de Leads</CardTitle>
          <CardDescription>
            Este proceso creará la tabla necesaria para gestionar la distribución de leads a franquicias y teléfonos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Este proceso creará:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  Tabla <code>lead_distributions</code> para almacenar las asignaciones de leads
                </li>
                <li>Índices para optimizar las consultas</li>
                <li>
                  Trigger para actualizar automáticamente el campo <code>updated_at</code>
                </li>
                <li>
                  Función <code>get_next_franchise_phone</code> para obtener el siguiente teléfono disponible
                </li>
                <li>
                  Vista <code>lead_distribution_stats</code> para estadísticas de distribución
                </li>
              </ul>
            </div>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateTable} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando tabla...
              </>
            ) : (
              "Crear Tabla de Distribuciones"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
