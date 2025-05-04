"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, ArrowUpRight, Plus, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/stat-card";

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState("resumen");

  // Datos simulados para el gráfico de flujo de caja
  const cashFlowData = {
    labels: ["Nov 24", "Dic 24", "Ene 25", "Feb 25", "Mar 25", "Abr 25"],
    datasets: [
      {
        label: "Ingresos",
        data: [0, 0, 0, 0, 3000, 15000],
        borderColor: "hsl(var(--chart-1))",
        backgroundColor: "hsl(var(--chart-1) / 0.1)",
        tension: 0.3,
      },
      {
        label: "Gastos",
        data: [0, 0, 0, 0, 1000, 4182],
        borderColor: "hsl(var(--chart-2))",
        backgroundColor: "hsl(var(--chart-2) / 0.1)",
        tension: 0.3,
      },
    ],
  };

  // Datos simulados para el gráfico de distribución de gastos
  const expenseDistributionData = {
    labels: ["Publicidad", "Salarios", "Servicios", "Equipamiento", "Otros"],
    datasets: [
      {
        data: [2500, 850, 350, 250, 232],
        backgroundColor: [
          "hsl(var(--chart-1))",
          "hsl(var(--chart-2))",
          "hsl(var(--chart-3))",
          "hsl(var(--chart-4))",
          "hsl(var(--chart-5))",
        ],
        borderColor: "hsl(var(--background))",
        borderWidth: 2,
      },
    ],
  };

  // Datos simulados para transacciones
  const transactions = [
    {
      id: "1",
      date: "21/04/2023",
      client: "ATENEA",
      description: "Pago adelantado publicidad",
      type: "ingreso",
      amount: 5000,
      status: "completada",
    },
    {
      id: "2",
      date: "19/04/2023",
      client: "ATENEA",
      description: "Gasto publicidad Server 4",
      type: "gasto",
      amount: 1250.75,
      status: "completada",
    },
    {
      id: "3",
      date: "17/04/2023",
      client: "EROS",
      description: "Gasto publicidad Server 5",
      type: "gasto",
      amount: 980.5,
      status: "completada",
    },
    {
      id: "4",
      date: "14/04/2023",
      client: "FENIX",
      description: "Pago adelantado publicidad",
      type: "ingreso",
      amount: 4500,
      status: "completada",
    },
    {
      id: "5",
      date: "11/04/2023",
      client: "GANA24",
      description: "Pago adelantado publicidad",
      type: "ingreso",
      amount: 3000,
      status: "completada",
    },
    {
      id: "6",
      date: "09/04/2023",
      client: "FORTUNA",
      description: "Gasto publicidad Server 6",
      type: "gasto",
      amount: 1100.25,
      status: "completada",
    },
  ];

  // Datos simulados para facturas
  const invoices = [
    {
      id: "INV-001",
      client: "ATENEA",
      issueDate: "31/03/2023",
      dueDate: "14/04/2023",
      amount: 5000,
      status: "pagada",
    },
    {
      id: "INV-002",
      client: "EROS",
      issueDate: "31/03/2023",
      dueDate: "14/04/2023",
      amount: 4500,
      status: "pagada",
    },
    {
      id: "INV-003",
      client: "FENIX",
      issueDate: "31/03/2023",
      dueDate: "14/04/2023",
      amount: 6000,
      status: "pagada",
    },
    {
      id: "INV-004",
      client: "GANA24",
      issueDate: "31/03/2023",
      dueDate: "14/04/2023",
      amount: 3000,
      status: "pagada",
    },
    {
      id: "INV-005",
      client: "FORTUNA",
      issueDate: "31/03/2023",
      dueDate: "14/04/2023",
      amount: 4000,
      status: "pendiente",
    },
    {
      id: "INV-006",
      client: "FLASHBET",
      issueDate: "31/03/2023",
      dueDate: "14/04/2023",
      amount: 3500,
      status: "pendiente",
    },
  ];

  // Datos simulados para gastos
  const expenses = [
    {
      id: "1",
      date: "21/04/2023",
      category: "Publicidad",
      description: "Gasto publicidad Server 4",
      paymentMethod: "Tarjeta Corporativa",
      amount: 1250.75,
    },
    {
      id: "2",
      date: "19/04/2023",
      category: "Publicidad",
      description: "Gasto publicidad Server 5",
      paymentMethod: "Tarjeta Corporativa",
      amount: 980.5,
    },
    {
      id: "3",
      date: "17/04/2023",
      category: "Salarios",
      description: "Pago quincenal personal",
      paymentMethod: "Transferencia Bancaria",
      amount: 8500,
    },
    {
      id: "4",
      date: "14/04/2023",
      category: "Servicios",
      description: "Pago internet oficina",
      paymentMethod: "Débito Automático",
      amount: 350,
    },
    {
      id: "5",
      date: "11/04/2023",
      category: "Publicidad",
      description: "Gasto publicidad Server 6",
      paymentMethod: "Tarjeta Corporativa",
      amount: 1100.25,
    },
    {
      id: "6",
      date: "09/04/2023",
      category: "Equipamiento",
      description: "Compra de equipos informáticos",
      paymentMethod: "Transferencia Bancaria",
      amount: 2500,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Resumen Financiero</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Transacción
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Balance Total"
          value="$24,500.00"
          description="Todas las cuentas"
          trend="up"
          trendValue="8.2%"
        />
        <StatCard
          title="Gastos Mensuales"
          value="$12,450.00"
          description="Abril 2023"
          trend="down"
          trendValue="3.1%"
        />
        <StatCard
          title="Ingresos Mensuales"
          value="$18,200.00"
          description="Abril 2023"
          trend="up"
          trendValue="12.5%"
        />
        <StatCard
          title="Presupuesto Disponible"
          value="$6,350.00"
          description="Restante este mes"
          trend="neutral"
          trendValue="0%"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          <TabsTrigger value="wallets">Billeteras</TabsTrigger>
          <TabsTrigger value="budgets">Presupuestos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gastos por Categoría</CardTitle>
                <CardDescription>
                  Distribución de gastos del mes actual
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Gráfico de distribución de gastos
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Flujo de Caja</CardTitle>
                <CardDescription>
                  Ingresos vs gastos en los últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Gráfico de flujo de caja
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transacciones Recientes</CardTitle>
              <CardDescription>
                Historial de movimientos financieros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">
                        Pago de Publicidad - Facebook
                      </p>
                      <p className="text-sm text-muted-foreground">
                        24 Abril, 2023
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-500">-$1,250.00</p>
                      <p className="text-xs text-muted-foreground">
                        Wallet: Principal
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Billeteras</CardTitle>
                <CardDescription>
                  Administra tus cuentas financieras
                </CardDescription>
              </div>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Billetera
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Principal", balance: 12500, type: "Efectivo" },
                  { name: "Publicidad", balance: 8750, type: "Tarjeta" },
                  { name: "Reserva", balance: 3250, type: "Ahorro" },
                ].map((wallet, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">{wallet.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {wallet.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${wallet.balance.toLocaleString()}
                      </p>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Presupuestos</CardTitle>
              <CardDescription>Control de gastos por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Publicidad", spent: 8200, budget: 10000 },
                  { name: "Servidores", spent: 2500, budget: 3000 },
                  { name: "Personal", spent: 1750, budget: 2500 },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm">
                        ${item.spent.toLocaleString()} / $
                        {item.budget.toLocaleString()}
                      </p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(item.spent / item.budget) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
