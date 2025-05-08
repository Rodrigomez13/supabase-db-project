"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { updateServerFranchise } from "@/lib/queries/server-queries";
import type { Franchise, Server } from "@/types/lead-tracking";
import { Loader2, ArrowLeft, Check } from "lucide-react";

export default function AssignFranchisePage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.id as string;

  const [server, setServer] = useState<Server | null>(null);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentFranchiseName, setCurrentFranchiseName] = useState<
    string | null
  >(null);

  useEffect(() => {
    fetchData();
  }, [serverId]);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch server details
      const { data: serverData, error: serverError } = await supabase
        .from("servers")
        .select("id, name, default_franchise_id")
        .eq("id", serverId)
        .single();

      if (serverError) throw serverError;

      // Fetch franchises
      const { data: franchisesData, error: franchisesError } = await supabase
        .from("franchises")
        .select("id, name")
        .order("name");

      if (franchisesError) throw franchisesError;

      setServer(serverData);
      setFranchises(franchisesData || []);

      // Set the selected franchise if the server has a default franchise
      if (serverData?.default_franchise_id) {
        setSelectedFranchiseId(serverData.default_franchise_id);

        // Obtener el nombre de la franquicia actual
        const currentFranchise = franchisesData?.find(
          (f) => f.id === serverData.default_franchise_id
        );
        if (currentFranchise) {
          setCurrentFranchiseName(currentFranchise.name);
        }
      } else {
        setSelectedFranchiseId("none");
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description:
          "No se pudieron cargar los datos. Por favor, intenta de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const franchiseId =
        selectedFranchiseId === "none" ? null : selectedFranchiseId;
      const result = await updateServerFranchise(serverId, franchiseId);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Franquicia asignada",
        description: franchiseId
          ? "La franquicia predeterminada ha sido asignada correctamente al servidor."
          : "Se ha eliminado la asignación de franquicia predeterminada.",
      });

      // Redirect back to server details
      router.push(`/dashboard/servers/${serverId}`);
    } catch (error: any) {
      console.error("Error assigning franchise:", error);
      toast({
        title: "Error",
        description:
          error.message || "Ocurrió un error al asignar la franquicia.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-red-500">No se encontró el servidor</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/dashboard/servers")}
          >
            Volver a Servidores
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/servers/${serverId}`)}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">
          Asignar Franquicia Predeterminada
        </h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            Servidor: {server.name}
            {server.default_franchise_id && (
              <span className="ml-2 text-sm bg-green-500/20 text-green-500 px-2 py-1 rounded-full flex items-center">
                <Check className="h-3 w-3 mr-1" />
                Asignado
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Asigna una franquicia predeterminada a este servidor. Los leads y
            conversiones entrantes serán automáticamente asignados a esta
            franquicia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {currentFranchiseName && (
                <div className="bg-secondary/30 p-4 rounded-md">
                  <p className="text-sm font-medium">Franquicia actual:</p>
                  <p className="text-lg font-bold">{currentFranchiseName}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="franchise">Franquicia Predeterminada</Label>
                <Select
                  value={selectedFranchiseId}
                  onValueChange={setSelectedFranchiseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una franquicia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      Ninguna (sin asignación automática)
                    </SelectItem>
                    {franchises.map((franchise) => (
                      <SelectItem key={franchise.id} value={franchise.id}>
                        {franchise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-4 text-amber-500 text-sm">
                <p className="font-medium">Importante:</p>
                <p>
                  Al cambiar la franquicia predeterminada, todos los nuevos
                  leads y conversiones se asignarán automáticamente a esta
                  franquicia. Los registros existentes no se verán afectados.
                </p>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/servers/${serverId}`)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="min-w-[120px]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
