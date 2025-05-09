"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function CreateSystemConfigFunctionsPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateFunctions = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await fetch("/api/create-system-config-functions", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al crear las funciones")
      }

      setSuccess(true)
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "Ocurrió un error al crear las funciones")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Crear Funciones para System Config</CardTitle>
          <CardDescription>
            Esta acción creará funciones SQL para gestionar la configuración del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Estas funciones permitirán actualizar la configuración del sistema sin problemas de políticas de seguridad.
          </p>

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Operación exitosa</AlertTitle>
              <AlertDescription className="text-green-700">
                Las funciones han sido creadas correctamente.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Error</AlertTitle>
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateFunctions} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Funciones"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
