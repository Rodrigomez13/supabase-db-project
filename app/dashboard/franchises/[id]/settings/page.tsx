"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, AlertCircle } from "lucide-react";
import { safeQuery, safeUpdate } from "@/lib/safe-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Franchise {
  id: string;
  name: string;
  owner: string;
  password?: string;
  cvu?: string;
  alias?: string;
  link?: string;
  status?: string;
}

export default function FranchiseSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const franchiseId = params.id as string;
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [formData, setFormData] = useState<Franchise>({
    id: "",
    name: "",
    owner: "",
    password: "",
    cvu: "",
    alias: "",
    link: "",
    status: "Activo",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const fetchFranchise = async () => {
      try {
        setIsLoading(true);
        const data = await safeQuery<Franchise>("franchises", {
          where: { id: franchiseId },
        });

        if (data.length > 0) {
          setFranchise(data[0]);
          setFormData(data[0]);
          setIsActive(data[0].status !== "inactive");
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

    if (franchiseId) {
      fetchFranchise();
    }
  }, [franchiseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (checked: boolean) => {
    setIsActive(checked);
    setFormData((prev) => ({
      ...prev,
      status: checked ? "Activo" : "inactive",
    }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await safeUpdate("franchises", franchiseId, formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Actualizar los datos locales
      setFranchise(formData);
      alert("Configuración guardada con éxito");
    } catch (err: any) {
      setError(err.message || "Error al actualizar la franquicia");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Configuración</h2>
        <p className="text-muted-foreground">
          Gestiona la configuración de esta franquicia
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="advanced">Avanzado</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <p>Cargando datos...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="franchise-status">
                        Estado de la franquicia
                      </Label>
                      <div className="text-sm text-muted-foreground">
                        Activa o inactiva
                      </div>
                    </div>
                    <Switch
                      id="franchise-status"
                      checked={isActive}
                      onCheckedChange={handleStatusChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nombre de la franquicia"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner">Propietario</Label>
                    <Input
                      id="owner"
                      name="owner"
                      value={formData.owner || ""}
                      onChange={handleChange}
                      placeholder="Nombre del propietario"
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
                      placeholder="Dejar en blanco para mantener la actual"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Información de Pagos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <p>Cargando datos...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cvu">CVU</Label>
                    <Input
                      id="cvu"
                      name="cvu"
                      value={formData.cvu || ""}
                      onChange={handleChange}
                      placeholder="CVU para pagos"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alias">Alias</Label>
                    <Input
                      id="alias"
                      name="alias"
                      value={formData.alias || ""}
                      onChange={handleChange}
                      placeholder="Alias para pagos"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="link">Link de pago</Label>
                    <Input
                      id="link"
                      name="link"
                      value={formData.link || ""}
                      onChange={handleChange}
                      placeholder="Link personalizado de pago"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Configuración Avanzada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-amber-50 text-amber-800 p-4 rounded-md">
                  <p className="text-sm">Opciones avanzadas en desarrollo.</p>
                </div>

                {/* Aquí irán opciones avanzadas en el futuro */}
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-red-600">
                Zona de Peligro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Las siguientes acciones son irreversibles. Proceda con
                precaución.
              </p>
              <Button variant="destructive">Eliminar Franquicia</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/franchises/${franchiseId}`)}
        >
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
}
