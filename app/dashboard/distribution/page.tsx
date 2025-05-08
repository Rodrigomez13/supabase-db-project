"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Loader2,
  Phone,
  PlusCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";

interface Franchise {
  id: string;
  name: string;
}

interface FranchisePhone {
  id: string;
  franchise_id: string;
  phone_number: string;
  order_number: number;
}

interface DistributionGoal {
  id: string;
  franchise_id: string;
  daily_goal: number;
  priority: number;
  is_active: boolean;
  franchise_name: string;
  current_count: number;
  progress: number;
}

interface DailyDistribution {
  id: string;
  date: string;
  franchise_id: string;
  franchise_phone_id: string;
  conversions_count: number;
  franchise_name: string;
  phone_number: string;
}

export default function DistributionPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [phones, setPhones] = useState<FranchisePhone[]>([]);
  const [goals, setGoals] = useState<DistributionGoal[]>([]);
  const [distributions, setDistributions] = useState<DailyDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    franchise_id: "",
    phone_id: "",
    count: 1,
  });
  const [nextFranchise, setNextFranchise] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [nextPhone, setNextPhone] = useState<{
    id: string;
    number: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    if (formData.franchise_id) {
      fetchPhones(formData.franchise_id);
    } else {
      setPhones([]);
    }
  }, [formData.franchise_id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateStr = selectedDate.toISOString().split("T")[0];

      // Obtener franquicias
      const { data: franchisesData, error: franchisesError } = await supabase
        .from("franchises")
        .select("id, name")
        .order("name");

      if (franchisesError) throw franchisesError;

      // Obtener metas de distribución con progreso actual
      const { data: goalsData, error: goalsError } = await supabase
        .from("distribution_goals")
        .select(
          `
          id, 
          franchise_id, 
          daily_goal, 
          priority, 
          is_active,
          franchises (name)
        `
        )
        .order("priority");

      if (goalsError) throw goalsError;

      // Obtener distribuciones del día
      const { data: distributionsData, error: distributionsError } =
        await supabase
          .from("daily_distribution")
          .select(
            `
          id,
          date,
          franchise_id,
          franchise_phone_id,
          conversions_count,
          franchises (name),
          franchise_phones (phone_number)
        `
          )
          .eq("date", dateStr)
          .order("created_at", { ascending: false });

      if (distributionsError) throw distributionsError;

      // Procesar datos de distribución
      const processedDistributions =
        distributionsData?.map((dist) => ({
          id: dist.id,
          date: dist.date,
          franchise_id: dist.franchise_id,
          franchise_phone_id: dist.franchise_phone_id,
          conversions_count: dist.conversions_count,
          franchise_name: Array.isArray(dist.franchises) 
            ? (dist.franchises[0] as { name: string })?.name || "" 
            : (dist.franchises as { name: string })?.name || "", // Ajuste para acceder directamente al nombre
          phone_number: Array.isArray(dist.franchise_phones) && dist.franchise_phones.length > 0 ? dist.franchise_phones[0].phone_number || "" : "", // Ajuste para acceder directamente al número
        })) || [];

      // Calcular totales por franquicia
      const franchiseTotals: Record<string, number> = {};
      processedDistributions.forEach((dist) => {
        franchiseTotals[dist.franchise_id] =
          (franchiseTotals[dist.franchise_id] || 0) + dist.conversions_count;
      });

      // Procesar metas con progreso
      const processedGoals =
        goalsData?.map((goal) => {
          const currentCount = franchiseTotals[goal.franchise_id] || 0;
          const progress =
            goal.daily_goal > 0
              ? Math.min(100, (currentCount / goal.daily_goal) * 100)
              : 0;

          return {
            id: goal.id,
            franchise_id: goal.franchise_id,
            daily_goal: goal.daily_goal,
            priority: goal.priority,
            is_active: goal.is_active,
            franchise_name: Array.isArray(goal.franchises) && goal.franchises.length > 0 
              ? goal.franchises[0].name || "" 
              : Array.isArray(goal.franchises) 
                ? goal.franchises[0]?.name || "" 
                : (goal.franchises as { name: string })?.name || "", // Ajuste para manejar tanto arrays como objetos
            current_count: currentCount,
            progress,
          };
        }) || [];

      // Determinar la siguiente franquicia y teléfono para asignación automática
      await determineNextAssignment(processedGoals, franchiseTotals);

      setFranchises(franchisesData || []);
      setGoals(processedGoals);
      setDistributions(processedDistributions);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(`Error al cargar datos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhones = async (franchiseId: string) => {
    try {
      const { data, error } = await supabase
        .from("franchise_phones")
        .select("id, franchise_id, phone_number, order_number")
        .eq("franchise_id", franchiseId)
        .eq("is_active", true)
        .order("order_number");

      if (error) throw error;

      setPhones(data || []);

      // Seleccionar automáticamente el primer teléfono
      if (data && data.length > 0) {
        setFormData((prev) => ({ ...prev, phone_id: data[0].id }));
      } else {
        setFormData((prev) => ({ ...prev, phone_id: "" }));
      }
    } catch (err: any) {
      console.error("Error fetching phones:", err);
      toast({
        title: "Error",
        description: `Error al cargar teléfonos: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const determineNextAssignment = async (
    currentGoals: DistributionGoal[],
    totals: Record<string, number>
  ) => {
    try {
      // Encontrar la primera franquicia activa que no haya alcanzado su meta
      const nextGoal = currentGoals
        .filter((g) => g.is_active)
        .find((g) => g.current_count < g.daily_goal);

      if (!nextGoal) {
        // Si todas alcanzaron sus metas, usar la primera por prioridad
        const firstGoal = currentGoals
          .filter((g) => g.is_active)
          .sort((a, b) => a.priority - b.priority)[0];

        if (firstGoal) {
          setNextFranchise({
            id: firstGoal.franchise_id,
            name: firstGoal.franchise_name,
          });
        } else {
          setNextFranchise(null);
        }
      } else {
        setNextFranchise({
          id: nextGoal.franchise_id,
          name: nextGoal.franchise_name,
        });
      }

      // Si tenemos una franquicia seleccionada, buscar el siguiente teléfono
      if (nextFranchise) {
        const { data, error } = await supabase.rpc("get_next_franchise_phone", {
          p_franchise_id: nextFranchise.id,
        });

        if (error) throw error;

        if (data) {
          // Obtener detalles del teléfono
          const { data: phoneData, error: phoneError } = await supabase
            .from("franchise_phones")
            .select("phone_number")
            .eq("id", data)
            .single();

          if (phoneError) throw phoneError;

          setNextPhone({
            id: data,
            number: phoneData?.phone_number || "",
          });
        } else {
          setNextPhone(null);
        }
      } else {
        setNextPhone(null);
      }
    } catch (err: any) {
      console.error("Error determining next assignment:", err);
      // No mostrar error al usuario, solo log
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "count" ? Math.max(1, Number.parseInt(value) || 1) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleManualDistribution = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!formData.franchise_id || !formData.phone_id || formData.count < 1) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos correctamente",
          variant: "destructive",
        });
        return;
      }

      const dateStr = selectedDate.toISOString().split("T")[0];

      // Verificar si ya existe una distribución para esta franquicia y teléfono hoy
      const { data: existingData, error: existingError } = await supabase
        .from("daily_distribution")
        .select("id, conversions_count")
        .eq("date", dateStr)
        .eq("franchise_id", formData.franchise_id)
        .eq("franchise_phone_id", formData.phone_id)
        .maybeSingle();

      if (existingError) throw existingError;

      let result;

      if (existingData) {
        // Actualizar distribución existente
        const newCount = existingData.conversions_count + formData.count;

        result = await supabase
          .from("daily_distribution")
          .update({
            conversions_count: newCount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingData.id)
          .select();
      } else {
        // Crear nueva distribución
        result = await supabase
          .from("daily_distribution")
          .insert({
            date: dateStr,
            franchise_id: formData.franchise_id,
            franchise_phone_id: formData.phone_id,
            conversions_count: formData.count,
          })
          .select();
      }

      if (result.error) throw result.error;

      toast({
        title: "Distribución exitosa",
        description: `Se han asignado ${formData.count} conversiones correctamente`,
      });

      // Resetear formulario y recargar datos
      setFormData({
        franchise_id: "",
        phone_id: "",
        count: 1,
      });

      fetchData();
    } catch (err: any) {
      console.error("Error distributing conversions:", err);
      setError(`Error al distribuir conversiones: ${err.message}`);
      toast({
        title: "Error",
        description: `Error al distribuir conversiones: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoDistribution = async () => {
    try {
      if (!nextFranchise || !nextPhone) {
        toast({
          title: "Error",
          description:
            "No se pudo determinar la siguiente asignación automática",
          variant: "destructive",
        });
        return;
      }

      setSubmitting(true);
      setError(null);

      const dateStr = selectedDate.toISOString().split("T")[0];
      const count = formData.count || 1;

      // Verificar si ya existe una distribución para esta franquicia y teléfono hoy
      const { data: existingData, error: existingError } = await supabase
        .from("daily_distribution")
        .select("id, conversions_count")
        .eq("date", dateStr)
        .eq("franchise_id", nextFranchise.id)
        .eq("franchise_phone_id", nextPhone.id)
        .maybeSingle();

      if (existingError) throw existingError;

      let result;

      if (existingData) {
        // Actualizar distribución existente
        const newCount = existingData.conversions_count + count;

        result = await supabase
          .from("daily_distribution")
          .update({
            conversions_count: newCount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingData.id)
          .select();
      } else {
        // Crear nueva distribución
        result = await supabase
          .from("daily_distribution")
          .insert({
            date: dateStr,
            franchise_id: nextFranchise.id,
            franchise_phone_id: nextPhone.id,
            conversions_count: count,
          })
          .select();
      }

      if (result.error) throw result.error;

      toast({
        title: "Distribución automática exitosa",
        description: `Se han asignado ${count} conversiones a ${nextFranchise.name} (${nextPhone.number})`,
      });

      // Recargar datos para actualizar la siguiente asignación
      fetchData();
    } catch (err: any) {
      console.error("Error in auto distribution:", err);
      setError(`Error en distribución automática: ${err.message}`);
      toast({
        title: "Error",
        description: `Error en distribución automática: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const refreshData = () => {
    fetchData();
    toast({
      title: "Datos actualizados",
      description: "Los datos de distribución han sido actualizados",
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Distribución de Conversiones</h1>
          <p className="text-muted-foreground">
            Asigna conversiones a franquicias según las metas diarias
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DatePicker date={selectedDate} setDate={handleDateChange} />
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Progreso de Metas Diarias</CardTitle>
            <CardDescription>
              Seguimiento de las metas de distribución para{" "}
              {selectedDate.toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : goals.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No hay metas configuradas</AlertTitle>
                <AlertDescription>
                  No hay metas de distribución configuradas. Por favor,
                  configura las metas en el panel de administración.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {goals
                  .filter((g) => g.is_active)
                  .map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{goal.franchise_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {goal.current_count} / {goal.daily_goal} (
                          {Math.round(goal.progress)}%)
                        </div>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asignar Conversiones</CardTitle>
            <CardDescription>
              Distribuye conversiones a franquicias y teléfonos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="auto" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="auto">Automático</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>

              <TabsContent value="auto" className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="text-sm font-medium mb-2">
                      Siguiente asignación:
                    </div>
                    {nextFranchise && nextPhone ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-primary/10">
                            {nextFranchise.name}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline" className="bg-secondary/10">
                            <Phone className="h-3 w-3 mr-1" />
                            {nextPhone.number}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Basado en las metas diarias y prioridades configuradas
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No se pudo determinar la siguiente asignación
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auto_count">Cantidad de conversiones</Label>
                    <Input
                      id="auto_count"
                      name="count"
                      type="number"
                      min="1"
                      value={formData.count}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                  </div>

                  <Button
                    onClick={handleAutoDistribution}
                    disabled={submitting || !nextFranchise || !nextPhone}
                    className="w-full"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Asignando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Asignar Automáticamente
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="franchise_id">Franquicia</Label>
                    <Select
                      value={formData.franchise_id}
                      onValueChange={(value) =>
                        handleSelectChange("franchise_id", value)
                      }
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar franquicia" />
                      </SelectTrigger>
                      <SelectContent>
                        {franchises.map((franchise) => (
                          <SelectItem key={franchise.id} value={franchise.id}>
                            {franchise.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_id">Teléfono</Label>
                    <Select
                      value={formData.phone_id}
                      onValueChange={(value) =>
                        handleSelectChange("phone_id", value)
                      }
                      disabled={
                        submitting ||
                        !formData.franchise_id ||
                        phones.length === 0
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar teléfono" />
                      </SelectTrigger>
                      <SelectContent>
                        {phones.map((phone) => (
                          <SelectItem key={phone.id} value={phone.id}>
                            {phone.phone_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.franchise_id && phones.length === 0 && (
                      <p className="text-sm text-destructive">
                        Esta franquicia no tiene teléfonos activos
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="count">Cantidad de conversiones</Label>
                    <Input
                      id="count"
                      name="count"
                      type="number"
                      min="1"
                      value={formData.count}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                  </div>

                  <Button
                    onClick={handleManualDistribution}
                    disabled={
                      submitting || !formData.franchise_id || !formData.phone_id
                    }
                    className="w-full"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Asignando...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Asignar Manualmente
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribuciones del Día</CardTitle>
          <CardDescription>
            Conversiones asignadas para {selectedDate.toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : distributions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay distribuciones registradas para esta fecha
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Franquicia</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Conversiones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributions.map((dist) => (
                  <TableRow key={dist.id}>
                    <TableCell className="font-medium">
                      {dist.franchise_name}
                    </TableCell>
                    <TableCell>{dist.phone_number}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {dist.conversions_count}
                      </Badge>
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
