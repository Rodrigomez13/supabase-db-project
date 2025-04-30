"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
import { StatusBadge } from "@/components/status-badge";

interface Portfolio {
  id: string;
  name: string;
  account_id: string;
  spend_limit: number;
  status: string;
  wallet_id: string;
  created_at: string;
}

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  async function fetchPortfolios() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setPortfolios(data);
      }
      setError(null);
    } catch (err: any) {
      console.error("Error fetching portfolios:", err);
      setError(
        "No se pudieron cargar los portfolios. Por favor, intenta de nuevo más tarde."
      );
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  }

  async function deletePortfolio(id: string) {
    try {
      const { error } = await supabase.from("portfolios").delete().eq("id", id);

      if (error) {
        throw error;
      }

      // Actualizamos la lista localmente para evitar otra consulta
      setPortfolios(portfolios.filter((portfolio) => portfolio.id !== id));
    } catch (err: any) {
      console.error("Error deleting portfolio:", err);
      setError(
        `Error al eliminar portfolio: ${err.message || "Error desconocido"}`
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-usina-text-primary">
          Portfolios
        </h1>
        <Link href="/dashboard/advertising/portfolios/new">
          <Button className="bg-usina-primary hover:bg-usina-secondary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Portfolio
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <Card className="border-usina-card bg-background/5">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-usina-text-secondary">
              Cargando portfolios...
            </div>
          ) : portfolios.length === 0 ? (
            <div className="p-6 text-center text-usina-text-secondary">
              No hay portfolios registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-usina-card/20">
                  <TableHead className="text-usina-text-secondary">
                    Nombre
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    ID de Cuenta
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Límite de Gasto
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Estado
                  </TableHead>
                  <TableHead className="text-right text-usina-text-secondary">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolios.map((portfolio) => (
                  <TableRow key={portfolio.id} className="border-usina-card/20">
                    <TableCell className="font-medium text-usina-text-primary">
                      {portfolio.name}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {portfolio.account_id}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      ${portfolio.spend_limit?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={portfolio.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/dashboard/advertising/portfolios/${portfolio.id}`}
                        >
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-usina-primary/30 text-usina-primary hover:bg-usina-primary/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-usina-danger/30 text-usina-danger hover:bg-usina-danger/10"
                          onClick={() => {
                            if (
                              confirm(
                                "¿Estás seguro de eliminar este portfolio?"
                              )
                            ) {
                              deletePortfolio(portfolio.id);
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
