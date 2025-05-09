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
import { assignLeadsToFranchise } from "@/lib/lead-distribution-utils";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";

export default function TestLeadAssignmentPage() {
  const [serverId, setServerId] = useState("");
  const [franchiseId, setFranchiseId] = useState("");
  const [leadsCount, setLeadsCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [servers, setServers] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Cargar servidores y franquicias al montar el componente
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true);

        // Cargar servidores
        const { data: serversData, error: serversError } = await supabase
          .from("servers")
          .select("id, name")
          .order("name");

        if (!serversError && serversData) {
          setServers(serversData);
        }

        // Cargar franquicias
        const { data: franchisesData, error: franchisesError } = await supabase
          .from("franchises")
          .select("id, name")
          .order("name");

        if (!franchisesError && franchisesData) {
          setFranchises(franchisesData);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  async function handleTestAssignment() {
    if (!serverId || !franchiseId) {
      setResult({
        success: false,
        error: "Por favor selecciona un servidor y una franquicia",
      });
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      // Intentar asignar leads
      const assignmentResult = await assignLeadsToFranchise(
        serverId,
        franchiseId,
        leadsCount
      );

      // Guardar el resultado
      setResult(assignmentResult);

      // Mostrar detalles adicionales si es exitoso
      if (assignmentResult.success) {
        // Obtener detalles del teléfono asignado
        const { data: phoneData } = await supabase
          .from("franchise_phones")
          .select("phone_number")
          .eq("id", assignmentResult.data?.[0]?.franchise_phone_id)
          .single();

        if (phoneData) {
          setResult({
            ...assignmentResult,
            phoneNumber: phoneData.phone_number,
          });
        }
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "Error desconocido durante la asignación",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Prueba de Asignación de Leads</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Parámetros de Prueba</CardTitle>
            <CardDescription>
              Configura los parámetros para probar la asignación de leads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="server">Servidor</Label>
              <select
                id="server"
                className="w-full p-2 border rounded"
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
                disabled={loadingData}
              >
                <option value="">Selecciona un servidor</option>
                {servers.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="franchise">Franquicia</Label>
              <select
                id="franchise"
                className="w-full p-2 border rounded"
                value={franchiseId}
                onChange={(e) => setFranchiseId(e.target.value)}
                disabled={loadingData}
              >
                <option value="">Selecciona una franquicia</option>
                {franchises.map((franchise) => (
                  <option key={franchise.id} value={franchise.id}>
                    {franchise.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leadsCount">Cantidad de Leads</Label>
              <Input
                id="leadsCount"
                type="number"
                min="1"
                value={leadsCount}
                onChange={(e) =>
                  setLeadsCount(Number.parseInt(e.target.value) || 1)
                }
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleTestAssignment}
              disabled={loading || !serverId || !franchiseId}
              className="w-full"
            >
              {loading ? "Asignando..." : "Probar Asignación"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado de la Prueba</CardTitle>
            <CardDescription>
              Aquí verás el resultado de la asignación de leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result === null ? (
              <div className="text-center py-10 text-gray-500">
                Ejecuta una prueba para ver los resultados
              </div>
            ) : result.success ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-700">
                  Asignación exitosa
                </AlertTitle>
                <AlertDescription className="text-green-600">
                  <div className="mt-2 space-y-2">
                    <p>
                      <strong>ID de asignación:</strong> {result.data[0].id}
                    </p>
                    <p>
                      <strong>Teléfono asignado:</strong>{" "}
                      {result.phoneNumber || result.data[0].franchise_phone_id}
                    </p>
                    <p>
                      <strong>Cantidad de leads:</strong>{" "}
                      {result.data[0].leads_count}
                    </p>
                    <p>
                      <strong>Fecha:</strong> {result.data[0].date}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error en la asignación</AlertTitle>
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            {result && (
              <div className="w-full">
                <details className="text-sm">
                  <summary className="cursor-pointer">
                    Ver detalles técnicos
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
function useEffect(arg0: () => void, arg1: never[]) {
  throw new Error("Function not implemented.");
}
