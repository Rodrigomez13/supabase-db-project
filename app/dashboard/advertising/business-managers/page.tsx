"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { safeQuery, safeDelete } from "@/lib/safe-query";

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

  useEffect(() => {
    fetchBusinessManagers();
  }, []);

  async function fetchBusinessManagers() {
    try {
      setLoading(true);

      // Usamos nuestra función de consulta segura
      const data = await safeQuery<BusinessManager>("business_managers", {
        orderBy: { column: "created_at", ascending: false },
        relationships: "portfolios (name)",
      });

      setBusinessManagers(data);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Business Managers</h1>
        <Link href="/dashboard/advertising/business-managers/new">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Business Manager
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">Cargando business managers...</div>
          ) : businessManagers.length === 0 ? (
            <div className="p-6 text-center">
              No hay business managers registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>ID de Business Manager</TableHead>
                  <TableHead>Portfolio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessManagers.map((bm) => (
                  <TableRow key={bm.id}>
                    <TableCell className="font-medium">{bm.name}</TableCell>
                    <TableCell>{bm.bm_id}</TableCell>
                    <TableCell>{bm.portfolios?.name || "N/A"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          bm.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {bm.status === "active" ? "Activo" : "Inactivo"}
                      </span>
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
    </div>
  );
}
