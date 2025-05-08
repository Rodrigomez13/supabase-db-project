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
import { supabase } from "@/lib/supabase";

export default function AddPortfolioColumnPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const addColumn = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Añadir columna portfolio_id a la tabla ad_sets
      const { error: alterError } = await supabase.rpc("exec_sql", {
        sql_query: `
          ALTER TABLE ad_sets ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES portfolios(id);
        `,
      });

      if (alterError) throw alterError;

      // Actualizar permisos para la nueva columna
      const { error: permissionError } = await supabase.rpc("exec_sql", {
        sql_query: `
          GRANT ALL ON ad_sets TO authenticated;
          GRANT ALL ON ad_sets TO service_role;
        `,
      });

      if (permissionError) throw permissionError;

      setResult({
        success: true,
        message:
          "Columna portfolio_id añadida correctamente a la tabla ad_sets",
      });
    } catch (error: any) {
      console.error("Error al añadir columna:", error);
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
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Añadir Columna Portfolio ID</CardTitle>
          <CardDescription>
            Añade la columna portfolio_id a la tabla ad_sets para permitir la
            relación con portfolios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Este proceso añadirá la columna portfolio_id a la tabla ad_sets si
            no existe. Esta columna es necesaria para relacionar conjuntos de
            anuncios con portfolios.
          </p>

          {result && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className="mt-4"
            >
              <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={addColumn} disabled={isLoading}>
            {isLoading ? "Añadiendo columna..." : "Añadir Columna Portfolio ID"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
