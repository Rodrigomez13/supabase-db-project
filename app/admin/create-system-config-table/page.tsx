"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

export default function CreateSystemConfigTablePage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateTable = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await fetch("/api/create-system-config-table", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al crear la tabla")
      }

      setSuccess(true)
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "Ocurrió un error al crear la tabla")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Crear Tabla de Configuración del Sistema</CardTitle>
          <CardDescription>
            Esta acción creará la tabla system_config para almacenar la configuración global del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            La tabla system_config se utiliza para almacenar configuraciones globales como la franquicia activa para
            asignación de leads y loads.
          </p>

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Operación exitosa</AlertTitle>
              <AlertDescription className="text-green-700">
                La tabla system_config ha sido creada o actualizada correctamente.
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
          <Button onClick={handleCreateTable} disabled={loading}>
            {loading ? "Creando..." : "Crear Tabla"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
