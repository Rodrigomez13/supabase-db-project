"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DailyCycleConfigPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // Calcular próximo ciclo
  const now = new Date();
  const nextCycleDate = new Date();

  // Si ya pasó las 2 AM, el próximo ciclo es mañana a las 2 AM
  if (now.getHours() >= 2) {
    nextCycleDate.setDate(nextCycleDate.getDate() + 1);
  }

  nextCycleDate.setHours(2, 0, 0, 0);

  // Calcular tiempo restante
  const timeRemaining = nextCycleDate.getTime() - now.getTime();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor(
    (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
  );

  async function runDailyCycle() {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch("/api/daily-cycle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          error: data.error || "Error al ejecutar el ciclo diario",
        });
        return;
      }

      setResult({
        success: true,
        message: data.message || "Ciclo diario ejecutado correctamente",
      });
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "Error al ejecutar el ciclo diario",
      });
    } finally {
      setLoading(false);
    }
  }

  async function createDailyCycleFunction() {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch("/api/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql: "SELECT 1 FROM pg_proc WHERE proname = 'generate_daily_report_and_reset'",
          action: "check_function_exists",
        }),
      });

      const checkData = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          error: checkData.error || "Error al verificar la función",
        });
        return;
      }

      // Si la función no existe, crearla
      if (!checkData.exists) {
        const createResponse = await fetch("/api/execute-sql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sqlPath: "/create-daily-cycle-function.sql",
            action: "create_daily_cycle_function",
          }),
        });

        const createData = await createResponse.json();

        if (!createResponse.ok) {
          setResult({
            success: false,
            error: createData.error || "Error al crear la función",
          });
          return;
        }

        setResult({
          success: true,
          message: "Función de ciclo diario creada correctamente",
        });
      } else {
        setResult({
          success: true,
          message: "La función de ciclo diario ya existe",
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "Error al crear la función de ciclo diario",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">
        Configuración del Ciclo Diario
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Ciclo Actual</CardTitle>
            <CardDescription>
              Período de 24 horas para registro de métricas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Clock className="h-10 w-10 text-usina-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Inicio del ciclo actual:
                </p>
                <p className="font-medium">
                  {format(
                    new Date().setHours(2, 0, 0, 0),
                    "dd 'de' MMMM, yyyy 'a las' HH:mm",
                    { locale: es }
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Próximo Ciclo</CardTitle>
            <CardDescription>El próximo reinicio de contadores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <RefreshCw className="h-10 w-10 text-usina-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Próximo reinicio:
                </p>
                <p className="font-medium">
                  {format(nextCycleDate, "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                    locale: es,
                  })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tiempo restante: {hoursRemaining}h {minutesRemaining}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Reportes Generados</CardTitle>
            <CardDescription>
              Los datos se guardan automáticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <CheckCircle className="h-10 w-10 text-usina-success" />
              <div>
                <p className="text-sm text-muted-foreground">Último reporte:</p>
                <p className="font-medium">
                  {format(
                    new Date().setDate(new Date().getDate() - 1),
                    "dd 'de' MMMM, yyyy",
                    { locale: es }
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="config">
        <TabsList className="mb-4">
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="manual">Ejecución Manual</TabsTrigger>
          <TabsTrigger value="setup">Instalación</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Ciclo Diario</CardTitle>
              <CardDescription>
                El ciclo diario se ejecuta automáticamente todos los días a las
                2:00 AM. Los datos de leads, cargas y gastos se reinician, y se
                genera un reporte con los datos del día anterior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  Configuración de Vercel Cron
                </h3>
                <p className="text-sm text-muted-foreground">
                  Para configurar el ciclo diario automático, agrega el
                  siguiente cron job en tu proyecto de Vercel:
                </p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  0 2 * * * curl -X POST https://tu-dominio.com/api/daily-cycle
                  -H "Authorization: Bearer TU_API_KEY"
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Clave API</h3>
                <p className="text-sm text-muted-foreground">
                  Configura una clave API para proteger el endpoint del ciclo
                  diario. Agrega esta variable de entorno en tu proyecto de
                  Vercel:
                </p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  DAILY_CYCLE_API_KEY=tu_clave_secreta
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Ejecución Manual del Ciclo Diario</CardTitle>
              <CardDescription>
                Ejecuta manualmente el ciclo diario para generar reportes y
                reiniciar contadores. Esto normalmente se hace automáticamente a
                las 2:00 AM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Clave API</Label>
                <div className="flex">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="Ingresa la clave API"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="ml-2"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
              </div>

              {result && (
                <Alert variant={result.success ? "default" : "destructive"}>
                  <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
                  <AlertDescription>
                    {result.message || result.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={runDailyCycle}
                disabled={loading || !apiKey}
                className="w-full"
              >
                {loading ? "Ejecutando..." : "Ejecutar Ciclo Diario"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Instalación de la Función de Ciclo Diario</CardTitle>
              <CardDescription>
                Crea la función SQL necesaria para el ciclo diario en la base de
                datos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  Esta acción creará o actualizará la función SQL necesaria para
                  el ciclo diario. Asegúrate de tener una copia de seguridad de
                  tu base de datos antes de continuar.
                </AlertDescription>
              </Alert>

              {result && (
                <Alert variant={result.success ? "default" : "destructive"}>
                  <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
                  <AlertDescription>
                    {result.message || result.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={createDailyCycleFunction}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Instalando..." : "Instalar Función de Ciclo Diario"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
