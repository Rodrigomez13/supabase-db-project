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
import { type Ad, getAds, deleteAd } from "@/lib/queries/ad-queries";
import { StatusBadge } from "@/components/status-badge";

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAds();
  }, []);

  async function fetchAds() {
    try {
      setLoading(true);
      const data = await getAds();
      setAds(data);
      setError(null);
    } catch (err: any) {
      console.error("Error loading ads:", err);
      setError(
        "No se pudieron cargar los anuncios. Por favor, intenta de nuevo más tarde."
      );
      setAds([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAd(id: string) {
    try {
      const result = await deleteAd(id);

      if (!result) {
        throw new Error("Error");
      }

      // Actualizamos la lista localmente para evitar otra consulta
      setAds(ads.filter((ad) => ad.id !== id));
    } catch (err: any) {
      console.error("Error deleting ad:", err);
      setError(
        `Error al eliminar anuncio: ${err.message || "Error desconocido"}`
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-usina-text-primary">Anuncios</h1>
        <Link href="/dashboard/advertising/ads/new">
          <Button className="bg-usina-primary hover:bg-usina-secondary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Anuncio
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
              Cargando anuncios...
            </div>
          ) : ads.length === 0 ? (
            <div className="p-6 text-center text-usina-text-secondary">
              No hay anuncios registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-usina-card/20">
                  <TableHead className="text-usina-text-secondary">
                    Nombre
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    ID de Anuncio
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Tipo de Creativo
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Conjunto de Anuncios
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
                {ads.map((ad) => (
                  <TableRow key={ad.id} className="border-usina-card/20">
                    <TableCell className="font-medium text-usina-text-primary">
                      {ad.name}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {ad.ad_id}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {ad.creative_type}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {ad.ad_sets?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ad.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/dashboard/advertising/ads/${ad.id}`}>
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
                              confirm("¿Estás seguro de eliminar este anuncio?")
                            ) {
                              handleDeleteAd(ad.id);
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
