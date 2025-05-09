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
import { PlusIcon, Pencil, Trash2, Phone, RefreshCw } from "lucide-react";
import Link from "next/link";
import {
  type Franchise as BaseFranchise,
  getFranchises,
  deleteFranchise,
} from "@/lib/queries/franchise-queries";
import { getFranchisePhonesCount } from "@/lib/franchise-phone-utils";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";

export type Franchise = BaseFranchise & {
  phones?: { is_active: boolean }[];
};

export type LocalFranchise = {
  id: string;
  name: string;
  owner?: string;
  created_at: string;
  status?: string;
  activePhones?: number;
  totalPhones?: number;
};

export default function FranchisesPage() {
  const [franchises, setFranchises] = useState<LocalFranchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFranchises();
  }, []);

  async function fetchFranchises() {
    try {
      setLoading(true);
      const data = await getFranchises();

      // Obtener el conteo de teléfonos para cada franquicia
      const { data: phonesData, error: phonesError } =
        await getFranchisePhonesCount();

      if (phonesError) {
        console.error("Error al obtener conteo de teléfonos:", phonesError);
        toast({
          title: "Error",
          description:
            "No se pudo obtener el conteo de teléfonos. Se mostrará 0/0.",
          variant: "destructive",
        });
      }

      // Combinar los datos
      const franchisesWithPhones = data.map((franchise: BaseFranchise) => {
        const phoneInfo:
          | {
              franchise_id: string;
              active_phones: number;
              total_phones: number;
            }
          | undefined = phonesData?.find(
          (p: { franchise_id: string }) => p.franchise_id === franchise.id
        );
        return {
          ...franchise,
          activePhones: phoneInfo?.active_phones || 0,
          totalPhones: phoneInfo?.total_phones || 0,
        };
      });

      setFranchises(franchisesWithPhones);
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

      toast({
        title: "Franquicia eliminada",
        description: "La franquicia ha sido eliminada correctamente",
      });
    } catch (err: any) {
      console.error("Error deleting franchise:", err);
      setError(
        `Error al eliminar franquicia: ${err.message || "Error desconocido"}`
      );

      toast({
        title: "Error",
        description: `Error al eliminar franquicia: ${
          err.message || "Error desconocido"
        }`,
        variant: "destructive",
      });
    }
  }

  const handleRefresh = () => {
    fetchFranchises();
    toast({
      title: "Actualizando",
      description: "Actualizando lista de franquicias y conteo de teléfonos",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-usina-text-primary">
          Franquicias
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} className="mr-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Link href="/dashboard/franchises/new">
            <Button className="bg-usina-primary hover:bg-usina-secondary">
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva Franquicia
            </Button>
          </Link>
        </div>
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
                  <TableHead className="text-usina-text-secondary">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Teléfonos (Activos/Total)
                    </div>
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
                    <TableCell className="text-center text-usina-text-primary">
                      <span
                        className={
                          franchise.activePhones === 0
                            ? "text-amber-500 font-medium"
                            : ""
                        }
                      >
                        {franchise.activePhones}/{franchise.totalPhones}
                      </span>
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
                        <Link
                          href={`/dashboard/franchises/${franchise.id}/phones`}
                        >
                          <Button
                            variant="outline"
                            className="border-usina-primary/30 text-usina-primary hover:bg-usina-primary/10 px-4"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Ver Teléfonos
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
