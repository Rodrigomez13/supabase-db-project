"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import {
  getCampaignById,
  updateCampaign,
} from "@/lib/queries/campaign-queries";
import { safeQuery } from "@/lib/safe-query";
import { StatusBadge } from "@/components/status-badge";

interface BusinessManager {
  id: string;
  name: string;
}

export default function EditCampaignPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessManagers, setBusinessManagers] = useState<BusinessManager[]>(
    []
  );
  const [campaignId, setCampaignId] = useState<string>("");

  // Formulario
  const [name, setName] = useState("");
  const [campaignIdValue, setCampaignIdValue] = useState("");
  const [objective, setObjective] = useState("");
  const [status, setStatus] = useState("Activo");
  const [bmId, setBmId] = useState("");

  // Extraer el ID de la campaña de params al inicio
  useEffect(() => {
    if (params.id) {
      setCampaignId(params.id);
    }
  }, [params.id]);

  useEffect(() => {
    async function loadData() {
      if (!campaignId) return;

      try {
        setLoading(true);
        setError(null);

        // Cargar datos de la campaña
        const campaign = await getCampaignById(campaignId);

        if (!campaign) {
          throw new Error("Campaña no encontrada");
        }

        // Establecer valores del formulario
        setName(campaign.name);
        setCampaignIdValue(campaign.campaign_id);
        setObjective(campaign.objective);
        setStatus(campaign.status);
        setBmId(campaign.bm_id);

        // Cargar business managers
        const bmData = await safeQuery<BusinessManager>("business_managers", {
          orderBy: { column: "name", ascending: true },
        });
        setBusinessManagers(bmData);
      } catch (err: any) {
        console.error("Error loading campaign:", err);
        setError(`Error al cargar datos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [campaignId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!campaignId) return;

    try {
      setSubmitting(true);
      setError(null);

      // Validar datos
      if (!name || !campaignIdValue || !bmId) {
        throw new Error("Por favor completa todos los campos requeridos");
      }

      // Actualizar campaña
      const updatedData = {
        name,
        campaign_id: campaignIdValue,
        objective,
        status,
        bm_id: bmId,
      };

      await updateCampaign(campaignId, updatedData);

      // Redirigir a la lista de campañas
      router.push("/dashboard/advertising/campaigns");
    } catch (err: any) {
      console.error("Error updating campaign:", err);
      setError(`Error al actualizar: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Cargando datos...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Editar Campaña</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información de la Campaña</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign_id">ID de la Campaña</Label>
              <Input
                id="campaign_id"
                value={campaignIdValue}
                onChange={(e) => setCampaignIdValue(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">Objetivo</Label>
              <Input
                id="objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Pausada">Pausada</SelectItem>
                  <SelectItem value="Eliminada">Eliminada</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2">
                <StatusBadge status={status} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bm_id">Business Manager</Label>
              <Select value={bmId} onValueChange={setBmId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un business manager" />
                </SelectTrigger>
                <SelectContent>
                  {businessManagers.map((bm) => (
                    <SelectItem key={bm.id} value={bm.id}>
                      {bm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
