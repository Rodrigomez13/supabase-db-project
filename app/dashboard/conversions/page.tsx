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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { safeQuery, safeInsert } from "@/lib/safe-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface Conversion {
  id: string;
  date: string;
  server_id: string;
  franchise_id: string;
  franchise_phone_id: string;
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

export default function ConversionsPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [franchisePhones, setFranchisePhones] = useState<FranchisePhone[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    server_id: "",
    franchise_id: "",
    franchise_phone_id: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

      // Fetch active servers
      const serversData = await safeQuery<Server>("servers", {
        where: { is_active: true },
        orderBy: { column: "name" },
      });

      // Fetch franchises
      const franchisesData = await safeQuery<Franchise>("franchises", {
        orderBy: { column: "name" },
      });

      // Fetch recent conversions
      const conversionsData = await safeQuery<Conversion>("conversions", {
        relationships:
          "servers(name), franchises(name), franchise_phones(phone_number)",
        orderBy: { column: "created_at", ascending: false },
        limit: 10,
      });

      setServers(serversData);
      setFranchises(franchisesData);
      setConversions(conversionsData);
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
        where: {
          franchise_id: franchiseId,
          is_active: true,
        },
        orderBy: { column: "order_number" },
      });

      setFranchisePhones(data);
    } catch (error) {
      console.error("Error fetching franchise phones:", error);
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData((prev) => ({
        ...prev,
        date: date.toISOString().split("T")[0],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await safeInsert("conversions", formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Reset form and refresh data
      setFormData({
        server_id: "",
        franchise_id: "",
        franchise_phone_id: "",
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
      <h1 className="text-3xl font-bold">Registro de Conversiones</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Registrar Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Registrando..." : "Registrar Conversión"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversiones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center">Cargando conversiones...</div>
            ) : conversions.length === 0 ? (
              <div className="text-center">No hay conversiones recientes</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Servidor</TableHead>
                    <TableHead>Franquicia</TableHead>
                    <TableHead>Teléfono</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversions.map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell>
                        {new Date(conv.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{conv.servers?.name}</TableCell>
                      <TableCell>{conv.franchises?.name}</TableCell>
                      <TableCell>
                        {conv.franchise_phones?.phone_number}
                      </TableCell>
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
