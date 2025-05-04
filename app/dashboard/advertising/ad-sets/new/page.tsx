"use client";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { safeQuery, safeInsert } from "@/lib/safe-query";

interface Campaign {
  id: string;
  name: string;
}

interface BusinessManager {
  id: string;
  name: string;
}

interface Portfolio {
  id: string;
  name: string;
}

interface AdFormData {
  name: string;
  ad_id: string;
  creative_type: string;
  status: string;
  adset_id: string;
}

export default function NewAdSetPage() {
  const [formData, setFormData] = useState({
    name: "",
    adset_id: "",
    budget: 0,
    status: "active",
    campaign_id: "",
    business_manager_id: "",
    portfolio_id: "",
  });

  const [adFormData, setAdFormData] = useState<AdFormData>({
    name: "",
    ad_id: "",
    creative_type: "image",
    status: "active",
    adset_id: "", // Se llenará después de crear el adset
  });

  const [createAdWithAdSet, setCreateAdWithAdSet] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [businessManagers, setBusinessManagers] = useState<BusinessManager[]>(
    []
  );
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchRelatedData();
  }, []);

  async function fetchRelatedData() {
    try {
      // Fetch campaigns
      const campaignsData = await safeQuery<Campaign>("campaigns", {
        orderBy: { column: "name" },
      });
      setCampaigns(campaignsData);

      // Fetch business managers
      const bmData = await safeQuery<BusinessManager>("business_managers", {
        orderBy: { column: "name" },
      });
      setBusinessManagers(bmData);

      // Fetch portfolios
      const portfoliosData = await safeQuery<Portfolio>("portfolios", {
        orderBy: { column: "name" },
      });
      setPortfolios(portfoliosData);
    } catch (error) {
      console.error("Error fetching related data:", error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdSelectChange = (name: string, value: string) => {
    setAdFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Crear el conjunto de anuncios
      const adSetResult = await safeInsert<{ id: string }>("ad_sets", formData);

      if (!adSetResult.success) {
        throw new Error(
          adSetResult.error || "Error al crear el conjunto de anuncios"
        );
      }

      // Si se seleccionó crear un anuncio junto con el conjunto
      if (createAdWithAdSet && adSetResult.data) {
        // Asignar el ID del conjunto recién creado al anuncio
        const adData = {
          ...adFormData,
          adset_id: adSetResult.data.id,
        };

        const adResult = await safeInsert("ads", adData);

        if (!adResult.success) {
          console.error("Error al crear el anuncio:", adResult.error);
          // Continuamos aunque falle la creación del anuncio
        }
      }

      router.push("/dashboard/advertising/ad-sets");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Nuevo Conjunto de Anuncios</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="adset">
            <TabsList className="mb-4">
              <TabsTrigger value="adset">Conjunto de Anuncios</TabsTrigger>
              <TabsTrigger value="ad" disabled={!createAdWithAdSet}>
                Anuncio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="adset">
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Conjunto</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adset_id">ID de Conjunto (Facebook)</Label>
                  <Input
                    id="adset_id"
                    name="adset_id"
                    value={formData.adset_id}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Presupuesto Diario</Label>
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
                  <Label htmlFor="business_manager_id">Business Manager</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("business_manager_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un Business Manager" />
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
                  <Label htmlFor="portfolio_id">Portfolio (Opcional)</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("portfolio_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un Portfolio" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios.map((portfolio) => (
                        <SelectItem key={portfolio.id} value={portfolio.id}>
                          {portfolio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    onValueChange={(value) =>
                      handleSelectChange("status", value)
                    }
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

                <div className="flex items-center space-x-2 pt-4">
                  <Checkbox
                    id="createAd"
                    checked={createAdWithAdSet}
                    onCheckedChange={(checked) =>
                      setCreateAdWithAdSet(checked === true)
                    }
                  />
                  <Label htmlFor="createAd">
                    Crear anuncio junto con el conjunto
                  </Label>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="ad">
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ad_name">Nombre del Anuncio</Label>
                  <Input
                    id="ad_name"
                    name="name"
                    value={adFormData.name}
                    onChange={handleAdChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ad_id">ID de Anuncio (Facebook)</Label>
                  <Input
                    id="ad_id"
                    name="ad_id"
                    value={adFormData.ad_id}
                    onChange={handleAdChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creative_type">Tipo de Creativo</Label>
                  <Select
                    defaultValue="image"
                    onValueChange={(value) =>
                      handleAdSelectChange("creative_type", value)
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
                  <Label htmlFor="ad_status">Estado</Label>
                  <Select
                    defaultValue="active"
                    onValueChange={(value) =>
                      handleAdSelectChange("status", value)
                    }
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
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
