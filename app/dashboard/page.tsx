"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { getAllActiveServersDailyMetrics } from "@/lib/queries/server-queries";
import { ActivityFeed } from "@/components/activity-feed";

interface DashboardMetrics {
  leads: number;
  conversions: number;
  conversion_rate: number;
  spend: number;
  cost_per_lead: number;
  cost_per_conversion: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateString, setDateString] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        // Cargar métricas diarias de todos los servidores activos
        const metricsData = await getAllActiveServersDailyMetrics(dateString);
        setMetrics(metricsData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [dateString]);

  // Función para manejar el cambio de fecha
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setDateString(date.toISOString().split("T")[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-usina-text-primary">
          Dashboard
        </h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(selectedDate, "dd/MM/yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-usina-card bg-background/5">
              <CardHeader className="pb-2">
                <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-usina-card bg-background/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-usina-text-primary">
                Leads Generados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-usina-text-primary">
                {metrics?.leads || 0}
              </div>
              <p className="text-xs text-usina-text-secondary mt-1">
                {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es })}
              </p>
            </CardContent>
          </Card>
          <Card className="border-usina-card bg-background/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-usina-text-primary">
                Conversiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-usina-text-primary">
                {metrics?.conversions || 0}
              </div>
              <p className="text-xs text-usina-text-secondary mt-1">
                {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es })}
              </p>
            </CardContent>
          </Card>
          <Card className="border-usina-card bg-background/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-usina-text-primary">
                Tasa de Conversión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-usina-text-primary">
                {metrics?.conversion_rate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-usina-text-secondary mt-1">
                {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es })}
              </p>
            </CardContent>
          </Card>
          <Card className="border-usina-card bg-background/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-usina-text-primary">
                Costo por Conversión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-usina-text-primary">
                ${metrics?.cost_per_conversion?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-usina-text-secondary mt-1">
                {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Actividad Reciente</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="space-y-4">
          <ActivityFeed activities={[]} />
        </TabsContent>
        <TabsContent value="performance" className="space-y-4">
          <Card className="border-usina-card bg-background/5">
            <CardHeader>
              <CardTitle className="text-usina-text-primary">
                Métricas de Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-usina-text-secondary">
                    Gasto Total
                  </h3>
                  <p className="text-2xl font-bold text-usina-text-primary">
                    ${metrics?.spend?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-usina-text-secondary">
                    Costo por Lead
                  </h3>
                  <p className="text-2xl font-bold text-usina-text-primary">
                    ${metrics?.cost_per_lead?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-usina-text-secondary">
                    Costo por Conversión
                  </h3>
                  <p className="text-2xl font-bold text-usina-text-primary">
                    ${metrics?.cost_per_conversion?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
