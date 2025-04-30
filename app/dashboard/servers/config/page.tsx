"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  getServers,
  deleteServer,
  type Server,
} from "@/lib/queries/server-queries";

export default function ServerConfigPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchServers();
  }, []);

  async function fetchServers() {
    try {
      setLoading(true);
      const data = await getServers();
      setServers(data);
      setError(null);
    } catch (err: any) {
      console.error("Error loading servers:", err);
      setError(
        "No se pudieron cargar los servidores. Por favor, intenta de nuevo más tarde."
      );
      setServers([]);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteServer = async (id: string) => {
    try {
      const result = await deleteServer(id);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Actualizamos la lista localmente para evitar otra consulta
      setServers(servers.filter((server) => server.id !== id));
    } catch (err: any) {
      console.error("Error deleting server:", err);
      setError(
        `Error al eliminar servidor: ${err.message || "Error desconocido"}`
      );
    }
  };

  const filteredServers = servers.filter(
    (server) =>
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (server.description &&
        server.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-usina-text-primary">
            Configuración de Servidores
          </h1>
          <p className="text-usina-text-secondary">
            Administra todos los servidores del sistema
          </p>
        </div>
        <Link href="/dashboard/servers/new">
          <Button className="bg-usina-primary hover:bg-usina-secondary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Servidor
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-usina-text-primary">
          Lista de Servidores
        </h2>
        <div className="w-64">
          <Input
            placeholder="Buscar servidores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-secondary/50 border-border/30"
          />
        </div>
      </div>

      <Card className="border-usina-card bg-background/5">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-usina-text-secondary">
              Cargando servidores...
            </div>
          ) : filteredServers.length === 0 ? (
            <div className="p-6 text-center text-usina-text-secondary">
              No hay servidores registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-usina-card/20">
                  <TableHead className="text-usina-text-secondary">
                    Nombre
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Coeficiente
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Estado
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Descripción
                  </TableHead>
                  <TableHead className="text-right text-usina-text-secondary">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServers.map((server) => (
                  <TableRow key={server.id} className="border-usina-card/20">
                    <TableCell className="font-medium text-usina-text-primary">
                      {server.name}
                    </TableCell>
                    <TableCell className="text-usina-text-primary">
                      {server.coefficient}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          server.is_active
                            ? "bg-usina-success/20 text-usina-success"
                            : "bg-usina-danger/20 text-usina-danger"
                        }`}
                      >
                        {server.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-usina-text-primary">
                      {server.description || "Sin descripción"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/dashboard/servers/${server.id}`}>
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-usina-primary/30 text-usina-primary hover:bg-usina-primary/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-usina-danger/30 text-usina-danger hover:bg-usina-danger/10"
                          onClick={() => {
                            if (
                              confirm(
                                "¿Estás seguro de eliminar este servidor?"
                              )
                            ) {
                              handleDeleteServer(server.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
