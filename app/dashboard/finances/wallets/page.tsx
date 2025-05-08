import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Download, Plus, Search } from "lucide-react";

export default function WalletsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cuentas Publicitarias</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cuenta
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="Activo">Activas</TabsTrigger>
          <TabsTrigger value="inactive">Inactivas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Cuentas Publicitarias</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar cuenta..." className="pl-8" />
                </div>
              </div>
              <CardDescription>
                Administra las cuentas publicitarias y sus fondos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">
                      <Button
                        variant="ghost"
                        className="p-0 font-medium flex items-center"
                      >
                        Nombre
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        className="p-0 font-medium flex items-center ml-auto"
                      >
                        Balance
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      name: "Cuenta Principal",
                      platform: "Facebook",
                      id: "123456789",
                      balance: 5250.75,
                      Activo: true,
                    },
                    {
                      name: "Cuenta Secundaria",
                      platform: "Google",
                      id: "987654321",
                      balance: 3120.5,
                      Activo: true,
                    },
                    {
                      name: "Cuenta Reserva",
                      platform: "TikTok",
                      id: "456789123",
                      balance: 1500.25,
                      Activo: false,
                    },
                    {
                      name: "Cuenta Emergencia",
                      platform: "Facebook",
                      id: "789123456",
                      balance: 750.0,
                      Activo: true,
                    },
                    {
                      name: "Cuenta Pruebas",
                      platform: "Google",
                      id: "321654987",
                      balance: 250.0,
                      Activo: false,
                    },
                  ].map((wallet, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {wallet.name}
                      </TableCell>
                      <TableCell>{wallet.platform}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {wallet.id}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${wallet.balance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            wallet.Activo
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {wallet.Activo ? "Activa" : "Inactiva"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Activo" className="space-y-4">
          {/* Contenido similar pero filtrado para cuentas activas */}
          <Card>
            <CardHeader>
              <CardTitle>Cuentas Activas</CardTitle>
              <CardDescription>Solo cuentas con estado activo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">
                Contenido de cuentas activas
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {/* Contenido similar pero filtrado para cuentas inactivas */}
          <Card>
            <CardHeader>
              <CardTitle>Cuentas Inactivas</CardTitle>
              <CardDescription>
                Solo cuentas con estado inactivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">
                Contenido de cuentas inactivas
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
