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
import { AlertCircle, CheckCircle } from "lucide-react";

export default function CreateFranchiseDistributionFunctionPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateFunction = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await fetch(
        "/api/create-franchise-distribution-function",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la función");
      }

      setSuccess(true);
    } catch (error: any) {
      console.error("Error creating function:", error);
      setError(error.message || "Error al crear la función");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">
        Crear Función de Distribución de Franquicias
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Función get_franchise_distribution</CardTitle>
          <CardDescription>
            Esta función SQL calcula la distribución de conversiones por
            franquicia para una fecha específica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            La función devuelve una tabla con el nombre de la franquicia, el
            número de conversiones, el porcentaje del total, el número de
            teléfonos y el número de teléfonos activos.
          </p>

          {success && (
            <Alert className="mb-4 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">
                Función creada correctamente
              </AlertTitle>
              <AlertDescription className="text-green-600">
                La función get_franchise_distribution ha sido creada o
                actualizada correctamente.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
            <pre className="text-xs">
              {`-- Función para obtener la distribución de conversiones por franquicia
CREATE OR REPLACE FUNCTION public.get_franchise_distribution(p_date date)
RETURNS TABLE (
  franchise_name text,
  conversions bigint,
  percentage numeric,
  phones bigint,
  active_phones bigint
) AS $$
DECLARE
  total_conversions bigint;
BEGIN
  -- Obtener el total de conversiones para la fecha
  SELECT COUNT(*) INTO total_conversions FROM conversions WHERE date = p_date;
  
  -- Si no hay conversiones, devolver un conjunto vacío
  IF total_conversions = 0 THEN
    RETURN;
  END IF;
  
  -- Devolver la distribución
  RETURN QUERY
  WITH franchise_conversions AS (
    SELECT 
      f.name AS franchise_name,
      COUNT(c.id) AS conversions
    FROM 
      franchises f
    LEFT JOIN 
      conversions c ON c.franchise_id = f.id AND c.date = p_date
    GROUP BY 
      f.name
  ),
  franchise_phones AS (
    SELECT 
      f.name AS franchise_name,
      COUNT(fp.id) AS phones,
      COUNT(fp.id) FILTER (WHERE fp.active = true) AS active_phones
    FROM 
      franchises f
    LEFT JOIN 
      franchise_phones fp ON fp.franchise_id = f.id
    GROUP BY 
      f.name
  )
  SELECT 
    fc.franchise_name,
    fc.conversions,
    CASE 
      WHEN total_conversions > 0 THEN (fc.conversions::numeric / total_conversions) * 100
      ELSE 0
    END AS percentage,
    COALESCE(fp.phones, 0) AS phones,
    COALESCE(fp.active_phones, 0) AS active_phones
  FROM 
    franchise_conversions fc
  LEFT JOIN 
    franchise_phones fp ON fp.franchise_name = fc.franchise_name
  ORDER BY 
    fc.conversions DESC;
END;
$$ LANGUAGE plpgsql;`}
            </pre>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateFunction} disabled={loading}>
            {loading ? "Creando..." : "Crear Función"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
