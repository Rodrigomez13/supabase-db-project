"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { PlusIcon, Trash2Icon, ArrowLeftIcon } from "lucide-react";

export default function ManageFranchisePhones() {
  const params = useParams();
  const router = useRouter();
  const franchiseId = params.id as string;

  const [phones, setPhones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [franchiseName, setFranchiseName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [addingPhone, setAddingPhone] = useState(false);

  useEffect(() => {
    if (franchiseId) {
      fetchFranchiseData();
      fetchPhones();
    }
  }, [franchiseId]);

  async function fetchFranchiseData() {
    try {
      const { data, error } = await supabase
        .from("franchises")
        .select("name")
        .eq("id", franchiseId)
        .single();

      if (error) throw error;
      if (data) {
        setFranchiseName(data.name);
      }
    } catch (err) {
      console.error("Error fetching franchise data:", err);
    }
  }

  async function fetchPhones() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("franchise_phones")
        .select("*")
        .eq("franchise_id", franchiseId)
        .order("order_number", { ascending: true })
        .order("id", { ascending: true });

      if (error) throw error;
      setPhones(data || []);
    } catch (err) {
      console.error("Error fetching phones:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los teléfonos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function addPhone() {
    if (!newPhone) {
      toast({
        title: "Error",
        description: "Ingresa un número de teléfono",
        variant: "destructive",
      });
      return;
    }

    try {
      setAddingPhone(true);

      // Obtener el máximo order_number actual
      const maxOrder = phones.reduce(
        (max, phone) => Math.max(max, phone.order_number || 0),
        0
      );

      const { data, error } = await supabase
        .from("franchise_phones")
        .insert({
          franchise_id: franchiseId,
          phone_number: newPhone,
          is_active: true,
          order_number: maxOrder + 1,
        })
        .select();

      if (error) throw error;

      toast({
        title: "Teléfono agregado",
        description: "El teléfono ha sido agregado correctamente",
      });

      setNewPhone("");
      fetchPhones();
    } catch (err: any) {
      console.error("Error adding phone:", err);
      toast({
        title: "Error",
        description: `No se pudo agregar el teléfono: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setAddingPhone(false);
    }
  }

  async function togglePhoneStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("franchise_phones")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      // Actualizar estado local
      setPhones(
        phones.map((phone) =>
          phone.id === id ? { ...phone, is_active: !currentStatus } : phone
        )
      );

      toast({
        title: "Estado actualizado",
        description: `El teléfono ha sido ${
          !currentStatus ? "activado" : "desactivado"
        }`,
      });
    } catch (err: any) {
      console.error("Error toggling phone status:", err);
      toast({
        title: "Error",
        description: `No se pudo actualizar el estado: ${err.message}`,
        variant: "destructive",
      });
    }
  }

  async function deletePhone(id: string) {
    if (!confirm("¿Estás seguro de eliminar este teléfono?")) return;

    try {
      const { error } = await supabase
        .from("franchise_phones")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Actualizar estado local
      setPhones(phones.filter((phone) => phone.id !== id));

      toast({
        title: "Teléfono eliminado",
        description: "El teléfono ha sido eliminado correctamente",
      });
    } catch (err: any) {
      console.error("Error deleting phone:", err);
      toast({
        title: "Error",
        description: `No se pudo eliminar el teléfono: ${err.message}`,
        variant: "destructive",
      });
    }
  }

  async function updatePhoneOrder(id: string, newOrder: number) {
    try {
      const { error } = await supabase
        .from("franchise_phones")
        .update({ order_number: newOrder })
        .eq("id", id);

      if (error) throw error;

      // Actualizar estado local
      setPhones(
        phones.map((phone) =>
          phone.id === id ? { ...phone, order_number: newOrder } : phone
        )
      );

      toast({
        title: "Orden actualizado",
        description: "El orden del teléfono ha sido actualizado",
      });
    } catch (err: any) {
      console.error("Error updating phone order:", err);
      toast({
        title: "Error",
        description: `No se pudo actualizar el orden: ${err.message}`,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            Administrar Teléfonos - {franchiseName}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar Nuevo Teléfono</CardTitle>
          <CardDescription>
            Agrega un nuevo teléfono para esta franquicia. Los teléfonos activos
            serán utilizados para asignar leads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="phone-number">Número de Teléfono</Label>
              <Input
                id="phone-number"
                placeholder="Ingresa el número de teléfono"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>
            <Button
              onClick={addPhone}
              disabled={addingPhone || !newPhone}
              className="bg-usina-primary hover:bg-usina-secondary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teléfonos Existentes</CardTitle>
          <CardDescription>
            Administra los teléfonos existentes para esta franquicia. Puedes
            activar, desactivar o eliminar teléfonos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Cargando teléfonos...</div>
          ) : phones.length === 0 ? (
            <div className="text-center py-4 text-usina-text-secondary">
              No hay teléfonos configurados para esta franquicia
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phones.map((phone) => (
                  <TableRow key={phone.id}>
                    <TableCell className="font-medium">
                      {phone.phone_number}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={phone.order_number || 1}
                        onChange={(e) =>
                          updatePhoneOrder(
                            phone.id,
                            Number.parseInt(e.target.value) || 1
                          )
                        }
                        className="w-20 h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={phone.is_active}
                          onCheckedChange={() =>
                            togglePhoneStatus(phone.id, phone.is_active)
                          }
                        />
                        <span>{phone.is_active ? "Activo" : "Inactivo"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-usina-danger hover:bg-usina-danger/10"
                        onClick={() => deletePhone(phone.id)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-usina-text-secondary">
            Total: {phones.length} teléfono(s),{" "}
            {phones.filter((p) => p.is_active).length} activo(s)
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
