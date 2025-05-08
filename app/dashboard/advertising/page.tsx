"use client";

import React from "react";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  PlusCircle,
  Settings,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";

// Interfaces para los datos
interface Campaign {
  id: string;
  name: string;
  platform: string;
  budget: number;
  spent: number;
  status: string;
  leads: number;
  conversions: number;
  roi: number;
  conversion_rate: number;
  cost_per_lead: number;
  cost_per_conversion: number;
}

interface AdAccount {
  id: string;
  name: string;
  platform: string;
  spend_limit: number;
  spent: number;
  remaining: number;
  is_active: boolean;
}

export default function AdvertisingPage() {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSpend: 0,
    totalLeads: 0,
    totalConversions: 0,
    averageROI: 0,
    spendChange: 0,
    leadsChange: 0,
    conversionsChange: 0,
    roiChange: 0,
  });

  useEffect(() => {
    fetchMetrics();
    fetchCampaigns();
    fetchAdAccounts();
  }, []);

  async function fetchMetrics() {
    try {
      // En un caso real, esto vendría de una API o de Supabase
      setMetrics({
        totalSpend: 1012.3,
        totalLeads: 2470,
        totalConversions: 617,
        averageROI: 3.0,
        spendChange: 8.2,
        leadsChange: 15.3,
        conversionsChange: 0,
        roiChange: 0.2,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  }

  async function fetchCampaigns() {
    setLoading(true);
    try {
      // Simulamos datos para el ejemplo
      const mockCampaigns: Campaign[] = [
        {
          id: "1",
          name: "Casino Verano",
          platform: "Facebook",
          budget: 500.0,
          spent: 325.75,
          status: "active",
          leads: 850,
          conversions: 212,
          roi: 3.2,
          conversion_rate: 24.9,
          cost_per_lead: 0.38,
          cost_per_conversion: 1.54,
        },
        {
          id: "2",
          name: "Ruleta Promoción",
          platform: "Instagram",
          budget: 350.0,
          spent: 280.5,
          status: "active",
          leads: 620,
          conversions: 145,
          roi: 2.8,
          conversion_rate: 23.4,
          cost_per_lead: 0.45,
          cost_per_conversion: 1.93,
        },
        {
          id: "3",
          name: "Bono Bienvenida",
          platform: "Facebook",
          budget: 400.0,
          spent: 180.25,
          status: "paused",
          leads: 420,
          conversions: 95,
          roi: 2.5,
          conversion_rate: 22.6,
          cost_per_lead: 0.43,
          cost_per_conversion: 1.9,
        },
        {
          id: "4",
          name: "Slots Gratis",
          platform: "Instagram",
          budget: 300.0,
          spent: 225.8,
          status: "active",
          leads: 580,
          conversions: 135,
          roi: 2.9,
          conversion_rate: 23.3,
          cost_per_lead: 0.39,
          cost_per_conversion: 1.67,
        },
        {
          id: "5",
          name: "Poker Night",
          platform: "Facebook",
          budget: 450.0,
          spent: 0.0,
          status: "scheduled",
          leads: 0,
          conversions: 0,
          roi: 0,
          conversion_rate: 0,
          cost_per_lead: 0,
          cost_per_conversion: 0,
        },
      ];

      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAdAccounts() {
    try {
      // Simulamos datos para el ejemplo
      const mockAdAccounts: AdAccount[] = [
        {
          id: "1",
          name: "Cuenta Principal",
          platform: "Facebook",
          spend_limit: 1000.0,
          spent: 650.25,
          remaining: 349.75,
          is_active: true,
        },
        {
          id: "2",
          name: "Cuenta Secundaria",
          platform: "Facebook",
          spend_limit: 800.0,
          spent: 420.5,
          remaining: 379.5,
          is_active: true,
        },
        {
          id: "3",
          name: "Cuenta Instagram",
          platform: "Instagram",
          spend_limit: 600.0,
          spent: 380.75,
          remaining: 219.25,
          is_active: true,
        },
        {
          id: "4",
          name: "Cuenta Respaldo",
          platform: "Facebook",
          spend_limit: 500.0,
          spent: 0.0,
          remaining: 500.0,
          is_active: false,
        },
      ];

      setAdAccounts(mockAdAccounts);
    } catch (error) {
      console.error("Error fetching ad accounts:", error);
    }
  }

  const toggleCampaignExpand = (campaignId: string) => {
    if (expandedCampaign === campaignId) {
      setExpandedCampaign(null);
    } else {
      setExpandedCampaign(campaignId);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500">
            Activo
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-500">
            Pausada
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-500">
            Programada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-500">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Publicidad</h1>
        <p className="text-muted-foreground">
          Gestiona tus campañas publicitarias y anuncios.
        </p>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Gasto Total
                </p>
                <h2 className="text-2xl font-bold mt-1">
                  {formatCurrency(metrics.totalSpend)}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  +{metrics.spendChange}% respecto al mes anterior
                </p>
              </div>
              <div className="text-green-500">$</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Leads Generados
                </p>
                <h2 className="text-2xl font-bold mt-1">
                  {metrics.totalLeads.toLocaleString()}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  +{metrics.leadsChange}% respecto al mes anterior
                </p>
              </div>
              <div className="text-blue-500">↗</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Conversiones
                </p>
                <h2 className="text-2xl font-bold mt-1">
                  {metrics.totalConversions}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Tasa de conversión: 25.0%
                </p>
              </div>
              <div className="text-purple-500">↗</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ROI Promedio
                </p>
                <h2 className="text-2xl font-bold mt-1">
                  {metrics.averageROI.toFixed(1)}x
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  +{metrics.roiChange}% respecto al mes anterior
                </p>
              </div>
              <div className="text-green-500">↗</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas */}
      <Tabs
        defaultValue="campaigns"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="border-b border-border w-full justify-start rounded-none p-0">
          <TabsTrigger
            value="campaigns"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-2 px-4"
          >
            Campañas
          </TabsTrigger>
          <TabsTrigger
            value="ads"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-2 px-4"
          >
            Anuncios
          </TabsTrigger>
          <TabsTrigger
            value="accounts"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-2 px-4"
          >
            Cuentas Publicitarias
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-2 px-4"
          >
            Analíticas
          </TabsTrigger>
        </TabsList>

        {/* Contenido de Campañas */}
        <TabsContent value="campaigns" className="mt-6 p-0">
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-80">
              <Input
                type="search"
                placeholder="Buscar campañas..."
                className="pl-3 pr-10 py-2"
              />
            </div>
            <Link href="/dashboard/advertising/campaigns/new">
              <Button className="bg-primary hover:bg-primary/90">
                <PlusCircle className="h-4 w-4 mr-2" />
                Nueva Campaña
              </Button>
            </Link>
          </div>

          <div className="bg-card border rounded-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Campañas Publicitarias</h3>
              <p className="text-sm text-muted-foreground">
                Gestiona tus campañas activas y programadas.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Nombre
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Plataforma
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Presupuesto
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Gastado
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Estado
                    </th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <React.Fragment key={campaign.id}>
                      <tr className="border-b">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleCampaignExpand(campaign.id)}
                            className="flex items-center font-medium"
                          >
                            {expandedCampaign === campaign.id ? (
                              <ChevronDown className="h-4 w-4 mr-2" />
                            ) : (
                              <ChevronRight className="h-4 w-4 mr-2" />
                            )}
                            {campaign.name}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {campaign.platform === "Facebook" ? (
                            <div className="flex items-center">
                              <span className="text-blue-500 mr-2">f</span>{" "}
                              Facebook
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="text-pink-500 mr-2">📷</span>{" "}
                              Instagram
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatCurrency(campaign.budget)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatCurrency(campaign.spent)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(campaign.status)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedCampaign === campaign.id && (
                        <tr className="bg-muted/20">
                          <td colSpan={6} className="p-0">
                            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Leads
                                </p>
                                <p className="text-lg font-semibold">
                                  {campaign.leads}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Conversiones
                                </p>
                                <p className="text-lg font-semibold">
                                  {campaign.conversions}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Costo por Lead
                                </p>
                                <p className="text-lg font-semibold">
                                  {formatCurrency(campaign.cost_per_lead)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Costo por Conversión
                                </p>
                                <p className="text-lg font-semibold">
                                  {formatCurrency(campaign.cost_per_conversion)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  ROI
                                </p>
                                <p className="text-lg font-semibold">
                                  {campaign.roi.toFixed(1)}x
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Tasa de Conversión
                                </p>
                                <p className="text-lg font-semibold">
                                  {formatPercentage(campaign.conversion_rate)}
                                </p>
                              </div>
                              <div className="col-span-2 flex items-center">
                                <Button
                                  variant="outline"
                                  className="text-primary border-primary/30 hover:bg-primary/10"
                                >
                                  Ver Anuncios
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Contenido de Anuncios */}
        <TabsContent value="ads" className="mt-6 p-0">
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-80">
              <Input
                type="search"
                placeholder="Buscar anuncios..."
                className="pl-3 pr-10 py-2"
              />
            </div>
            <Link href="/dashboard/advertising/ads/new">
              <Button className="bg-primary hover:bg-primary/90">
                <PlusCircle className="h-4 w-4 mr-2" />
                Nuevo Anuncio
              </Button>
            </Link>
          </div>

          <div className="bg-card border rounded-md p-6">
            <h3 className="text-lg font-semibold mb-4">Anuncios</h3>
            <p className="text-muted-foreground">
              Selecciona la pestaña "Anuncios" para ver y gestionar tus
              anuncios.
            </p>
          </div>
        </TabsContent>

        {/* Contenido de Cuentas Publicitarias */}
        <TabsContent value="accounts" className="mt-6 p-0">
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configurar API
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <PlusCircle className="h-4 w-4 mr-2" />
              Agregar Cuenta
            </Button>
          </div>

          <div className="bg-card border rounded-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Cuentas Publicitarias</h3>
              <p className="text-sm text-muted-foreground">
                Gestiona tus cuentas de Facebook e Instagram Ads.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Nombre
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Plataforma
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Límite de Gasto
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Gastado
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Restante
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Estado
                    </th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {adAccounts.map((account) => (
                    <tr key={account.id} className="border-b">
                      <td className="py-3 px-4 font-medium">{account.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {account.platform === "Facebook" ? (
                          <div className="flex items-center">
                            <span className="text-blue-500 mr-2">f</span>{" "}
                            Facebook
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span className="text-pink-500 mr-2">📷</span>{" "}
                            Instagram
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatCurrency(account.spend_limit)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatCurrency(account.spent)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatCurrency(account.remaining)}
                      </td>
                      <td className="py-3 px-4">
                        <Switch checked={account.is_active} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Contenido de Analíticas */}
        <TabsContent value="analytics" className="mt-6 p-0">
          <div className="bg-card border rounded-md p-6">
            <h3 className="text-lg font-semibold mb-4">Analíticas</h3>
            <p className="text-muted-foreground">
              Selecciona la pestaña "Analíticas" para ver estadísticas
              detalladas de tus campañas.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
