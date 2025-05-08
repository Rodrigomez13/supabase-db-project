// Interfaces para servidores
export interface Server {
  id: string
  name: string
  default_franchise_id?: string | null
  coefficient?: number
  is_active?: boolean
  description?: string
  created_at?: string
}

// Interfaces para franquicias
export interface Franchise {
  id: string
  name: string
}

// Interfaces para teléfonos de franquicias
export interface FranchisePhone {
  id: string
  franchise_id: string
  phone_number: string
  order_number: number
}

// Interfaces para leads
export interface Lead {
  id: string
  date: string
  server_id: string
  franchise_id: string
  franchise_phone_id: string
  status: string
  created_at?: string
  servers?: {
    name: string
  }
  franchises?: {
    name: string
  }
  franchise_phones?: {
    phone_number: string
  }
}

// Interfaces para conversiones
export interface Conversion {
  id: string
  lead_id: string
  date: string
  amount: number
  created_at?: string
  leads?: {
    servers?: {
      name: string
    }
    franchises?: {
      name: string
    }
    franchise_phones?: {
      phone_number: string
    }
  }
}

// Tipos de estado para leads
export type LeadStatus = "pending" | "contacted" | "converted" | "lost"

// Tipos de variante para badges
export type BadgeVariant = "default" | "destructive" | "outline" | "secondary" | "success" | "warning"
