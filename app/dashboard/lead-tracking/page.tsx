"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import type {
  Server,
  Franchise,
  FranchisePhone,
  Lead,
  Conversion,
  LeadStatus,
} from "@/types/lead-tracking";

export default function LeadTrackingPage() {
  const [activeTab, setActiveTab] = useState("leads");
  const [servers, setServers] = useState<Server[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [franchisePhones, setFranchisePhones] = useState<FranchisePhone[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [leadFormData, setLeadFormData] = useState({
    server_id: "",
    franchise_id: "",
    franchise_phone_id: "",
    status: "pending" as LeadStatus,
    date: new Date().toISOString().split("T")[0],
  });
  const [conversionFormData, setConversionFormData] = useState({
    lead_id: "",
    date: new Date().toISOString().split("T")[0],
    amount: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableLeads, setAvailableLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (leadFormData.server_id) {
      // Buscar la franquicia predeterminada del servidor seleccionado
      const selectedServer = servers.find(
        (server) => server.id === leadFormData.server_id
      );
      if (
        selectedServer &&
        selectedServer.default_franchise_id &&
        selectedServer.default_franchise_id !== leadFormData.franchise_id
      ) {
        // Actualizar la franquicia seleccionada con la predeterminada del servidor
        setLeadFormData((prev) => ({
          ...prev,
          franchise_id: selectedServer.default_franchise_id || "",
        }));

        // Si hay una franquicia predeterminada, cargar sus teléfonos
        if (selectedServer.default_franchise_id) {
          fetchFranchisePhones(selectedServer.default_franchise_id);
        }
      }
    }
  }, [leadFormData.server_id, servers]);

  useEffect(() => {
    if (leadFormData.franchise_id) {
      fetchFranchisePhones(leadFormData.franchise_id);
    } else {
      setFranchisePhones([]);
    }
  }, [leadFormData.franchise_id]);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch servers with default_franchise_id
      const { data: serversData, error: serversError } = await supabase
        .from("servers")
        .select("id, name, default_franchise_id")
        .eq("is_active", true)
        .order("name");

      if (serversError) throw serversError;

      // Fetch franchises
      const { data: franchisesData, error: franchisesError } = await supabase
        .from("franchises")
        .select("id, name")
        .order("name");

      if (franchisesError) throw franchisesError;

      // Fetch recent leads
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select(
          `
          id, date, server_id, franchise_id, franchise_phone_id, status, created_at,
          servers: name,
          franchises: name,
          franchise_phones: phone_number
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (leadsError) throw leadsError;

      // Fetch recent conversions
      const { data: conversionsData, error: conversionsError } = await supabase
        .from("conversions")
        .select(
          `
          id, lead_id, date, amount, created_at,
          leads (
            servers: name,
            franchises: name,
            franchise_phones: phone_number
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (conversionsError) throw conversionsError;

      // Fetch available leads for conversion
      const { data: availableLeadsData, error: availableLeadsError } =
        await supabase
          .from("leads")
          .select(
            `
            id, date, server_id, franchise_id, franchise_phone_id, status, created_at,
            servers (name),
            franchises (name),
            franchise_phones (phone_number)
          `
          )
          .eq("status", "pending")
          .order("created_at", { ascending: false });

      if (availableLeadsError) throw availableLeadsError;

      // Asignar los datos a los estados
      setServers(serversData || []);
      setFranchises(franchisesData || []);
      setLeads(leadsData || []);
      setConversions(
        (conversionsData || []).map((conversion) => ({
          ...conversion,
          leads: {
            servers: conversion.leads?.[0]?.servers ?? { name: "" },
            franchises: conversion.leads?.[0]?.franchises ?? { name: "" },
            franchise_phones: conversion.leads?.[0]?.franchise_phones ?? {
              phone_number: "",
            },
          },
        }))
      );
      setAvailableLeads(
        (availableLeadsData || []).map((lead) => ({
          ...lead,
          servers: lead.servers?.[0] ?? { name: "" },
          franchises: lead.franchises?.[0] ?? { name: "" },
          franchise_phones: lead.franchise_phones?.[0] ?? { phone_number: "" },
        }))
      );
      setError(null);
    } catch (error: any) {
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
      const { data, error } = await supabase
        .from("franchise_phones")
        .select("id, franchise_id, phone_number, order_number")
        .eq("franchise_id", franchiseId)
        .order("order_number");

      if (error) throw error;

      if (data && data.length > 0) {
        setFranchisePhones(data);
        // Si hay teléfonos disponibles, seleccionar el primero automáticamente
        setLeadFormData((prev) => ({
          ...prev,
          franchise_phone_id: data[0].id,
        }));
      } else {
        setFranchisePhones([]);
        setLeadFormData((prev) => ({
          ...prev,
          franchise_phone_id: "",
        }));
      }
    } catch (error: any) {
      console.error("Error fetching franchise phones:", error);
      toast({
        title: "Error",
        description: `No se pudieron cargar los teléfonos: ${error.message}`,
        variant: "destructive",
      });
    }
  }

  const handleLeadSelectChange = (name: string, value: string) => {
    setLeadFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConversionSelectChange = (name: string, value: string) => {
    setConversionFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      if (activeTab === "leads") {
        setLeadFormData((prev) => ({
          ...prev,
          date: date.toISOString().split("T")[0],
        }));
      } else {
        setConversionFormData((prev) => ({
          ...prev,
          date: date.toISOString().split("T")[0],
        }));
      }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConversionFormData((prev) => ({
      ...prev,
      amount: Number(e.target.value) || 0,
    }));
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validar que se hayan seleccionado todos los campos requeridos
      if (
        !leadFormData.server_id ||
        !leadFormData.franchise_id ||
        !leadFormData.franchise_phone_id
      ) {
        throw new Error("Por favor, completa todos los campos requeridos");
      }

      // Insertar el nuevo lead
      const { data, error } = await supabase
        .from("leads")
        .insert({
          server_id: leadFormData.server_id,
          franchise_id: leadFormData.franchise_id,
          franchise_phone_id: leadFormData.franchise_phone_id,
          status: leadFormData.status,
          date: leadFormData.date,
        })
        .select();

      if (error) throw error;

      // Mostrar mensaje de éxito
      toast({
        title: "Lead registrado",
        description: "El lead ha sido registrado correctamente",
      });

      // Resetear el formulario
      setLeadFormData({
        server_id: "",
        franchise_id: "",
        franchise_phone_id: "",
        status: "pending",
        date: new Date().toISOString().split("T")[0],
      });

      // Recargar los datos
      fetchData();
    } catch (err: any) {
      console.error("Error submitting lead:", err);
      toast({
        title: "Error",
        description: err.message || "Ocurrió un error al registrar el lead",
        variant: "destructive",
      });
      setError(err.message || "Ocurrió un error al registrar el lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validar que se hayan seleccionado todos los campos requeridos
      if (!conversionFormData.lead_id || conversionFormData.amount <= 0) {
        throw new Error("Por favor, completa todos los campos requeridos");
      }

      // 1. Insertar la conversión
      const { data, error } = await supabase
        .from("conversions")
        .insert({
          lead_id: conversionFormData.lead_id,
          date: conversionFormData.date,
          amount: conversionFormData.amount,
        })
        .select();

      if (error) throw error;

      // 2. Actualizar el estado del lead a "converted"
      const { error: updateError } = await supabase
        .from("leads")
        .update({ status: "converted" })
        .eq("id", conversionFormData.lead_id);

      if (updateError) throw updateError;

      // Mostrar mensaje de éxito
      toast({
        title: "Conversión registrada",
        description: "La conversión ha sido registrada correctamente",
      });

      // Resetear el formulario
      setConversionFormData({
        lead_id: "",
        date: new Date().toISOString().split("T")[0],
        amount: 0,
      });

      // Recargar los datos
      fetchData();
    } catch (err: any) {
      console.error("Error submitting conversion:", err);
      toast({
        title: "Error",
        description:
          err.message || "Ocurrió un error al registrar la conversión",
        variant: "destructive",
      });
      setError(err.message || "Ocurrió un error al registrar la conversión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (lead.servers?.name ?? "").toLowerCase().includes(searchLower) ||
      (lead.franchises?.name ?? "").toLowerCase().includes(searchLower) ||
      (lead.franchise_phones?.phone_number ?? "")
        .toLowerCase()
        .includes(searchLower) ||
      (lead.status ?? "").toLowerCase().includes(searchLower)
    );
  });

  const filteredConversions = conversions.filter((conversion) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (conversion.leads?.servers?.name ?? "")
        .toLowerCase()
        .includes(searchLower) ||
      (conversion.leads?.franchises?.name ?? "")
        .toLowerCase()
        .includes(searchLower) ||
      (conversion.leads?.franchise_phones?.phone_number ?? "")
        .toLowerCase()
        .includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Seguimiento de Leads</h1>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <Tabs
        defaultValue="leads"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="conversions">Conversiones</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Registrar Lead</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitLead} className="space-y-4">
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
                      value={leadFormData.server_id}
                      onValueChange={(value) =>
                        handleLeadSelectChange("server_id", value)
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
                      value={leadFormData.franchise_id}
                      onValueChange={(value) =>
                        handleLeadSelectChange("franchise_id", value)
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
                      value={leadFormData.franchise_phone_id}
                      onValueChange={(value) =>
                        handleLeadSelectChange("franchise_phone_id", value)
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
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={leadFormData.status}
                      onValueChange={(value) =>
                        handleLeadSelectChange("status", value as LeadStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="contacted">Contactado</SelectItem>
                        <SelectItem value="converted">Convertido</SelectItem>
                        <SelectItem value="lost">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Registrando..." : "Registrar Lead"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Leads Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center">Cargando leads...</div>
                ) : filteredLeads.length === 0 ? (
                  <div className="text-center">
                    No hay leads que coincidan con la búsqueda
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Servidor</TableHead>
                        <TableHead>Franquicia</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            {new Date(lead.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{lead.servers?.name ?? ""}</TableCell>
                          <TableCell>{lead.franchises?.name ?? ""}</TableCell>
                          <TableCell>
                            {lead.franchise_phones?.phone_number ?? ""}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              let variant: string;
                              let label: string;

                              switch (lead.status) {
                                case "converted":
                                  variant = "default"; // Map "success" to "default"
                                  label = "Convertido";
                                  break;
                                case "lost":
                                  variant = "destructive";
                                  label = "Perdido";
                                  break;
                                case "contacted":
                                  variant = "secondary"; // Map "warning" to "secondary"
                                  label = "Contactado";
                                  break;
                                default:
                                  variant = "default";
                                  label = "Pendiente";
                              }

                              const statusProps = (() => {
                                switch (lead.status) {
                                  case "converted":
                                    return {
                                      status: "converted",
                                      variant: "default",
                                      label: "Convertido",
                                    };
                                  case "lost":
                                    return {
                                      status: "lost",
                                      variant: "destructive",
                                      label: "Perdido",
                                    };
                                  case "contacted":
                                    return {
                                      status: "contacted",
                                      variant: "secondary",
                                      label: "Contactado",
                                    };
                                  default:
                                    return {
                                      status: "pending",
                                      variant: "default",
                                      label: "Pendiente",
                                    };
                                }
                              })();

                              return <StatusBadge {...statusProps} />;
                            })()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Registrar Conversión</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitConversion} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lead_id">Lead</Label>
                    <Select
                      value={conversionFormData.lead_id}
                      onValueChange={(value) =>
                        handleConversionSelectChange("lead_id", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un lead" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLeads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.franchises?.name ?? ""} -{" "}
                            {lead.franchise_phones?.phone_number ?? ""} (
                            {new Date(lead.date).toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha de Conversión</Label>
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
                    <Label htmlFor="amount">Monto ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={conversionFormData.amount}
                      onChange={handleAmountChange}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Registrando..." : "Registrar Conversión"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Conversiones Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center">Cargando conversiones...</div>
                ) : filteredConversions.length === 0 ? (
                  <div className="text-center">
                    No hay conversiones que coincidan con la búsqueda
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Servidor</TableHead>
                        <TableHead>Franquicia</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredConversions.map((conversion) => (
                        <TableRow key={conversion.id}>
                          <TableCell>
                            {new Date(conversion.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {conversion.leads?.servers?.name ?? ""}
                          </TableCell>
                          <TableCell>
                            {conversion.leads?.franchises?.name ?? ""}
                          </TableCell>
                          <TableCell>
                            {conversion.leads?.franchise_phones?.phone_number ??
                              ""}
                          </TableCell>
                          <TableCell>${conversion.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
