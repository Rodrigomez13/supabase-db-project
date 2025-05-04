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
import { safeQuery, safeUpdate } from "@/lib/safe-query";
import { StatusBadge } from "@/components/status-badge";

interface AdSet {
  id: string;
  name: string;
  adset_id: string;
  budget: number;
  status: string;
  campaign_id: string;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
}

export default function EditAdSetPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [adSet, setAdSet] = useState<AdSet | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adSetId, setAdSetId] = useState<string>("");

  // Formulario
  const [name, setName] = useState("");
  const [adsetId, setAdsetId] = useState("");
  const [budget, setBudget] = useState(0);
  const [status, setStatus] = useState("ACTIVE");
  const [campaignId, setCampaignId] = useState("");

  // Extraer el ID del conjunto de anuncios de params al inicio
  useEffect(() => {
    if (params.id) {
      setAdSetId(params.id);
    }
  }, [params.id]);

  useEffect(() => {
    async function loadData() {
      if (!adSetId) return;

      try {
        setLoading(true);
        setError(null);

        // Cargar datos del conjunto de anuncios
        const adSets = await safeQuery<AdSet>("ad_sets", {
          where: { id: adSetId },
          single: true,
        });

        if (!adSets || adSets.length === 0) {
          throw new Error("Conjunto de anuncios no encontrado");
        }

        const adSetData = adSets[0];
        setAdSet(adSetData);

        // Establecer valores del formulario
        setName(adSetData.name);
        setAdsetId(adSetData.adset_id);
        setBudget(adSetData.budget);
        setStatus(adSetData.status);
        setCampaignId(adSetData.campaign_id);

        // Cargar campañas
        const campaignsData = await safeQuery<Campaign>("campaigns", {
          orderBy: { column: "name", ascending: true },
        });
        setCampaigns(campaignsData);
      } catch (err: any) {
        console.error("Error loading ad set:", err);
        setError(`Error al cargar datos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [adSetId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!adSetId) return;

    try {
      setSubmitting(true);
      setError(null);

      // Validar datos
      if (!name || !adsetId || !campaignId) {
        throw new Error("Por favor completa todos los campos requeridos");
      }

      // Actualizar conjunto de anuncios
      const updatedData = {
        name,
        adset_id: adsetId,
        budget,
        status,
        campaign_id: campaignId,
      };

      await safeUpdate("ad_sets", adSetId, updatedData);

      // Redirigir a la lista de conjuntos de anuncios
      router.push("/dashboard/advertising/ad-sets");
    } catch (err: any) {
      console.error("Error updating ad set:", err);
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

  if (!adSet) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">
          Conjunto de anuncios no encontrado
        </h2>
        <Button onClick={() => router.push("/dashboard/advertising/ad-sets")}>
          Volver a Conjuntos de Anuncios
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Editar Conjunto de Anuncios</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Conjunto de Anuncios</CardTitle>
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
              <Label htmlFor="adset_id">ID del Conjunto de Anuncios</Label>
              <Input
                id="adset_id"
                value={adsetId}
                onChange={(e) => setAdsetId(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Presupuesto Diario ($)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="PAUSED">Pausado</SelectItem>
                  <SelectItem value="DELETED">Eliminado</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2">
                <StatusBadge status={status} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign">Campaña</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una campaña" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
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
