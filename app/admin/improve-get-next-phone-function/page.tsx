"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function ImproveGetNextPhoneFunctionPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const handleCreateFunction = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch("/api/improve-get-next-phone-function");
      const data = await response.json();

      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "Error desconocido",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Mejorar Función de Asignación de Teléfonos</CardTitle>
          <CardDescription>
            Esta página mejora la función SQL que obtiene el siguiente teléfono
            disponible para asignación de leads.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            La función mejorada selecciona el teléfono más adecuado para asignar
            leads, considerando:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Teléfonos activos de la franquicia</li>
            <li>Metas diarias configuradas</li>
            <li>Cantidad de leads ya asignados hoy</li>
            <li>Orden de prioridad configurado</li>
          </ul>

          <Button onClick={handleCreateFunction} disabled={loading}>
            {loading ? "Creando función..." : "Crear Función Mejorada"}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
              </div>
              <AlertDescription>
                {result.success ? result.message : result.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
