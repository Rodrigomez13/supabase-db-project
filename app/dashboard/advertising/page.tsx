"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  PlusIcon,
  BarChart3,
  Wallet,
  Users,
  Settings,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalSpend: number;
  totalLeads: number;
  totalConversions: number;
  costPerConversion: number;
  activeCampaigns: number;
  totalCampaigns: number;
  activeAdSets: number;
  totalAdSets: number;
  activeAds: number;
  totalAds: number;
}

interface TopAd {
  id: string;
  name: string;
  platform: string;
  spend: number;
  leads: number;
  conversions: number;
  cpc: number;
  status: string;
}

export default function AdvertisingDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSpend: 0,
    totalLeads: 0,
    totalConversions: 0,
    costPerConversion: 0,
    activeCampaigns: 0,
    totalCampaigns: 0,
    activeAdSets: 0,
    totalAdSets: 0,
    activeAds: 0,
    totalAds: 0,
  });
  const [topAds, setTopAds] = useState<TopAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      // Simulamos la obtención de datos del dashboard
      // En una implementación real, estos datos vendrían de Supabase

      // Obtener estadísticas de campañas
      const { data: campaignsData, error: campaignsError } = await supabase
        .from("campaigns")
        .select("id, status");

      if (campaignsError) throw campaignsError;

      // Obtener estadísticas de conjuntos de anuncios
      const { data: adSetsData, error: adSetsError } = await supabase
        .from("ad_sets")
        .select("id, status");

      if (adSetsError) throw adSetsError;

      // Obtener estadísticas de anuncios
      const { data: adsData, error: adsError } = await supabase
        .from("ads")
        .select("id, status");

      if (adsError) throw adsError;

      // Calcular estadísticas
      const activeCampaigns =
        campaignsData?.filter((c) => c.status === "active").length || 0;
      const activeAdSets =
        adSetsData?.filter((a) => a.status === "active").length || 0;
      const activeAds =
        adsData?.filter((a) => a.status === "active").length || 0;

      // Actualizar el estado con datos simulados
      setStats({
        totalSpend: 12458.75,
        totalLeads: 3245,
        totalConversions: 876,
        costPerConversion: 14.22,
        activeCampaigns,
        totalCampaigns: campaignsData?.length || 0,
        activeAdSets,
        totalAdSets: adSetsData?.length || 0,
        activeAds,
        totalAds: adsData?.length || 0,
      });

      // Datos simulados para los mejores anuncios
      setTopAds([
        {
          id: "1",
          name: "Promoción de Verano",
          platform: "Facebook",
          spend: 2345.67,
          leads: 543,
          conversions: 187,
          cpc: 12.54,
          status: "active",
        },
        {
          id: "2",
          name: "Oferta Especial",
          platform: "Instagram",
          spend: 1876.32,
          leads: 421,
          conversions: 156,
          cpc: 12.03,
          status: "active",
        },
        {
          id: "3",
          name: "Descuento Exclusivo",
          platform: "Facebook",
          spend: 1543.21,
          leads: 387,
          conversions: 132,
          cpc: 11.69,
          status: "active",
        },
        {
          id: "4",
          name: "Campaña de Navidad",
          platform: "Instagram",
          spend: 1234.56,
          leads: 298,
          conversions: 95,
          cpc: 13.0,
          status: "paused",
        },
        {
          id: "5",
          name: "Lanzamiento de Producto",
          platform: "Facebook",
          spend: 987.65,
          leads: 245,
          conversions: 78,
          cpc: 12.66,
          status: "active",
        },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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
            Resumen de tus campañas publicitarias y métricas
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/dashboard/advertising/campaigns/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva Campaña
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-32"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Gasto Total</CardDescription>
              <CardTitle className="text-2xl">
                ${stats.totalSpend.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Inversión total en publicidad
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Leads Generados</CardDescription>
              <CardTitle className="text-2xl">
                {stats.totalLeads.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Total de leads obtenidos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Conversiones</CardDescription>
              <CardTitle className="text-2xl">
                {stats.totalConversions.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Total de conversiones realizadas
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Costo por Conversión</CardDescription>
              <CardTitle className="text-2xl">
                ${stats.costPerConversion.toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Promedio de costo por conversión
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Campañas</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {stats.activeCampaigns}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                de {stats.totalCampaigns}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Campañas activas
            </p>
            <Link href="/dashboard/advertising/campaigns">
              <Button variant="outline" className="w-full">
                Ver campañas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Conjuntos de anuncios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {stats.activeAdSets}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                de {stats.totalAdSets}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Conjuntos activos
            </p>
            <Link href="/dashboard/advertising/ad-sets">
              <Button variant="outline" className="w-full">
                Ver conjuntos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Anuncios</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {stats.activeAds}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                de {stats.totalAds}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Anuncios activos
            </p>
            <Link href="/dashboard/advertising/ads">
              <Button variant="outline" className="w-full">
                Ver anuncios
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mejores Anuncios</CardTitle>
          <CardDescription>
            Los 5 anuncios con mejor rendimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Nombre</th>
                  <th className="text-left py-3 px-2">Plataforma</th>
                  <th className="text-right py-3 px-2">Gasto</th>
                  <th className="text-right py-3 px-2">Leads</th>
                  <th className="text-right py-3 px-2">Conversiones</th>
                  <th className="text-right py-3 px-2">CPC</th>
                  <th className="text-center py-3 px-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {topAds.map((ad) => (
                  <tr key={ad.id} className="border-b">
                    <td className="py-3 px-2 font-medium">{ad.name}</td>
                    <td className="py-3 px-2">{ad.platform}</td>
                    <td className="py-3 px-2 text-right">
                      ${ad.spend.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right">{ad.leads}</td>
                    <td className="py-3 px-2 text-right">{ad.conversions}</td>
                    <td className="py-3 px-2 text-right">
                      ${ad.cpc.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge
                        variant={
                          ad.status === "active" ? "success" : "secondary"
                        }
                      >
                        {ad.status === "active" ? "Activo" : "Pausado"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Link href="/dashboard/advertising/business-managers">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Gestionar Business Managers
                </Button>
              </Link>
              <Link href="/dashboard/advertising/wallets">
                <Button variant="outline" className="w-full justify-start">
                  <Wallet className="mr-2 h-4 w-4" />
                  Administrar Billeteras
                </Button>
              </Link>
              <Link href="/dashboard/advertising/import/ads">
                <Button variant="outline" className="w-full justify-start">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Importar Anuncios
                </Button>
              </Link>
              <Link href="/dashboard/advertising/register-activity">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Registrar Actividad
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Link href="/dashboard/advertising/portfolios">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Gestionar Portfolios
                </Button>
              </Link>
              <Link href="/dashboard/advertising/apis">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar APIs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
