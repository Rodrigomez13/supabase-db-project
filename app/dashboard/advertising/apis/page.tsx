"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface Api {
  id: string;
  name: string;
  url: string;
  api_key?: string;
  is_Activo: boolean;
  created_at: string;
}

export default function ApisPage() {
  const [apis, setApis] = useState<Api[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingApi, setEditingApi] = useState<Api | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isActivo, setIsActivo] = useState(true);

  useEffect(() => {
    fetchApis();
  }, []);

  async function fetchApis() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("apis")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApis(data || []);
    } catch (err: any) {
      console.error("Error fetching APIs:", err);
      toast({
        title: "Error",
        description: `No se pudieron cargar las APIs: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName("");
    setUrl("");
    setApiKey("");
    setIsActivo(true);
    setEditingApi(null);
  }

  function handleOpenAddDialog() {
    resetForm();
    setShowAddDialog(true);
  }

  function handleEditApi(api: Api) {
    setEditingApi(api);
    setName(api.name);
    setUrl(api.url);
    setApiKey(api.api_key || "");
    setIsActivo(api.is_Activo);
    setShowAddDialog(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (!name || !url) {
        toast({
          title: "Error",
          description: "Por favor completa los campos requeridos",
          variant: "destructive",
        });
        return;
      }

      const apiData = {
        name,
        url,
        api_key: apiKey,
        is_Activo: isActivo,
      };

      if (editingApi) {
        // Actualizar API existente
        const { error } = await supabase
          .from("apis")
          .update(apiData)
          .eq("id", editingApi.id);

        if (error) throw error;

        toast({
          title: "API actualizada",
          description: `La API ${name} ha sido actualizada correctamente`,
        });
      } else {
        // Crear nueva API
        const { error } = await supabase.from("apis").insert(apiData);

        if (error) throw error;

        toast({
          title: "API creada",
          description: `La API ${name} ha sido creada correctamente`,
        });
      }

      // Cerrar diálogo y recargar datos
      setShowAddDialog(false);
      resetForm();
      fetchApis();
    } catch (err: any) {
      console.error("Error saving API:", err);
      toast({
        title: "Error",
        description: `No se pudo guardar la API: ${err.message}`,
        variant: "destructive",
      });
    }
  }

  async function handleDeleteApi(id: string, name: string) {
    if (!confirm(`¿Estás seguro de eliminar la API "${name}"?`)) {
      return;
    }

    try {
      // Verificar si la API está en uso
      const { data: usageData, error: usageError } = await supabase
        .from("server_ads")
        .select("id")
        .eq("api_id", id)
        .limit(1);

      if (usageError) throw usageError;

      if (usageData && usageData.length > 0) {
        toast({
          title: "No se puede eliminar",
          description:
            "Esta API está siendo utilizada por uno o más anuncios en servidores",
          variant: "destructive",
        });
        return;
      }

      // Eliminar API
      const { error } = await supabase.from("apis").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "API eliminada",
        description: `La API "${name}" ha sido eliminada correctamente`,
      });

      // Actualizar lista
      setApis(apis.filter((api) => api.id !== id));
    } catch (err: any) {
      console.error("Error deleting API:", err);
      toast({
        title: "Error",
        description: `No se pudo eliminar la API: ${err.message}`,
        variant: "destructive",
      });
    }
  }

  async function handleToggleActivo(id: string, isActivo: boolean) {
    try {
      const { error } = await supabase
        .from("apis")
        .update({ is_Activo: !isActivo })
        .eq("id", id);

      if (error) throw error;

      // Actualizar estado local
      setApis(
        apis.map((api) => {
          if (api.id === id) {
            return { ...api, is_Activo: !isActivo };
          }
          return api;
        })
      );

      toast({
        title: "Estado actualizado",
        description: `La API ha sido ${
          !isActivo ? "activada" : "desactivada"
        } correctamente`,
      });
    } catch (err: any) {
      console.error("Error toggling API status:", err);
      toast({
        title: "Error",
        description: `No se pudo actualizar el estado: ${err.message}`,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de APIs</h1>
          <p className="text-muted-foreground">
            Administra las APIs para la integración con plataformas
            publicitarias
          </p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva API
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>APIs Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Cargando APIs...</div>
          ) : apis.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No hay APIs configuradas</p>
              <Button className="mt-4" onClick={handleOpenAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Crear API
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apis.map((api) => (
                  <TableRow key={api.id}>
                    <TableCell className="font-medium">{api.name}</TableCell>
                    <TableCell>{api.url}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={api.is_Activo}
                          onCheckedChange={() =>
                            handleToggleActivo(api.id, api.is_Activo)
                          }
                        />
                        <Badge
                          variant={api.is_Activo ? "outline" : "secondary"}
                        >
                          {api.is_Activo ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(api.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditApi(api)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteApi(api.id, api.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingApi ? "Editar API" : "Crear Nueva API"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la API"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.ejemplo.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key (opcional)</Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Clave de API"
                type="password"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActivo"
                checked={isActivo}
                onCheckedChange={setIsActivo}
              />
              <Label htmlFor="isActivo">API Activa</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingApi ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
