"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { getServerById, updateServer } from "@/lib/queries/server-queries";

interface ServerFormData {
  name: string;
  coefficient: number;
  description: string;
  is_active: boolean;
}

export default function EditServerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverId, setServerId] = useState<string>("");

  const [formData, setFormData] = useState<ServerFormData>({
    name: "",
    coefficient: 1.0,
    description: "",
    is_active: true,
  });

  // Extraer el ID del servidor de params al inicio
  useEffect(() => {
    if (params && params.id) {
      setServerId(params.id);
    }
  }, [params]);

  useEffect(() => {
    async function loadServer() {
      if (!serverId) return;

      try {
        setLoading(true);
        const server = await getServerById(serverId);

        if (!server) {
          throw new Error("Servidor no encontrado");
        }

        setFormData({
          name: server.name,
          coefficient: server.coefficient,
          description: server.description || "",
          is_active: server.is_active,
        });
      } catch (err: any) {
        console.error("Error loading server:", err);
        setError(`Error al cargar el servidor: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    if (serverId) {
      loadServer();
    }
  }, [serverId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      is_active: checked,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Number.parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serverId) return;

    try {
      setSubmitting(true);
      setError(null);

      const result = await updateServer(serverId, formData);

      router.push(`/dashboard/servers/${serverId}`);
    } catch (err: any) {
      console.error("Error updating server:", err);
      setError(`Error al actualizar el servidor: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Cargando datos del servidor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Editar Servidor</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Servidor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Servidor</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coefficient">Coeficiente</Label>
              <Input
                id="coefficient"
                name="coefficient"
                type="number"
                step="0.01"
                min="1"
                value={formData.coefficient}
                onChange={handleNumberChange}
                required
              />
              <p className="text-sm text-muted-foreground">
                Factor multiplicador para el cálculo de costos.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="is_active">Servidor Activo</Label>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
