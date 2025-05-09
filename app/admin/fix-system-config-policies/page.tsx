"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function FixSystemConfigPoliciesPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFixPolicies = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await fetch("/api/fix-system-config-policies", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al corregir las políticas")
      }

      setSuccess(true)
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "Ocurrió un error al corregir las políticas")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Corregir Políticas de Seguridad para System Config</CardTitle>
          <CardDescription>
            Esta acción corregirá las políticas de seguridad de nivel de fila (RLS) para la tabla system_config.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            La tabla system_config se utiliza para almacenar configuraciones globales como la franquicia activa para
            asignación de leads y loads. Esta acción corregirá las políticas de seguridad para permitir que los usuarios
            autenticados puedan leer y modificar esta tabla.
          </p>

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Operación exitosa</AlertTitle>
              <AlertDescription className="text-green-700">
                Las políticas de seguridad han sido corregidas correctamente.
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
          <Button onClick={handleFixPolicies} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Corrigiendo...
              </>
            ) : (
              "Corregir Políticas"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
