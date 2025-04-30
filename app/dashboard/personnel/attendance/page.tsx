"use client";

import type React from "react";

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
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { safeQuery, safeInsert } from "@/lib/safe-query";

interface Employee {
  id: string;
  name: string;
  role: string;
  day_off: string;
}

interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  hours_worked: number;
  overtime: number;
  day_off_worked: boolean;
  employees?: {
    name: string;
  };
}

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [formData, setFormData] = useState({
    employee_id: "",
    date: new Date().toISOString().split("T")[0],
    hours_worked: 8,
    overtime: 0,
    day_off_worked: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
    fetchAttendanceForDate(selectedDate);
  }, []);

  useEffect(() => {
    fetchAttendanceForDate(selectedDate);
  }, [selectedDate]);

  const fetchEmployees = async () => {
    try {
      const data = await safeQuery<Employee>("employees", {
        orderBy: { column: "name" },
      });
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchAttendanceForDate = async (date: Date) => {
    try {
      setLoading(true);
      const formattedDate = date.toISOString().split("T")[0];

      const data = await safeQuery<Attendance>("attendance", {
        filters: [{ column: "date", value: formattedDate }],
        relationships: "employees (name)",
      });

      setAttendanceRecords(data);
      setError(null);
    } catch (err: any) {
      console.error("Error loading attendance records:", err);
      setError("No se pudieron cargar los registros de asistencia");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData((prev) => ({
        ...prev,
        date: date.toISOString().split("T")[0],
      }));
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setFormData((prev) => ({
      ...prev,
      employee_id: employeeId,
    }));

    // Verificar si el empleado tiene el día seleccionado como día libre
    const employee = employees.find((emp) => emp.id === employeeId);
    if (employee) {
      const dayOfWeek = new Date(formData.date).toLocaleDateString("en-US", {
        weekday: "lowercase",
      });
      const isDayOff = employee.day_off === dayOfWeek;
      setFormData((prev) => ({
        ...prev,
        day_off_worked: isDayOff,
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      day_off_worked: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await safeInsert("attendance", formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess("Registro de asistencia guardado correctamente");
      fetchAttendanceForDate(selectedDate);

      // Resetear el formulario
      setFormData({
        employee_id: "",
        date: selectedDate.toISOString().split("T")[0],
        hours_worked: 8,
        overtime: 0,
        day_off_worked: false,
      });
      setSelectedEmployee("");
    } catch (err: any) {
      setError(err.message || "Error al guardar el registro de asistencia");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Registro de Asistencia</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendario de Asistencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                className="rounded-md border"
              />
              <p className="text-sm text-muted-foreground">
                Fecha seleccionada: {selectedDate.toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registrar Asistencia</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Empleado</Label>
                <Select
                  value={selectedEmployee}
                  onValueChange={handleEmployeeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours_worked">Horas Trabajadas</Label>
                <Input
                  id="hours_worked"
                  name="hours_worked"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.hours_worked}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="overtime">Horas Extra</Label>
                <Input
                  id="overtime"
                  name="overtime"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.overtime}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="day_off_worked"
                  checked={formData.day_off_worked}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="day_off_worked">Trabajó en día libre</Label>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert
                  variant="default"
                  className="bg-green-50 text-green-800 border-green-200"
                >
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !selectedEmployee}
              >
                {isSubmitting ? "Guardando..." : "Registrar Asistencia"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Registros de Asistencia para {selectedDate.toLocaleDateString()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Cargando registros...</div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-4">
              No hay registros de asistencia para esta fecha
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Horas Trabajadas</TableHead>
                  <TableHead>Horas Extra</TableHead>
                  <TableHead>Día Libre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.employees?.name}</TableCell>
                    <TableCell>{record.hours_worked}</TableCell>
                    <TableCell>{record.overtime}</TableCell>
                    <TableCell>
                      {record.day_off_worked ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                          Trabajó en día libre
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Día normal
                        </span>
                      )}
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
