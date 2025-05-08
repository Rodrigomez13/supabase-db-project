"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Upload,
  Download,
  AlertCircle,
  Copy,
  Search,
  Plus,
  MoveUp,
  MoveDown,
  Tag,
  Phone,
} from "lucide-react";
import {
  safeQuery,
  safeInsert,
  safeUpdate,
  safeDelete,
  safeRPC,
} from "@/lib/safe-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Papa from "papaparse";

interface FranchisePhone {
  id?: string; // Made optional to allow deletion
  franchise_id: string;
  phone_number: string;
  order_number: number;
  is_active: boolean;
  daily_goal: number;
  created_at: string;
  updated_at?: string;
  notes?: string;
  category?: string;
  tags?: string[];
}

interface Franchise {
  id: string;
  name: string;
}

interface CSVRow {
  order: string;
  status: string;
  phone: string;
  goal: string;
  notes?: string;
  category?: string;
  tags?: string;
}

export default function FranchisePhonesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const franchiseName = searchParams.get("franchise");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [phones, setPhones] = useState<FranchisePhone[]>([]);
  const [filteredPhones, setFilteredPhones] = useState<FranchisePhone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    phone_number: "",
    order_number: 1,
    is_active: true,
    daily_goal: 0,
    notes: "",
    category: "general",
    tags: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkPhones, setBulkPhones] = useState("");
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [categories, setCategories] = useState([
    "general",
    "ventas",
    "soporte",
    "marketing",
    "administrativo",
    "otro",
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Buscar la franquicia por nombre
        if (franchiseName) {
          const queryOptions = { where: { name: franchiseName } }; // Adjusted to use a valid property
          const franchises = await safeQuery<Franchise>(
            "franchises",
            queryOptions
          );

          if (franchises.length > 0) {
            const franchise = franchises[0];
            setFranchise(franchise);

            // Cargar teléfonos de la franquicia
            const phonesData = await safeRPC<FranchisePhone[]>(
              "get_franchise_phones",
              {
                p_franchise_id: franchise.id,
              }
            );

            if (phonesData && Array.isArray(phonesData)) {
              // Asegurarse de que todos los teléfonos tengan las propiedades necesarias
              const normalizedPhones = phonesData.map((phone) => ({
                ...phone,
                notes: phone.notes || "",
                category: phone.category || "general",
                tags: phone.tags || [],
              }));

              setPhones(normalizedPhones);
              setFilteredPhones(normalizedPhones);

              // Establecer el siguiente número de orden
              if (normalizedPhones.length > 0) {
                const maxOrder = Math.max(
                  ...normalizedPhones.map((p) => p.order_number)
                );
                setFormData((prev) => ({
                  ...prev,
                  order_number: maxOrder + 1,
                }));
              }
            } else {
              setPhones([]);
              setFilteredPhones([]);
            }
          }
        }
      } catch (err: any) {
        console.error("Error loading franchise phones:", err);
        setError("Error al cargar los datos. Por favor, intente nuevamente.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [franchiseName]);

  // Filtrar teléfonos cuando cambian los filtros
  useEffect(() => {
    let filtered = [...phones];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (phone) =>
          phone.phone_number.includes(searchTerm) ||
          (phone.notes &&
            phone.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (phone.tags &&
            phone.tags.some((tag) =>
              tag.toLowerCase().includes(searchTerm.toLowerCase())
            ))
      );
    }

    // Filtrar por categoría
    if (categoryFilter) {
      filtered = filtered.filter((phone) => phone.category === categoryFilter);
    }

    // Filtrar por estado
    if (statusFilter) {
      const isActive = statusFilter === "Activo";
      filtered = filtered.filter((phone) => phone.is_active === isActive);
    }

    setFilteredPhones(filtered);
  }, [phones, searchTerm, categoryFilter, statusFilter]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if ((e.target as HTMLInputElement).type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? Number(value) : value,
      }));
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleTagRemove = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Validación básica: solo números, +, y espacios
    const regex = /^[0-9+\s]+$/;
    return regex.test(phone) && phone.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!franchise) return;

    // Validar número de teléfono
    if (!validatePhoneNumber(formData.phone_number)) {
      setError(
        "El número de teléfono no es válido. Use solo números, + y espacios."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const phoneData = {
        ...formData,
        franchise_id: franchise.id,
        order_number: Number(formData.order_number),
        daily_goal: Number(formData.daily_goal),
      };

      let result;

      if (editingId) {
        // Actualizar teléfono existente
        result = await safeUpdate("franchise_phones", editingId, phoneData);
        setSuccessMessage("Teléfono actualizado correctamente");
      } else {
        // Crear nuevo teléfono
        result = await safeInsert("franchise_phones", phoneData);
        setSuccessMessage("Teléfono agregado correctamente");
      }

      // Recargar teléfonos
      await reloadPhones();

      setEditingId(null);
    } catch (err: any) {
      console.error("Error saving phone:", err);
      setError("Error al guardar el teléfono. Por favor, intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!franchise) return;

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      // Dividir los números de teléfono por líneas
      const phoneNumbers = bulkPhones
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // Validar todos los números
      const invalidNumbers = phoneNumbers.filter(
        (phone) => !validatePhoneNumber(phone)
      );
      if (invalidNumbers.length > 0) {
        setError(
          `Hay ${invalidNumbers.length} números inválidos. Por favor, revise el formato.`
        );
        setIsSubmitting(false);
        return;
      }

      // Obtener el último orden
      let lastOrder =
        phones.length > 0 ? Math.max(...phones.map((p) => p.order_number)) : 0;

      // Insertar cada número
      for (const phoneNumber of phoneNumbers) {
        lastOrder++;
        await safeInsert("franchise_phones", {
          franchise_id: franchise.id,
          phone_number: phoneNumber,
          order_number: lastOrder,
          is_active: true,
          daily_goal: 0,
          category: formData.category,
          tags: formData.tags,
        });
      }

      setSuccessMessage(
        `Se agregaron ${phoneNumbers.length} teléfonos correctamente`
      );
      setBulkPhones("");

      // Recargar teléfonos
      await reloadPhones();
    } catch (err: any) {
      console.error("Error adding bulk phones:", err);
      setError(
        "Error al agregar los teléfonos. Por favor, intente nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const reloadPhones = async () => {
    if (!franchise) return;

    const updatedPhones = await safeRPC<FranchisePhone[]>(
      "get_franchise_phones",
      {
        p_franchise_id: franchise.id,
      }
    );

    if (updatedPhones && Array.isArray(updatedPhones)) {
      const normalizedPhones = updatedPhones.map((phone) => ({
        ...phone,
        notes: phone.notes || "",
        category: phone.category || "general",
        tags: phone.tags || [],
      }));

      setPhones(normalizedPhones);

      // Actualizar el siguiente número de orden
      if (normalizedPhones.length > 0) {
        const maxOrder = Math.max(
          ...normalizedPhones.map((p) => p.order_number)
        );
        setFormData({
          phone_number: "",
          order_number: maxOrder + 1,
          is_active: true,
          daily_goal: 0,
          notes: "",
          category: "general",
          tags: [],
        });
      } else {
        setFormData({
          phone_number: "",
          order_number: 1,
          is_active: true,
          daily_goal: 0,
          notes: "",
          category: "general",
          tags: [],
        });
      }
    }
  };

  const handleEdit = (phone: FranchisePhone) => {
    setFormData({
      phone_number: phone.phone_number,
      order_number: phone.order_number,
      is_active: phone.is_active,
      daily_goal: phone.daily_goal || 0,
      notes: phone.notes || "",
      category: phone.category || "general",
      tags: phone.tags || [],
    });
    setEditingId(phone.id ?? null);
    setSuccessMessage(null);
    setBulkMode(false);
  };

  const handleDuplicate = (phone: FranchisePhone) => {
    if (!franchise) return;

    const newPhone = {
      ...phone,
      order_number:
        phones.length > 0
          ? Math.max(...phones.map((p) => p.order_number)) + 1
          : 1,
    };

    delete newPhone.id;

    setFormData({
      phone_number: newPhone.phone_number,
      order_number: newPhone.order_number,
      is_active: newPhone.is_active,
      daily_goal: newPhone.daily_goal || 0,
      notes: newPhone.notes || "",
      category: newPhone.category || "general",
      tags: newPhone.tags || [],
    });

    setEditingId(null);
    setSuccessMessage(null);
    setBulkMode(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro que desea eliminar este teléfono?")) return;

    try {
      setError(null);
      setSuccessMessage(null);

      await safeDelete("franchise_phones", id);
      setSuccessMessage("Teléfono eliminado correctamente");

      // Actualizar lista de teléfonos
      setPhones(phones.filter((phone) => phone.id !== id));
    } catch (err: any) {
      console.error("Error deleting phone:", err);
      setError("Error al eliminar el teléfono. Por favor, intente nuevamente.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPhones.length === 0) return;

    if (
      !confirm(
        `¿Está seguro que desea eliminar ${selectedPhones.length} teléfonos?`
      )
    )
      return;

    try {
      setError(null);
      setSuccessMessage(null);

      for (const id of selectedPhones) {
        await safeDelete("franchise_phones", id);
      }

      setSuccessMessage(
        `Se eliminaron ${selectedPhones.length} teléfonos correctamente`
      );
      setSelectedPhones([]);

      // Actualizar lista de teléfonos
      setPhones(
        phones.filter((phone) => phone.id && !selectedPhones.includes(phone.id))
      );
    } catch (err: any) {
      console.error("Error deleting phones:", err);
      setError(
        "Error al eliminar los teléfonos. Por favor, intente nuevamente."
      );
    }
  };

  const handleMovePhone = async (id: string, direction: "up" | "down") => {
    const phoneIndex = phones.findIndex((p) => p.id === id);
    if (phoneIndex === -1) return;

    const phone = phones[phoneIndex];
    let swapWithIndex: number;

    if (direction === "up" && phoneIndex > 0) {
      swapWithIndex = phoneIndex - 1;
    } else if (direction === "down" && phoneIndex < phones.length - 1) {
      swapWithIndex = phoneIndex + 1;
    } else {
      return; // No se puede mover más arriba/abajo
    }

    const swapWithPhone = phones[swapWithIndex];

    try {
      // Intercambiar los números de orden
      if (phone.id && swapWithPhone.id) {
        await safeUpdate("franchise_phones", phone.id, {
          order_number: swapWithPhone.order_number,
        });

        await safeUpdate("franchise_phones", swapWithPhone.id, {
          order_number: phone.order_number,
        });
      } else {
        console.error("One of the phone IDs is undefined.");
      }

      // Recargar teléfonos
      await reloadPhones();

      setSuccessMessage("Orden actualizado correctamente");
    } catch (err: any) {
      console.error("Error reordering phones:", err);
      setError(
        "Error al reordenar los teléfonos. Por favor, intente nuevamente."
      );
    }
  };

  const handleCancel = () => {
    setFormData({
      phone_number: "",
      order_number:
        phones.length > 0
          ? Math.max(...phones.map((p) => p.order_number)) + 1
          : 1,
      is_active: true,
      daily_goal: 0,
      notes: "",
      category: "general",
      tags: [],
    });
    setEditingId(null);
    setSuccessMessage(null);
  };

  const togglePhoneSelection = (id: string) => {
    setSelectedPhones((prev) => {
      if (prev.includes(id)) {
        return prev.filter((phoneId) => phoneId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedPhones.length === filteredPhones.length) {
      setSelectedPhones([]);
    } else {
      setSelectedPhones(
        filteredPhones
          .map((phone) => phone.id)
          .filter((id): id is string => id !== undefined)
      );
    }
  };

  const handleBulkStatusChange = async (status: boolean) => {
    if (selectedPhones.length === 0) return;

    try {
      setError(null);
      setSuccessMessage(null);

      for (const id of selectedPhones) {
        await safeUpdate("franchise_phones", id, { is_active: status });
      }

      setSuccessMessage(
        `Se actualizaron ${selectedPhones.length} teléfonos correctamente`
      );

      // Recargar teléfonos
      await reloadPhones();
    } catch (err: any) {
      console.error("Error updating phones:", err);
      setError(
        "Error al actualizar los teléfonos. Por favor, intente nuevamente."
      );
    }
  };

  const handleBulkCategoryChange = async (category: string) => {
    if (selectedPhones.length === 0) return;

    try {
      setError(null);
      setSuccessMessage(null);

      for (const id of selectedPhones) {
        await safeUpdate("franchise_phones", id, { category });
      }

      setSuccessMessage(
        `Se actualizaron ${selectedPhones.length} teléfonos correctamente`
      );

      // Recargar teléfonos
      await reloadPhones();
    } catch (err: any) {
      console.error("Error updating phones:", err);
      setError(
        "Error al actualizar los teléfonos. Por favor, intente nuevamente."
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError(null);
    setCsvData([]);

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setCsvError(
            `Error al procesar el archivo: ${results.errors[0].message}`
          );
          return;
        }

        // Procesar los datos del CSV
        const data = results.data as string[][];
        const parsedData: CSVRow[] = data.map((row) => ({
          order: row[0] || "",
          status: row[1] || "",
          phone: row[2] || "",
          goal: row[3] || "0",
          notes: row[4] || "",
          category: row[5] || "general",
          tags: row[6] || "",
        }));

        // Validar los datos
        const invalidRows = parsedData.filter(
          (row) =>
            !row.order.trim() ||
            isNaN(Number(row.order)) ||
            !row.phone.trim() ||
            !validatePhoneNumber(row.phone) ||
            ![
              "activo",
              "inactivo",
              "Activo",
              "inactive",
              "1",
              "0",
              "true",
              "false",
            ].includes(row.status.toLowerCase())
        );

        if (invalidRows.length > 0) {
          setCsvError(
            `El archivo contiene ${invalidRows.length} filas con datos inválidos.`
          );
          return;
        }

        setCsvData(parsedData);
      },
    });
  };

  const handleImportCSV = async () => {
    if (!franchise || csvData.length === 0) return;

    try {
      setIsImporting(true);
      setError(null);
      setCsvError(null);
      setSuccessMessage(null);

      // Convertir los datos del CSV a objetos de teléfono
      const phoneData = csvData.map((row) => ({
        franchise_id: franchise.id,
        order_number: Number(row.order),
        is_active: ["activo", "Activo", "1", "true"].includes(
          row.status.toLowerCase()
        ),
        phone_number: row.phone,
        daily_goal: Number(row.goal) || 0,
        notes: row.notes || "",
        category: row.category || "general",
        tags: row.tags ? row.tags.split(",").map((tag) => tag.trim()) : [],
      }));

      // Insertar los teléfonos en la base de datos
      for (const phone of phoneData) {
        await safeInsert("franchise_phones", {
          franchise_id: phone.franchise_id,
          order_number: phone.order_number,
          is_active: phone.is_active,
          phone_number: phone.phone_number,
          daily_goal: phone.daily_goal,
          notes: phone.notes,
          category: phone.category,
          tags: phone.tags,
        });
      }

      // Recargar teléfonos
      await reloadPhones();

      setSuccessMessage(
        `Se importaron ${phoneData.length} teléfonos correctamente.`
      );
      setCsvData([]);

      // Limpiar el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Error importing phones:", err);
      setError(
        "Error al importar los teléfonos. Por favor, intente nuevamente."
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCSV = () => {
    if (phones.length === 0) return;

    // Convertir los teléfonos a formato CSV
    const csvContent = phones.map((phone) => [
      phone.order_number,
      phone.is_active ? "activo" : "inactivo",
      phone.phone_number,
      phone.daily_goal || 0,
      phone.notes || "",
      phone.category || "general",
      (phone.tags || []).join(","),
    ]);

    // Agregar encabezados
    csvContent.unshift([
      "Orden",
      "Estado",
      "Número de Teléfono",
      "Meta Diaria",
      "Notas",
      "Categoría",
      "Etiquetas",
    ]);

    // Generar el contenido del CSV
    const csv = Papa.unparse(csvContent);

    // Crear un blob y descargar el archivo
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `telefonos_${franchiseName?.toLowerCase() || "franquicia"}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Cargando datos...
      </div>
    );
  }

  if (!franchise) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p>
              Franquicia no encontrada. Por favor, seleccione una franquicia
              válida.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Teléfonos de {franchise.name}</h1>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={phones.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert
          variant="default"
          className="bg-green-50 text-green-800 border-green-200"
        >
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Teléfonos</TabsTrigger>
          <TabsTrigger value="add">Agregar Teléfonos</TabsTrigger>
          <TabsTrigger value="import">Importar CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Teléfonos Registrados</CardTitle>
                <div className="flex items-center space-x-2">
                  {selectedPhones.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkStatusChange(true)}
                        className="text-green-600"
                      >
                        Activar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkStatusChange(false)}
                        className="text-amber-600"
                      >
                        Desactivar
                      </Button>
                      <Dialog
                        open={showTagDialog}
                        onOpenChange={setShowTagDialog}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Tag className="h-4 w-4 mr-2" />
                            Categoría
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cambiar categoría</DialogTitle>
                            <DialogDescription>
                              Seleccione una categoría para los{" "}
                              {selectedPhones.length} teléfonos seleccionados.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="bulk-category">Categoría</Label>
                              <Select
                                onValueChange={(value) =>
                                  handleBulkCategoryChange(value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category.charAt(0).toUpperCase() +
                                        category.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setShowTagDialog(false)}
                            >
                              Cancelar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkDelete}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar teléfonos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={categoryFilter || ""}
                      onValueChange={(value) =>
                        setCategoryFilter(value || null)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Todas las categorías" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas las categorías</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={statusFilter || ""}
                      onValueChange={(value) => setStatusFilter(value || null)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos los estados</SelectItem>
                        <SelectItem value="Activo">Activos</SelectItem>
                        <SelectItem value="inactive">Inactivos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredPhones.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">
                    No hay teléfonos que coincidan con los filtros.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30px]">
                            <Checkbox
                              checked={
                                selectedPhones.length ===
                                  filteredPhones.length &&
                                filteredPhones.length > 0
                              }
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
                          <TableHead>Orden</TableHead>
                          <TableHead>Número de Teléfono</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Meta Diaria</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Etiquetas</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPhones.map((phone) => (
                          <TableRow key={phone.id}>
                            <TableCell>
                              <Checkbox
                                checked={
                                  phone.id
                                    ? selectedPhones.includes(phone.id)
                                    : false
                                }
                                onCheckedChange={() =>
                                  phone.id && togglePhoneSelection(phone.id)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <span>{phone.order_number}</span>
                                <div className="flex flex-col">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() =>
                                      phone.id &&
                                      handleMovePhone(phone.id, "up")
                                    }
                                  >
                                    <MoveUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() =>
                                      phone.id &&
                                      handleMovePhone(phone.id, "down")
                                    }
                                  >
                                    <MoveDown className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                                {phone.phone_number}
                              </div>
                              {phone.notes && (
                                <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                                  {phone.notes}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  phone.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {phone.is_active ? "Activo" : "Inactivo"}
                              </span>
                            </TableCell>
                            <TableCell>{phone.daily_goal || 0}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {phone.category || "general"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {(phone.tags || []).map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEdit(phone)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDuplicate(phone)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="text-red-500"
                                  onClick={() =>
                                    phone.id && handleDelete(phone.id)
                                  }
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {bulkMode
                  ? "Agregar Múltiples Teléfonos"
                  : editingId
                  ? "Editar Teléfono"
                  : "Agregar Teléfono"}
              </CardTitle>
              <CardDescription>
                {bulkMode
                  ? "Ingrese múltiples números de teléfono, uno por línea"
                  : "Complete los datos del teléfono"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!bulkMode ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Número de Teléfono</Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="5491112345678"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order_number">Orden</Label>
                    <Input
                      id="order_number"
                      name="order_number"
                      type="number"
                      min="1"
                      value={formData.order_number}
                      onChange={handleChange}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Orden de prioridad para asignar conversiones
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="daily_goal">Meta Diaria</Label>
                    <Input
                      id="daily_goal"
                      name="daily_goal"
                      type="number"
                      min="0"
                      value={formData.daily_goal}
                      onChange={handleChange}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Cantidad estimada de conversiones diarias
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Información adicional sobre este teléfono"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Etiquetas</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 hover:bg-red-100"
                            onClick={() => handleTagRemove(tag)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Nueva etiqueta"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTagAdd}
                      >
                        Agregar
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_active: checked === true,
                        }))
                      }
                    />
                    <Label htmlFor="is_active">Teléfono Activo</Label>
                  </div>

                  <div className="flex justify-between space-x-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setBulkMode(true)}
                      disabled={!!editingId}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Modo Múltiple
                    </Button>
                    <div className="flex space-x-2">
                      {editingId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                        >
                          Cancelar
                        </Button>
                      )}
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                          ? "Guardando..."
                          : editingId
                          ? "Actualizar Teléfono"
                          : "Agregar Teléfono"}
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleBulkSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk_phones">Números de Teléfono</Label>
                    <Textarea
                      id="bulk_phones"
                      value={bulkPhones}
                      onChange={(e) => setBulkPhones(e.target.value)}
                      placeholder="Ingrese un número de teléfono por línea"
                      rows={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Ingrese un número de teléfono por línea. Ejemplo:
                      5491112345678
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Etiquetas</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 hover:bg-red-100"
                            onClick={() => handleTagRemove(tag)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Nueva etiqueta"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTagAdd}
                      >
                        Agregar
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between space-x-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setBulkMode(false)}
                    >
                      Modo Individual
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Guardando..." : "Agregar Teléfonos"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar Teléfonos desde CSV</CardTitle>
              <CardDescription>
                Importe múltiples teléfonos desde un archivo CSV con formato
                específico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Archivo CSV</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    El archivo debe tener las siguientes columnas: Orden, Estado
                    (activo/inactivo), Número de Teléfono, Meta Diaria, Notas,
                    Categoría, Etiquetas (separadas por comas)
                  </p>
                </div>

                {csvError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{csvError}</AlertDescription>
                  </Alert>
                )}

                {csvData.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Vista previa ({csvData.length} registros)
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Orden</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Número de Teléfono</TableHead>
                            <TableHead>Meta Diaria</TableHead>
                            <TableHead>Categoría</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvData.slice(0, 5).map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row.order}</TableCell>
                              <TableCell>{row.status}</TableCell>
                              <TableCell>{row.phone}</TableCell>
                              <TableCell>{row.goal}</TableCell>
                              <TableCell>{row.category || "general"}</TableCell>
                            </TableRow>
                          ))}
                          {csvData.length > 5 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-muted-foreground"
                              >
                                ... y {csvData.length - 5} registros más
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleImportCSV}
                disabled={csvData.length === 0 || isImporting}
                className="flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? "Importando..." : "Importar Teléfonos"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
