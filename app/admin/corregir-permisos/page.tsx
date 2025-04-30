"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface VistaPermiso {
  nombre_vista: string;
  es_security_definer: boolean;
  tiene_permisos_auth: boolean;
}

export default function CorregirPermisosPage() {
  const [vistas, setVistas] = useState<VistaPermiso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Cargar información de permisos de vistas
  const cargarPermisos = async () => {
    setCargando(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc("verificar_permisos_vistas");

      if (error) throw error;

      setVistas(data || []);
    } catch (err: any) {
      console.error("Error al cargar permisos:", err);
      setError(err.message || "Error al cargar permisos de vistas");
    } finally {
      setCargando(false);
    }
  };

  // Corregir permisos mediante API
  const corregirPermisos = async () => {
    setCargando(true);
    setError(null);
    setMensaje(null);

    try {
      const response = await fetch("/api/corregir-permisos-vistas", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al corregir permisos");
      }

      const data = await response.json();
      setMensaje(data.message || "Permisos corregidos correctamente");

      // Recargar permisos después de corregirlos
      await cargarPermisos();
    } catch (err: any) {
      console.error("Error al corregir permisos:", err);
      setError(err.message || "Error al corregir permisos de vistas");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPermisos();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Administrador de Permisos de Vistas</CardTitle>
          <CardDescription>
            Verifica y corrige los permisos de las vistas para usuarios
            autenticados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {mensaje && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Éxito</AlertTitle>
              <AlertDescription>{mensaje}</AlertDescription>
            </Alert>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre de la Vista</TableHead>
                <TableHead>SECURITY DEFINER</TableHead>
                <TableHead>Permisos para Authenticated</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : vistas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No se encontraron vistas
                  </TableCell>
                </TableRow>
              ) : (
                vistas.map((vista) => (
                  <TableRow key={vista.nombre_vista}>
                    <TableCell>{vista.nombre_vista}</TableCell>
                    <TableCell>
                      {vista.es_security_definer ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      {vista.tiene_permisos_auth ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      {vista.es_security_definer &&
                      vista.tiene_permisos_auth ? (
                        <span className="text-green-500">Correcto</span>
                      ) : (
                        <span className="text-red-500">
                          Necesita corrección
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={cargarPermisos} disabled={cargando}>
            Actualizar
          </Button>
          <Button onClick={corregirPermisos} disabled={cargando}>
            Corregir Todos los Permisos
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
