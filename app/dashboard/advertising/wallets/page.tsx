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
import { PlusIcon, Pencil, Trash2, Search } from "lucide-react";
import Link from "next/link";
import { safeQuery, safeDelete } from "@/lib/safe-query";
import { Input } from "@/components/ui/input";

// Definir interfaces para los datos relacionados
interface PortfolioData {
  name: string;
}

interface WalletData {
  name: string;
}

interface AdvertisingAccount {
  id: string;
  name: string;
  account_id: string;
  platform: string;
  status: string;
  portfolio_id?: string | null;
  portfolio?: PortfolioData | null;
  wallet_id?: string | null;
  wallet?: WalletData | null;
  created_at: string;
}

// Definir la estructura de respuesta de safeQuery
interface SafeQueryResponse<T> {
  data: T[] | null;
  error: string | null;
  success: boolean;
}

export default function AdvertisingAccountsPage() {
  const [accounts, setAccounts] = useState<AdvertisingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAdvertisingAccounts();
  }, []);

  async function fetchAdvertisingAccounts() {
    try {
      setLoading(true);
      setError(null);

      const result = (await safeQuery<AdvertisingAccount>(
        "advertising_accounts",
        {
          select: `
          id, 
          name, 
          account_id, 
          platform, 
          status, 
          portfolio_id, 
          portfolio:portfolio_id(name), 
          wallet_id, 
          wallet:wallet_id(name), 
          created_at
        `,
          orderBy: { column: "created_at", ascending: false },
        }
      )) as unknown as SafeQueryResponse<AdvertisingAccount>;

      if (result.error) {
        throw new Error(result.error);
      }

      setAccounts(result.data ?? []);
    } catch (err: any) {
      console.error("Error loading advertising accounts:", err);
      setError(
        `No se pudieron cargar las cuentas publicitarias: ${
          err.message ?? "Error desconocido"
        }`
      );
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAccount(id: string) {
    try {
      const result = await safeDelete("advertising_accounts", id);

      if (!result.success) {
        throw new Error(result.error ?? "Error desconocido");
      }

      setAccounts(accounts.filter((account) => account.id !== id));
    } catch (err: any) {
      console.error("Error deleting advertising account:", err);
      setError(
        `Error al eliminar cuenta publicitaria: ${
          err.message ?? "Error desconocido"
        }`
      );
    }
  }

  const filteredAccounts = accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.portfolio?.name &&
        account.portfolio.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (account.wallet?.name &&
        account.wallet.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-usina-text-primary">
            Cuentas Publicitarias
          </h1>
          <p className="text-usina-text-secondary">
            Gestiona tus cuentas publicitarias en diferentes plataformas
          </p>
        </div>
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

      <div className="flex justify-end mb-4">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar cuentas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-background/10 border-usina-card/30"
          />
        </div>
      </div>

      <Card className="border-usina-card bg-background/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-usina-text-primary">
            Cuentas Publicitarias
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-usina-text-secondary">
              Cargando cuentas publicitarias...
            </div>
          ) : filteredAccounts.length === 0 ? (
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
                    ID de Cuenta
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Plataforma
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Portfolio
                  </TableHead>
                  <TableHead className="text-usina-text-secondary">
                    Billetera
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
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id} className="border-usina-card/20">
                    <TableCell className="font-medium text-usina-text-primary">
                      {account.name}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {account.account_id}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {account.platform}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {account.portfolio?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-usina-text-secondary">
                      {account.wallet?.name ?? "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          account.status === "Activo"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {account.status === "Activo" ? "Activa" : "Inactiva"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/dashboard/advertising/wallets/${account.id}`}
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
                              deleteAccount(account.id);
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
