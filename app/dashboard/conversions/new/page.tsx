"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function NewConversionPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [selectedFranchise, setSelectedFranchise] = useState<any>(null);
  const [nextPhone, setNextPhone] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    async function loadData() {
      try {
        // Obtener franquicia seleccionada
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          const { data: prefData, error: prefError } = await supabase
            .from("user_preferences")
            .select("selected_franchise_id")
            .eq("user_id", userData.user.id)
            .single();

          if (prefData?.selected_franchise_id) {
            // Obtener detalles de la franquicia
            const { data: franchiseData, error: franchiseError } =
              await supabase
                .from("franchises")
                .select("*")
                .eq("id", prefData.selected_franchise_id)
                .single();

            if (franchiseData && !franchiseError) {
              setSelectedFranchise(franchiseData);

              // Determinar próximo teléfono
              await determineNextPhone(franchiseData.id);
            }
          }
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos necesarios",
          variant: "destructive",
        });
      }
    }

    loadData();
  }, [supabase]);

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
    } catch (error) {
      console.error("Error determinando próximo teléfono:", error);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFranchise) {
      toast({
        title: "Error",
        description: "Debes seleccionar una franquicia para derivación primero",
        variant: "destructive",
      });
      return;
    }

    if (!nextPhone) {
      toast({
        title: "Error",
        description:
          "No hay teléfonos disponibles para la franquicia seleccionada",
        variant: "destructive",
      });
      return;
    }

    if (
      !formData.amount ||
      isNaN(Number(formData.amount)) ||
      Number(formData.amount) <= 0
    ) {
      toast({
        title: "Error",
        description: "Debes ingresar un monto válido",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Crear el lead convertido
      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .insert({
          franchise_id: selectedFranchise.id,
          franchise_phone_id: nextPhone.id,
          date: formData.date,
          status: "converted",
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

      toast({
        title: "Conversión registrada",
        description: `Conversión asignada a la franquicia ${selectedFranchise.name} y al teléfono ${nextPhone.phone_number}`,
      });

      router.push("/dashboard/conversions");
    } catch (error: any) {
      console.error("Error creando conversión:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar la conversión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Nueva Conversión</h1>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Nueva Conversión</CardTitle>
          <CardDescription>
            Ingresa los datos de la nueva conversión
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedFranchise ? (
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle>No hay franquicia seleccionada</AlertTitle>
              <AlertDescription>
                Selecciona una franquicia para derivación en el Dashboard antes
                de registrar una conversión.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>
                Franquicia seleccionada: {selectedFranchise.name}
              </AlertTitle>
              <AlertDescription>
                {nextPhone ? (
                  <>
                    La conversión será asignada al teléfono:{" "}
                    <strong>{nextPhone.phone_number}</strong>
                  </>
                ) : (
                  "No hay teléfonos disponibles para esta franquicia"
                )}
              </AlertDescription>
            </Alert>
          )}

          {nextPhone && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-800">
                Teléfono seleccionado:
              </p>
              <p className="text-lg font-bold text-blue-900">
                {nextPhone.phone_number}
              </p>
              <p className="text-xs text-blue-700">
                Meta diaria: {nextPhone.daily_goal} conversiones
              </p>
            </div>
          )}

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
              <Label htmlFor="amount">Monto ($)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !selectedFranchise || !nextPhone}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar Conversión"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
