"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { safeInsert } from "@/lib/safe-query";

interface Ad {
  id: string;
  name: string;
  ad_id: string;
  adset_id: string;
  adset_name?: string;
}

interface Api {
  id: string;
  name: string;
}

interface Server {
  id: string;
  name: string;
  coefficient: number;
}

export default function AddServerAdPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [server, setServer] = useState<Server | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [apis, setApis] = useState<Api[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulario
  const [selectedAdId, setSelectedAdId] = useState<string>("");
  const [selectedApiId, setSelectedApiId] = useState<string>("");
  const [budget, setBudget] = useState<number>(0);
  const [leads, setLeads] = useState<number>(0);
  const [conversions, setConversions] = useState<number>(0);
  const [fbSpend, setFbSpend] = useState<number>(0);

  // Valores calculados
  const conversionRate = leads > 0 ? (conversions / leads) * 100 : 0;
  const fbSpendWithImp = server?.coefficient ? fbSpend * server.coefficient : 0;
  const costPerLead = leads > 0 ? fbSpendWithImp / leads : 0;
  const costPerConversion = conversions > 0 ? fbSpend / conversions : 0;
  const costPerConversionWithImp =
    conversions > 0 ? fbSpendWithImp / conversions : 0;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Cargar datos del servidor
        const { data: serverData, error: serverError } = await supabase
          .from("servers")
          .select("id, name, coefficient")
          .eq("id", params.id)
          .single();

        if (serverError) throw serverError;
        setServer(serverData);

        // Cargar anuncios activos
        const { data: adsData, error: adsError } = await supabase
          .from("ads")
          .select(
            `
            id, 
            name, 
            ad_id,
            adset_id,
            ad_sets (name)
          `
          )
          .eq("active", true);

        if (adsError) throw adsError;

        // Transformar los datos para incluir el nombre del conjunto de anuncios
        const formattedAds = adsData.map((ad: any) => ({
          id: ad.id,
          name: ad.name,
          ad_id: ad.ad_id,
          adset_id: ad.adset_id,
          adset_name: ad.ad_sets?.name,
        }));

        setAds(formattedAds);

        // Cargar APIs activas
        const { data: apisData, error: apisError } = await supabase
          .from("apis")
          .select("id, name")
          .eq("is_active", true);

        if (apisError) {
          console.warn("Error al cargar APIs:", apisError);
          setApis([]);
        } else {
          setApis(apisData || []);
        }
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(`Error al cargar datos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedAdId || !selectedApiId) {
      setError("Por favor selecciona un anuncio y una API");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Obtener información del anuncio seleccionado
      const selectedAd = ads.find((ad) => ad.id === selectedAdId);
      if (!selectedAd) throw new Error("Anuncio no encontrado");

      // Crear registro en server_ads
      const serverAdData = {
        server_id: params.id,
        ad_id: selectedAdId,
        api_id: selectedApiId,
        daily_budget: budget,
        leads: leads,
        loads: conversions,
        spent: fbSpend,
        total_cost: fbSpendWithImp,
        date: new Date().toISOString().split("T")[0],
      };

      await safeInsert("server_ads", serverAdData);

      // Redirigir a la página del servidor
      router.push(`/dashboard/servers/${params.id}`);
    } catch (err: any) {
      console.error("Error submitting form:", err);
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Cargando...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          Agregar Anuncio al Servidor {server?.name}
        </h1>
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
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="ad">Seleccionar Anuncio</Label>
                <Select value={selectedAdId} onValueChange={setSelectedAdId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un anuncio" />
                  </SelectTrigger>
                  <SelectContent>
                    {ads.map((ad) => (
                      <SelectItem key={ad.id} value={ad.id}>
                        {ad.name} - {ad.adset_name || "Sin conjunto"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="api">API de Conexión</Label>
                <Select value={selectedApiId} onValueChange={setSelectedApiId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una API" />
                  </SelectTrigger>
                  <SelectContent>
                    {apis.map((api) => (
                      <SelectItem key={api.id} value={api.id}>
                        {api.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="budget">Presupuesto Diario ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  value={budget}
                  onChange={(e) =>
                    setBudget(Number.parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium">Métricas</h3>

                <div className="flex items-center space-x-4">
                  <Label htmlFor="leads" className="w-24">
                    Leads:
                  </Label>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setLeads(Math.max(0, leads - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="leads"
                      type="number"
                      value={leads}
                      onChange={(e) =>
                        setLeads(Number.parseInt(e.target.value) || 0)
                      }
                      className="w-20 mx-2 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setLeads(leads + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <Label htmlFor="conversions" className="w-24">
                    Conversiones:
                  </Label>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setConversions(Math.max(0, conversions - 1))
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="conversions"
                      type="number"
                      value={conversions}
                      onChange={(e) =>
                        setConversions(Number.parseInt(e.target.value) || 0)
                      }
                      className="w-20 mx-2 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setConversions(conversions + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <Label htmlFor="fbSpend" className="w-24">
                    Gasto FB ($):
                  </Label>
                  <Input
                    id="fbSpend"
                    type="number"
                    step="0.01"
                    value={fbSpend}
                    onChange={(e) =>
                      setFbSpend(Number.parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Resultados Calculados</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">
                      % Conversión
                    </Label>
                    <p className="font-medium">{conversionRate.toFixed(2)}%</p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">
                      Gasto FB + imp
                    </Label>
                    <p className="font-medium">${fbSpendWithImp.toFixed(2)}</p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">$ Leads</Label>
                    <p className="font-medium">${costPerLead.toFixed(2)}</p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">
                      $ Conversiones
                    </Label>
                    <p className="font-medium">
                      ${costPerConversion.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">
                      $ Conv + imp
                    </Label>
                    <p className="font-medium">
                      ${costPerConversionWithImp.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando..." : "Guardar Anuncio"}
          </Button>
        </div>
      </form>
    </div>
  );
}
