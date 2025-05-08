"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Server {
  id: string;
  name: string;
  default_franchise_id: string | null;
}

interface Assignment {
  id: string;
  server_id: string;
  franchise_id: string;
  server_name?: string;
  created_at: string;
}

export default function FranchiseAssignmentsPage() {
  const params = useParams();
  const franchiseId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableServers, setAvailableServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch current assignments
        const { data: assignmentsData, error: assignmentsError } =
          await supabase
            .from("servers")
            .select("id, name")
            .eq("default_franchise_id", franchiseId);

        if (assignmentsError)
          throw new Error(
            `Error al cargar asignaciones: ${assignmentsError.message}`
          );

        // Format assignments data
        const formattedAssignments = (assignmentsData || []).map(
          (server: any) => ({
            id: `${server.id}-${franchiseId}`,
            server_id: server.id,
            franchise_id: franchiseId,
            server_name: server.name,
            created_at: new Date().toISOString(),
          })
        );

        // Fetch available servers (those not assigned to this franchise)
        const { data: serversData, error: serversError } = await supabase
          .from("servers")
          .select("id, name, default_franchise_id")
          .not("default_franchise_id", "eq", franchiseId);

        if (serversError)
          throw new Error(
            `Error al cargar servidores: ${serversError.message}`
          );

        setAssignments(formattedAssignments);
        setAvailableServers(serversData || []);
      } catch (err: any) {
        console.error("Error fetching assignments data:", err);
        setError(err.message || "Error al cargar los datos de asignaciones");
      } finally {
        setLoading(false);
      }
    }

    if (franchiseId) {
      fetchData();
    }
  }, [franchiseId]);

  const handleAddAssignment = async () => {
    if (!selectedServer) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Update server's default_franchise_id
      const { error: updateError } = await supabase
        .from("servers")
        .update({ default_franchise_id: franchiseId })
        .eq("id", selectedServer);

      if (updateError)
        throw new Error(`Error al asignar servidor: ${updateError.message}`);

      // Get server details
      const { data: serverData, error: serverError } = await supabase
        .from("servers")
        .select("name")
        .eq("id", selectedServer)
        .single();

      if (serverError)
        throw new Error(
          `Error al obtener detalles del servidor: ${serverError.message}`
        );

      // Add to local state
      const newAssignment: Assignment = {
        id: `${selectedServer}-${franchiseId}`,
        server_id: selectedServer,
        franchise_id: franchiseId,
        server_name: serverData.name,
        created_at: new Date().toISOString(),
      };

      setAssignments([...assignments, newAssignment]);

      // Remove from available servers
      setAvailableServers(
        availableServers.filter((server) => server.id !== selectedServer)
      );
      setSelectedServer("");
    } catch (err: any) {
      console.error("Error adding assignment:", err);
      setError(err.message || "Error al agregar la asignación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (serverId: string) => {
    try {
      setError(null);

      // Update server's default_franchise_id to null
      const { error: updateError } = await supabase
        .from("servers")
        .update({ default_franchise_id: null })
        .eq("id", serverId);

      if (updateError)
        throw new Error(`Error al eliminar asignación: ${updateError.message}`);

      // Get server details to add back to available servers
      const { data: serverData, error: serverError } = await supabase
        .from("servers")
        .select("id, name, default_franchise_id")
        .eq("id", serverId)
        .single();

      if (serverError)
        throw new Error(
          `Error al obtener detalles del servidor: ${serverError.message}`
        );

      // Update local state
      setAssignments(assignments.filter((a) => a.server_id !== serverId));
      setAvailableServers([...availableServers, serverData]);
    } catch (err: any) {
      console.error("Error removing assignment:", err);
      setError(err.message || "Error al eliminar la asignación");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-[200px] w-full mb-6 rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Asignaciones de Servidores</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Asignar Nuevo Servidor</CardTitle>
          <CardDescription>
            Asigna un servidor a esta franquicia para gestionar sus anuncios y
            métricas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Label htmlFor="server-select">Servidor</Label>
              <Select value={selectedServer} onValueChange={setSelectedServer}>
                <SelectTrigger id="server-select">
                  <SelectValue placeholder="Seleccionar servidor" />
                </SelectTrigger>
                <SelectContent>
                  {availableServers.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No hay servidores disponibles
                    </SelectItem>
                  ) : (
                    availableServers.map((server) => (
                      <SelectItem key={server.id} value={server.id}>
                        {server.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleAddAssignment}
            disabled={!selectedServer || isSubmitting}
          >
            <Plus className="mr-2 h-4 w-4" />
            Asignar Servidor
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Servidores Asignados</CardTitle>
          <CardDescription>
            Servidores actualmente asignados a esta franquicia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No hay servidores asignados a esta franquicia
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servidor</TableHead>
                  <TableHead>Fecha de Asignación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.server_name}
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleRemoveAssignment(assignment.server_id)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
