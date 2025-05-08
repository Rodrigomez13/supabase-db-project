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

export default function CreateFranchisePhonesTablePage() {
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
          sqlFile: "create-franchise-phones-table.sql",
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
        Crear Tabla de Teléfonos de Franquicias
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Crear Tabla SQL</CardTitle>
          <CardDescription>
            Este script creará la tabla para almacenar los teléfonos de las
            franquicias y las funciones relacionadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            El script creará:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              Tabla franchise_phones: Almacena los teléfonos de las franquicias
            </li>
            <li>Índices para búsquedas eficientes</li>
            <li>Triggers para actualización automática de timestamps</li>
            <li>
              Función get_franchise_phones: Obtiene los teléfonos de una
              franquicia
            </li>
          </ul>

          {result?.success && (
            <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Tabla y funciones creadas correctamente
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
