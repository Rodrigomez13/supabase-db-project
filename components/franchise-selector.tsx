"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function FranchiseSelector() {
  const [franchises, setFranchises] = useState<any[]>([]);
  const [selectedFranchise, setSelectedFranchise] = useState<string | null>(
    null
  );
  const [franchiseName, setFranchiseName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadFranchises() {
      try {
        setLoading(true);

        // Cargar franquicias
        const { data: franchisesData, error: franchisesError } = await supabase
          .from("franchises")
          .select("id, name")
          .order("name");

        if (franchisesError) throw franchisesError;

        // Obtener preferencia del usuario
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          const { data: prefData } = await supabase
            .from("user_preferences")
            .select("selected_franchise_id")
            .eq("user_id", userData.user.id)
            .single();

          if (prefData?.selected_franchise_id) {
            setSelectedFranchise(prefData.selected_franchise_id);

            // Obtener nombre de la franquicia
            const franchise = franchisesData?.find(
              (f) => f.id === prefData.selected_franchise_id
            );
            if (franchise) {
              setFranchiseName(franchise.name);
            }
          }
        }

        setFranchises(franchisesData || []);
      } catch (error) {
        console.error("Error cargando franquicias:", error);
      } finally {
        setLoading(false);
      }
    }

    loadFranchises();
  }, [supabase]);

  const handleFranchiseChange = async (franchiseId: string) => {
    try {
      setSaving(true);
      setSelectedFranchise(franchiseId);

      // Actualizar nombre de la franquicia
      const franchise = franchises.find((f) => f.id === franchiseId);
      if (franchise) {
        setFranchiseName(franchise.name);
      }

      // Guardar preferencia del usuario
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        // Verificar si ya existe una preferencia
        const { data: existingPref } = await supabase
          .from("user_preferences")
          .select("id")
          .eq("user_id", userData.user.id)
          .single();

        if (existingPref) {
          // Actualizar preferencia existente
          await supabase
            .from("user_preferences")
            .update({ selected_franchise_id: franchiseId })
            .eq("user_id", userData.user.id);
        } else {
          // Crear nueva preferencia
          await supabase.from("user_preferences").insert({
            user_id: userData.user.id,
            selected_franchise_id: franchiseId,
          });
        }

        toast({
          title: "Franquicia actualizada",
          description: `Ahora estás derivando leads y conversiones a ${
            franchise?.name || franchiseId
          }`,
        });
      }
    } catch (error) {
      console.error("Error guardando franquicia:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la franquicia seleccionada",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Cargando franquicias...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="franchise-select" className="font-medium">
          Franquicia Activa para Derivación:
        </Label>
        {selectedFranchise && (
          <div className="flex items-center bg-[#133936] text-green-700 text-sm">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            <span>Activa</span>
          </div>
        )}
      </div>

      <Select
        value={selectedFranchise || ""}
        onValueChange={handleFranchiseChange}
        disabled={saving || franchises.length === 0}
      >
        <SelectTrigger id="franchise-select" className="w-full">
          <SelectValue placeholder="Seleccionar franquicia para derivación" />
        </SelectTrigger>
        <SelectContent>
          {franchises.map((franchise) => (
            <SelectItem key={franchise.id} value={franchise.id}>
              {franchise.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedFranchise && (
        <p className="text-sm text-green-700">
          Los nuevos leads y conversiones se asignarán automáticamente a{" "}
          <strong>{franchiseName}</strong>
        </p>
      )}
    </div>
  );
}
