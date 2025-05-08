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
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { updateFranchisePhonesRelation } from "@/lib/franchise-phone-utils";

export default function UpdateFranchisePhonesRelationPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const result = await updateFranchisePhonesRelation();

      if (!result.success) {
        throw new Error(
          result.error || "Error desconocido al actualizar la relación"
        );
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Error updating franchise phones relation:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">
        Actualizar Relación Franquicias-Teléfonos
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Actualizar Relación</CardTitle>
          <CardDescription>
            Este proceso actualizará la relación entre franquicias y teléfonos
            para mostrar correctamente el conteo de teléfonos activos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Este proceso creará una vista y una función que permitirán mostrar
              correctamente el conteo de teléfonos activos y totales para cada
              franquicia.
            </p>
            <p>
              Esto solucionará el problema de que en la lista de franquicias
              aparece "0/0" en la columna de teléfonos.
            </p>

            <Button onClick={handleUpdate} disabled={loading} className="mt-4">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando relación...
                </>
              ) : (
                "Actualizar Relación"
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Éxito</AlertTitle>
              <AlertDescription>
                Relación entre franquicias y teléfonos actualizada
                correctamente. Ahora deberías ver el conteo correcto de
                teléfonos en la lista de franquicias.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
