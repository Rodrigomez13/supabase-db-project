"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export default function CreateFranchiseFunctionsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleCreateFunctions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/create-franchise-functions", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear las funciones")
      }

      setResult(data.message)
      toast({
        title: "Éxito",
        description: "Funciones creadas correctamente",
      })
    } catch (error: any) {
      console.error("Error:", error)
      setResult(`Error: ${error.message}`)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Crear Funciones para Franquicias</CardTitle>
          <CardDescription>
            Crea las funciones necesarias para acceder a las franquicias en la base de datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Este proceso creará las siguientes funciones en la base de datos:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>get_active_franchises() - Obtiene todas las franquicias activas</li>
          </ul>
          <p className="text-sm text-muted-foreground">Nota: Si las funciones ya existen, serán reemplazadas.</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={handleCreateFunctions} disabled={loading}>
            {loading ? "Creando..." : "Crear Funciones"}
          </Button>
          {result && (
            <div className={`text-sm ${result.includes("Error") ? "text-red-500" : "text-green-500"}`}>{result}</div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
