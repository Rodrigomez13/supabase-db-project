"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface PhoneGoal {
  id: string;
  franchise_phone_id: string;
  daily_goal: number;
  weekly_goal: number;
  monthly_goal: number;
  phone_number?: string;
  order_number?: number;
}

export default function PhoneGoalsPage() {
  const params = useParams();
  const franchiseId = params.id as string;
  const [phoneGoals, setPhoneGoals] = useState<PhoneGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [franchiseName, setFranchiseName] = useState("");
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPhoneGoals();
  }, [franchiseId]);

  const fetchPhoneGoals = async () => {
    try {
      setLoading(true);

      // Obtener el nombre de la franquicia
      const { data: franchiseData, error: franchiseError } = await supabase
        .from("franchises")
        .select("name")
        .eq("id", franchiseId)
        .single();

      if (franchiseError) throw franchiseError;
      setFranchiseName(franchiseData.name);

      // Obtener los teléfonos de la franquicia con sus metas
      const { data: phonesData, error: phonesError } = await supabase
        .from("franchise_phones")
        .select("id, phone_number, order_number, is_active")
        .eq("franchise_id", franchiseId)
        .order("order_number");

      if (phonesError) throw phonesError;

      // Obtener las metas para estos teléfonos
      const { data: goalsData, error: goalsError } = await supabase
        .from("phone_goals")
        .select("id, franchise_phone_id, daily_goal, weekly_goal, monthly_goal")
        .in(
          "franchise_phone_id",
          phonesData.map((phone) => phone.id)
        );

      if (goalsError) throw goalsError;

      // Combinar los datos
      const combinedData = phonesData.map((phone) => {
        const goal = goalsData.find((g) => g.franchise_phone_id === phone.id);
        return {
          id: goal?.id || "",
          franchise_phone_id: phone.id,
          phone_number: phone.phone_number,
          order_number: phone.order_number,
          is_active: phone.is_active,
          daily_goal: goal?.daily_goal || 5,
          weekly_goal: goal?.weekly_goal || 30,
          monthly_goal: goal?.monthly_goal || 120,
        };
      });

      setPhoneGoals(combinedData);
    } catch (error) {
      console.error("Error fetching phone goals:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las metas de los teléfonos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoalChange = (index: number, field: string, value: number) => {
    const updatedGoals = [...phoneGoals];
    updatedGoals[index] = {
      ...updatedGoals[index],
      [field]: value,
    };
    setPhoneGoals(updatedGoals);
  };

  const saveGoals = async () => {
    try {
      setSaving(true);

      for (const goal of phoneGoals) {
        if (goal.id) {
          // Actualizar meta existente
          const { error } = await supabase
            .from("phone_goals")
            .update({
              daily_goal: goal.daily_goal,
              weekly_goal: goal.weekly_goal,
              monthly_goal: goal.monthly_goal,
            })
            .eq("id", goal.id);

          if (error) throw error;
        } else {
          // Crear nueva meta
          const { error } = await supabase.from("phone_goals").insert({
            franchise_phone_id: goal.franchise_phone_id,
            daily_goal: goal.daily_goal,
            weekly_goal: goal.weekly_goal,
            monthly_goal: goal.monthly_goal,
          });

          if (error) throw error;
        }
      }

      toast({
        title: "Éxito",
        description: "Metas de teléfonos guardadas correctamente",
      });

      // Recargar los datos
      fetchPhoneGoals();
    } catch (error: any) {
      console.error("Error saving phone goals:", error);
      toast({
        title: "Error",
        description: `No se pudieron guardar las metas: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Metas de Teléfonos</h1>
          <p className="text-muted-foreground">
            Configurar metas de conversiones para los teléfonos de{" "}
            {franchiseName}
          </p>
        </div>
        <Button onClick={saveGoals} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Cambios
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metas por Teléfono</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : phoneGoals.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                No hay teléfonos configurados para esta franquicia
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Meta Diaria</TableHead>
                  <TableHead>Meta Semanal</TableHead>
                  <TableHead>Meta Mensual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phoneGoals.map((goal, index) => (
                  <TableRow key={goal.franchise_phone_id}>
                    <TableCell>{goal.phone_number}</TableCell>
                    <TableCell>{goal.order_number}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={goal.daily_goal}
                        onChange={(e) =>
                          handleGoalChange(
                            index,
                            "daily_goal",
                            Number.parseInt(e.target.value) || 1
                          )
                        }
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={goal.weekly_goal}
                        onChange={(e) =>
                          handleGoalChange(
                            index,
                            "weekly_goal",
                            Number.parseInt(e.target.value) || 1
                          )
                        }
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={goal.monthly_goal}
                        onChange={(e) =>
                          handleGoalChange(
                            index,
                            "monthly_goal",
                            Number.parseInt(e.target.value) || 1
                          )
                        }
                        className="w-20"
                      />
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
