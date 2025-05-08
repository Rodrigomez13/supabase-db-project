"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { safeQuery, safeInsert } from "@/lib/safe-query";

interface Wallet {
  id: string;
  name: string;
}

export default function NewPortfolioPage() {
  const [formData, setFormData] = useState({
    name: "",
    account_id: "",
    spend_limit: 0,
    status: "Activo",
    wallet_id: "",
  });
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchWallets();
  }, []);

  async function fetchWallets() {
    try {
      const data = await safeQuery<Wallet>("wallets", {
        orderBy: { column: "name" },
      });

      setWallets(data);
    } catch (error) {
      console.error("Error fetching wallets:", error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await safeInsert("portfolios", formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push("/dashboard/advertising/portfolios");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Nuevo Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_id">ID de Cuenta</Label>
              <Input
                id="account_id"
                name="account_id"
                value={formData.account_id}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spend_limit">Límite de Gasto</Label>
              <Input
                id="spend_limit"
                name="spend_limit"
                type="number"
                step="0.01"
                value={formData.spend_limit}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet_id">Cuenta Publicitaria</Label>
              <Select
                onValueChange={(value) =>
                  handleSelectChange("wallet_id", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una cuenta publicitaria" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                defaultValue="Activo"
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Portfolio"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
