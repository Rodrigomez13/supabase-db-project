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

interface Wallet {
  id: string;
  name: string;
  account_number: string;
  balance: number;
  currency: string;
  created_at: string;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWallets();
  }, []);

  async function fetchWallets() {
    try {
      setLoading(true);

      // Usamos nuestra función de consulta segura
      const data = await safeQuery<Wallet>("wallets", {
        orderBy: { column: "created_at", ascending: false },
      });

      setWallets(data);
      setError(null);
    } catch (err: any) {
      console.error("Error loading wallets:", err);
      setError(
        "No se pudieron cargar las cuentas publicitarias. Por favor, intenta de nuevo más tarde."
      );
      setWallets([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteWallet(id: string) {
    try {
      const result = await safeDelete("wallets", id);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Actualizamos la lista localmente para evitar otra consulta
      setWallets(wallets.filter((wallet) => wallet.id !== id));
    } catch (err: any) {
      console.error("Error deleting wallet:", err);
      setError(
        `Error al eliminar cuenta publicitaria: ${
          err.message || "Error desconocido"
        }`
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-usina-text-primary">
          Cuentas Publicitarias
        </h1>
        <Link href="/dashboard/advertising/wallets/new">
          <Button className="bg-usina-primary hover:bg-usina-secondary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Cuenta
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
              Cargando cuentas publicitarias...
            </div>
          ) : wallets.length === 0 ? (
            <div className="p-6 text-center text-usina-text-secondary">
              No hay cuentas publicitarias registradas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-usina-card/20">
                  <TableHead className="text-usina-text-secondary">
                    Nombre
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Número de Cuenta
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Balance
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Moneda
                  </TableHead>
                  <TableHead className="text-right text-usina-text-secondary">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((wallet) => (
                  <TableRow key={wallet.id} className="border-usina-card/20">
                    <TableCell className="font-medium text-usina-text-primary">
                      {wallet.name}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {wallet.account_number}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {wallet.balance?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {wallet.currency}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/dashboard/advertising/wallets/${wallet.id}`}
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
                                "¿Estás seguro de eliminar esta cuenta publicitaria?"
                              )
                            ) {
                              deleteWallet(wallet.id);
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
