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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

export default function NewLeadPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [servers, setServers] = useState<any[]>([]);
  const [selectedFranchise, setSelectedFranchise] = useState<any>(null);
  const [nextPhone, setNextPhone] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    server_id: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        // Cargar servidores
        const { data: serversData, error: serversError } = await supabase
          .from("servers")
          .select("id, name")
          .eq("is_active", true)
          .order("name");

        if (serversError) throw serversError;
        setServers(serversData || []);

        if (serversData && serversData.length > 0) {
          setFormData((prev) => ({ ...prev, server_id: serversData[0].id }));
        }

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServerChange = (value: string) => {
    setFormData((prev) => ({ ...prev, server_id: value }));
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

    try {
      setLoading(true);

      // Crear el lead
      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .insert({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          notes: formData.notes,
          server_id: formData.server_id,
          franchise_id: selectedFranchise.id,
          franchise_phone_id: nextPhone.id,
          date: new Date().toISOString().split("T")[0],
          status: "Pendiente",
        })
        .select();

      if (leadError) throw leadError;

      toast({
        title: "Lead creado",
        description: `Lead asignado a la franquicia ${selectedFranchise.name} y al teléfono ${nextPhone.phone_number}`,
      });

      router.push("/dashboard/leads");
    } catch (error: any) {
      console.error("Error creando lead:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el lead",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Nuevo Lead</h1>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Nuevo Lead</CardTitle>
          <CardDescription>Ingresa los datos del nuevo lead</CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedFranchise ? (
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle>No hay franquicia seleccionada</AlertTitle>
              <AlertDescription>
                Selecciona una franquicia para derivación en el Dashboard antes
                de crear un lead.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>
                Franquicia seleccionada: {selectedFranchise.name}
              </AlertTitle>
              <AlertDescription>
                {nextPhone ? (
                  <>
                    El lead será asignado al teléfono:{" "}
                    <strong>{nextPhone.phone_number}</strong>
                  </>
                ) : (
                  "No hay teléfonos disponibles para esta franquicia"
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="server_id">Servidor</Label>
              <Select
                value={formData.server_id}
                onValueChange={handleServerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servidor" />
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
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
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
                  Creando...
                </>
              ) : (
                "Crear Lead"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
