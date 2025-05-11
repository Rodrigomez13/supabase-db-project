"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  PlusIcon,
  Search,
  Download,
  Upload,
  Phone,
  Check,
  X,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  safeQuery,
  safeInsert,
  safeUpdate,
  safeDelete,
} from "@/lib/safe-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface FranchisePhone {
  id: string;
  franchise_id: string;
  phone_number: string;
  order_number: number;
  is_active: boolean;
  daily_goal: number;
  notes?: string;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export default function FranchisePhonesPage() {
  const params = useParams();
  const franchiseId = params.id as string;
  const [phones, setPhones] = useState<FranchisePhone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [filter, setFilter] = useState<"all" | "Activo" | "Inactivo">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPhone, setCurrentPhone] = useState<FranchisePhone | null>(null);
  const [formData, setFormData] = useState({
    phone_number: "",
    order_number: 0,
    is_active: true,
    daily_goal: 0,
    notes: "",
    category: "",
    tags: [] as string[],
  });
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadPhones();
  }, [franchiseId]);

  const loadPhones = async () => {
    try {
      setLoading(true);
      const data = await safeQuery<FranchisePhone>("franchise_phones", {
        where: { franchise_id: franchiseId },
        orderBy: { column: "order_number", ascending: true },
      });
      setPhones(data);
    } catch (error) {
      console.error("Error loading franchise phones:", error);
      setPhones([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar teléfonos según búsqueda y filtro de estado
  const filteredPhones = phones.filter((phone) => {
    const matchesSearch =
      search === "" ||
      phone.phone_number.includes(search) ||
      (phone.notes &&
        phone.notes.toLowerCase().includes(search.toLowerCase())) ||
      (phone.category &&
        phone.category.toLowerCase().includes(search.toLowerCase())) ||
      (phone.tags &&
        phone.tags.some((tag) =>
          tag.toLowerCase().includes(search.toLowerCase())
        ));

    const matchesFilter =
      filter === "all" ||
      (filter === "Activo" && phone.is_active) ||
      (filter === "Inactivo" && !phone.is_active);

    return matchesSearch && matchesFilter;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      is_active: checked,
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const resetForm = () => {
    setFormData({
      phone_number: "",
      order_number: phones.length + 1,
      is_active: true,
      daily_goal: 0,
      notes: "",
      category: "",
      tags: [],
    });
    setError(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (phone: FranchisePhone) => {
    setCurrentPhone(phone);
    setFormData({
      phone_number: phone.phone_number,
      order_number: phone.order_number,
      is_active: phone.is_active,
      daily_goal: phone.daily_goal,
      notes: phone.notes || "",
      category: phone.category || "",
      tags: phone.tags || [],
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (phone: FranchisePhone) => {
    setCurrentPhone(phone);
    setIsDeleteDialogOpen(true);
  };

  const handleAddPhone = async () => {
    try {
      setError(null);

      if (!formData.phone_number) {
        setError("El número de teléfono es obligatorio");
        return;
      }

      const newPhone = {
        franchise_id: franchiseId,
        ...formData,
      };

      const result = await safeInsert("franchise_phones", newPhone);

      if (result.success) {
        toast({
          title: "Teléfono agregado",
          description: "El teléfono ha sido agregado correctamente",
        });
        setIsAddDialogOpen(false);
        loadPhones();
      } else {
        setError(result.error || "Error al agregar el teléfono");
      }
    } catch (error: any) {
      setError(error.message || "Error al agregar el teléfono");
    }
  };

  const handleUpdatePhone = async () => {
    try {
      setError(null);

      if (!currentPhone) return;

      if (!formData.phone_number) {
        setError("El número de teléfono es obligatorio");
        return;
      }

      const result = await safeUpdate(
        "franchise_phones",
        currentPhone.id,
        formData
      );

      if (result.success) {
        toast({
          title: "Teléfono actualizado",
          description: "El teléfono ha sido actualizado correctamente",
        });
        setIsEditDialogOpen(false);
        loadPhones();
      } else {
        setError(result.error || "Error al actualizar el teléfono");
      }
    } catch (error: any) {
      setError(error.message || "Error al actualizar el teléfono");
    }
  };

  const handleDeletePhone = async () => {
    try {
      if (!currentPhone) return;

      const result = await safeDelete("franchise_phones", currentPhone.id);

      if (result.success) {
        toast({
          title: "Teléfono eliminado",
          description: "El teléfono ha sido eliminado correctamente",
        });
        setIsDeleteDialogOpen(false);
        loadPhones();
      } else {
        setError(result.error || "Error al eliminar el teléfono");
      }
    } catch (error: any) {
      setError(error.message || "Error al eliminar el teléfono");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Teléfonos</h2>
          <p className="text-muted-foreground">
            Gestiona los números telefónicos asignados a esta franquicia
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={openAddDialog}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Nuevo Teléfono
          </Button>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center">
            <Phone className="mr-2 h-5 w-5" />
            Lista de Teléfonos
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar teléfono, notas o etiquetas..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                Todos
              </Button>
              <Button
                variant={filter === "Activo" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("Activo")}
              >
                Activos
              </Button>
              <Button
                variant={filter === "Inactivo" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("Inactivo")}
              >
                Inactivos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <p>Cargando teléfonos...</p>
            </div>
          ) : filteredPhones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Phone className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <h3 className="text-lg font-medium">No hay teléfonos</h3>
              <p className="text-muted-foreground">
                {search || filter !== "all"
                  ? "No hay teléfonos que coincidan con la búsqueda o filtro."
                  : "No hay teléfonos asignados a esta franquicia aún."}
              </p>
              <Button className="mt-4" onClick={openAddDialog}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Agregar Teléfono
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Orden</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Etiquetas</TableHead>
                    <TableHead>Meta Diaria</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPhones.map((phone) => (
                    <TableRow key={phone.id}>
                      <TableCell className="font-medium">
                        {phone.order_number}
                      </TableCell>
                      <TableCell>{phone.phone_number}</TableCell>
                      <TableCell>
                        {phone.is_active ? (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800 hover:bg-green-200"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="bg-red-100 text-red-800 hover:bg-red-200"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {phone.category ? (
                          <Badge variant="outline" className="bg-green-950">
                            {phone.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            Sin categoría
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {phone.tags && phone.tags.length > 0 ? (
                            phone.tags.map((tag, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">
                              Sin etiquetas
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{phone.daily_goal || 0}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {phone.notes || (
                          <span className="text-muted-foreground">
                            Sin notas
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => openEditDialog(phone)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="text-red-500"
                            onClick={() => openDeleteDialog(phone)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para agregar teléfono */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Teléfono</DialogTitle>
            <DialogDescription>
              Agrega un nuevo número telefónico a esta franquicia.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone_number" className="text-right">
                Número
              </Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="+54 9 11 1234-5678"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="order_number" className="text-right">
                Orden
              </Label>
              <Input
                id="order_number"
                name="order_number"
                type="number"
                value={formData.order_number}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Activo
              </Label>
              <div className="col-span-3">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={handleSwitchChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoría
              </Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Ej: Principal, Secundario, Ventas..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="daily_goal" className="text-right">
                Meta Diaria
              </Label>
              <Input
                id="daily_goal"
                name="daily_goal"
                type="number"
                value={formData.daily_goal}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">
                Etiquetas
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Agregar etiqueta"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag} size="sm">
                    Agregar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notas
              </Label>
              <Input
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Notas adicionales..."
              />
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPhone}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar teléfono */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Teléfono</DialogTitle>
            <DialogDescription>
              Modifica la información del teléfono seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_phone_number" className="text-right">
                Número
              </Label>
              <Input
                id="edit_phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_order_number" className="text-right">
                Orden
              </Label>
              <Input
                id="edit_order_number"
                name="order_number"
                type="number"
                value={formData.order_number}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_is_active" className="text-right">
                Activo
              </Label>
              <div className="col-span-3">
                <Switch
                  id="edit_is_active"
                  checked={formData.is_active}
                  onCheckedChange={handleSwitchChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_category" className="text-right">
                Categoría
              </Label>
              <Input
                id="edit_category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_daily_goal" className="text-right">
                Meta Diaria
              </Label>
              <Input
                id="edit_daily_goal"
                name="daily_goal"
                type="number"
                value={formData.daily_goal}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_tags" className="text-right">
                Etiquetas
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="edit_tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Agregar etiqueta"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag} size="sm">
                    Agregar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_notes" className="text-right">
                Notas
              </Label>
              <Input
                id="edit_notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdatePhone}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para eliminar teléfono */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este teléfono? Esta acción no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {currentPhone && (
            <div className="py-4">
              <p className="font-medium">Número: {currentPhone.phone_number}</p>
              <p className="text-muted-foreground text-sm mt-1">
                {currentPhone.is_active ? "TRUE" : "FALSE"}
                {currentPhone.category ? ` • ${currentPhone.category}` : ""}
              </p>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeletePhone}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
