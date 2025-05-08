"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import {
  CalendarIcon,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ConversionsPage() {
  const [activeTab, setActiveTab] = useState("register");
  const [servers, setServers] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [franchisePhones, setFranchisePhones] = useState<any[]>([]);
  const [conversions, setConversions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedFranchise, setSelectedFranchise] = useState<any>(null);
  const [nextPhone, setNextPhone] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch servers
      const { data: serversData, error: serversError } = await supabase
        .from("servers")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (serversError) throw serversError;

      // Fetch franchises
      const { data: franchisesData, error: franchisesError } = await supabase
        .from("franchises")
        .select("id, name")
        .order("name");

      if (franchisesError) throw franchisesError;

      // Fetch recent conversions
      const { data: conversionsData, error: conversionsError } = await supabase
        .from("leads")
        .select(
          `
          id, date, franchise_id, franchise_phone_id, status, created_at,
          franchises (name),
          franchise_phones (phone_number),
          conversions (id, amount, description)
        `
        )
        .eq("status", "converted")
        .order("created_at", { ascending: false })
        .limit(50);

      if (conversionsError) throw conversionsError;

      // Obtener la franquicia seleccionada por el usuario
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        const { data: prefData, error: prefError } = await supabase
          .from("user_preferences")
          .select("selected_franchise_id")
          .eq("user_id", userData.user.id)
          .single();

        if (prefData && !prefError && prefData.selected_franchise_id) {
          // Obtener detalles de la franquicia
          const { data: franchiseData, error: franchiseError } = await supabase
            .from("franchises")
            .select("*")
            .eq("id", prefData.selected_franchise_id)
            .single();

          if (franchiseData && !franchiseError) {
            setSelectedFranchise(franchiseData);

            // Obtener teléfonos de la franquicia
            const { data: phonesData, error: phonesError } = await supabase
              .from("franchise_phones")
              .select("*")
              .eq("franchise_id", franchiseData.id)
              .eq("is_active", true)
              .order("order_number");

            if (phonesData && !phonesError) {
              setFranchisePhones(phonesData);

              // Determinar el próximo teléfono disponible
              await determineNextPhone(franchiseData.id);
            }
          }
        }
      }

      // Asignar los datos a los estados
      setServers(serversData || []);
      setFranchises(franchisesData || []);

      // Formatear las conversiones
      const formattedConversions = (conversionsData || []).map((lead) => {
        return {
          id: lead.id,
          date: lead.date,
          franchise: Array.isArray(lead.franchises) && lead.franchises.length > 0 ? lead.franchises[0].name : "N/A",
          phone: Array.isArray(lead.franchise_phones) && lead.franchise_phones.length > 0 ? lead.franchise_phones[0].phone_number : "N/A",
          amount: lead.conversions?.[0]?.amount || 0,
          description: lead.conversions?.[0]?.description || "",
          created_at: lead.created_at,
        };
      });

      setConversions(formattedConversions);
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

  async function determineNextPhone(franchiseId: string) {
    try {
      // Usar la función SQL para obtener el próximo teléfono disponible
      const { data, error } = await supabase.rpc("get_next_available_phone", {
        p_franchise_id: franchiseId,
      });

      if (error) throw error;

      if (data) {
        // Obtener los detalles del teléfono
        const { data: phoneData, error: phoneError } = await supabase
          .from("franchise_phones")
          .select("*")
          .eq("id", data)
          .single();

        if (phoneError) throw phoneError;

        setNextPhone(phoneData);
      } else {
        setNextPhone(null);
      }
    } catch (error: any) {
      console.error("Error determining next phone:", error);
      setNextPhone(null);
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData((prev) => ({
        ...prev,
        date: date.toISOString().split("T")[0],
      }));
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      amount: e.target.value,
    }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      description: e.target.value,
    }));
  };

  const handleSubmitConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      // Validar que haya una franquicia seleccionada
      if (!selectedFranchise) {
        throw new Error(
          "No hay franquicia seleccionada para distribución. Por favor, selecciona una en la página de servidores."
        );
      }

      // Validar que haya teléfonos disponibles
      if (!nextPhone) {
        throw new Error("No hay teléfonos disponibles para esta franquicia.");
      }

      // Validar el monto
      if (
        !formData.amount ||
        isNaN(Number(formData.amount)) ||
        Number(formData.amount) <= 0
      ) {
        throw new Error(
          "Por favor, ingresa un monto válido para la conversión."
        );
      }

      // Crear un nuevo lead para la franquicia seleccionada
      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .insert({
          server_id: servers[0]?.id, // Usar el primer servidor como predeterminado
          franchise_id: selectedFranchise.id,
          franchise_phone_id: nextPhone.id,
          status: "converted",
          date: formData.date,
        })
        .select();

      if (leadError) throw leadError;

      if (!leadData || leadData.length === 0) {
        throw new Error("No se pudo crear el lead");
      }

      // Registrar la conversión
      const { data: conversionData, error: conversionError } = await supabase
        .from("conversions")
        .insert({
          lead_id: leadData[0].id,
          amount: Number(formData.amount),
          description: formData.description,
        })
        .select();

      if (conversionError) throw conversionError;

      // Mostrar mensaje de éxito
      setSuccess(
        `Conversión registrada exitosamente. Asignada al teléfono: ${nextPhone.phone_number}`
      );

      // Resetear el formulario pero mantener la fecha
      setFormData({
        date: formData.date,
        amount: "",
        description: "",
      });

      // Actualizar el próximo teléfono disponible
      await determineNextPhone(selectedFranchise.id);

      // Recargar las conversiones
      fetchData();
    } catch (err: any) {
      console.error("Error submitting conversion:", err);
      setError(err.message || "Ocurrió un error al registrar la conversión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredConversions = conversions.filter((conversion) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      conversion.franchise.toLowerCase().includes(searchLower) ||
      conversion.phone.toLowerCase().includes(searchLower) ||
      (conversion.description &&
        conversion.description.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Registro de Conversiones</h1>
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

      <Tabs
        defaultValue="register"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="register">Registrar Conversión</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Registrar Conversión</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedFranchise ? (
                  <Alert className="mb-4 bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle>No hay franquicia seleccionada</AlertTitle>
                    <AlertDescription>
                      Selecciona una franquicia para distribución en la página
                      de servidores antes de registrar conversiones.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert className="mb-4 bg-blue-50 border-blue-200">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <AlertTitle>
                        Franquicia activa: {selectedFranchise.name}
                      </AlertTitle>
                      <AlertDescription>
                        Las conversiones se asignarán automáticamente al próximo
                        teléfono disponible.
                      </AlertDescription>
                    </Alert>

                    {nextPhone && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm font-medium text-green-800">
                          Próximo teléfono:
                        </p>
                        <p className="text-lg font-bold text-green-900">
                          {nextPhone.phone_number}
                        </p>
                        <p className="text-xs text-green-700">
                          Meta diaria: {nextPhone.daily_goal} conversiones
                        </p>
                      </div>
                    )}

                    {error && (
                      <Alert className="mb-4 bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert className="mb-4 bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle>Éxito</AlertTitle>
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}

                    <form
                      onSubmit={handleSubmitConversion}
                      className="space-y-4"
                    >
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
                          value={formData.amount}
                          onChange={handleAmountChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">
                          Descripción (opcional)
                        </Label>
                        <Input
                          id="description"
                          value={formData.description}
                          onChange={handleDescriptionChange}
                          placeholder="Detalles adicionales"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting || !nextPhone}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registrando...
                          </>
                        ) : (
                          "Registrar Conversión"
                        )}
                      </Button>
                    </form>
                  </>
                )}
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
                        <TableHead>Franquicia</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Descripción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredConversions.map((conversion) => (
                        <TableRow key={conversion.id}>
                          <TableCell>
                            {new Date(conversion.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{conversion.franchise}</TableCell>
                          <TableCell>{conversion.phone}</TableCell>
                          <TableCell>${conversion.amount.toFixed(2)}</TableCell>
                          <TableCell>{conversion.description || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Conversiones</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center">Cargando historial...</div>
              ) : filteredConversions.length === 0 ? (
                <div className="text-center">
                  No hay conversiones que coincidan con la búsqueda
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Franquicia</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Fecha de Registro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConversions.map((conversion) => (
                      <TableRow key={conversion.id}>
                        <TableCell>
                          {new Date(conversion.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{conversion.franchise}</TableCell>
                        <TableCell>{conversion.phone}</TableCell>
                        <TableCell>${conversion.amount.toFixed(2)}</TableCell>
                        <TableCell>{conversion.description || "-"}</TableCell>
                        <TableCell>
                          {new Date(conversion.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
