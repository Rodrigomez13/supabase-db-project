"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DatePicker } from "@/components/ui/date-picker";
import { PlusCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getLeadDistributions } from "@/lib/lead-distribution-utils";

interface Server {
  id: string;
  name: string;
}

interface Franchise {
  id: string;
  name: string;
}

interface LeadDistribution {
  id: string;
  date: string;
  server_id: string;
  franchise_id: string;
  franchise_phone_id: string;
  leads_count: number;
  created_at: string;
  servers: {
    name: string;
  };
  franchises: {
    name: string;
  };
  franchise_phones: {
    phone_number: string;
  };
}

export default function LeadDistributionPage() {
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [distributions, setDistributions] = useState<LeadDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date | undefined>(new Date());
  const [filterServer, setFilterServer] = useState<string>("");
  const [filterFranchise, setFilterFranchise] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchDistributions();
  }, [filterDate, filterServer, filterFranchise]);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch servers
      const { data: serversData, error: serversError } = await fetch(
        "/api/servers"
      ).then((res) => res.json());

      if (serversError) throw new Error(serversError);

      // Fetch franchises
      const { data: franchisesData, error: franchisesError } = await fetch(
        "/api/franchises"
      ).then((res) => res.json());

      if (franchisesError) throw new Error(franchisesError);

      setServers(serversData || []);
      setFranchises(franchisesData || []);
      setError(null);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setError(
        "No se pudieron cargar los datos. Por favor, intenta de nuevo más tarde."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchDistributions() {
    try {
      setLoading(true);

      if (!filterDate) return;

      // Obtener distribuciones usando la nueva función
      const {
        success,
        data,
        error: distError,
      } = await getLeadDistributions(
        filterDate,
        filterServer || undefined,
        filterFranchise || undefined
      );

      if (!success) {
        throw new Error(distError);
      }

      setDistributions(
        (data || []).map((dist: any) => ({
          ...dist,
          servers: dist.servers[0] || { name: "" },
          franchises: dist.franchises[0] || { name: "" },
          franchise_phones: dist.franchise_phones[0] || { phone_number: "" },
        }))
      );
      setError(null);
    } catch (error: any) {
      console.error("Error fetching distributions:", error);
      setError("Error al cargar las distribuciones: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const resetFilters = () => {
    setFilterDate(new Date());
    setFilterServer("");
    setFilterFranchise("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Distribución de Leads</h1>
        <Button
          onClick={() =>
            router.push("/dashboard/advertising/distribution/assign")
          }
          className="bg-primary hover:bg-primary/90"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Asignar Leads
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Filtros</span>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-filter">Fecha</Label>
              <DatePicker date={filterDate} setDate={setFilterDate} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="server-filter">Servidor</Label>
              <Select value={filterServer} onValueChange={setFilterServer}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los servidores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los servidores</SelectItem>
                  {servers.map((server) => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="franchise-filter">Franquicia</Label>
              <Select
                value={filterFranchise}
                onValueChange={setFilterFranchise}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las franquicias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las franquicias</SelectItem>
                  {franchises.map((franchise) => (
                    <SelectItem key={franchise.id} value={franchise.id}>
                      {franchise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuciones de Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Cargando distribuciones...</div>
          ) : distributions.length === 0 ? (
            <div className="text-center py-4">
              No hay distribuciones para los filtros seleccionados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Servidor</TableHead>
                    <TableHead>Franquicia</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Creado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributions.map((dist) => (
                    <TableRow key={dist.id}>
                      <TableCell>
                        {new Date(dist.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{dist.servers?.name}</TableCell>
                      <TableCell>{dist.franchises?.name}</TableCell>
                      <TableCell>
                        {dist.franchise_phones?.phone_number}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10">
                          {dist.leads_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(dist.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
