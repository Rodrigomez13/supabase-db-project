import { supabase } from "./supabase"

interface QueryOptions {
  where?: Record<string, any>
  whereIn?: { column: string; values: any[] }
  orderBy?: { column: string; ascending: boolean }
  limit?: number
  offset?: number
  relationships?: string
  select?: string
  single?: boolean
}

/**
 * Realiza una consulta segura a Supabase
 * @param table Nombre de la tabla
 * @param options Opciones de consulta
 * @returns Datos de la consulta
 */
export async function safeQuery<T>(table: string, options: QueryOptions = {}): Promise<T[]> {
  try {
    // Iniciar la consulta
    let query = supabase.from(table)

    // Seleccionar campos específicos o todos
    if (options.select) {
      query = query.select(options.select)
    } else {
      query = query.select("*")
    }

    // Agregar relaciones si se especifican
    if (options.relationships) {
      query = query.select(`*, ${options.relationships}`)
    }

    // Agregar filtros
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    // Agregar filtros IN
    if (options.whereIn) {
      query = query.in(options.whereIn.column, options.whereIn.values)
    }

    // Agregar ordenamiento
    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending,
      })
    }

    // Agregar límite
    if (options.limit) {
      query = query.limit(options.limit)
    }

    // Agregar offset
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    // Ejecutar la consulta
    const { data, error } = options.single ? await query.single() : await query

    if (error) {
      console.error(`Error en consulta a ${table}:`, error)
      throw new Error(error.message)
    }

    return (options.single ? [data] : data) as T[]
  } catch (error: any) {
    console.error(`Error en safeQuery (${table}):`, error)
    throw new Error(`Error al consultar ${table}: ${error.message}`)
  }
}

/**
 * Inserta un registro en una tabla
 * @param table Nombre de la tabla
 * @param data Datos a insertar
 * @returns Registro insertado
 */
export async function safeInsert<T>(table: string, data: Record<string, any>): Promise<T> {
  try {
    const { data: result, error } = await supabase.from(table).insert(data).select().single()

    if (error) {
      console.error(`Error al insertar en ${table}:`, error)
      throw new Error(error.message)
    }

    return result as T
  } catch (error: any) {
    console.error(`Error en safeInsert (${table}):`, error)
    throw new Error(`Error al insertar en ${table}: ${error.message}`)
  }
}

/**
 * Actualiza un registro en una tabla
 * @param table Nombre de la tabla
 * @param id ID del registro
 * @param data Datos a actualizar
 * @returns Registro actualizado
 */
export async function safeUpdate<T>(table: string, id: string, data: Record<string, any>): Promise<T> {
  try {
    const { data: result, error } = await supabase.from(table).update(data).eq("id", id).select().single()

    if (error) {
      console.error(`Error al actualizar en ${table}:`, error)
      throw new Error(error.message)
    }

    return result as T
  } catch (error: any) {
    console.error(`Error en safeUpdate (${table}):`, error)
    throw new Error(`Error al actualizar en ${table}: ${error.message}`)
  }
}

/**
 * Elimina un registro de una tabla
 * @param table Nombre de la tabla
 * @param id ID del registro
 * @returns Resultado de la operación
 */
export async function safeDelete(table: string, id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from(table).delete().eq("id", id)

    if (error) {
      console.error(`Error al eliminar de ${table}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error(`Error en safeDelete (${table}):`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Realiza una consulta RPC a una función de Supabase
 * @param functionName Nombre de la función
 * @param params Parámetros de la función
 * @returns Resultado de la función
 */
export async function safeRPC<T>(functionName: string, params: Record<string, any> = {}): Promise<T> {
  try {
    const { data, error } = await supabase.rpc(functionName, params)

    if (error) {
      console.error(`Error en RPC ${functionName}:`, error)
      throw new Error(error.message)
    }

    return data as T
  } catch (error: any) {
    console.error(`Error en safeRPC (${functionName}):`, error)
    throw new Error(`Error al ejecutar ${functionName}: ${error.message}`)
  }
}
