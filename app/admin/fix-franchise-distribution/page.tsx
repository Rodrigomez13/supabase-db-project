"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function FixFranchiseDistributionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const handleFixFunction = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/fix-franchise-distribution")
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
          <CardTitle>Corregir Función de Distribución de Franquicias</CardTitle>
          <CardDescription>
            Esta herramienta corrige la función SQL que calcula la distribución de conversiones por franquicia,
            solucionando el error de ambigüedad en la columna "franchise_name".
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert className={result.success ? "bg-green-50" : "bg-red-50"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
              <AlertDescription>{result.success ? result.message : result.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleFixFunction} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Corrigiendo...
              </>
            ) : (
              "Corregir Función"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
