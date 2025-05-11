"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { execSQL } from "@/lib/exec-sql-function"

export default function ExecuteAddEmojiSQLPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const executeSQL = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const sql = `
        -- Agregar campo emoji a la tabla ads
        ALTER TABLE ads ADD COLUMN IF NOT EXISTS emoji TEXT;
        
        -- Crear índice para búsquedas rápidas por emoji
        CREATE INDEX IF NOT EXISTS ads_emoji_idx ON ads(emoji);
        
        -- Comentario para la columna
        COMMENT ON COLUMN ads.emoji IS 'Emoji identificador para el anuncio, usado por el bot de publicidad';
      `

      const result = await execSQL(sql)

      if (!result.success) {
        throw new Error(result.error || "Error al ejecutar SQL")
      }

      setSuccess("Columna emoji agregada correctamente a la tabla ads")
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Agregar Columna Emoji a Anuncios</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ejecutar SQL</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Este proceso agregará una columna <code>emoji</code> a la tabla <code>ads</code> para almacenar emojis
            identificadores para cada anuncio.
          </p>

          <Button onClick={executeSQL} disabled={loading}>
            {loading ? "Ejecutando..." : "Ejecutar SQL"}
          </Button>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">{error}</div>
          )}

          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
              {success}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
