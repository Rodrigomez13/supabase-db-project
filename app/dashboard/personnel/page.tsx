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
import { PlusIcon, Pencil, Trash2, Calendar } from "lucide-react";
import Link from "next/link";
import {
  type Employee,
  getEmployees,
  deleteEmployee,
} from "@/lib/queries/employee-queries";

export default function PersonnelPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(data);
      setError(null);
    } catch (err: any) {
      console.error("Error loading employees:", err);
      setError(
        "No se pudieron cargar los empleados. Por favor, intenta de nuevo más tarde."
      );
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEmployee(id: string) {
    try {
      const result = await deleteEmployee(id);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Actualizamos la lista localmente para evitar otra consulta
      setEmployees(employees.filter((employee) => employee.id !== id));
    } catch (err: any) {
      console.error("Error deleting employee:", err);
      setError(
        `Error al eliminar empleado: ${err.message || "Error desconocido"}`
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Personal</h1>
        <div className="flex space-x-2">
          <Link href="/dashboard/personnel/attendance">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Asistencia
            </Button>
          </Link>
          <Link href="/dashboard/personnel/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuevo Empleado
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">Cargando empleados...</div>
          ) : employees.length === 0 ? (
            <div className="p-6 text-center">No hay empleados registrados</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Salario</TableHead>
                  <TableHead>Día Libre</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.name}
                    </TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>{employee.shift}</TableCell>
                    <TableCell>{employee.account}</TableCell>
                    <TableCell>${employee.salary.toFixed(2)}</TableCell>
                    <TableCell>{employee.day_off}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/dashboard/personnel/${employee.id}`}>
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
                                "¿Estás seguro de eliminar este empleado?"
                              )
                            ) {
                              handleDeleteEmployee(employee.id);
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
