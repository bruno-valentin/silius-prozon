import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
}

// Columns selected for product listings. Excludes `search_vector` (a large tsvector
// used only for full-text indexing — no need to ship it to the client).
export const PRODUCT_COLUMNS =
  'id, category_id, name, slug, ref, price_ht, description, image_url, stock, active, created_at, category_n1, category_n2, category_n3'
