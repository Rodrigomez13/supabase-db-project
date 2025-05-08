"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, PieChart } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalBusinessManagers: number;
  activeBusinessManagers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalAdSets: number;
  activeAdSets: number;
  totalAds: number;
  activeAds: number;
  totalSpend: number;
  averageCostPerLead: number;
  averageConversionRate: number;
}

export default function AdvertisingDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      setLoading(true);

      // Obtener estadísticas de Business Managers
      const { data: bms, error: bmError } = await supabase
        .from("business_managers")
        .select("id, status");

      if (bmError) throw bmError;

      // Obtener estadísticas de Campañas
      const { data: campaigns, error: campaignError } = await supabase
        .from("campaigns")
        .select("id, status");

      if (campaignError) throw campaignError;

      // Obtener estadísticas de Conjuntos de Anuncios
      const { data: adSets, error: adSetError } = await supabase
        .from("ad_sets")
        .select("id, status");

      if (adSetError) throw adSetError;

      // Obtener estadísticas de Anuncios
      const { data: ads, error: adError } = await supabase
        .from("ads")
        .select("id, status");

      if (adError) throw adError;

      // Obtener estadísticas de gasto
      const { data: serverAds, error: serverAdError } = await supabase
        .from("server_ads")
        .select("spent, leads, loads");

      if (serverAdError) throw serverAdError;

      // Calcular estadísticas
      const totalSpend =
        serverAds?.reduce((sum, item) => sum + (Number(item.spent) || 0), 0) ||
        0;
      const totalLeads =
        serverAds?.reduce((sum, item) => sum + (Number(item.leads) || 0), 0) ||
        0;
      const totalLoads =
        serverAds?.reduce((sum, item) => sum + (Number(item.loads) || 0), 0) ||
        0;

      const averageCostPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
      const averageConversionRate =
        totalLeads > 0 ? (totalLoads / totalLeads) * 100 : 0;

      setStats({
        totalBusinessManagers: bms?.length || 0,
        activeBusinessManagers:
          bms?.filter((bm) => bm.status === "Activo").length || 0,
        totalCampaigns: campaigns?.length || 0,
        activeCampaigns:
          campaigns?.filter((c) => c.status === "Activo").length || 0,
        totalAdSets: adSets?.length || 0,
        activeAdSets: adSets?.filter((a) => a.status === "Activo").length || 0,
        totalAds: ads?.length || 0,
        activeAds: ads?.filter((a) => a.status === "Activo").length || 0,
        totalSpend,
        averageCostPerLead,
        averageConversionRate,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Publicidad</h1>
          <p className="text-muted-foreground">
            Gestiona tus campañas publicitarias y analiza su rendimiento
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/dashboard/advertising/import/ads">
            <Button variant="outline">Importar Anuncios</Button>
          </Link>
          <Link href="/dashboard/advertising/business-managers/new">
            <Button>Nuevo Business Manager</Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BarChart className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="performance">
            <LineChart className="h-4 w-4 mr-2" />
            Rendimiento
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <PieChart className="h-4 w-4 mr-2" />
            Distribución
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Business Managers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {stats?.totalBusinessManagers}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.activeBusinessManagers} activos
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campañas</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {stats?.totalCampaigns}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.activeCampaigns} activas
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conjuntos de Anuncios
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {stats?.totalAdSets}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.activeAdSets} activos
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Anuncios</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.totalAds}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.activeAds} activos
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Estructura Publicitaria</CardTitle>
                <CardDescription>
                  Organización de tus elementos publicitarios
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {loading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-1/4 font-medium">
                          Business Managers
                        </div>
                        <div className="w-3/4 h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${
                                stats?.activeBusinessManagers &&
                                stats?.totalBusinessManagers
                                  ? (stats.activeBusinessManagers /
                                      stats.totalBusinessManagers) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground pl-1/4 ml-[25%]">
                        {stats?.activeBusinessManagers} de{" "}
                        {stats?.totalBusinessManagers} activos (
                        {stats?.totalBusinessManagers
                          ? Math.round(
                              (stats.activeBusinessManagers /
                                stats.totalBusinessManagers) *
                                100
                            )
                          : 0}
                        %)
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-1/4 font-medium">Campañas</div>
                        <div className="w-3/4 h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${
                                stats?.activeCampaigns && stats?.totalCampaigns
                                  ? (stats.activeCampaigns /
                                      stats.totalCampaigns) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground pl-1/4 ml-[25%]">
                        {stats?.activeCampaigns} de {stats?.totalCampaigns}{" "}
                        activas (
                        {stats?.totalCampaigns
                          ? Math.round(
                              (stats.activeCampaigns / stats.totalCampaigns) *
                                100
                            )
                          : 0}
                        %)
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-1/4 font-medium">Conjuntos</div>
                        <div className="w-3/4 h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${
                                stats?.activeAdSets && stats?.totalAdSets
                                  ? (stats.activeAdSets / stats.totalAdSets) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground pl-1/4 ml-[25%]">
                        {stats?.activeAdSets} de {stats?.totalAdSets} activos (
                        {stats?.totalAdSets
                          ? Math.round(
                              (stats.activeAdSets / stats.totalAdSets) * 100
                            )
                          : 0}
                        %)
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-1/4 font-medium">Anuncios</div>
                        <div className="w-3/4 h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${
                                stats?.activeAds && stats?.totalAds
                                  ? (stats.activeAds / stats.totalAds) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground pl-1/4 ml-[25%]">
                        {stats?.activeAds} de {stats?.totalAds} activos (
                        {stats?.totalAds
                          ? Math.round((stats.activeAds / stats.totalAds) * 100)
                          : 0}
                        %)
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
                <CardDescription>
                  Indicadores clave de desempeño
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Gasto Total
                      </div>
                      <div className="text-2xl font-bold">
                        ${stats?.totalSpend.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Costo por Lead
                      </div>
                      <div className="text-2xl font-bold">
                        ${stats?.averageCostPerLead.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Tasa de Conversión
                      </div>
                      <div className="text-2xl font-bold">
                        {stats?.averageConversionRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard/advertising/business-managers"
              className="col-span-1"
            >
              <Card className="h-full hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">Business Managers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Gestiona tus Business Managers y sus campañas asociadas.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link
              href="/dashboard/advertising/campaigns"
              className="col-span-1"
            >
              <Card className="h-full hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">Campañas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Administra tus campañas publicitarias y sus objetivos.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/advertising/ad-sets" className="col-span-1">
              <Card className="h-full hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Conjuntos de Anuncios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Visualiza y edita los conjuntos de anuncios de tus campañas.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/advertising/ads" className="col-span-1">
              <Card className="h-full hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">Anuncios</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Gestiona los anuncios individuales y sus creativos.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento de Campañas</CardTitle>
              <CardDescription>
                Esta sección está en desarrollo. Próximamente podrás ver
                gráficos de rendimiento de tus campañas.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <LineChart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Próximamente: Gráficos de rendimiento
                </p>
                <Button className="mt-4" variant="outline">
                  Ver datos en bruto
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Presupuesto</CardTitle>
              <CardDescription>
                Esta sección está en desarrollo. Próximamente podrás ver la
                distribución de tu presupuesto publicitario.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <PieChart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Próximamente: Gráficos de distribución
                </p>
                <Button className="mt-4" variant="outline">
                  Ver datos en bruto
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
