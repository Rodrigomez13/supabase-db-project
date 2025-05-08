"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const supabase = createClientComponentClient()

interface QueryOptions {
  where?: Record<string, any>
  filters?: { column: string; value: any; operator?: string }[]
  orderBy?: { column: string; ascending?: boolean; order?: string }
  limit?: number
  relationships?: string
  select?: string
}

async function safeQuery<T>(table: string, options: QueryOptions = {}): Promise<T[]> {
  try {
    let selectColumns = options.select || "*"
    if (options.relationships) {
      selectColumns = `${selectColumns},${options.relationships}`
    }
    let query = supabase.from(table).select(selectColumns)

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    if (options.filters) {
      options.filters.forEach((filter) => {
        const operator = filter.operator || "eq";
        if (operator === "eq") {
          query = query.eq(filter.column, filter.value);
        } else if (operator === "neq") {
          query = query.neq(filter.column, filter.value);
        } else if (operator === "lt") {
          query = query.lt(filter.column, filter.value);
        } else if (operator === "lte") {
          query = query.lte(filter.column, filter.value);
        } else if (operator === "gt") {
          query = query.gt(filter.column, filter.value);
        } else if (operator === "gte") {
          query = query.gte(filter.column, filter.value);
        } else {
          console.warn(`Operador no soportado: ${operator}`);
        }
      });
    }

    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending,
        foreignTable: options.orderBy.order,
      })
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error en consulta a ${table}:`, error)
      throw new Error(error.message)
    }

    return data as T[]
  } catch (error: any) {
    console.error(`Error en safeQuery (${table}):`, error)
    throw new Error(`Error al consultar ${table}: ${error.message}`)
  }
}

async function safeInsert<T>(
  table: string,
  data: Record<string, any>,
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const { data: result, error } = await supabase.from(table).insert([data]).select().single()

    if (error) {
      console.error(`Error al insertar en ${table}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true, data: result as T }
  } catch (error: any) {
    console.error(`Error en safeInsert (${table}):`, error)
    return { success: false, error: `Error al insertar en ${table}: ${error.message}` }
  }
}

async function safeUpdate<T>(
  table: string,
  id: string,
  data: Record<string, any>,
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const { data: result, error } = await supabase.from(table).update(data).eq("id", id).select().single()

    if (error) {
      console.error(`Error al actualizar en ${table}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true, data: result as T }
  } catch (error: any) {
    console.error(`Error en safeUpdate (${table}):`, error)
    return { success: false, error: `Error al actualizar en ${table}: ${error.message}` }
  }
}

async function safeDelete(table: string, id: string): Promise<{ success: boolean; error?: string }> {
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

export { safeQuery, safeInsert, safeUpdate, safeDelete }
