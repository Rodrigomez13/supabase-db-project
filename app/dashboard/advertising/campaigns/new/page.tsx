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

interface BusinessManager {
  id: string;
  name: string;
}

export default function NewCampaignPage() {
  const [formData, setFormData] = useState({
    name: "",
    campaign_id: "",
    objective: "",
    status: "active",
    bm_id: "",
  });
  const [businessManagers, setBusinessManagers] = useState<BusinessManager[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchBusinessManagers();
  }, []);

  async function fetchBusinessManagers() {
    try {
      const data = await safeQuery<BusinessManager>("business_managers", {
        orderBy: { column: "name" },
      });

      setBusinessManagers(data);
    } catch (error) {
      console.error("Error fetching business managers:", error);
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
      const result = await safeInsert("campaigns", formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push("/dashboard/advertising/campaigns");
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
          <CardTitle className="text-2xl">Nueva Campaña</CardTitle>
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
              <Label htmlFor="campaign_id">ID de Campaña</Label>
              <Input
                id="campaign_id"
                name="campaign_id"
                value={formData.campaign_id}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">Objetivo</Label>
              <Select
                onValueChange={(value) =>
                  handleSelectChange("objective", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un objetivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONVERSIONS">Conversiones</SelectItem>
                  <SelectItem value="LINK_CLICKS">Clics en Enlaces</SelectItem>
                  <SelectItem value="LEAD_GENERATION">
                    Generación de Leads
                  </SelectItem>
                  <SelectItem value="MESSAGES">Mensajes</SelectItem>
                  <SelectItem value="AWARENESS">Reconocimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bm_id">Business Manager</Label>
              <Select
                onValueChange={(value) => handleSelectChange("bm_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un business manager" />
                </SelectTrigger>
                <SelectContent>
                  {businessManagers.map((bm) => (
                    <SelectItem key={bm.id} value={bm.id}>
                      {bm.name}
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
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                  <SelectItem value="inactive">Inactiva</SelectItem>
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
            {isLoading ? "Guardando..." : "Guardar Campaña"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
