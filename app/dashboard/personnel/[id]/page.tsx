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

interface Employee {
  id: string;
  name: string;
  role: string;
  shift: string;
  account: string;
  salary: number;
  day_off: string;
}

export default function EditEmployeePage({
  params,
}: {
  params: { id: string };
}) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Employee>({
    id: "",
    name: "",
    role: "",
    shift: "",
    account: "",
    salary: 0,
    day_off: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      fetchEmployee(params.id);
    }
  }, [params.id]);

  const fetchEmployee = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await safeQuery<Employee>("employees", {
        filters: [{ column: "id", value: id }],
      });

      if (data.length > 0) {
        setEmployee(data[0]);
        setFormData(data[0]);
      } else {
        setError("Empleado no encontrado");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar el empleado");
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
      const result = await safeUpdate("employees", params.id, formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push("/dashboard/personnel");
    } catch (err: any) {
      setError(err.message || "Error al actualizar el empleado");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Cargando empleado...</p>
      </div>
    );
  }

  if (!employee && !isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert variant="destructive">
          <AlertDescription>Empleado no encontrado</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Editar Empleado</CardTitle>
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
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleSelectChange("role", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="operator">Operador</SelectItem>
                  <SelectItem value="support">Soporte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift">Turno</Label>
              <Select
                value={formData.shift}
                onValueChange={(value) => handleSelectChange("shift", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Mañana</SelectItem>
                  <SelectItem value="afternoon">Tarde</SelectItem>
                  <SelectItem value="night">Noche</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Cuenta</Label>
              <Input
                id="account"
                name="account"
                value={formData.account || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Salario</Label>
              <Input
                id="salary"
                name="salary"
                type="number"
                step="0.01"
                value={formData.salary}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="day_off">Día Libre</Label>
              <Select
                value={formData.day_off}
                onValueChange={(value) => handleSelectChange("day_off", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un día" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Lunes</SelectItem>
                  <SelectItem value="tuesday">Martes</SelectItem>
                  <SelectItem value="wednesday">Miércoles</SelectItem>
                  <SelectItem value="thursday">Jueves</SelectItem>
                  <SelectItem value="friday">Viernes</SelectItem>
                  <SelectItem value="saturday">Sábado</SelectItem>
                  <SelectItem value="sunday">Domingo</SelectItem>
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
