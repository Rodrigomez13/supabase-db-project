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
import { safeQuery, safeDelete } from "@/lib/safe-query";
import { StatusBadge } from "@/components/status-badge";

interface AdSet {
  id: string;
  name: string;
  adset_id: string;
  budget: number;
  status: string;
  campaign_id: string;
  created_at: string;
  campaigns?: {
    name: string;
  };
}

export default function AdSetsPage() {
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdSets();
  }, []);

  async function fetchAdSets() {
    try {
      setLoading(true);

      // Usamos nuestra función de consulta segura
      const data = await safeQuery<AdSet>("ad_sets", {
        orderBy: { column: "created_at", ascending: false },
        relationships: "campaigns (name)",
      });

      setAdSets(data);
      setError(null);
    } catch (err: any) {
      console.error("Error loading ad sets:", err);
      setError(
        "No se pudieron cargar los conjuntos de anuncios. Por favor, intenta de nuevo más tarde."
      );
      setAdSets([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAdSet(id: string) {
    try {
      const result = await safeDelete("ad_sets", id);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Actualizamos la lista localmente para evitar otra consulta
      setAdSets(adSets.filter((adSet) => adSet.id !== id));
    } catch (err: any) {
      console.error("Error deleting ad set:", err);
      setError(
        `Error al eliminar conjunto de anuncios: ${
          err.message || "Error desconocido"
        }`
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-usina-text-primary">
          Conjuntos de Anuncios
        </h1>
        <Link href="/dashboard/advertising/ad-sets/new">
          <Button className="bg-usina-primary hover:bg-usina-secondary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Conjunto
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
              Cargando conjuntos de anuncios...
            </div>
          ) : adSets.length === 0 ? (
            <div className="p-6 text-center text-usina-text-secondary">
              No hay conjuntos de anuncios registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-usina-card/20">
                  <TableHead className="text-usina-text-secondary">
                    Nombre
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    ID de Conjunto
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Presupuesto
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Campaña
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
                {adSets.map((adSet) => (
                  <TableRow key={adSet.id} className="border-usina-card/20">
                    <TableCell className="font-medium text-usina-text-primary">
                      {adSet.name}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {adSet.adset_id}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      ${adSet.budget?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {adSet.campaigns?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={adSet.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/dashboard/advertising/ad-sets/${adSet.id}`}
                        >
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
                                "¿Estás seguro de eliminar este conjunto de anuncios?"
                              )
                            ) {
                              deleteAdSet(adSet.id);
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
