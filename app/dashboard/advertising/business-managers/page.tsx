"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusIcon,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { safeDelete } from "@/lib/safe-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

interface BusinessManager {
  id: string;
  name: string;
  bm_id: string;
  status: string;
  portfolio_id: string;
  created_at: string;
  portfolios?: {
    name: string;
  };
}

export default function BusinessManagersPage() {
  const [businessManagers, setBusinessManagers] = useState<BusinessManager[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedBMs, setExpandedBMs] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchBusinessManagers();
  }, []);

  async function fetchBusinessManagers() {
    try {
      setLoading(true);

      // Obtener business managers con sus portfolios
      const { data: bms, error: bmError } = await supabase
        .from("business_managers")
        .select(
          `
          id, 
          name, 
          bm_id, 
          status, 
          portfolio_id, 
          created_at,
          portfolios (name)
        `
        )
        .order("created_at", { ascending: false });

      if (bmError) throw bmError;

      setBusinessManagers(
        (bms || []).map((bm) => ({
          ...bm,
          portfolios: bm.portfolios?.[0] || undefined,
        }))
      );
      setError(null);
    } catch (err: any) {
      console.error("Error loading business managers:", err);
      setError(
        "No se pudieron cargar los business managers. Por favor, intenta de nuevo más tarde."
      );
      setBusinessManagers([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteBusinessManager(id: string) {
    try {
      const result = await safeDelete("business_managers", id);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Actualizamos la lista localmente para evitar otra consulta
      setBusinessManagers(businessManagers.filter((bm) => bm.id !== id));
    } catch (err: any) {
      console.error("Error deleting business manager:", err);
      setError(
        `Error al eliminar business manager: ${
          err.message || "Error desconocido"
        }`
      );
    }
  }

  const toggleBM = (id: string) => {
    setExpandedBMs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredBusinessManagers = businessManagers.filter((bm) => {
    // Filtrar por búsqueda
    const matchesSearch =
      bm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bm.bm_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bm.portfolios?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    // Filtrar por estado
    const matchesStatus =
      activeTab === "all" ||
      (activeTab === "active" && bm.status === "active") ||
      (activeTab === "inactive" && bm.status !== "active");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Business Managers</h1>
          <p className="text-muted-foreground">
            Gestiona tus Business Managers y sus campañas publicitarias
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/dashboard/advertising/business-managers/settings">
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard/advertising/business-managers/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuevo Business Manager
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="inactive">Inactivos</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar business managers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Business Managers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">Cargando business managers...</div>
          ) : filteredBusinessManagers.length === 0 ? (
            <div className="p-6 text-center">
              No hay business managers registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">Nombre</TableHead>
                  <TableHead>ID de Business Manager</TableHead>
                  <TableHead>Portfolio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBusinessManagers.map((bm) => (
                  <TableRow key={bm.id}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => toggleBM(bm.id)}
                        className="flex items-center space-x-2 focus:outline-none"
                      >
                        {expandedBMs[bm.id] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span>{bm.name}</span>
                      </button>
                    </TableCell>
                    <TableCell>{bm.bm_id}</TableCell>
                    <TableCell>{bm.portfolios?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          bm.status === "active" ? "success" : "secondary"
                        }
                      >
                        {bm.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/dashboard/advertising/business-managers/${bm.id}`}
                        >
                          <Button variant="outline" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (
                              confirm(
                                "¿Estás seguro de eliminar este business manager?"
                              )
                            ) {
                              deleteBusinessManager(bm.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Próximos pasos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Campañas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Gestiona tus campañas publicitarias y sus métricas.
              </p>
              <Link href="/dashboard/advertising/campaigns">
                <Button className="w-full">Ver campañas</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conjuntos de anuncios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Administra los conjuntos de anuncios de tus campañas.
              </p>
              <Link href="/dashboard/advertising/ad-sets">
                <Button className="w-full">Ver conjuntos</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anuncios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Visualiza y edita los anuncios individuales.
              </p>
              <Link href="/dashboard/advertising/ads">
                <Button className="w-full">Ver anuncios</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
