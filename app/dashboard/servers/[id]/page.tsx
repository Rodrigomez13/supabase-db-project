"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { safeQuery, safeUpdate } from "@/lib/safe-query";

interface Server {
  id: string;
  name: string;
  coefficient: number;
  is_active: boolean;
  description: string;
}

export default function EditServerPage({ params }: { params: { id: string } }) {
  const [server, setServer] = useState<Server | null>(null);
  const [formData, setFormData] = useState<Server>({
    id: "",
    name: "",
    coefficient: 1.0,
    is_active: true,
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      fetchServer(params.id);
    }
  }, [params.id]);

  const fetchServer = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await safeQuery<Server>("servers", {
        filters: [{ column: "id", value: id }],
      });

      if (data.length > 0) {
        setServer(data[0]);
        setFormData(data[0]);
      } else {
        setError("Servidor no encontrado");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar el servidor");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const result = await safeUpdate("servers", params.id, formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push("/dashboard/servers");
    } catch (err: any) {
      setError(err.message || "Error al actualizar el servidor");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Cargando servidor...</p>
      </div>
    );
  }

  if (!server && !isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert variant="destructive">
          <AlertDescription>Servidor no encontrado</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Editar Servidor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
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
                value={formData.coefficient}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="is_active">Activo</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows={4}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
