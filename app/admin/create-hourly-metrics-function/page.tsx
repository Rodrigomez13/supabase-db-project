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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function CreateHourlyMetricsFunctionPage() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
  } | null>(null);

  const handleExecuteSQL = async () => {
    try {
      setIsExecuting(true);
      setResult(null);

      const response = await fetch("/api/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sqlFile: "create-hourly-metrics-function.sql",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true });
      } else {
        setResult({ error: data.error || "Error al ejecutar el script SQL" });
      }
    } catch (error: any) {
      setResult({ error: error.message || "Error al ejecutar el script SQL" });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">
        Crear Función de Métricas por Hora
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Crear Función SQL</CardTitle>
          <CardDescription>
            Este script creará las funciones necesarias para obtener métricas
            por hora y distribución de franquicias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            El script creará las siguientes funciones:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              get_hourly_metrics: Obtiene métricas acumuladas por hora para una
              fecha específica
            </li>
            <li>
              get_franchise_distribution_metrics: Obtiene la distribución de
              conversiones por franquicia
            </li>
          </ul>

          {result?.success && (
            <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Funciones creadas correctamente
              </AlertDescription>
            </Alert>
          )}

          {result?.error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleExecuteSQL} disabled={isExecuting}>
            {isExecuting ? "Ejecutando..." : "Ejecutar Script SQL"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
