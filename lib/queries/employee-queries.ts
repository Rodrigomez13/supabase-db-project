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
  return safeInsert<Employee>("employees", data)
}

/**
 * Actualiza un empleado existente
 */
export async function updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
  return safeUpdate<Employee>("employees", id, data)
}

/**
 * Elimina un empleado
 */
export async function deleteEmployee(id: string): Promise<{ success: boolean; error?: string }> {
  return safeDelete("employees", id)
}
