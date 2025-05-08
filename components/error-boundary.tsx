"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Capturar errores no manejados
    const handleError = (event: ErrorEvent) => {
      console.error("Error capturado por ErrorBoundary:", event.error)
      setError(event.error)
      event.preventDefault()
    }

    // Capturar promesas rechazadas no manejadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Promesa rechazada no manejada:", event.reason)
      setError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)))
      event.preventDefault()
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error en la aplicación</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Se ha producido un error inesperado:</p>
            <pre className="bg-red-50 p-2 rounded text-sm overflow-auto max-h-40">
              {error.message || "Error desconocido"}
            </pre>
            {error.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">Ver detalles técnicos</summary>
                <pre className="bg-red-50 p-2 rounded text-xs overflow-auto max-h-40 mt-2">{error.stack}</pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Recargar página
          </Button>
          <Button variant="outline" onClick={() => setError(null)}>
            Intentar continuar
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
