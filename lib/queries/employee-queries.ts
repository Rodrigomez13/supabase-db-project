import { safeQuery, safeInsert, safeUpdate, safeDelete } from "../safe-query"

export interface Employee {
  id: string
  name: string
  role: string
  shift: string
  account: string
  salary: number
  day_off: string
  created_at: string
}

/**
 * Obtiene todos los empleados
 */
export async function getEmployees(): Promise<Employee[]> {
  return safeQuery<Employee>("employees", {
    orderBy: { column: "created_at", ascending: false },
  })
}

/**
 * Obtiene un empleado por su ID
 */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  try {
    const employees = await safeQuery<Employee>("employees", {
      where: { id },
      single: true,
    })
    return employees[0] || null
  } catch (error) {
    console.error("Error en getEmployeeById:", error)
    return null
  }
}

/**
 * Crea un nuevo empleado
 */
export async function createEmployee(data: Omit<Employee, "id" | "created_at">): Promise<Employee> {
  const result = await safeInsert<Employee>("employees", data)
  if (result.success && result.data) {
    return result.data
  }
  throw new Error(result.error || "Failed to create employee")
}

/**
 * Actualiza un empleado existente
 */
export async function updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
  const result = await safeUpdate<Employee>("employees", id, data)
  if (result.success && result.data) {
    return result.data
  }
  throw new Error(result.error || "Failed to update employee")
}

/**
 * Elimina un empleado
 */
export async function deleteEmployee(id: string): Promise<{ success: boolean; error?: string }> {
  return safeDelete("employees", id)
}
