"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function CreateFranchisePhonesCountFunctionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleCreateFunction = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // Obtener el SQL del archivo
      const response = await fetch("/api/create-franchise-phones-count-function")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Error al crear la función de conteo de teléfonos")
      }

      setResult({
        success: true,
        message: "Función de conteo de teléfonos creada correctamente",
      })
    } catch (error: any) {
      console.error("Error:", error)
      setResult({
        success: false,
        message: error.message || "Error al crear la función de conteo de teléfonos",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Crear Función de Conteo de Teléfonos</CardTitle>
          <CardDescription>
            Este proceso creará la función necesaria para contar los teléfonos activos y totales por franquicia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Este proceso creará:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  Función <code>get_franchise_phones_count</code> para contar teléfonos por franquicia
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
          <Button onClick={handleCreateFunction} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando función...
              </>
            ) : (
              "Crear Función de Conteo"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
