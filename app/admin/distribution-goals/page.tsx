"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

interface Franchise {
  id: string
  name: string
}

interface DistributionGoal {
  id?: string
  franchise_id: string
  daily_goal: number
  priority: number
  is_active: boolean
  franchise_name?: string
}

export default function DistributionGoalsPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [goals, setGoals] = useState<DistributionGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [newGoal, setNewGoal] = useState<DistributionGoal>({
    franchise_id: "",
    daily_goal: 0,
    priority: 0,
    is_active: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener franquicias
      const { data: franchisesData, error: franchisesError } = await supabase
        .from("franchises")
        .select("id, name")
        .order("name")

      if (franchisesError) throw franchisesError

      // Obtener metas de distribución
      const { data: goalsData, error: goalsError } = await supabase
        .from("distribution_goals")
        .select(`
          id, 
          franchise_id, 
          daily_goal, 
          priority, 
          is_active,
          franchises (name)
        `)
        .order("priority")

      if (goalsError) throw goalsError

      // Procesar datos
      const processedGoals =
        goalsData?.map((goal) => ({
          id: goal.id,
          franchise_id: goal.franchise_id,
          daily_goal: goal.daily_goal,
          priority: goal.priority,
          is_active: goal.is_active,
          franchise_name: goal.franchises?.name,
        })) || []

      setFranchises(franchisesData || [])
      setGoals(processedGoals)

      // Establecer la prioridad para el nuevo objetivo
      if (processedGoals.length > 0) {
        const maxPriority = Math.max(...processedGoals.map((g) => g.priority))
        setNewGoal((prev) => ({ ...prev, priority: maxPriority + 1 }))
      }
    } catch (err: any) {
      console.error("Error fetching data:", err)
      setError(`Error al cargar datos: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewGoal((prev) => ({
      ...prev,
      [name]: name === "daily_goal" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setNewGoal((prev) => ({ ...prev, is_active: checked }))
  }

  const handleSelectChange = (value: string) => {
    setNewGoal((prev) => ({ ...prev, franchise_id: value }))
  }

  const addGoal = async () => {
    try {
      if (!newGoal.franchise_id) {
        toast({
          title: "Error",
          description: "Debes seleccionar una franquicia",
          variant: "destructive",
        })
        return
      }

      if (newGoal.daily_goal <= 0) {
        toast({
          title: "Error",
          description: "La meta diaria debe ser mayor que cero",
          variant: "destructive",
        })
        return
      }

      // Verificar si ya existe una meta para esta franquicia
      const existingGoal = goals.find((g) => g.franchise_id === newGoal.franchise_id)
      if (existingGoal) {
        toast({
          title: "Error",
          description: "Ya existe una meta para esta franquicia",
          variant: "destructive",
        })
        return
      }

      setSaving(true)

      // Obtener el nombre de la franquicia
      const franchise = franchises.find((f) => f.id === newGoal.franchise_id)

      // Insertar nueva meta
      const { data, error } = await supabase.from("distribution_goals").insert(newGoal).select()

      if (error) throw error

      // Actualizar estado local
      const newGoalWithId = {
        ...newGoal,
        id: data[0].id,
        franchise_name: franchise?.name,
      }

      setGoals((prev) => [...prev, newGoalWithId])

      // Resetear formulario
      setNewGoal({
        franchise_id: "",
        daily_goal: 0,
        priority: newGoal.priority + 1,
        is_active: true,
      })

      toast({
        title: "Meta agregada",
        description: "La meta de distribución ha sido agregada correctamente",
      })
    } catch (err: any) {
      console.error("Error adding goal:", err)
      toast({
        title: "Error",
        description: `Error al agregar meta: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateGoalStatus = async (id: string, isActive: boolean) => {
    try {
      // Actualizar en la base de datos
      const { error } = await supabase.from("distribution_goals").update({ is_active: isActive }).eq("id", id)

      if (error) throw error

      // Actualizar estado local
      setGoals((prev) => prev.map((goal) => (goal.id === id ? { ...goal, is_active: isActive } : goal)))

      toast({
        title: "Estado actualizado",
        description: `Meta ${isActive ? "activada" : "desactivada"} correctamente`,
      })
    } catch (err: any) {
      console.error("Error updating goal status:", err)
      toast({
        title: "Error",
        description: `Error al actualizar estado: ${err.message}`,
        variant: "destructive",
      })
    }
  }

  const updateGoalPriority = async (id: string, direction: "up" | "down") => {
    try {
      const currentIndex = goals.findIndex((g) => g.id === id)
      if (currentIndex === -1) return

      // No se puede mover más arriba del primer elemento
      if (direction === "up" && currentIndex === 0) return

      // No se puede mover más abajo del último elemento
      if (direction === "down" && currentIndex === goals.length - 1) return

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
      const targetGoal = goals[targetIndex]

      // Intercambiar prioridades
      const currentPriority = goals[currentIndex].priority
      const targetPriority = targetGoal.priority

      // Actualizar en la base de datos
      const updates = [
        supabase.from("distribution_goals").update({ priority: targetPriority }).eq("id", id),
        supabase
          .from("distribution_goals")
          .update({ priority: currentPriority })
          .eq("id", targetGoal.id as string),
      ]

      await Promise.all(updates)

      // Actualizar estado local
      const newGoals = [...goals]
      newGoals[currentIndex] = { ...newGoals[currentIndex], priority: targetPriority }
      newGoals[targetIndex] = { ...newGoals[targetIndex], priority: currentPriority }

      // Reordenar por prioridad
      newGoals.sort((a, b) => a.priority - b.priority)

      setGoals(newGoals)
    } catch (err: any) {
      console.error("Error updating priority:", err)
      toast({
        title: "Error",
        description: `Error al actualizar prioridad: ${err.message}`,
        variant: "destructive",
      })
    }
  }

  const deleteGoal = async (id: string) => {
    try {
      if (!confirm("¿Estás seguro de eliminar esta meta de distribución?")) {
        return
      }

      // Eliminar de la base de datos
      const { error } = await supabase.from("distribution_goals").delete().eq("id", id)

      if (error) throw error

      // Actualizar estado local
      setGoals((prev) => prev.filter((goal) => goal.id !== id))

      toast({
        title: "Meta eliminada",
        description: "La meta de distribución ha sido eliminada correctamente",
      })
    } catch (err: any) {
      console.error("Error deleting goal:", err)
      toast({
        title: "Error",
        description: `Error al eliminar meta: ${err.message}`,
        variant: "destructive",
      })
    }
  }

  const updateGoalValue = async (id: string, value: number) => {
    try {
      if (value <= 0) {
        toast({
          title: "Error",
          description: "La meta diaria debe ser mayor que cero",
          variant: "destructive",
        })
        return
      }

      // Actualizar en la base de datos
      const { error } = await supabase.from("distribution_goals").update({ daily_goal: value }).eq("id", id)

      if (error) throw error

      // Actualizar estado local
      setGoals((prev) => prev.map((goal) => (goal.id === id ? { ...goal, daily_goal: value } : goal)))

      toast({
        title: "Meta actualizada",
        description: "El valor de la meta ha sido actualizado correctamente",
      })
    } catch (err: any) {
      console.error("Error updating goal value:", err)
      toast({
        title: "Error",
        description: `Error al actualizar meta: ${err.message}`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Metas de Distribución</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Agregar Meta</CardTitle>
            <CardDescription>Define metas diarias de distribución para cada franquicia</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="franchise_id">Franquicia</Label>
                <Select value={newGoal.franchise_id} onValueChange={handleSelectChange} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar franquicia" />
                  </SelectTrigger>
                  <SelectContent>
                    {franchises.map((franchise) => (
                      <SelectItem
                        key={franchise.id}
                        value={franchise.id}
                        disabled={goals.some((g) => g.franchise_id === franchise.id)}
                      >
                        {franchise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily_goal">Meta Diaria (conversiones)</Label>
                <Input
                  id="daily_goal"
                  name="daily_goal"
                  type="number"
                  min="1"
                  value={newGoal.daily_goal}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={newGoal.is_active}
                  onCheckedChange={handleSwitchChange}
                  disabled={saving}
                />
                <Label htmlFor="is_active">Activa</Label>
              </div>

              <Button
                type="button"
                onClick={addGoal}
                disabled={saving || !newGoal.franchise_id || newGoal.daily_goal <= 0}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Meta
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Metas Configuradas</CardTitle>
            <CardDescription>
              Las franquicias recibirán conversiones en el orden de prioridad establecido
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : goals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay metas de distribución configuradas</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Franquicia</TableHead>
                    <TableHead>Meta Diaria</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goals.map((goal, index) => (
                    <TableRow key={goal.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{index + 1}</span>
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => goal.id && updateGoalPriority(goal.id, "up")}
                              disabled={index === 0}
                              className="h-6 w-6"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => goal.id && updateGoalPriority(goal.id, "down")}
                              disabled={index === goals.length - 1}
                              className="h-6 w-6"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{goal.franchise_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="1"
                            value={goal.daily_goal}
                            onChange={(e) => {
                              const value = Number.parseInt(e.target.value) || 0
                              setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, daily_goal: value } : g)))
                            }}
                            className="w-20 h-8"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => goal.id && updateGoalValue(goal.id, goal.daily_goal)}
                            className="h-8 w-8"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={goal.is_active}
                          onCheckedChange={(checked) => goal.id && updateGoalStatus(goal.id, checked)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => goal.id && deleteGoal(goal.id)}
                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
