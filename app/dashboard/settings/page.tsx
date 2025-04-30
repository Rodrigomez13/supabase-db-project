"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Añadir la importación del useTheme
import { useTheme } from "next-themes";

export default function SettingsPage() {
  // Dentro del componente SettingsPage, añadir el hook useTheme
  const { theme, setTheme } = useTheme();

  // Actualizar el estado generalSettings para incluir el tema
  const [generalSettings, setGeneralSettings] = useState({
    companyName: "Sistema de Leads",
    emailNotifications: true,
    darkMode: theme === "dark",
  });

  const [apiSettings, setApiSettings] = useState({
    apiKey: "",
    apiEndpoint: "",
    apiEnabled: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modificar la función handleGeneralChange para manejar el cambio de tema
  const handleGeneralChange = (field: string, value: any) => {
    setGeneralSettings((prev) => ({ ...prev, [field]: value }));

    // Si el campo es darkMode, actualizar el tema
    if (field === "darkMode") {
      setTheme(value ? "dark" : "light");
    }
  };

  const handleApiChange = (field: string, value: any) => {
    setApiSettings((prev) => ({ ...prev, [field]: value }));
  };

  const saveGeneralSettings = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Aquí implementarías la lógica para guardar la configuración
      // Por ejemplo, usando una tabla de configuración en Supabase

      // Simulamos un guardado exitoso
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess("Configuración general guardada correctamente");
    } catch (err: any) {
      setError(err.message || "Error al guardar la configuración");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiSettings = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Aquí implementarías la lógica para guardar la configuración de API

      // Simulamos un guardado exitoso
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess("Configuración de API guardada correctamente");
    } catch (err: any) {
      setError(err.message || "Error al guardar la configuración de API");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Añadir un efecto para actualizar el estado cuando cambie el tema
  useEffect(() => {
    setGeneralSettings((prev) => ({
      ...prev,
      darkMode: theme === "dark",
    }));
  }, [theme]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuración</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="backup">Respaldo</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Configura los ajustes generales del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <Input
                  id="companyName"
                  value={generalSettings.companyName}
                  onChange={(e) =>
                    handleGeneralChange("companyName", e.target.value)
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="emailNotifications"
                  checked={generalSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    handleGeneralChange("emailNotifications", checked)
                  }
                />
                <Label htmlFor="emailNotifications">
                  Notificaciones por Email
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="darkMode"
                  checked={generalSettings.darkMode}
                  onCheckedChange={(checked) =>
                    handleGeneralChange("darkMode", checked)
                  }
                />
                <Label htmlFor="darkMode">Modo Oscuro</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveGeneralSettings} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de API</CardTitle>
              <CardDescription>
                Configura los ajustes para la integración con APIs externas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  value={apiSettings.apiKey}
                  onChange={(e) => handleApiChange("apiKey", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiEndpoint">API Endpoint</Label>
                <Input
                  id="apiEndpoint"
                  value={apiSettings.apiEndpoint}
                  onChange={(e) =>
                    handleApiChange("apiEndpoint", e.target.value)
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="apiEnabled"
                  checked={apiSettings.apiEnabled}
                  onCheckedChange={(checked) =>
                    handleApiChange("apiEnabled", checked)
                  }
                />
                <Label htmlFor="apiEnabled">Habilitar API</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveApiSettings} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar Configuración de API"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Respaldo de Datos</CardTitle>
              <CardDescription>
                Configura y gestiona los respaldos de la base de datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p>
                  Realiza un respaldo completo de la base de datos o programa
                  respaldos automáticos.
                </p>
                <Button>Crear Respaldo Ahora</Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backupSchedule">
                  Programación de Respaldos
                </Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Guardar Configuración de Respaldo</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-600">
            {success}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
