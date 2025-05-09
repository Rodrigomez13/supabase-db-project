"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function CreateNewFranchiseDistributionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const handleCreateFunction = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/create-new-franchise-distribution")
      const data = await response.json()

      setResult({
        success: data.success,
        message: data.message,
        error: data.error,
      })
    } catch (error) {
      setResult({
        success: false,
        error: "Error al conectar con el servidor",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nueva Función de Distribución de Franquicias</CardTitle>
          <CardDescription>
            Esta herramienta crea una nueva función SQL para calcular la distribución de conversiones por franquicia,
            solucionando el error de ambigüedad en la columna "franchise_name".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            La nueva función <code>get_franchise_distribution_v2</code> utiliza un enfoque diferente para calcular la
            distribución, evitando problemas de ambigüedad en las columnas y mejorando el rendimiento.
          </p>

          {result && (
            <Alert className={result.success ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
              <AlertDescription>{result.success ? result.message : result.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateFunction} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Nueva Función"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
