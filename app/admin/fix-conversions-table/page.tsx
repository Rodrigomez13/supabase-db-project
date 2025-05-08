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
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function FixConversionsTablePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleFixTable = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/fix-conversions-table", {
        method: "POST",
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error desconocido al corregir la tabla de conversiones",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkTableExists = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Verificar si la tabla conversions existe
      const { data: tableExists, error: tableError } = await supabase.rpc(
        "check_table_exists",
        {
          table_name: "conversions",
        }
      );

      if (tableError) {
        throw new Error(`Error al verificar la tabla: ${tableError.message}`);
      }

      // Verificar si la columna lead_id existe
      if (tableExists) {
        const { data: columns, error: columnError } = await supabase
          .from("information_schema.columns")
          .select("column_name")
          .eq("table_name", "conversions")
          .eq("column_name", "lead_id");

        if (columnError) {
          throw new Error(
            `Error al verificar columnas: ${columnError.message}`
          );
        }

        const leadIdExists = columns && columns.length > 0;

        setResult({
          success: true,
          message: `Tabla conversions ${
            tableExists ? "existe" : "no existe"
          }. Columna lead_id ${leadIdExists ? "existe" : "no existe"}.`,
        });
      } else {
        setResult({
          success: false,
          message: "La tabla conversions no existe.",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error desconocido al verificar la tabla",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Corregir Tabla de Conversiones</CardTitle>
          <CardDescription>
            Esta herramienta corregirá la estructura de la tabla de conversiones
            y sus índices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Esta operación realizará las siguientes acciones:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Verificará si la tabla conversions existe</li>
              <li>Creará la tabla si no existe con la estructura correcta</li>
              <li>Añadirá la columna lead_id si no existe</li>
              <li>Creará los índices necesarios</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="flex space-x-4">
            <Button
              onClick={checkTableExists}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar Tabla"
              )}
            </Button>
            <Button onClick={handleFixTable} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Corregir Tabla"
              )}
            </Button>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
