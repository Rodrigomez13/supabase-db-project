"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { safeQuery, safeInsert } from "@/lib/safe-query";

interface AdSet {
  id: string;
  name: string;
}

export default function NewAdPage() {
  const [formData, setFormData] = useState({
    name: "",
    ad_id: "",
    creative_type: "",
    status: "active",
    adset_id: "",
  });
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAdSets();
  }, []);

  async function fetchAdSets() {
    try {
      const data = await safeQuery<AdSet>("ad_sets", {
        orderBy: { column: "name" },
      });

      setAdSets(data);
    } catch (error) {
      console.error("Error fetching ad sets:", error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await safeInsert("ads", formData);

      if (!result) {
        throw new Error("Error");
      }

      router.push("/dashboard/advertising/ads");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Nuevo Anuncio</CardTitle>
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
              <Label htmlFor="ad_id">ID de Anuncio</Label>
              <Input
                id="ad_id"
                name="ad_id"
                value={formData.ad_id}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creative_type">Tipo de Creativo</Label>
              <Select
                onValueChange={(value) =>
                  handleSelectChange("creative_type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Imagen</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="carousel">Carrusel</SelectItem>
                  <SelectItem value="collection">Colección</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adset_id">Conjunto de Anuncios</Label>
              <Select
                onValueChange={(value) => handleSelectChange("adset_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un conjunto" />
                </SelectTrigger>
                <SelectContent>
                  {adSets.map((adSet) => (
                    <SelectItem key={adSet.id} value={adSet.id}>
                      {adSet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                defaultValue="active"
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
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
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Anuncio"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
