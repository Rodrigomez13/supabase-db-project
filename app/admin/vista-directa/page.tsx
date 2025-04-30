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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { CheckCircle, AlertTriangle } from "lucide-react";

export default function VistaDirectaPage() {
  const [nombreVista, setNombreVista] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [sql, setSql] = useState("");
  const supabase = createClientComponentClient();

  // Consultar una vista directamente
  const consultarVista = async () => {
    if (!nombreVista) {
      setError("Por favor, ingresa el nombre de una vista");
      return;
    }

    setCargando(true);
    setError(null);
    setMensaje(null);
    setResultados([]);

    try {
      const { data, error } = await supabase
        .from(nombreVista)
        .select("*")
        .limit(10);

      if (error) throw error;

      setResultados(data || []);
      setMensaje(
        `Se encontraron ${
          data?.length || 0
        } registros en la vista ${nombreVista}`
      );
    } catch (err: any) {
      console.error("Error al consultar vista:", err);
      setError(err.message || `Error al consultar la vista ${nombreVista}`);
    } finally {
      setCargando(false);
    }
  };

  // Ejecutar SQL personalizado
  const ejecutarSQL = async () => {
    if (!sql) {
      setError("Por favor, ingresa una consulta SQL");
      return;
    }

    setCargando(true);
    setError(null);
    setMensaje(null);
    setResultados([]);

    try {
      const { data, error } = await supabase.rpc("ejecutar_sql_seguro", {
        consulta: sql,
      });

      if (error) throw error;

      setResultados(data || []);
      setMensaje(`Consulta ejecutada correctamente`);
    } catch (err: any) {
      console.error("Error al ejecutar SQL:", err);
      setError(err.message || "Error al ejecutar la consulta SQL");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Consulta Directa de Vistas</CardTitle>
          <CardDescription>
            Prueba el acceso a tus vistas como usuario autenticado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {mensaje && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Éxito</AlertTitle>
              <AlertDescription>{mensaje}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="nombreVista">Nombre de la Vista</Label>
            <div className="flex gap-2">
              <Input
                id="nombreVista"
                value={nombreVista}
                onChange={(e) => setNombreVista(e.target.value)}
                placeholder="Ej: recent_activities"
                disabled={cargando}
              />
              <Button onClick={consultarVista} disabled={cargando}>
                Consultar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sql">Consulta SQL Personalizada</Label>
            <Textarea
              id="sql"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="SELECT * FROM recent_activities LIMIT 10;"
              disabled={cargando}
              rows={3}
            />
            <Button onClick={ejecutarSQL} disabled={cargando}>
              Ejecutar SQL
            </Button>
          </div>

          {resultados.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Resultados:</h3>
              <div className="overflow-x-auto">
                <pre className="bg-muted p-4 rounded-md text-sm">
                  {JSON.stringify(resultados, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Nota: Esta herramienta utiliza tu sesión actual para acceder a las
            vistas.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
