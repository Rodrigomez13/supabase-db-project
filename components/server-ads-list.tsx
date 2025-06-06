"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, PlusIcon, MinusIcon, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { assignLeadsToFranchise } from "@/lib/lead-distribution-utils";
import { getActiveFranchise } from "@/lib/update-active-franchise";

interface ServerAd {
  id: string;
  ad_id: string;
  name: string;
  daily_budget: number;
  is_active?: boolean;
  api_id: string;
  api_name?: string;
  bm_name?: string;
  portfolio_id?: string;
  portfolio_name?: string;
  adset_id?: string;
  adset_name?: string;
  spent?: number;
  leads?: number;
  loads?: number;
  conversion_rate?: number;
  cost_per_lead?: number;
  cost_per_load?: number;
  status?: string;
}

interface ServerAdsListProps {
  serverId: string;
}

export function ServerAdsList({ serverId }: ServerAdsListProps) {
  const [ads, setAds] = useState<ServerAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [availableAds, setAvailableAds] = useState<any[]>([]);
  const [availableApis, setAvailableApis] = useState<any[]>([]);
  const [selectedAdId, setSelectedAdId] = useState<string>("");
  const [selectedApiId, setSelectedApiId] = useState<string>("");
  const [budget, setBudget] = useState<number>(0);
  const [serverCoefficient, setServerCoefficient] = useState<number>(1);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("Activo");
  const [activeFranchise, setActiveFranchise] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [assigningLoad, setAssigningLoad] = useState(false);

  useEffect(() => {
    if (serverId) {
      fetchServerAds();
      fetchServerInfo();
      fetchActiveFranchise();
    }
  }, [serverId]);

  async function fetchActiveFranchise() {
    try {
      const franchise = await getActiveFranchise();
      console.log("Franquicia activa obtenida:", franchise);
      setActiveFranchise(franchise);
    } catch (err) {
      console.error("Error al obtener franquicia activa:", err);
    }
  }

  async function fetchServerInfo() {
    try {
      const { data, error } = await supabase
        .from("servers")
        .select("coefficient")
        .eq("id", serverId)
        .single();

      if (error) throw error;
      if (data) {
        setServerCoefficient(data.coefficient || 1);
      }
    } catch (err) {
      console.error("Error fetching server info:", err);
    }
  }

  async function fetchServerAds() {
    try {
      setLoading(true);
      setError(null);

      // Consulta directa a la tabla server_ads con joins
      const { data, error } = await supabase
        .from("server_ads")
        .select(
          `
          id, 
          server_id,
          ad_id,
          api_id,
          daily_budget,
          leads,
          loads,
          spent,
          date,
          status,
          ads (
            name,
            ad_id,
            adset_id,
            is_active
          ),
          apis (
            name
          )
        `
        )
        .eq("server_id", serverId);

      if (error) {
        console.error("Error al consultar server_ads:", error);
        throw error;
      }

      console.log("Server ads table data:", data);

      // Transformar los datos
      const processedData = await Promise.all(
        (data || []).map(async (item: any) => {
          // Calcular métricas
          const leads = item.leads || 0;
          const loads = item.loads || 0;
          const spent = item.spent || 0;
          const conversion_rate = leads > 0 ? (loads / leads) * 100 : 0;
          const cost_per_lead =
            leads > 0 ? (spent * serverCoefficient) / leads : 0;
          const cost_per_load = loads > 0 ? spent / loads : 0;

          // Obtener información del adset
          let adsetName = "";
          let bmName = "";
          if (item.ads?.adset_id) {
            try {
              const { data: adsetData } = await supabase
                .from("ad_sets")
                .select("name, business_manager_id")
                .eq("id", item.ads.adset_id)
                .single();

              if (adsetData) {
                adsetName = adsetData.name;

                // Obtener nombre del business manager
                if (adsetData.business_manager_id) {
                  const { data: bmData } = await supabase
                    .from("business_managers")
                    .select("name")
                    .eq("id", adsetData.business_manager_id)
                    .single();

                  if (bmData) {
                    bmName = bmData.name;
                  }
                }
              }
            } catch (e) {
              console.warn(
                `No se pudo cargar el adset para el anuncio ${item.id}`
              );
            }
          }

          return {
            id: item.id,
            ad_id: item.ad_id,
            name: item.ads?.name || "Anuncio sin nombre",
            daily_budget: item.daily_budget || 0,
            api_id: item.api_id,
            api_name: item.apis?.name || "API desconocida",
            bm_name: bmName || "-",
            adset_id: item.ads?.adset_id,
            adset_name: adsetName || "-",
            spent: spent,
            leads: leads,
            loads: loads,
            conversion_rate: conversion_rate,
            cost_per_lead: cost_per_lead,
            cost_per_load: cost_per_load,
            status: item.is_active || true, // Estado por defecto actualizado
          };
        })
      );

      setAds(processedData);
    } catch (err: any) {
      console.error("Error fetching server ads:", err);
      setError(
        `Error al cargar anuncios: ${err.message || "Error desconocido"}`
      );
      setAds([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableAds() {
    try {
      // Debug serverId
      console.log('serverId:', serverId, 'Type:', typeof serverId, 'JSON:', JSON.stringify(serverId));

      // Extract UUID from serverId
      let serverIdValue;
      if (typeof serverId === 'string') {
        serverIdValue = serverId;
      }

      // Validate serverIdValue
      if (!serverIdValue) {
        throw new Error(`serverId is invalid or missing: ${JSON.stringify(serverId)}`);
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(serverIdValue)  ) {
        throw new Error(`Invalid UUID format for serverId: ${serverIdValue}`);
      }

      console.log('Using serverIdValue:', serverIdValue);

      // Call the get_available_ads function
      const { data: adsData, error: adsError } = await supabase
        .rpc('get_available_ads', { p_server_id: serverIdValue });

      if (adsError) throw adsError;
      console.log('Ads data:', adsData);
      setAvailableAds(adsData || []);

      // Fetch APIs
      const { data: apisData, error: apisError } = await supabase
        .from('apis')
        .select('id, name')
        .eq('is_active', true);

      if (apisError) throw apisError;
      setAvailableApis(apisData || []);
    } catch (err) {
      console.error('Error loading available ads:', err);
    }
  }

  async function addAdToServer() {
    if (!selectedAdId || !selectedApiId) {
      setError("Por favor selecciona un anuncio y una API");
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];

      // Asegurarnos de que los valores iniciales sean 0
      const { data, error } = await supabase
        .from("server_ads")
        .insert({
          server_id: serverId,
          ad_id: selectedAdId,
          api_id: selectedApiId,
          daily_budget: budget,
          leads: 0,
          loads: 0,
          spent: 0,
          date: today,
          status: "Activo", // Estado inicial actualizado
        })
        .select();

      if (error) throw error;

      // Cerrar diálogo y recargar datos
      setShowAddDialog(false);
      fetchServerAds();
      toast({
        title: "Anuncio agregado",
        description: "El anuncio ha sido agregado al servidor correctamente",
      });
    } catch (err: any) {
      console.error("Error adding ad to server:", err);
      setError(`Error al agregar anuncio: ${err.message}`);
    }
  }

  async function updateAdMetrics(id: string, field: string, value: number) {
    try {
      const adToUpdate = ads.find((ad) => ad.id === id);
      if (!adToUpdate) return;

      // Primero actualizar el contador en server_ads
      const { error: updateError } = await supabase
        .from("server_ads")
        .update({ [field]: value })
        .eq("id", id);

      if (updateError) throw updateError;

      // Si estamos incrementando loads (conversiones), asignar a la franquicia seleccionada
      if (
        field === "loads" &&
        value > (adToUpdate.loads || 0) &&
        activeFranchise
      ) {
        // Calcular cuántas conversiones nuevas se están agregando
        const newLoads = value - (adToUpdate.loads || 0);
        console.log(
          `Asignando ${newLoads} nuevas conversiones a ${activeFranchise.name}`
        );

        setAssigningLoad(true);

        try {
          // Asignar cada nueva conversión a la franquicia seleccionada
          let successCount = 0;
          const errorMessages = [];

          for (let i = 0; i < newLoads; i++) {
            const result = await assignLeadsToFranchise(
              serverId,
              activeFranchise.id,
              1
            );
            if (result.success) {
              successCount++;
            } else {
              errorMessages.push(result.error);
              console.error(
                "Error al asignar conversión a franquicia:",
                result.error
              );
            }
          }

          if (successCount > 0) {
            toast({
              title: "Conversiones registradas",
              description: `Se han registrado ${successCount} de ${newLoads} conversión(es)`,
            });
          }

          if (errorMessages.length > 0) {
            toast({
              title: "Errores al asignar conversiones",
              description: `Ocurrieron ${errorMessages.length} errores. Primer error: ${errorMessages[0]}`,
              variant: "destructive",
            });
          }
        } catch (err: any) {
          console.error(`Error al asignar conversiones:`, err);
          toast({
            title: "Error",
            description: `Error al asignar conversiones: ${err.message}`,
            variant: "destructive",
          });
        } finally {
          setAssigningLoad(false);
        }
      }

      // Actualizar estado local
      const updatedAds = ads.map((ad) => {
        if (ad.id === id) {
          const updatedAd = { ...ad, [field]: value };

          // Recalcular métricas
          const leads = updatedAd.leads || 0;
          const loads = updatedAd.loads || 0;
          const spent = updatedAd.spent || 0;

          updatedAd.conversion_rate = leads > 0 ? (loads / leads) * 100 : 0;
          updatedAd.cost_per_lead =
            leads > 0 ? (spent * serverCoefficient) / leads : 0;
          updatedAd.cost_per_load = loads > 0 ? spent / loads : 0;

          return updatedAd;
        }
        return ad;
      });

      setAds(updatedAds);
    } catch (err: any) {
      console.error(`Error updating ${field}:`, err);
      toast({
        title: "Error",
        description: `Error al actualizar: ${err.message}`,
        variant: "destructive",
      });
    }
  }

  async function updateAdStatus(id: string, status: string) {
    try {
      const adToUpdate = ads.find((ad) => ad.id === id);
      if (!adToUpdate) return;

      // Actualizar en la base de datos
      const { error } = await supabase
        .from("server_ads")
        .update({ status: status })
        .eq("id", id);

      if (error) throw error;

      // Actualizar estado local
      const updatedAds = ads.map((ad) => {
        if (ad.id === id) {
          return { ...ad, status: status };
        }
        return ad;
      });

      setAds(updatedAds);
      setEditingStatus(null);
      toast({
        title: "Estado actualizado",
        description: `El anuncio ahora está en estado: ${status}`,
      });
    } catch (err: any) {
      console.error("Error updating ad status:", err);
      toast({
        title: "Error",
        description: `No se pudo actualizar el estado: ${err.message}`,
        variant: "destructive",
      });
    }
  }

  async function deleteAd(id: string) {
    try {
      const { error } = await supabase.from("server_ads").delete().eq("id", id);

      if (error) throw error;

      // Actualizar estado local
      setAds(ads.filter((ad) => ad.id !== id));
      toast({
        title: "Anuncio eliminado",
        description: "El anuncio ha sido eliminado del servidor",
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

  async function generateDailyRecord() {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];

      // 1. Calcular totales del día
      const totalLeads = ads.reduce((sum, ad) => sum + (ad.leads || 0), 0);
      const totalLoads = ads.reduce((sum, ad) => sum + (ad.loads || 0), 0);
      const totalSpent = ads.reduce((sum, ad) => sum + (ad.spent || 0), 0);

      console.log("Totales calculados:", {
        totalLeads,
        totalLoads,
        totalSpent,
      });

      // 2. Crear registro diario - Corregido para usar los nombres correctos de las columnas
      const { data: recordData, error: recordError } = await supabase
        .from("server_daily_records")
        .upsert(
          {
            server_id: serverId,
            date: today,
            leads: totalLeads, // Nombre correcto: leads
            conversions: totalLoads, // Nombre correcto: conversions
            total_conversions: totalLoads, // También actualizar total_conversions
            conversion_rate:
              totalLeads > 0 ? (totalLoads / totalLeads) * 100 : 0,
            fb_spend: totalSpent, // Usando fb_spend en lugar de total_spent
            cost_per_lead: totalLeads > 0 ? totalSpent / totalLeads : 0,
            cost_per_conversion: totalLoads > 0 ? totalSpent / totalLoads : 0,
          },
          {
            onConflict: "server_id,date",
          }
        )
        .select();

      if (recordError) {
        console.error("Error al crear registro diario:", recordError);
        throw recordError;
      }

      console.log("Registro diario creado:", recordData);

      // 3. Actualizar los totales en los anuncios correspondientes
      for (const ad of ads) {
        // Actualizar totales en la tabla ads
        if (ad.ad_id) {
          const { data: adData, error: adError } = await supabase
            .from("ads")
            .select("total_leads, total_conversions, total_spent")
            .eq("id", ad.ad_id)
            .single();

          if (!adError && adData) {
            // Sumar los valores actuales a los totales
            await supabase
              .from("ads")
              .update({
                total_leads: (adData.total_leads || 0) + (ad.leads || 0),
                total_conversions:
                  (adData.total_conversions || 0) + (ad.loads || 0),
                total_spent: (adData.total_spent || 0) + (ad.spent || 0),
              })
              .eq("id", ad.ad_id);
          }
        }
      }

      // 4. Reiniciar los contadores diarios en server_ads
      const resetPromises = ads.map((ad) =>
        supabase
          .from("server_ads")
          .update({
            leads: 0,
            loads: 0,
            spent: 0,
            date: new Date().toISOString().split("T")[0],
          })
          .eq("id", ad.id)
      );

      await Promise.all(resetPromises);

      // 5. Recargar los datos
      await fetchServerAds();

      return { success: true, message: "Cierre diario completado con éxito" };
    } catch (err: any) {
      console.error("Error generating daily record:", err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }

  // Función para obtener la variante del badge según el estado
  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case "Activo":
        return "outline" as const;
      case "Inactivo":
        return "secondary" as const;
      case "Error":
        return "destructive" as const;
      case "Error_de_Entrega":
        return "warning" as const;
      case "BM_Deshabilitada":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  }

  // Función para obtener el texto del badge según el estado
  function getStatusBadgeText(status: string) {
    switch (status) {
      case "Activo":
        return "Activo";
      case "Inactivo":
        return "Inactivo";
      case "Error":
        return "Error";
      case "Error_de_Entrega":
        return "Error de Entrega";
      case "BM_Deshabilitada":
        return "BM Deshabilitada";
      case "Cuenta_Deshabilitada":
        return "Cuenta Deshabilitada";
      case "Violación_de_Políticas":
        return "Violación de Políticas";
      default:
        return status;
    }
  }

  const filteredAds = ads.filter(
    (ad) =>
      ad.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.adset_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-usina-text-primary">
          Anuncios del Servidor
        </h3>
        <div className="flex space-x-2">
          <Input
            placeholder="Buscar anuncios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 bg-background/10 border-usina-card/30"
          />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button
                className="bg-usina-primary hover:bg-usina-secondary"
                onClick={() => {
                  loadAvailableAds();
                  setSelectedAdId("");
                  setSelectedApiId("");
                  setBudget(0);
                }}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Agregar Anuncio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Agregar Anuncio al Servidor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="ad">Seleccionar Anuncio</Label>
                  <Select value={selectedAdId} onValueChange={setSelectedAdId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un anuncio" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAds.map((ad) => (
                        <SelectItem key={ad.id} value={ad.id}>
                          {ad.name} - {ad.ad_set_name}
                        </SelectItem>
                      ))}                       
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api">API de Conexión</Label>
                  <Select
                    value={selectedApiId}
                    onValueChange={setSelectedApiId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una API" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableApis.map((api) => (
                        <SelectItem key={api.id} value={api.id}>
                          {api.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Presupuesto Diario ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value) || 0)}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={addAdToServer}>Agregar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            className="bg-usina-success/10 text-usina-success border-usina-success/30 hover:bg-usina-success/20"
            onClick={async () => {
              if (
                confirm(
                  "¿Estás seguro de realizar el cierre diario? Esto reiniciará los contadores y guardará los totales."
                )
              ) {
                const result = await generateDailyRecord();
                if (result.success) {
                  toast({
                    title: "Cierre diario completado",
                    description: "El cierre diario se ha completado con éxito",
                  });
                } else {
                  toast({
                    title: "Error",
                    description: `Error al realizar el cierre diario: ${result.error}`,
                    variant: "destructive",
                  });
                }
              }
            }}
          >
            Realizar Cierre Diario
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {activeFranchise ? (
        <Alert className="bg-green-50 border-green-200">
          <AlertTitle className="text-green-700 flex items-center">
            Franquicia activa: {activeFranchise.name}
          </AlertTitle>
          <AlertDescription className="text-green-600">
            Las conversiones se asignarán automáticamente a esta franquicia
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No hay franquicia seleccionada</AlertTitle>
          <AlertDescription>
            Selecciona una franquicia en el menú superior para asignar
            conversiones
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-4 text-usina-text-secondary">
          Cargando anuncios...
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="text-center py-4 text-usina-text-secondary">
          No hay anuncios para este servidor
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-usina-card/20">
                <TableHead className="text-usina-text-secondary">
                  ID Ad Set
                </TableHead>
                <TableHead className="text-usina-text-secondary">BM</TableHead>
                <TableHead className="text-usina-text-secondary">
                  Budget
                </TableHead>
                <TableHead className="text-usina-text-secondary">
                  Gastado
                </TableHead>
                <TableHead className="text-usina-text-secondary">API</TableHead>
                <TableHead className="text-usina-text-secondary">
                  Estado
                </TableHead>
                <TableHead className="text-usina-text-secondary">
                  Leads
                </TableHead>
                <TableHead className="text-usina-text-secondary">
                  Loads
                </TableHead>
                <TableHead className="text-usina-text-secondary">
                  Conversion
                </TableHead>
                <TableHead className="text-usina-text-secondary">
                  $ Lead
                </TableHead>
                <TableHead className="text-usina-text-secondary">
                  $ Loads
                </TableHead>
                <TableHead className="text-right text-usina-text-secondary">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAds.map((ad) => (
                <TableRow key={ad.id} className="border-usina-card/20">
                  <TableCell>
                    <div>
                      <p className="font-medium text-usina-text-primary">
                        {ad.adset_name}
                      </p>
                      <p className="text-xs text-usina-text-secondary">
                        {ad.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-usina-text-primary">
                    {ad.bm_name}
                  </TableCell>
                  <TableCell className="text-usina-text-primary">
                    ${ad.daily_budget?.toFixed(2) ?? "0.00"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Input
                        type="number"
                        step="0.01"
                        value={ad.spent || 0}
                        onChange={(e) =>
                          updateAdMetrics(
                            ad.id,
                            "spent",
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-20 h-8 text-center"
                        disabled={ad.is_active !== true}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-usina-text-primary">
                    {ad.api_name}
                  </TableCell>
                  <TableCell>
                    {editingStatus === ad.id ? (
                      <div className="flex flex-col space-y-2">
                        <Select
                          value={selectedStatus}
                          onValueChange={setSelectedStatus}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Activo">Activo</SelectItem>
                            <SelectItem value="Inactivo">Inactivo</SelectItem>
                            <SelectItem value="Error">Error</SelectItem>
                            <SelectItem value="Error_de_Entrega">
                              Error de Entrega
                            </SelectItem>
                            <SelectItem value="BM_Deshabilitada">
                              BM Deshabilitada
                            </SelectItem>
                            <SelectItem value="Cuenta_Deshabilitada">
                              Cuenta Deshabilitada
                            </SelectItem>
                            <SelectItem value="Violación_de_Políticas">
                              Violación de Políticas
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => setEditingStatus(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() =>
                              updateAdStatus(ad.id, selectedStatus)
                            }
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Badge
                        variant={getStatusBadgeVariant(ad.status || "Activo")}
                        className="cursor-pointer"
                        onClick={() => {
                          setEditingStatus(ad.id);
                          setSelectedStatus(ad.status || "Activo");
                        }}
                      >
                        {getStatusBadgeText(ad.status || "Activo")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          updateAdMetrics(
                            ad.id,
                            "leads",
                            Math.max(0, (ad.leads || 0) - 1)
                          )
                        }
                        disabled={ad.is_active !== true}
                      >
                        <MinusIcon className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={ad.leads || 0}
                        onChange={(e) =>
                          updateAdMetrics(
                            ad.id,
                            "leads",
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-20 h-8 text-center"
                        disabled={ad.is_active !== true}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          updateAdMetrics(ad.id, "leads", (ad.leads || 0) + 1)
                        }
                        disabled={ad.is_active !== true}
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
                          updateAdMetrics(
                            ad.id,
                            "loads",
                            Math.max(0, (ad.loads || 0) - 1)
                          )
                        }
                        disabled={ad.is_active !== true || assigningLoad}
                      >
                        <MinusIcon className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={ad.loads || 0}
                        onChange={(e) =>
                          updateAdMetrics(
                            ad.id,
                            "loads",
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-20 h-8 text-center"
                        disabled={ad.is_active !== true || assigningLoad}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          updateAdMetrics(ad.id, "loads", (ad.loads || 0) + 1)
                        }
                        disabled={ad.is_active !== true || assigningLoad}
                      >
                        <PlusIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-usina-text-primary">
                    {ad.conversion_rate?.toFixed(0)}%
                  </TableCell>
                  <TableCell className="text-usina-text-primary">
                    ${ad.cost_per_lead?.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-usina-text-primary">
                    ${ad.cost_per_load?.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-usina-danger/30 text-usina-danger hover:bg-usina-danger/10"
                        onClick={() => {
                          if (
                            confirm(
                              "¿Estás seguro de eliminar este anuncio del servidor?"
                            )
                          ) {
                            deleteAd(ad.id);
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
        </div>
      )}
    </div>
  );
}
