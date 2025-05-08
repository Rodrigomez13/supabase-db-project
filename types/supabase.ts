import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente estándar para uso en el frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Función para obtener información del usuario actual
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    console.error("Error al obtener usuario:", error)
    return null
  }
  return data.user
}

// Función para verificar si el usuario está autenticado
export async function isAuthenticated() {
  const user = await getCurrentUser()
  return !!user // Devuelve true si el usuario existe, false si es null
}

// Define and export the Database type
export type Database = {
  // Add the structure of your database here
  users: {
    id: number;
    name: string;
  };
};