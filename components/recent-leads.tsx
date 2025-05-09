"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import Link from "next/link";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  status: string;
  franchise_name: string;
  phone_number: string;
  created_at: string;
}

export function RecentLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchLeads() {
      try {
        setLoading(true);

        // Obtener leads recientes
        const { data, error } = await supabase
          .from("leads")
          .select(
            `
            id, name, phone, email, date, status, created_at,
            franchises (name),
            franchise_phones (phone_number)
          `
          )
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;

        // Formatear los datos
        const formattedLeads = data.map((lead) => ({
          id: lead.id,
          name: lead.name || "Sin nombre",
          phone: lead.phone || "Sin teléfono",
          email: lead.email || "Sin email",
          date: lead.date,
          status: lead.status,
          franchise_name:
            (Array.isArray(lead.franchises) && lead.franchises[0]?.name) ||
            "Sin franquicia",
          phone_number:
            (Array.isArray(lead.franchise_phones) &&
              lead.franchise_phones[0]?.phone_number) ||
            "Sin teléfono asignado",
          created_at: lead.created_at,
        }));

        setLeads(formattedLeads);
      } catch (error) {
        console.error("Error fetching leads:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, [supabase]);

  // Función para renderizar el badge de estado
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Pendiente":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pendiente
          </Badge>
        );
      case "converted":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Convertido
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Rechazado
          </Badge>
        );
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Leads Recientes</CardTitle>
        <Link href="/dashboard/leads">
          <Button variant="outline" size="sm">
            Ver todos
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No hay leads recientes para mostrar
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Franquicia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>{lead.franchise_name}</TableCell>
                    <TableCell>{renderStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      {new Date(lead.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/leads/${lead.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
