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
import { safeQuery, safeUpdate } from "@/lib/safe-query";

interface Franchise {
  id: string;
  name: string;
  owner: string;
  password: string;
  cvu: string;
  alias: string;
  link: string;
}

export default function EditFranchisePage({
  params,
}: {
  params: { id: string };
}) {
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [formData, setFormData] = useState<Franchise>({
    id: "",
    name: "",
    owner: "",
    password: "",
    cvu: "",
    alias: "",
    link: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const id = params.id;
    if (id) {
      fetchFranchise(id);
    }
  }, [params.id]);

  const fetchFranchise = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await safeQuery<Franchise>("franchises", {
        where: [{ column: "id", value: id }],
      });

      if (data.length > 0) {
        setFranchise(data[0]);
        setFormData(data[0]);
      } else {
        setError("Franquicia no encontrada");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar la franquicia");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const result = await safeUpdate("franchises", params.id, formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push("/dashboard/franchises");
    } catch (err: any) {
      setError(err.message || "Error al actualizar la franquicia");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Cargando franquicia...</p>
      </div>
    );
  }

  if (!franchise && !isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert variant="destructive">
          <AlertDescription>Franquicia no encontrada</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Editar Franquicia</CardTitle>
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
              <Label htmlFor="owner">Propietario</Label>
              <Input
                id="owner"
                name="owner"
                value={formData.owner || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password || ""}
                onChange={handleChange}
                placeholder="Dejar en blanco para mantener la contraseña actual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvu">CVU</Label>
              <Input
                id="cvu"
                name="cvu"
                value={formData.cvu || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alias">Alias</Label>
              <Input
                id="alias"
                name="alias"
                value={formData.alias || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                name="link"
                value={formData.link || ""}
                onChange={handleChange}
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
