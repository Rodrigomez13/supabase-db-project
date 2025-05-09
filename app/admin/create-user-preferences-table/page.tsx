"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export default function CreateUserPreferencesTablePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleCreateTable = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/create-user-preferences-table", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Error al crear la tabla")
      }

      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
      toast({
        title: "Éxito",
        description: "Tabla de preferencias de usuario creada correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la tabla de preferencias de usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Crear Tabla de Preferencias de Usuario</h1>

      <Card>
        <CardHeader>
          <CardTitle>Crear Tabla user_preferences</CardTitle>
          <CardDescription>
            Esta operación creará la tabla user_preferences si no existe y configurará las políticas de seguridad
            necesarias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCreateTable} disabled={loading}>
            {loading ? "Creando..." : "Crear Tabla"}
          </Button>

          {result && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Resultado:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">{result}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
