"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function CreatePhoneAssignmentFunctionPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleCreateFunction = async () => {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/create-phone-assignment-function", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: "Función de asignación de teléfonos creada correctamente",
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Error al crear la función de asignación de teléfonos",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      setResult({
        success: false,
        message: "Error al procesar la solicitud",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Crear Función de Asignación de Teléfonos</CardTitle>
          <CardDescription>
            Este proceso creará la función SQL para asignar teléfonos respetando las metas diarias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert className={result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateFunction} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando función...
              </>
            ) : (
              "Crear Función de Asignación"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
