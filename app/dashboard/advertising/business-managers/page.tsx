"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusIcon,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  Settings,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { safeDelete } from "@/lib/safe-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

// Interfaces para los tipos de datos
interface BusinessManager {
  id: string;
  name: string;
  bm_id: string;
  status: string;
  portfolio_id: string;
  created_at: string;
  portfolios?: {
    name: string;
  };
}

interface Campaign {
  id: string;
  name: string;
  campaign_id: string;
  objective: string;
  status: string;
}

interface AdSet {
  id: string;
  name: string;
  adset_id: string;
  status: string;
}

interface Ad {
  id: string;
  name: string;
  ad_id: string;
  status: string;
  creative_type: string;
  image_url?: string;
}

export default function BusinessManagersPage() {
  const [businessManagers, setBusinessManagers] = useState<BusinessManager[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedBMs, setExpandedBMs] = useState<Record<string, boolean>>({});
  const [expandedCampaigns, setExpandedCampaigns] = useState<
    Record<string, boolean>
  >({});
  const [expandedAdSets, setExpandedAdSets] = useState<Record<string, boolean>>(
    {}
  );
  const [activeTab, setActiveTab] = useState("all");

  // Estados para almacenar datos cargados bajo demanda
  const [campaignsData, setCampaignsData] = useState<
    Record<string, Campaign[]>
  >({});
  const [adSetsData, setAdSetsData] = useState<Record<string, AdSet[]>>({});
  const [adsData, setAdsData] = useState<Record<string, Ad[]>>({});

  // Estados para controlar la carga
  const [loadingCampaigns, setLoadingCampaigns] = useState<
    Record<string, boolean>
  >({});
  const [loadingAdSets, setLoadingAdSets] = useState<Record<string, boolean>>(
    {}
  );
  const [loadingAds, setLoadingAds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchBusinessManagers();
  }, []);

  async function fetchBusinessManagers() {
    try {
      setLoading(true);

      // Obtener business managers con sus portfolios
      const { data: bms, error: bmError } = await supabase
        .from("business_managers")
        .select(
          `
          id, 
          name, 
          bm_id, 
          status, 
          portfolio_id, 
          created_at,
          portfolios (name)
        `
        )
        .order("created_at", { ascending: false });

      if (bmError) throw bmError;

      setBusinessManagers(
        (bms || []).map((bm) => ({
          ...bm,
          portfolios: bm.portfolios?.[0] || undefined, // Adjust portfolios to match the expected structure
        }))
      );
      setError(null);
    } catch (err: any) {
      console.error("Error loading business managers:", err);
      setError(
        "No se pudieron cargar los business managers. Por favor, intenta de nuevo más tarde."
      );
      setBusinessManagers([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteBusinessManager(id: string) {
    try {
      const result = await safeDelete("business_managers", id);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Actualizamos la lista localmente para evitar otra consulta
      setBusinessManagers(businessManagers.filter((bm) => bm.id !== id));
    } catch (err: any) {
      console.error("Error deleting business manager:", err);
      setError(
        `Error al eliminar business manager: ${
          err.message || "Error desconocido"
        }`
      );
    }
  }

  // Función para cargar campañas de un business manager específico
  async function loadCampaigns(bmId: string) {
    if (campaignsData[bmId]?.length > 0) {
      // Si ya tenemos datos, solo expandimos
      toggleBM(bmId);
      return;
    }

    try {
      setLoadingCampaigns((prev) => ({ ...prev, [bmId]: true }));

      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, campaign_id, objective, status")
        .eq("business_manager_id", bmId)
        .order("name");

      if (error) throw error;

      setCampaignsData((prev) => ({ ...prev, [bmId]: data || [] }));
      toggleBM(bmId);
    } catch (err: any) {
      console.error(`Error loading campaigns for BM ${bmId}:`, err);
      setCampaignsData((prev) => ({ ...prev, [bmId]: [] }));
    } finally {
      setLoadingCampaigns((prev) => ({ ...prev, [bmId]: false }));
    }
  }

  // Función para cargar conjuntos de anuncios de una campaña específica
  async function loadAdSets(campaignId: string) {
    if (adSetsData[campaignId]?.length > 0) {
      // Si ya tenemos datos, solo expandimos
      toggleCampaign(campaignId);
      return;
    }

    try {
      setLoadingAdSets((prev) => ({ ...prev, [campaignId]: true }));

      const { data, error } = await supabase
        .from("ad_sets")
        .select("id, name, adset_id, status")
        .eq("campaign_id", campaignId)
        .order("name");

      if (error) throw error;

      setAdSetsData((prev) => ({ ...prev, [campaignId]: data || [] }));
      toggleCampaign(campaignId);
    } catch (err: any) {
      console.error(`Error loading ad sets for campaign ${campaignId}:`, err);
      setAdSetsData((prev) => ({ ...prev, [campaignId]: [] }));
    } finally {
      setLoadingAdSets((prev) => ({ ...prev, [campaignId]: false }));
    }
  }

  // Función para cargar anuncios de un conjunto específico
  async function loadAds(adSetId: string) {
    if (adsData[adSetId]?.length > 0) {
      // Si ya tenemos datos, solo expandimos
      toggleAdSet(adSetId);
      return;
    }

    try {
      setLoadingAds((prev) => ({ ...prev, [adSetId]: true }));

      const { data, error } = await supabase
        .from("ads")
        .select("id, name, ad_id, status, creative_type, image_url")
        .eq("adset_id", adSetId)
        .order("name");

      if (error) throw error;

      setAdsData((prev) => ({ ...prev, [adSetId]: data || [] }));
      toggleAdSet(adSetId);
    } catch (err: any) {
      console.error(`Error loading ads for ad set ${adSetId}:`, err);
      setAdsData((prev) => ({ ...prev, [adSetId]: [] }));
    } finally {
      setLoadingAds((prev) => ({ ...prev, [adSetId]: false }));
    }
  }

  const toggleBM = (id: string) => {
    setExpandedBMs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleCampaign = (id: string) => {
    setExpandedCampaigns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAdSet = (id: string) => {
    setExpandedAdSets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredBusinessManagers = businessManagers.filter((bm) => {
    // Filtrar por búsqueda
    const matchesSearch =
      bm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bm.bm_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bm.portfolios?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    // Filtrar por estado
    const matchesStatus =
      activeTab === "all" ||
      (activeTab === "Activo" && bm.status === "Activo") ||
      (activeTab === "inactive" && bm.status !== "Activo");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Business Managers</h1>
          <p className="text-muted-foreground">
            Gestiona tus Business Managers y sus campañas publicitarias
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/dashboard/advertising/business-managers/settings">
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard/advertising/business-managers/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuevo Business Manager
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="Activo">Activos</TabsTrigger>
            <TabsTrigger value="inactive">Inactivos</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar business managers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Business Managers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <Skeleton className="h-12 w-full mb-2" />
              <Skeleton className="h-12 w-full mb-2" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredBusinessManagers.length === 0 ? (
            <div className="p-6 text-center">
              No hay business managers registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">Nombre</TableHead>
                  <TableHead>ID de Business Manager</TableHead>
                  <TableHead>Portfolio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBusinessManagers.map((bm) => (
                  <>
                    <TableRow key={bm.id}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => loadCampaigns(bm.id)}
                          className="flex items-center space-x-2 focus:outline-none"
                        >
                          {loadingCampaigns[bm.id] ? (
                            <Skeleton className="h-4 w-4 rounded-full" />
                          ) : expandedBMs[bm.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span>{bm.name}</span>
                        </button>
                      </TableCell>
                      <TableCell>{bm.bm_id}</TableCell>
                      <TableCell>{bm.portfolios?.name || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            bm.status === "Activo" ? "success" : "secondary"
                          }
                        >
                          {bm.status === "Activo" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/dashboard/advertising/business-managers/${bm.id}`}
                          >
                            <Button variant="outline" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (
                                confirm(
                                  "¿Estás seguro de eliminar este business manager?"
                                )
                              ) {
                                deleteBusinessManager(bm.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Campañas expandidas */}
                    {expandedBMs[bm.id] && (
                      <TableRow>
                        <TableCell colSpan={5} className="p-0">
                          <div className="p-4 bg-muted/20">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="text-lg font-medium">Campañas</h3>
                              <Link
                                href={`/dashboard/advertising/campaigns/new?bm=${bm.id}`}
                              >
                                <Button size="sm" variant="outline">
                                  <PlusIcon className="h-3 w-3 mr-1" />
                                  Nueva Campaña
                                </Button>
                              </Link>
                            </div>

                            {loadingCampaigns[bm.id] ? (
                              <div className="space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                              </div>
                            ) : campaignsData[bm.id]?.length === 0 ? (
                              <div className="text-center py-4 text-muted-foreground">
                                No hay campañas para este Business Manager
                              </div>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-1/3">
                                      Nombre
                                    </TableHead>
                                    <TableHead>ID de Campaña</TableHead>
                                    <TableHead>Objetivo</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">
                                      Acciones
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {campaignsData[bm.id]?.map((campaign) => (
                                    <>
                                      <TableRow key={campaign.id}>
                                        <TableCell>
                                          <button
                                            onClick={() =>
                                              loadAdSets(campaign.id)
                                            }
                                            className="flex items-center space-x-2 focus:outline-none"
                                          >
                                            {loadingAdSets[campaign.id] ? (
                                              <Skeleton className="h-4 w-4 rounded-full" />
                                            ) : expandedCampaigns[
                                                campaign.id
                                              ] ? (
                                              <ChevronDown className="h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4" />
                                            )}
                                            <span>{campaign.name}</span>
                                          </button>
                                        </TableCell>
                                        <TableCell>
                                          {campaign.campaign_id}
                                        </TableCell>
                                        <TableCell>
                                          {campaign.objective}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              campaign.status === "Activo"
                                                ? "success"
                                                : "secondary"
                                            }
                                          >
                                            {campaign.status === "Activo"
                                              ? "Activa"
                                              : "Inactiva"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex justify-end space-x-2">
                                            <Link
                                              href={`/dashboard/advertising/campaigns/${campaign.id}`}
                                            >
                                              <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7"
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </Button>
                                            </Link>
                                          </div>
                                        </TableCell>
                                      </TableRow>

                                      {/* Conjuntos de anuncios expandidos */}
                                      {expandedCampaigns[campaign.id] && (
                                        <TableRow>
                                          <TableCell
                                            colSpan={5}
                                            className="p-0"
                                          >
                                            <div className="p-4 bg-muted/40">
                                              <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-medium">
                                                  Conjuntos de Anuncios
                                                </h4>
                                                <Link
                                                  href={`/dashboard/advertising/ad-sets/new?campaign=${campaign.id}`}
                                                >
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7"
                                                  >
                                                    <PlusIcon className="h-3 w-3 mr-1" />
                                                    Nuevo Conjunto
                                                  </Button>
                                                </Link>
                                              </div>

                                              {loadingAdSets[campaign.id] ? (
                                                <div className="space-y-2">
                                                  <Skeleton className="h-8 w-full" />
                                                  <Skeleton className="h-8 w-full" />
                                                </div>
                                              ) : adSetsData[campaign.id]
                                                  ?.length === 0 ? (
                                                <div className="text-center py-3 text-muted-foreground">
                                                  No hay conjuntos de anuncios
                                                  para esta campaña
                                                </div>
                                              ) : (
                                                <Table>
                                                  <TableHeader>
                                                    <TableRow>
                                                      <TableHead className="w-1/3">
                                                        Nombre
                                                      </TableHead>
                                                      <TableHead>
                                                        ID de Conjunto
                                                      </TableHead>
                                                      <TableHead>
                                                        Estado
                                                      </TableHead>
                                                      <TableHead className="text-right">
                                                        Acciones
                                                      </TableHead>
                                                    </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                    {adSetsData[
                                                      campaign.id
                                                    ]?.map((adSet) => (
                                                      <>
                                                        <TableRow
                                                          key={adSet.id}
                                                        >
                                                          <TableCell>
                                                            <button
                                                              onClick={() =>
                                                                loadAds(
                                                                  adSet.id
                                                                )
                                                              }
                                                              className="flex items-center space-x-2 focus:outline-none"
                                                            >
                                                              {loadingAds[
                                                                adSet.id
                                                              ] ? (
                                                                <Skeleton className="h-4 w-4 rounded-full" />
                                                              ) : expandedAdSets[
                                                                  adSet.id
                                                                ] ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                              ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                              )}
                                                              <span>
                                                                {adSet.name}
                                                              </span>
                                                            </button>
                                                          </TableCell>
                                                          <TableCell>
                                                            {adSet.adset_id}
                                                          </TableCell>
                                                          <TableCell>
                                                            <Badge
                                                              variant={
                                                                adSet.status ===
                                                                "Activo"
                                                                  ? "success"
                                                                  : "secondary"
                                                              }
                                                            >
                                                              {adSet.status ===
                                                              "Activo"
                                                                ? "Activo"
                                                                : "Inactivo"}
                                                            </Badge>
                                                          </TableCell>
                                                          <TableCell className="text-right">
                                                            <div className="flex justify-end space-x-2">
                                                              <Link
                                                                href={`/dashboard/advertising/ad-sets/${adSet.id}`}
                                                              >
                                                                <Button
                                                                  variant="outline"
                                                                  size="icon"
                                                                  className="h-7 w-7"
                                                                >
                                                                  <Pencil className="h-3 w-3" />
                                                                </Button>
                                                              </Link>
                                                              <Link
                                                                href={`/dashboard/advertising/register-activity?adset=${adSet.id}`}
                                                              >
                                                                <Button
                                                                  variant="outline"
                                                                  size="icon"
                                                                  className="h-7 w-7"
                                                                >
                                                                  <Activity className="h-3 w-3" />
                                                                </Button>
                                                              </Link>
                                                            </div>
                                                          </TableCell>
                                                        </TableRow>

                                                        {/* Anuncios expandidos */}
                                                        {expandedAdSets[
                                                          adSet.id
                                                        ] && (
                                                          <TableRow>
                                                            <TableCell
                                                              colSpan={5}
                                                              className="p-0"
                                                            >
                                                              <div className="p-4 bg-muted/60">
                                                                <div className="flex justify-between items-center mb-2">
                                                                  <h5 className="font-medium">
                                                                    Anuncios
                                                                  </h5>
                                                                  <Link
                                                                    href={`/dashboard/advertising/ads/new?adset=${adSet.id}`}
                                                                  >
                                                                    <Button
                                                                      size="sm"
                                                                      variant="outline"
                                                                      className="h-7"
                                                                    >
                                                                      <PlusIcon className="h-3 w-3 mr-1" />
                                                                      Nuevo
                                                                      Anuncio
                                                                    </Button>
                                                                  </Link>
                                                                </div>

                                                                {loadingAds[
                                                                  adSet.id
                                                                ] ? (
                                                                  <div className="space-y-2">
                                                                    <Skeleton className="h-8 w-full" />
                                                                    <Skeleton className="h-8 w-full" />
                                                                  </div>
                                                                ) : adsData[
                                                                    adSet.id
                                                                  ]?.length ===
                                                                  0 ? (
                                                                  <div className="text-center py-3 text-muted-foreground">
                                                                    No hay
                                                                    anuncios
                                                                    para este
                                                                    conjunto
                                                                  </div>
                                                                ) : (
                                                                  <Table>
                                                                    <TableHeader>
                                                                      <TableRow>
                                                                        <TableHead>
                                                                          Nombre
                                                                        </TableHead>
                                                                        <TableHead>
                                                                          ID de
                                                                          Anuncio
                                                                        </TableHead>
                                                                        <TableHead>
                                                                          Tipo
                                                                          de
                                                                          Creativo
                                                                        </TableHead>
                                                                        <TableHead>
                                                                          Estado
                                                                        </TableHead>
                                                                        <TableHead className="text-right">
                                                                          Acciones
                                                                        </TableHead>
                                                                      </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                      {adsData[
                                                                        adSet.id
                                                                      ]?.map(
                                                                        (
                                                                          ad
                                                                        ) => (
                                                                          <TableRow
                                                                            key={
                                                                              ad.id
                                                                            }
                                                                          >
                                                                            <TableCell className="flex items-center space-x-2">
                                                                              {ad.image_url && (
                                                                                <div className="h-8 w-8 rounded overflow-hidden">
                                                                                  <img
                                                                                    src={
                                                                                      ad.image_url ||
                                                                                      "/placeholder.svg"
                                                                                    }
                                                                                    alt={
                                                                                      ad.name
                                                                                    }
                                                                                    className="h-full w-full object-cover"
                                                                                  />
                                                                                </div>
                                                                              )}
                                                                              <span>
                                                                                {
                                                                                  ad.name
                                                                                }
                                                                              </span>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                              {
                                                                                ad.ad_id
                                                                              }
                                                                            </TableCell>
                                                                            <TableCell>
                                                                              {
                                                                                ad.creative_type
                                                                              }
                                                                            </TableCell>
                                                                            <TableCell>
                                                                              <Badge
                                                                                variant={
                                                                                  ad.status ===
                                                                                  "Activo"
                                                                                    ? "success"
                                                                                    : "secondary"
                                                                                }
                                                                              >
                                                                                {ad.status ===
                                                                                "Activo"
                                                                                  ? "Activo"
                                                                                  : "Inactivo"}
                                                                              </Badge>
                                                                            </TableCell>
                                                                            <TableCell className="text-right">
                                                                              <div className="flex justify-end space-x-2">
                                                                                <Link
                                                                                  href={`/dashboard/advertising/ads/${ad.id}`}
                                                                                >
                                                                                  <Button
                                                                                    variant="outline"
                                                                                    size="icon"
                                                                                    className="h-7 w-7"
                                                                                  >
                                                                                    <Pencil className="h-3 w-3" />
                                                                                  </Button>
                                                                                </Link>
                                                                              </div>
                                                                            </TableCell>
                                                                          </TableRow>
                                                                        )
                                                                      )}
                                                                    </TableBody>
                                                                  </Table>
                                                                )}
                                                              </div>
                                                            </TableCell>
                                                          </TableRow>
                                                        )}
                                                      </>
                                                    ))}
                                                  </TableBody>
                                                </Table>
                                              )}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Próximos pasos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Campañas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Gestiona tus campañas publicitarias y sus métricas.
              </p>
              <Link href="/dashboard/advertising/campaigns">
                <Button className="w-full">Ver campañas</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conjuntos de anuncios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Administra los conjuntos de anuncios de tus campañas.
              </p>
              <Link href="/dashboard/advertising/ad-sets">
                <Button className="w-full">Ver conjuntos</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anuncios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Visualiza y edita los anuncios individuales.
              </p>
              <Link href="/dashboard/advertising/ads">
                <Button className="w-full">Ver anuncios</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
