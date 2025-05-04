"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { safeQuery } from "@/lib/safe-query";
import { supabase } from "@/lib/supabase";

interface Server {
  id: string;
  name: string;
}

interface Ad {
  id: string;
  name: string;
  ad_id: string;
  adset_id: string;
}

interface ActivityRecord {
  id: string;
  server_id: string;
  ad_id: string;
  leads: number;
  loads: number;
  spent: number;
  date: string;
  servers: { name: string };
  ads: { name: string };
}

export default function RegisterActivityPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [activityHistory, setActivityHistory] = useState<ActivityRecord[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [selectedAd, setSelectedAd] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Formulario para registrar actividad
  const [formData, setFormData] = useState({
    leads: 0,
    loads: 0,
    spent: 0,
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchServers();
    fetchAds();
    fetchActivityHistory();
  }, []);

  async function fetchServers() {
    try {
      const data = await safeQuery<Server>("servers", {
        select: "id, name",
        filter: { column: "is_active", operator: "eq", value: true },
        orderBy: { column: "name" },
      });
      setServers(data || []);
    } catch (error) {
      console.error("Error fetching servers:", error);
    }
  }

  async function fetchAds() {
    try {
      const data = await safeQuery<Ad>("ads", {
        select: "id, name, ad_id, adset_id",
        orderBy: { column: "name" },
      });
      setAds(data || []);
    } catch (error) {
      console.error("Error fetching ads:", error);
    }
  }

  async function fetchActivityHistory() {
    try {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from("server_ads")
        .select(
          `
          id, 
          server_id, 
          ad_id, 
          leads, 
          loads, 
          spent, 
          date,
          servers(name),
          ads(name)
        `
        )
        .order("date", { ascending: false })
        .limit(20);

      if (error) throw error;

      setActivityHistory(data || []);
    } catch (error) {
      console.error("Error fetching activity history:", error);
    } finally {
      setHistoryLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "date" ? value : Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!selectedServer || !selectedAd) {
        throw new Error("Debes seleccionar un servidor y un anuncio");
      }

      // Insertar directamente con supabase para obtener mejor manejo de errores
      const { data, error } = await supabase
        .from("server_ads")
        .insert({
          server_id: selectedServer,
          ad_id: selectedAd,
          leads: formData.leads,
          loads: formData.loads,
          spent: formData.spent,
          date: formData.date,
        })
        .select();

      if (error) {
        throw new Error(`Error al registrar la actividad: ${error.message}`);
      }

      setSuccess("Actividad registrada correctamente");

      // Resetear formulario
      setFormData({
        leads: 0,
        loads: 0,
        spent: 0,
        date: new Date().toISOString().split("T")[0],
      });

      // Actualizar historial
      fetchActivityHistory();
    } catch (err: any) {
      setError(err.message || "Error al registrar la actividad");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 text-usina-text-primary">
        Registrar Actividad Publicitaria
      </h1>

      <Tabs defaultValue="register">
        <TabsList className="mb-4">
          <TabsTrigger value="register">Registrar Actividad</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <Card className="border-usina-card bg-background/5">
            <CardHeader>
              <CardTitle className="text-usina-text-primary">
                Registrar Leads, Cargas y Gastos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="server" className="text-usina-text-primary">
                      Servidor
                    </Label>
                    <Select
                      value={selectedServer}
                      onValueChange={setSelectedServer}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un servidor" />
                      </SelectTrigger>
                      <SelectContent>
                        {servers.map((server) => (
                          <SelectItem key={server.id} value={server.id}>
                            {server.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ad" className="text-usina-text-primary">
                      Anuncio
                    </Label>
                    <Select value={selectedAd} onValueChange={setSelectedAd}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un anuncio" />
                      </SelectTrigger>
                      <SelectContent>
                        {ads.map((ad) => (
                          <SelectItem key={ad.id} value={ad.id}>
                            {ad.name} {ad.ad_id ? `(${ad.ad_id})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leads" className="text-usina-text-primary">
                      Leads Generados
                    </Label>
                    <Input
                      id="leads"
                      name="leads"
                      type="number"
                      min="0"
                      value={formData.leads}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loads" className="text-usina-text-primary">
                      Cargas
                    </Label>
                    <Input
                      id="loads"
                      name="loads"
                      type="number"
                      min="0"
                      value={formData.loads}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spent" className="text-usina-text-primary">
                      Gasto ($)
                    </Label>
                    <Input
                      id="spent"
                      name="spent"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.spent}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-usina-text-primary">
                      Fecha
                    </Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 border-green-200 text-green-800">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Registrando..." : "Registrar Actividad"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-usina-card bg-background/5">
            <CardHeader>
              <CardTitle className="text-usina-text-primary">
                Historial de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-4 text-usina-text-secondary">
                  Cargando historial...
                </div>
              ) : activityHistory.length === 0 ? (
                <div className="text-center py-4 text-usina-text-secondary">
                  No hay registros de actividad
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-usina-text-secondary">
                          Fecha
                        </TableHead>
                        <TableHead className="text-usina-text-secondary">
                          Servidor
                        </TableHead>
                        <TableHead className="text-usina-text-secondary">
                          Anuncio
                        </TableHead>
                        <TableHead className="text-usina-text-secondary">
                          Leads
                        </TableHead>
                        <TableHead className="text-usina-text-secondary">
                          Cargas
                        </TableHead>
                        <TableHead className="text-usina-text-secondary">
                          Gasto
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-usina-text-primary">
                            {new Date(record.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-usina-text-primary">
                            {record.servers?.name || "Desconocido"}
                          </TableCell>
                          <TableCell className="text-usina-text-primary">
                            {record.ads?.name || "Desconocido"}
                          </TableCell>
                          <TableCell className="text-usina-text-primary">
                            {record.leads}
                          </TableCell>
                          <TableCell className="text-usina-text-primary">
                            {record.loads}
                          </TableCell>
                          <TableCell className="text-usina-text-primary">
                            ${record.spent.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
