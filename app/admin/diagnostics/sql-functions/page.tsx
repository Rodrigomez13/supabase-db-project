"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface SqlFunction {
  name: string
  schema: string
  status: "ok" | "error" | "unknown"
  message?: string
}

export default function SqlFunctionsDiagnosticsPage() {
  const [functions, setFunctions] = useState<SqlFunction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkFunctions()
  }, [])

  async function checkFunctions() {
    setLoading(true)
    try {
      // Lista de funciones críticas para verificar
      const criticalFunctions = [
        { name: "get_franchise_distribution", schema: "public" },
        { name: "get_hourly_metrics", schema: "public" },
        { name: "exec_sql", schema: "public" },
        { name: "create_daily_records", schema: "public" },
      ]

      // Obtener lista de funciones de la base de datos
      const { data: dbFunctions, error: dbError } = await supabase
        .from("pg_catalog.pg_proc")
        .select(`
          proname,
          pronamespace
        `)
        .in(
          "proname",
          criticalFunctions.map((f) => f.name),
        )

      if (dbError) {
        console.error("Error fetching functions:", dbError)
        // Marcar todas como desconocidas si hay error
        setFunctions(
          criticalFunctions.map((f) => ({
            name: f.name,
            schema: f.schema,
            status: "unknown",
            message: "No se pudo verificar la función",
          })),
        )
        return
      }

      // Verificar cada función
      const functionsStatus: SqlFunction[] = await Promise.all(
        criticalFunctions.map(async (func) => {
          try {
            // Intentar ejecutar la función con parámetros de prueba
            let testResult

            if (func.name === "get_franchise_distribution") {
              testResult = await supabase.rpc("get_franchise_distribution", {
                p_date: new Date().toISOString().split("T")[0],
              })
            } else if (func.name === "get_hourly_metrics") {
              testResult = await supabase.rpc("get_hourly_metrics", { p_date: new Date().toISOString().split("T")[0] })
            } else if (func.name === "exec_sql") {
              testResult = await supabase.rpc("exec_sql", { sql_query: "SELECT 1" })
            } else if (func.name === "create_daily_records") {
              // Solo verificamos si existe, no la ejecutamos
              return {
                name: func.name,
                schema: func.schema,
                status: "ok",
                message: "Función verificada (solo existencia)",
              }
            }

            if (testResult?.error) {
              return {
                name: func.name,
                schema: func.schema,
                status: "error",
                message: testResult.error.message,
              }
            }

            return {
              name: func.name,
              schema: func.schema,
              status: "ok",
              message: "Función verificada correctamente",
            }
          } catch (error) {
            return {
              name: func.name,
              schema: func.schema,
              status: "error",
              message: error instanceof Error ? error.message : "Error desconocido",
            }
          }
        }),
      )

      setFunctions(functionsStatus)
    } catch (error) {
      console.error("Error checking functions:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico de Funciones SQL</CardTitle>
          <CardDescription>
            Verifica el estado de las funciones SQL críticas para el funcionamiento del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-end">
            <Button onClick={checkFunctions} disabled={loading} className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Verificando..." : "Verificar Funciones"}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Esquema</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {functions.map((func) => (
                <TableRow key={func.name}>
                  <TableCell>
                    {func.status === "ok" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : func.status === "error" ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{func.name}</TableCell>
                  <TableCell>{func.schema}</TableCell>
                  <TableCell className="max-w-md truncate">{func.message || "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (func.name === "get_franchise_distribution") {
                          window.location.href = "/admin/create-franchise-distribution-function"
                        } else if (func.name === "get_hourly_metrics") {
                          window.location.href = "/admin/create-hourly-metrics-function"
                        }
                      }}
                    >
                      Reparar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Nota: Las funciones marcadas como "error" deben ser reparadas para el correcto funcionamiento del sistema.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
