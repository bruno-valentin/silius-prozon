import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Supply typology driving the delivery estimate (see lib/delivery.ts). Internal only.
export type SupplyType = 'prozon_stock' | 'dropship_fr' | 'dropship_eu' | 'made_to_order'

// Types
export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  created_at: string
}

export type Product = {
  id: string
  category_id: string | null
  name: string
  slug: string
  ref: string
  price_ht: number
  description: string | null
  image_url: string | null
  stock: number
  active: boolean
  created_at: string
  category_n1: string | null
  category_n2: string | null
  category_n3: string | null
  // Supply data (delivery estimate) — added in sql/05_supply_data.sql.
  supply_type: SupplyType | null
  supplier_id: string | null
  force_long_delay: boolean
}

// Curated supplier (seeded in SQL — no full CRUD in V1; only force_long_delay is editable).
export type Supplier = {
  id: string
  name: string
  country: string | null
  default_supply_type: SupplyType
  force_long_delay: boolean
  force_long_delay_at: string | null
  force_long_delay_by: string | null
  created_at: string
}

// Columns selected for product listings. Excludes `search_vector` (a large tsvector
// used only for full-text indexing — no need to ship it to the client). Includes the
// supply fields needed by the delivery engine, but never the internal audit columns
// (`force_long_delay_at/by`).
export const PRODUCT_COLUMNS =
  'id, category_id, name, slug, ref, price_ht, description, image_url, stock, active, created_at, category_n1, category_n2, category_n3, supply_type, supplier_id, force_long_delay'
