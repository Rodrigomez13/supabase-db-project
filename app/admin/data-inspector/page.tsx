"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function DataInspectorPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>({})

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const results: any = {}

      // Obtener datos de las funciones RPC
      const rpcFunctions = [
        "get_dashboard_stats",
        "get_franchise_distribution",
        "get_franchise_balances",
        "get_recent_activities",
      ]

      for (const func of rpcFunctions) {
        const { data, error } = await supabase.rpc(func)
        if (error) {
          console.error(`Error fetching ${func}:`, error)
          results[func] = { error: error.message }
        } else {
          results[func] = data
        }
      }

      // Obtener datos de las tablas principales
      const tables = ["servers", "franchises", "campaigns", "ads", "employees", "lead_distributions", "server_ads"]

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*").limit(10)
        if (error) {
          console.error(`Error fetching ${table}:`, error)
          results[table] = { error: error.message }
        } else {
          results[table] = data
        }
      }

      // Obtener datos de las vistas
      const views = ["financial_summary", "franchise_lead_summary"]

      for (const view of views) {
        const { data, error } = await supabase.from(view).select("*").limit(10)
        if (error) {
          console.error(`Error fetching ${view}:`, error)
          results[view] = { error: error.message }
        } else {
          results[view] = data
        }
      }

      setData(results)
    } catch (err: any) {
      console.error("Error fetching data:", err)
      setError(err.message || "Error desconocido al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const renderDataTable = (dataArray: any[] | null | undefined) => {
    if (!dataArray || dataArray.length === 0) {
      return <div className="text-center py-4">No hay datos disponibles</div>
    }

    const columns = Object.keys(dataArray[0])

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataArray.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={`${index}-${column}`}>
                    {typeof row[column] === "object"
                      ? JSON.stringify(row[column])
                      : String(row[column] !== null ? row[column] : "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  const renderErrorOrData = (key: string) => {
    if (!data[key]) {
      return <div className="text-center py-4">Cargando...</div>
    }

    if (data[key].error) {
      return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{data[key].error}</div>
    }

    return renderDataTable(Array.isArray(data[key]) ? data[key] : [data[key]])
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inspector de Datos</h1>
        <Button onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="dashboard">Funciones del Dashboard</TabsTrigger>
          <TabsTrigger value="tables">Tablas</TabsTrigger>
          <TabsTrigger value="views">Vistas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>get_dashboard_stats</CardTitle>
              </CardHeader>
              <CardContent>{renderErrorOrData("get_dashboard_stats")}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>get_franchise_distribution</CardTitle>
              </CardHeader>
              <CardContent>{renderErrorOrData("get_franchise_distribution")}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>get_franchise_balances</CardTitle>
              </CardHeader>
              <CardContent>{renderErrorOrData("get_franchise_balances")}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>get_recent_activities</CardTitle>
              </CardHeader>
              <CardContent>{renderErrorOrData("get_recent_activities")}</CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tables">
          <div className="grid gap-6">
            {["servers", "franchises", "campaigns", "ads", "employees", "lead_distributions", "server_ads"].map(
              (table) => (
                <Card key={table}>
                  <CardHeader>
                    <CardTitle>{table}</CardTitle>
                  </CardHeader>
                  <CardContent>{renderErrorOrData(table)}</CardContent>
                </Card>
              ),
            )}
          </div>
        </TabsContent>

        <TabsContent value="views">
          <div className="grid gap-6">
            {["financial_summary", "franchise_lead_summary"].map((view) => (
              <Card key={view}>
                <CardHeader>
                  <CardTitle>{view}</CardTitle>
                </CardHeader>
                <CardContent>{renderErrorOrData(view)}</CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
