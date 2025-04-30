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

interface Campaign {
  id: string;
  name: string;
}

export default function NewAdSetPage() {
  const [formData, setFormData] = useState({
    name: "",
    adset_id: "",
    budget: 0,
    status: "active",
    campaign_id: "",
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const data = await safeQuery<Campaign>("campaigns", {
        orderBy: { column: "name" },
      });

      setCampaigns(data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
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
      const result = await safeInsert("ad_sets", formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push("/dashboard/advertising/ad-sets");
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
          <CardTitle className="text-2xl">Nuevo Conjunto de Anuncios</CardTitle>
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
              <Label htmlFor="adset_id">ID de Conjunto</Label>
              <Input
                id="adset_id"
                name="adset_id"
                value={formData.adset_id}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Presupuesto</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign_id">Campaña</Label>
              <Select
                onValueChange={(value) =>
                  handleSelectChange("campaign_id", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una campaña" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
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
            {isLoading ? "Guardando..." : "Guardar Conjunto"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
