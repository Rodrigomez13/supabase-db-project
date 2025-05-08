"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusIcon, ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function BusinessManagerSettingsPage() {
  const [activeTab, setActiveTab] = useState("portfolios");

  // Datos simulados para portfolios
  const portfolios = [
    {
      id: "1",
      name: "Portfolio Principal",
      status: "Activo",
      businessManagers: 3,
      wallets: 2,
    },
    {
      id: "2",
      name: "Portfolio Secundario",
      status: "Activo",
      businessManagers: 1,
      wallets: 1,
    },
    {
      id: "3",
      name: "Portfolio de Pruebas",
      status: "inactive",
      businessManagers: 0,
      wallets: 0,
    },
  ];

  // Datos simulados para billeteras
  const wallets = [
    {
      id: "1",
      name: "Billetera Principal",
      amount: 5000,
      portfolio: "Portfolio Principal",
      status: "Activo",
    },
    {
      id: "2",
      name: "Billetera Secundaria",
      amount: 2500,
      portfolio: "Portfolio Principal",
      status: "Activo",
    },
    {
      id: "3",
      name: "Billetera de Pruebas",
      amount: 1000,
      portfolio: "Portfolio Secundario",
      status: "Activo",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Link href="/dashboard/advertising/business-managers">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            Configuración de Business Managers
          </h1>
          <p className="text-muted-foreground">
            Gestiona portfolios y billeteras asociadas a tus Business Managers
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="portfolios">Portfolios</TabsTrigger>
          <TabsTrigger value="wallets">Billeteras</TabsTrigger>
        </TabsList>
        <TabsContent value="portfolios" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Portfolios</h2>
            <Link href="/dashboard/advertising/portfolios/new">
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo Portfolio
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Business Managers</TableHead>
                    <TableHead>Billeteras</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolios.map((portfolio) => (
                    <TableRow key={portfolio.id}>
                      <TableCell className="font-medium">
                        {portfolio.name}
                      </TableCell>
                      <TableCell>{portfolio.businessManagers}</TableCell>
                      <TableCell>{portfolio.wallets}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            portfolio.status === "Activo"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {portfolio.status === "Activo"
                            ? "Activo"
                            : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/dashboard/advertising/portfolios/${portfolio.id}`}
                        >
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Billeteras</h2>
            <Link href="/dashboard/advertising/wallets/new">
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nueva Billetera
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Portfolio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets.map((wallet) => (
                    <TableRow key={wallet.id}>
                      <TableCell className="font-medium">
                        {wallet.name}
                      </TableCell>
                      <TableCell>${wallet.amount.toLocaleString()}</TableCell>
                      <TableCell>{wallet.portfolio}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            wallet.status === "Activo" ? "success" : "secondary"
                          }
                        >
                          {wallet.status === "Activo" ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/dashboard/advertising/wallets/${wallet.id}`}
                        >
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
