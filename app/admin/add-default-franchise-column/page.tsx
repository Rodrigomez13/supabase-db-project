"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

export default function AddDefaultFranchiseColumnPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleAddColumn() {
    setIsLoading(true)
    setResult(null)

    try {
      // SQL para agregar la columna default_franchise_id a la tabla servers
      const sql = `
        -- Agregar columna default_franchise_id a la tabla servers
        ALTER TABLE servers 
        ADD COLUMN IF NOT EXISTS default_franchise_id UUID REFERENCES franchises(id);
        
        -- Crear índice para mejorar el rendimiento de las consultas
        CREATE INDEX IF NOT EXISTS idx_servers_default_franchise_id ON servers(default_franchise_id);
        
        -- Comentario para la columna
        COMMENT ON COLUMN servers.default_franchise_id IS 'ID de la franquicia predeterminada para asignar leads y conversiones automáticamente';
      `

      const { error } = await supabase.rpc("execute_sql", { sql_query: sql })

      if (error) throw error

      setResult("Columna agregada correctamente a la tabla servers.")
      toast({
        title: "Operación exitosa",
        description: "La columna default_franchise_id ha sido agregada a la tabla servers.",
      })
    } catch (error: any) {
      console.error("Error adding column:", error)
      setResult(`Error: ${error.message}`)
      toast({
        title: "Error",
        description: `No se pudo agregar la columna: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Agregar Columna de Franquicia Predeterminada</h1>

      <Card>
        <CardHeader>
          <CardTitle>Agregar columna default_franchise_id</CardTitle>
          <CardDescription>
            Este proceso agregará una columna default_franchise_id a la tabla servers para permitir asignar una
            franquicia predeterminada a cada servidor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">La columna default_franchise_id permitirá:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Asignar automáticamente leads a una franquicia específica</li>
            <li>Facilitar la distribución de conversiones</li>
            <li>Mejorar el seguimiento de métricas por franquicia</li>
          </ul>
          <p className="text-amber-600 dark:text-amber-400">
            Nota: Esta operación es segura y no afectará los datos existentes.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={handleAddColumn} disabled={isLoading}>
            {isLoading ? "Agregando columna..." : "Agregar Columna"}
          </Button>
        </CardFooter>
      </Card>

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">{result}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
