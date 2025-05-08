"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { safeQuery } from "@/lib/safe-query";
import { getFranchiseById } from "@/lib/queries/franchise-queries";
import {
  BarChart,
  LineChart,
  PieChart,
  Activity,
  TrendingUp,
  TrendingDown,
  Phone,
  MessageSquare,
  DollarSign,
} from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface FranchiseStats {
  total_leads: number;
  total_conversions: number;
  conversion_rate: number;
  total_spend: number;
  active_phones: number;
  inactive_phones: number;
}

export default function FranchiseDashboard() {
  const params = useParams();
  const franchiseId = params.id as string;
  const [franchise, setFranchise] = useState<any>(null);
  const [stats, setStats] = useState<FranchiseStats>({
    total_leads: 0,
    total_conversions: 0,
    conversion_rate: 0,
    total_spend: 0,
    active_phones: 0,
    inactive_phones: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  useEffect(() => {
    const loadFranchise = async () => {
      try {
        const franchiseData = await getFranchiseById(franchiseId);
        setFranchise(franchiseData);
      } catch (error) {
        console.error("Error loading franchise:", error);
      }
    };

    const loadStats = async () => {
      try {
        setLoading(true);

        // Cargar teléfonos para contar activos/inactivos
        const phones = await safeQuery("franchise_phones", {
          where: { franchise_id: franchiseId },
        });

        const activePhones = phones.filter(
          (phone: any) => phone.is_active
        ).length;
        const inactivePhones = phones.length - activePhones;

        // Cargar conversiones
        const conversions = await safeQuery("conversions", {
          where: { franchise_id: franchiseId },
        });

        // Cargar leads
        const leads = await safeQuery("leads", {
          where: { franchise_id: franchiseId },
        });

        // Calcular estadísticas
        const totalLeads = leads.length;
        const totalConversions = conversions.length;
        const conversionRate =
          totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;

        // Calcular gasto total (ejemplo)
        const totalSpend = conversions.reduce(
          (sum: number, conv: any) => sum + (conv.amount || 0),
          0
        );

        setStats({
          total_leads: totalLeads,
          total_conversions: totalConversions,
          conversion_rate: conversionRate,
          total_spend: totalSpend,
          active_phones: activePhones,
          inactive_phones: inactivePhones,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (franchiseId) {
      loadFranchise();
      loadStats();
    }
  }, [franchiseId, dateRange]);

  if (!franchise && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <p className="text-muted-foreground">Franquicia no encontrada</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Resumen</h1>
          <p className="text-muted-foreground">
            Vista general de la franquicia {franchise?.name || ""}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <DateRangePicker
            value={dateRange}
            onChange={(range: { from?: Date; to?: Date }) => {
              if (range?.from && range?.to) {
                setDateRange({ from: range.from, to: range.to });
              }
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="h-4 w-4 mr-2 text-primary" />
                Leads Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_leads}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                <span className="text-green-500">+12%</span> vs. período
                anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                Conversiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_conversions}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                <span className="text-green-500">+8%</span> vs. período anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-primary" />
                Gasto Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.total_spend.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingDown className="inline h-3 w-3 mr-1 text-red-500" />
                <span className="text-red-500">-3%</span> vs. período anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Phone className="h-4 w-4 mr-2 text-primary" />
                Teléfonos Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_phones}</div>
              <p className="text-xs text-muted-foreground">
                De un total de {stats.active_phones + stats.inactive_phones}{" "}
                teléfonos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-primary" />
              Conversiones por Día
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-muted/20 rounded-md">
                <p className="text-muted-foreground">
                  Gráfico de conversiones diarias
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-primary" />
              Distribución de Fuentes
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-muted/20 rounded-md">
                <p className="text-muted-foreground">
                  Gráfico de distribución de fuentes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <LineChart className="h-5 w-5 mr-2 text-primary" />
            Tendencia de Conversiones
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-muted/20 rounded-md">
              <p className="text-muted-foreground">
                Gráfico de tendencia de conversiones
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
