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
import { getAdById, updateAd } from "@/lib/queries/ad-queries";
import { safeQuery } from "@/lib/safe-query";
import { StatusBadge } from "@/components/status-badge";

interface AdSet {
  id: string;
  name: string;
}

export default function EditAdPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [adId, setAdId] = useState<string>("");

  // Formulario
  const [name, setName] = useState("");
  const [adIdValue, setAdIdValue] = useState("");
  const [creativeType, setCreativeType] = useState("");
  const [status, setStatus] = useState("Activo");
  const [adsetId, setAdsetId] = useState("");

  // Extraer el ID del anuncio de params al inicio
  useEffect(() => {
    if (params.id) {
      setAdId(params.id);
    }
  }, [params.id]);

  useEffect(() => {
    async function loadData() {
      if (!adId) return;

      try {
        setLoading(true);
        setError(null);

        // Cargar datos del anuncio
        const ad = await getAdById(adId);

        if (!ad) {
          throw new Error("Anuncio no encontrado");
        }

        // Establecer valores del formulario
        setName(ad.name);
        setAdIdValue(ad.ad_id);
        setCreativeType(ad.creative_type);
        setStatus(ad.status);
        setAdsetId(ad.adset_id);

        // Cargar conjuntos de anuncios
        const adSetsData = await safeQuery<AdSet>("ad_sets", {
          orderBy: { column: "name", ascending: true },
        });
        setAdSets(adSetsData);
      } catch (err: any) {
        console.error("Error loading ad:", err);
        setError(`Error al cargar datos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [adId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!adId) return;

    try {
      setSubmitting(true);
      setError(null);

      // Validar datos
      if (!name || !adIdValue || !adsetId) {
        throw new Error("Por favor completa todos los campos requeridos");
      }

      // Actualizar anuncio
      const updatedData = {
        name,
        ad_id: adIdValue,
        creative_type: creativeType,
        status,
        adset_id: adsetId,
      };

      await updateAd(adId, updatedData);

      // Redirigir a la lista de anuncios
      router.push("/dashboard/advertising/ads");
    } catch (err: any) {
      console.error("Error updating ad:", err);
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
        <h1 className="text-2xl font-bold">Editar Anuncio</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Anuncio</CardTitle>
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
              <Label htmlFor="ad_id">ID del Anuncio</Label>
              <Input
                id="ad_id"
                value={adIdValue}
                onChange={(e) => setAdIdValue(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creative_type">Tipo de Creativo</Label>
              <Input
                id="creative_type"
                value={creativeType}
                onChange={(e) => setCreativeType(e.target.value)}
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
              <Label htmlFor="adset">Conjunto de Anuncios</Label>
              <Select value={adsetId} onValueChange={setAdsetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un conjunto de anuncios" />
                </SelectTrigger>
                <SelectContent>
                  {adSets.map((adSet) => (
                    <SelectItem key={adSet.id} value={adSet.id}>
                      {adSet.name}
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
