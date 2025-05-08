"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { useRouter } from "next/navigation";
import { safeQuery, safeInsert } from "@/lib/safe-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface Server {
  id: string;
  name: string;
  default_franchise_id?: string;
}

interface Franchise {
  id: string;
  name: string;
}

interface FranchisePhone {
  id: string;
  franchise_id: string;
  phone_number: string;
  order_number: number;
}

export default function AssignLeadsPage() {
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [phones, setPhones] = useState<FranchisePhone[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [serverId, setServerId] = useState<string>("");
  const [franchiseId, setFranchiseId] = useState<string>("");
  const [phoneId, setPhoneId] = useState<string>("");
  const [leadsCount, setLeadsCount] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (serverId) {
      // Buscar el servidor seleccionado
      const selectedServer = servers.find((s) => s.id === serverId);

      // Si el servidor tiene una franquicia por defecto, seleccionarla
      if (selectedServer?.default_franchise_id) {
        setFranchiseId(selectedServer.default_franchise_id);
      }
    }
  }, [serverId, servers]);

  useEffect(() => {
    if (franchiseId) {
      fetchPhones(franchiseId);
    } else {
      setPhones([]);
      setPhoneId("");
    }
  }, [franchiseId]);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch servers
      const serversData = await safeQuery<Server>("servers", {
        where: { is_active: true },
        orderBy: { column: "name" },
      });

      // Fetch franchises
      const franchisesData = await safeQuery<Franchise>("franchises", {
        orderBy: { column: "name" },
      });

      setServers(serversData);
      setFranchises(franchisesData);
      setError(null);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(
        "No se pudieron cargar los datos. Por favor, intenta de nuevo más tarde."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchPhones(franchiseId: string) {
    try {
      // Fetch phones for the selected franchise
      const { data, error } = await supabase
        .from("franchise_phones")
        .select("*")
        .eq("franchise_id", franchiseId)
        .order("order_number");

      if (error) throw error;

      setPhones(data || []);

      // Si hay teléfonos, seleccionar el primero por defecto
      if (data && data.length > 0) {
        setPhoneId(data[0].id);
      } else {
        setPhoneId("");
      }
    } catch (error) {
      console.error("Error fetching phones:", error);
      setPhones([]);
      setPhoneId("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!serverId || !franchiseId || !phoneId || leadsCount <= 0) {
      setError("Por favor, completa todos los campos requeridos.");
      return;
    }

    try {
      setSubmitting(true);

      // Formatear la fecha para la base de datos
      const formattedDate = (date ?? new Date()).toISOString().split("T")[0];

      // Insertar la distribución
      const result = await safeInsert("lead_distributions", {
        date: formattedDate,
        server_id: serverId,
        franchise_id: franchiseId,
        franchise_phone_id: phoneId,
        leads_count: leadsCount,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Distribución creada",
        description: "La distribución de leads se ha registrado correctamente.",
      });

      // Redirigir a la página de distribuciones
      router.push("/dashboard/advertising/distribution");
    } catch (error: any) {
      console.error("Error creating distribution:", error);
      setError(
        `Error al crear la distribución: ${
          error.message || "Error desconocido"
        }`
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Asignar Leads</h1>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/advertising/distribution")}
        >
          Volver
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Formulario de Asignación</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Cargando datos...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <DatePicker date={date} setDate={setDate} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="server">Servidor</Label>
                  <Select value={serverId} onValueChange={setServerId} required>
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
                  <Label htmlFor="franchise">Franquicia</Label>
                  <Select
                    value={franchiseId}
                    onValueChange={setFranchiseId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una franquicia" />
                    </SelectTrigger>
                    <SelectContent>
                      {franchises.map((franchise) => (
                        <SelectItem key={franchise.id} value={franchise.id}>
                          {franchise.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Select
                    value={phoneId}
                    onValueChange={setPhoneId}
                    required
                    disabled={phones.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          phones.length === 0
                            ? "No hay teléfonos disponibles"
                            : "Selecciona un teléfono"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {phones.map((phone) => (
                        <SelectItem key={phone.id} value={phone.id}>
                          {phone.phone_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leads-count">Cantidad de Leads</Label>
                  <Input
                    id="leads-count"
                    type="number"
                    min="1"
                    value={leadsCount || ""}
                    onChange={(e) =>
                      setLeadsCount(Number.parseInt(e.target.value) || 0)
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Guardando..." : "Guardar Distribución"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
