"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  BarChart,
  PlusCircle,
  Filter,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Transaction {
  id: string
  franchise_id: string
  date: string
  concept: string
  type: "income" | "expense"
  amount: number
  category?: string
  notes?: string
}

export default function FranchiseFinancePage() {
  const params = useParams()
  const franchiseId = params.id as string
  const [loading, setLoading] = useState<boolean>(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    monthlyChange: 0,
  })
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all")

  useEffect(() => {
    const loadFinanceData = async () => {
      try {
        setLoading(true)

        // En un caso real, cargaríamos las transacciones desde Supabase
        // Aquí simulamos datos para demostración
        const mockTransactions: Transaction[] = [
          {
            id: "1",
            franchise_id: franchiseId,
            date: "2023-05-05",
            concept: "Pago de publicidad",
            type: "expense",
            amount: 500,
            category: "Marketing",
          },
          {
            id: "2",
            franchise_id: franchiseId,
            date: "2023-05-04",
            concept: "Venta de servicio",
            type: "income",
            amount: 1200,
            category: "Ventas",
          },
          {
            id: "3",
            franchise_id: franchiseId,
            date: "2023-05-03",
            concept: "Comisión de ventas",
            type: "expense",
            amount: 350,
            category: "Comisiones",
          },
          {
            id: "4",
            franchise_id: franchiseId,
            date: "2023-05-02",
            concept: "Venta de producto premium",
            type: "income",
            amount: 2500,
            category: "Ventas",
          },
          {
            id: "5",
            franchise_id: franchiseId,
            date: "2023-05-01",
            concept: "Gastos operativos",
            type: "expense",
            amount: 800,
            category: "Operaciones",
          },
        ]

        setTransactions(mockTransactions)

        // Calcular estadísticas
        const totalIncome = mockTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

        const totalExpenses = mockTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

        const balance = totalIncome - totalExpenses

        setStats({
          balance,
          income: totalIncome,
          expenses: totalExpenses,
          monthlyChange: 8.2, // Valor de ejemplo
        })
      } catch (error) {
        console.error("Error loading franchise finance data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (franchiseId) {
      loadFinanceData()
    }
  }, [franchiseId])

  // Filtrar transacciones
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      searchQuery === "" ||
      transaction.concept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.category && transaction.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (transaction.notes && transaction.notes.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = typeFilter === "all" || transaction.type === typeFilter

    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Finanzas</h2>
          <p className="text-muted-foreground">Gestiona las finanzas de esta franquicia</p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Registrar Transacción
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Balance Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-3xl font-bold">${stats.balance.toLocaleString()}</div>
                <div className="flex items-center mt-1 text-sm text-green-600">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>+{stats.monthlyChange}% desde el mes pasado</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-3xl font-bold">${stats.income.toLocaleString()}</div>
                <div className="flex items-center mt-1 text-sm text-green-600">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>+12.5% desde el mes pasado</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <TrendingDown className="mr-2 h-5 w-5" />
              Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-3xl font-bold">${stats.expenses.toLocaleString()}</div>
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  <span>+5.3% desde el mes pasado</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <BarChart className="mr-2 h-5 w-5" />
            Historial financiero
          </CardTitle>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <DatePicker date={selectedDate} setDate={(date) => setSelectedDate(date || new Date())} />
              <div className="relative">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar transacciones..."
                  className="pl-8 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Ingresos</SelectItem>
                  <SelectItem value="expense">Gastos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Tabs defaultValue="transacciones">
              <TabsList>
                <TabsTrigger value="transacciones">Transacciones</TabsTrigger>
                <TabsTrigger value="balance">Balance</TabsTrigger>
                <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <p>Cargando datos financieros...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <h3 className="text-lg font-medium">No hay transacciones</h3>
              <p className="text-muted-foreground">
                {searchQuery || typeFilter !== "all"
                  ? "No hay transacciones que coincidan con la búsqueda o filtro."
                  : "No hay transacciones registradas para esta franquicia."}
              </p>
              <Button className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" />
                Registrar Transacción
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="py-2 px-4 text-left font-medium">Fecha</th>
                    <th className="py-2 px-4 text-left font-medium">Concepto</th>
                    <th className="py-2 px-4 text-left font-medium">Categoría</th>
                    <th className="py-2 px-4 text-left font-medium">Tipo</th>
                    <th className="py-2 px-4 text-right font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b">
                      <td className="py-2 px-4">{transaction.date}</td>
                      <td className="py-2 px-4">{transaction.concept}</td>
                      <td className="py-2 px-4">{transaction.category || "Sin categoría"}</td>
                      <td className="py-2 px-4">
                        {transaction.type === "income" ? (
                          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Ingreso</span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">Gasto</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <span className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
                          {transaction.type === "income" ? "+" : "-"}${transaction.amount.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
