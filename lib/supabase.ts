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
  category_id: string
  name: string
  slug: string
  ref: string
  price_ht: number
  description: string | null
  image_url: string | null
  stock: number
  active: boolean
  created_at: string
}
