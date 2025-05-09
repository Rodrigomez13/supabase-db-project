"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function FixMetricsFunctionsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  async function handleFixFunctions() {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/fix-metrics-functions", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: "Las funciones de métricas han sido corregidas para eliminar referencias a columnas inexistentes",
        })
      } else {
        setResult({
          success: false,
          message: `Error al corregir las funciones: ${data.error || "Error desconocido"}`,
        })
      }
    } catch (error) {
      console.error("Error al corregir las funciones:", error)
      setResult({
        success: false,
        message: "Error al comunicarse con el servidor. Por favor, inténtelo de nuevo.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Corregir Funciones de Métricas</CardTitle>
          <CardDescription>
            Esta herramienta corregirá las funciones SQL que generan métricas para el dashboard y los informes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">Las siguientes funciones serán actualizadas:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              <code className="bg-muted px-1 py-0.5 rounded">get_hourly_metrics(date)</code> - Corrige referencias a
              columnas inexistentes
            </li>
            <li>
              <code className="bg-muted px-1 py-0.5 rounded">get_franchise_distribution_metrics(date)</code> - Corrige
              referencias a columnas inexistentes
            </li>
          </ul>

          {result && (
            <Alert
              className={`mt-6 ${result.success ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}`}
            >
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleFixFunctions} disabled={isLoading} className="w-full">
            {isLoading ? "Corrigiendo..." : "Corregir Funciones"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
