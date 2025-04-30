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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { safeQuery, safeInsert } from "@/lib/safe-query";

interface Server {
  id: string;
  name: string;
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

interface LeadDistribution {
  id: string;
  date: string;
  server_id: string;
  franchise_id: string;
  franchise_phone_id: string;
  leads_count: number;
  created_at: string;
  servers?: {
    name: string;
  };
  franchises?: {
    name: string;
  };
  franchise_phones?: {
    phone_number: string;
  };
}

export default function LeadDistributionPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [franchisePhones, setFranchisePhones] = useState<FranchisePhone[]>([]);
  const [distributions, setDistributions] = useState<LeadDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    server_id: "",
    franchise_id: "",
    franchise_phone_id: "",
    leads_count: 0,
    date: new Date().toISOString().split("T")[0],
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.franchise_id) {
      fetchFranchisePhones(formData.franchise_id);
    } else {
      setFranchisePhones([]);
    }
  }, [formData.franchise_id]);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch servers
      const serversData = await safeQuery<Server>("servers", {
        filters: [{ column: "is_active", value: true }],
        orderBy: { column: "name" },
      });

      // Fetch franchises
      const franchisesData = await safeQuery<Franchise>("franchises", {
        orderBy: { column: "name" },
      });

      // Fetch recent distributions
      const distributionsData = await safeQuery<LeadDistribution>(
        "lead_distributions",
        {
          relationships:
            "servers(name), franchises(name), franchise_phones(phone_number)",
          orderBy: { column: "created_at", ascending: false },
          limit: 10,
        }
      );

      setServers(serversData);
      setFranchises(franchisesData);
      setDistributions(distributionsData);
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

  async function fetchFranchisePhones(franchiseId: string) {
    try {
      const data = await safeQuery<FranchisePhone>("franchise_phones", {
        filters: [{ column: "franchise_id", value: franchiseId }],
        orderBy: { column: "order_number" },
      });

      setFranchisePhones(data);
    } catch (error) {
      console.error("Error fetching franchise phones:", error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await safeInsert("lead_distributions", formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Reset form and refresh data
      setFormData({
        server_id: "",
        franchise_id: "",
        franchise_phone_id: "",
        leads_count: 0,
        date: new Date().toISOString().split("T")[0],
      });
      fetchData();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Distribución de Leads</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Asignar Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="server_id">Servidor</Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("server_id", value)
                  }
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
                <Label htmlFor="franchise_id">Franquicia</Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("franchise_id", value)
                  }
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
                <Label htmlFor="franchise_phone_id">Teléfono</Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("franchise_phone_id", value)
                  }
                  disabled={franchisePhones.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un teléfono" />
                  </SelectTrigger>
                  <SelectContent>
                    {franchisePhones.map((phone) => (
                      <SelectItem key={phone.id} value={phone.id}>
                        {phone.phone_number} (#{phone.order_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leads_count">Cantidad de Leads</Label>
                <Input
                  id="leads_count"
                  name="leads_count"
                  type="number"
                  min="1"
                  value={formData.leads_count}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Asignando..." : "Asignar Leads"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center">Cargando distribuciones...</div>
            ) : distributions.length === 0 ? (
              <div className="text-center">No hay distribuciones recientes</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Servidor</TableHead>
                    <TableHead>Franquicia</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Leads</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributions.map((dist) => (
                    <TableRow key={dist.id}>
                      <TableCell>
                        {new Date(dist.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{dist.servers?.name}</TableCell>
                      <TableCell>{dist.franchises?.name}</TableCell>
                      <TableCell>
                        {dist.franchise_phones?.phone_number}
                      </TableCell>
                      <TableCell>{dist.leads_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
