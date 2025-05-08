"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, MinusIcon, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ServerAd {
  id: string;
  server_id: string;
  ad_id: string;
  api_id: string;
  daily_budget: number;
  leads: number;
  loads: number;
  spent: number;
  date: string;
  ad_name?: string;
  adset_name?: string;
  bm_name?: string;
  api_name?: string;
}

interface ServerAdsTableProps {
  serverId: string;
  onAddAdClick?: () => void;
  onDailyCloseClick?: () => void;
}

export function ServerAdsTable({
  serverId,
  onAddAdClick,
  onDailyCloseClick,
}: ServerAdsTableProps) {
  const [ads, setAds] = useState<ServerAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingMetrics, setUpdatingMetrics] = useState<
    Record<string, boolean>
  >({});
  const [totals, setTotals] = useState({
    leads: 0,
    loads: 0,
    conversion: 0,
    spent: 0,
  });

  useEffect(() => {
    fetchServerAds();
  }, [serverId]);

  async function fetchServerAds() {
    if (!serverId) return;

    try {
      setLoading(true);
      setError(null);

      const { data: viewData, error: viewError } = await supabase
        .from("server_ads_view")
        .select("*")
        .eq("server_id", serverId);

      if (viewError || !viewData || viewData.length === 0) {
        const { data, error } = await supabase
          .from("server_ads")
          .select(
            `
            *,
            ads:ad_id (id, name, adset_id),
            apis:api_id (id, name)
          `
          )
          .eq("server_id", serverId);

        if (error) throw error;

        if (!data || data.length === 0) {
          setAds([]);
          setTotals({ leads: 0, loads: 0, conversion: 0, spent: 0 });
          return;
        }

        const processedAds = await Promise.all(
          data.map(async (ad) => {
            let adsetName = "";
            let bmName = "";

            if (ad.ads?.adset_id) {
              const { data: adsetData } = await supabase
                .from("ad_sets")
                .select("name, business_manager_id")
                .eq("id", ad.ads.adset_id)
                .maybeSingle();

              if (adsetData) {
                adsetName = adsetData.name;

                if (adsetData.business_manager_id) {
                  const { data: bmData } = await supabase
                    .from("business_managers")
                    .select("name")
                    .eq("id", adsetData.business_manager_id)
                    .maybeSingle();

                  if (bmData) {
                    bmName = bmData.name;
                  }
                }
              }
            }

            return {
              ...ad,
              ad_name: ad.ads?.name || "Anuncio sin nombre",
              adset_name: adsetName || "-",
              bm_name: bmName || "-",
              api_name: ad.apis?.name || "API desconocida",
            };
          })
        );

        setAds(processedAds);
        calculateTotals(processedAds);
      } else {
        setAds(viewData);
        calculateTotals(viewData);
      }
    } catch (err: any) {
      console.error("Error fetching server ads:", err);
      setError(err.message || "Error al cargar anuncios");
    } finally {
      setLoading(false);
    }
  }

  function calculateTotals(adsData: ServerAd[]) {
    const totals = adsData.reduce(
      (acc, ad) => {
        acc.leads += ad.leads || 0;
        acc.loads += ad.loads || 0;
        acc.spent += ad.spent || 0;
        return acc;
      },
      { leads: 0, loads: 0, spent: 0, conversion: 0 }
    );

    // Calcular tasa de conversión
    totals.conversion =
      totals.leads > 0 ? (totals.loads / totals.leads) * 100 : 0;

    setTotals(totals);
  }

  async function updateAdMetric(id: string, field: string, value: number) {
    try {
      setUpdatingMetrics((prev) => ({ ...prev, [id + field]: true }));

      const { error } = await supabase
        .from("server_ads")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;

      // Actualizar localmente
      setAds((prevAds) =>
        prevAds.map((ad) => {
          if (ad.id === id) {
            return { ...ad, [field]: value };
          }
          return ad;
        })
      );

      // Recalcular totales
      calculateTotals(
        ads.map((ad) => {
          if (ad.id === id) {
            return { ...ad, [field]: value };
          }
          return ad;
        })
      );
    } catch (err: any) {
      console.error(`Error updating ${field}:`, err);
      toast({
        title: "Error",
        description: `No se pudo actualizar el campo ${field}: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setUpdatingMetrics((prev) => ({ ...prev, [id + field]: false }));
    }
  }

  async function deleteAd(id: string) {
    if (!confirm("¿Estás seguro de eliminar este anuncio del servidor?")) {
      return;
    }

    try {
      const { error } = await supabase.from("server_ads").delete().eq("id", id);

      if (error) throw error;

      // Actualizar localmente
      const updatedAds = ads.filter((ad) => ad.id !== id);
      setAds(updatedAds);
      calculateTotals(updatedAds);

      toast({
        title: "Anuncio eliminado",
        description: "El anuncio ha sido eliminado correctamente del servidor.",
      });
    } catch (err: any) {
      console.error("Error deleting ad:", err);
      toast({
        title: "Error",
        description: `No se pudo eliminar el anuncio: ${err.message}`,
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Cargando anuncios del servidor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background border rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Leads Generados
          </div>
          <div className="text-2xl font-bold">{totals.leads}</div>
        </div>
        <div className="bg-background border rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Conversiones
          </div>
          <div className="text-2xl font-bold">{totals.loads}</div>
        </div>
        <div className="bg-background border rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Tasa de Conversión
          </div>
          <div className="text-2xl font-bold">
            {totals.conversion.toFixed(1)}%
          </div>
        </div>
        <div className="bg-background border rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Gasto Total
          </div>
          <div className="text-2xl font-bold">${totals.spent.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Anuncios del Servidor</h3>
        <div className="flex space-x-2">
          {onAddAdClick && (
            <Button onClick={onAddAdClick}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar Anuncio
            </Button>
          )}
          {onDailyCloseClick && (
            <Button
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              onClick={onDailyCloseClick}
            >
              Realizar Cierre Diario
            </Button>
          )}
        </div>
      </div>

      {ads.length === 0 ? (
        <div className="bg-background border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            Este servidor no tiene anuncios asociados.
          </p>
          {onAddAdClick && (
            <Button variant="outline" className="mt-4" onClick={onAddAdClick}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar Anuncio
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Ad Set</TableHead>
                <TableHead>BM</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Gastado</TableHead>
                <TableHead>API</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Loads</TableHead>
                <TableHead>Conversión</TableHead>
                <TableHead>$ Lead</TableHead>
                <TableHead>$ Loads</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.map((ad) => {
                // Calcular métricas derivadas
                const conversionRate =
                  ad.leads > 0 ? (ad.loads / ad.leads) * 100 : 0;
                const costPerLead = ad.leads > 0 ? ad.spent / ad.leads : 0;
                const costPerLoad = ad.loads > 0 ? ad.spent / ad.loads : 0;

                return (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ad.adset_name || "-"}</p>
                        <p className="text-xs text-muted-foreground">
                          {ad.ad_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{ad.bm_name || "-"}</TableCell>
                    <TableCell>
                      ${ad.daily_budget?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={ad.spent || 0}
                        onChange={(e) =>
                          updateAdMetric(
                            ad.id,
                            "spent",
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-20 h-8 text-center"
                        disabled={updatingMetrics[ad.id + "spent"]}
                      />
                    </TableCell>
                    <TableCell>{ad.api_name || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Activo
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            updateAdMetric(
                              ad.id,
                              "leads",
                              Math.max(0, (ad.leads || 0) - 1)
                            )
                          }
                          disabled={updatingMetrics[ad.id + "leads"]}
                        >
                          <MinusIcon className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={ad.leads || 0}
                          onChange={(e) =>
                            updateAdMetric(
                              ad.id,
                              "leads",
                              Number(e.target.value) || 0
                            )
                          }
                          className="w-16 h-8 text-center"
                          disabled={updatingMetrics[ad.id + "leads"]}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            updateAdMetric(ad.id, "leads", (ad.leads || 0) + 1)
                          }
                          disabled={updatingMetrics[ad.id + "leads"]}
                        >
                          <PlusIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            updateAdMetric(
                              ad.id,
                              "loads",
                              Math.max(0, (ad.loads || 0) - 1)
                            )
                          }
                          disabled={updatingMetrics[ad.id + "loads"]}
                        >
                          <MinusIcon className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={ad.loads || 0}
                          onChange={(e) =>
                            updateAdMetric(
                              ad.id,
                              "loads",
                              Number(e.target.value) || 0
                            )
                          }
                          className="w-16 h-8 text-center"
                          disabled={updatingMetrics[ad.id + "loads"]}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            updateAdMetric(ad.id, "loads", (ad.loads || 0) + 1)
                          }
                          disabled={updatingMetrics[ad.id + "loads"]}
                        >
                          <PlusIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{conversionRate.toFixed(0)}%</TableCell>
                    <TableCell>${costPerLead.toFixed(2)}</TableCell>
                    <TableCell>${costPerLoad.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => deleteAd(ad.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
