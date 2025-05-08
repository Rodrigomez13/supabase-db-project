"use client";

import type React from "react";

import { useEffect, useState } from "react";
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
import { safeQuery, safeUpdate } from "@/lib/safe-query";

interface Wallet {
  id: string;
  name: string;
  account_number: string;
  balance: number;
  currency: string;
}

export default function EditWalletPage({ params }: { params: { id: string } }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [formData, setFormData] = useState<Wallet>({
    id: "",
    name: "",
    account_number: "",
    balance: 0,
    currency: "USD",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      fetchWallet(params.id);
    }
  }, [params.id]);

  const fetchWallet = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await safeQuery<Wallet>("wallets", {
        where: { id },
      });

      if (data.length > 0) {
        setWallet(data[0]);
        setFormData(data[0]);
      } else {
        setError("Cuenta publicitaria no encontrada");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar la cuenta publicitaria");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const result = await safeUpdate("wallets", params.id, formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push("/dashboard/advertising/wallets");
    } catch (err: any) {
      setError(err.message || "Error al actualizar la cuenta publicitaria");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Cargando cuenta publicitaria...</p>
      </div>
    );
  }

  if (!wallet && !isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert variant="destructive">
          <AlertDescription>Cuenta publicitaria no encontrada</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Editar Cuenta Publicitaria</CardTitle>
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
              <Label htmlFor="account_number">Número de Cuenta</Label>
              <Input
                id="account_number"
                name="account_number"
                value={formData.account_number || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Balance</Label>
              <Input
                id="balance"
                name="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleSelectChange("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">
                    USD - Dólar Estadounidense
                  </SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                  <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
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
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
