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
  type Campaign,
  getCampaigns,
  deleteCampaign,
} from "@/lib/queries/campaign-queries";
import { StatusBadge } from "@/components/status-badge";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      setLoading(true);
      const data = await getCampaigns();
      setCampaigns(data);
      setError(null);
    } catch (err: any) {
      console.error("Error loading campaigns:", err);
      setError(
        "No se pudieron cargar las campañas. Por favor, intenta de nuevo más tarde."
      );
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCampaign(id: string) {
    try {
      const result = await deleteCampaign(id);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Actualizamos la lista localmente para evitar otra consulta
      setCampaigns(campaigns.filter((campaign) => campaign.id !== id));
    } catch (err: any) {
      console.error("Error deleting campaign:", err);
      setError(
        `Error al eliminar campaña: ${err.message || "Error desconocido"}`
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-usina-text-primary">Campañas</h1>
        <Link href="/dashboard/advertising/campaigns/new">
          <Button className="bg-usina-primary hover:bg-usina-secondary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Campaña
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
              Cargando campañas...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-6 text-center text-usina-text-secondary">
              No hay campañas registradas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-usina-card/20">
                  <TableHead className="text-usina-text-secondary">
                    Nombre
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    ID de Campaña
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Objetivo
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Business Manager
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
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id} className="border-usina-card/20">
                    <TableCell className="font-medium text-usina-text-primary">
                      {campaign.name}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {campaign.campaign_id}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {campaign.objective}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {campaign.business_managers?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={campaign.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/dashboard/advertising/campaigns/${campaign.id}`}
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
                              confirm("¿Estás seguro de eliminar esta campaña?")
                            ) {
                              handleDeleteCampaign(campaign.id);
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
