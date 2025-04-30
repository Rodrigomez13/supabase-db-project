"use client";

import { useInitDb } from "@/lib/init-db";
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

export default function SetupPage() {
  const { initializeDatabase, isInitializing, isInitialized, error } =
    useInitDb();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            Configuración de Base de Datos
          </CardTitle>
          <CardDescription>
            Inicializa la estructura de la base de datos para el sistema de
            gestión de leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Este proceso creará todas las tablas necesarias en tu base de datos
            Supabase. Asegúrate de tener los permisos adecuados antes de
            continuar.
          </p>

          {isInitialized && (
            <Alert className="mb-4">
              <AlertDescription className="text-green-600">
                ¡Base de datos inicializada correctamente!
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={initializeDatabase}
            disabled={isInitializing || isInitialized}
            className="w-full"
          >
            {isInitializing
              ? "Inicializando..."
              : isInitialized
              ? "Inicializado"
              : "Inicializar Base de Datos"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
