"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  type Franchise,
  getFranchises,
  deleteFranchise,
} from "@/lib/queries/franchise-queries";
import { StatusBadge } from "@/components/status-badge";

export default function FranchisesPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFranchises();
  }, []);

  async function fetchFranchises() {
    try {
      setLoading(true);
      const data = await getFranchises();
      setFranchises(data);
      setError(null);
    } catch (err: any) {
      console.error("Error loading franchises:", err);
      setError(
        "No se pudieron cargar las franquicias. Por favor, intenta de nuevo más tarde."
      );
      setFranchises([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteFranchise(id: string) {
    try {
      const result = await deleteFranchise(id);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Actualizamos la lista localmente para evitar otra consulta
      setFranchises(franchises.filter((franchise) => franchise.id !== id));
    } catch (err: any) {
      console.error("Error deleting franchise:", err);
      setError(
        `Error al eliminar franquicia: ${err.message || "Error desconocido"}`
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-usina-text-primary">
          Franquicias
        </h1>
        <Link href="/dashboard/franchises/new">
          <Button className="bg-usina-primary hover:bg-usina-secondary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Franquicia
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <Card className="border-usina-card bg-background/5">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-usina-text-secondary">
              Cargando franquicias...
            </div>
          ) : franchises.length === 0 ? (
            <div className="p-6 text-center text-usina-text-secondary">
              No hay franquicias registradas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-usina-card/20">
                  <TableHead className="text-usina-text-secondary">
                    Nombre
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Propietario
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Fecha de Creación
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Estado
                  </TableHead>
                  <TableHead className="text-right text-usina-text-secondary">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {franchises.map((franchise) => (
                  <TableRow key={franchise.id} className="border-usina-card/20">
                    <TableCell className="font-medium text-usina-text-primary">
                      {franchise.name}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {franchise.owner || "No especificado"}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {new Date(franchise.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={franchise.status || "active"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/dashboard/franchises/${franchise.id}`}>
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
                                "¿Estás seguro de eliminar esta franquicia?"
                              )
                            ) {
                              handleDeleteFranchise(franchise.id);
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
