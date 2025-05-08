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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function CreateConversionsTablePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleCreateTable = async () => {
    try {
      setIsLoading(true);
      setResult(null);

      const response = await fetch("/api/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sqlFile: "create-conversions-table.sql",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: "Tablas y funciones creadas correctamente.",
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Error al crear las tablas y funciones.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setResult({
        success: false,
        message: "Error al procesar la solicitud.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Crear Tablas de Conversiones</CardTitle>
          <CardDescription>
            Este proceso creará las tablas necesarias para gestionar las
            conversiones y teléfonos de franquicias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Se crearán las siguientes tablas y funciones:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>
              Tabla <code>conversions</code> para registrar las conversiones
            </li>
            <li>
              Tabla <code>franchise_phones</code> para gestionar los teléfonos
              de las franquicias
            </li>
            <li>
              Función <code>get_conversion_distribution</code> para obtener la
              distribución de conversiones por franquicia
            </li>
            <li>
              Función <code>get_server_conversion_distribution</code> para
              obtener la distribución de conversiones por servidor
            </li>
          </ul>

          {result && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className="mt-4"
            >
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateTable} disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Tablas y Funciones"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
