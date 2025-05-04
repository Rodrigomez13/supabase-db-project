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
import { supabase } from "@/lib/supabase";

export default function AddBusinessManagerColumnPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleAddColumn = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Añadir la columna business_manager_id a la tabla ad_sets
      const { error: alterError } = await supabase.rpc("exec_sql", {
        sql_query:
          "ALTER TABLE ad_sets ADD COLUMN IF NOT EXISTS business_manager_id UUID REFERENCES business_managers(id);",
      });

      if (alterError) throw alterError;

      // Crear un índice para mejorar el rendimiento
      const { error: indexError } = await supabase.rpc("exec_sql", {
        sql_query:
          "CREATE INDEX IF NOT EXISTS idx_ad_sets_business_manager_id ON ad_sets(business_manager_id);",
      });

      if (indexError) throw indexError;

      setResult({
        success: true,
        message:
          "Columna business_manager_id añadida correctamente a la tabla ad_sets",
      });
    } catch (error: any) {
      console.error("Error al añadir la columna:", error);
      setResult({
        success: false,
        message: `Error: ${error.message || "Ocurrió un error desconocido"}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Añadir Columna Business Manager</CardTitle>
          <CardDescription>
            Añade la columna business_manager_id a la tabla ad_sets para
            permitir la relación con business_managers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className="mb-4"
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
          <p className="text-sm text-muted-foreground">
            Esta operación añadirá la columna business_manager_id a la tabla
            ad_sets y creará un índice para mejorar el rendimiento.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleAddColumn}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Añadiendo columna..." : "Añadir Columna"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
