import { supabase } from '@/lib/supabase'

// The product taxonomy lives in the products table as three text columns
// (category_n1 / n2 / n3). These helpers turn that flat data into a navigable
// tree and provide stable, URL-safe slugs derived from the n1 label.

export type SubCategory = {
  name: string
  count: number
}

export type TopCategory = {
  name: string // raw category_n1 value
  slug: string
  count: number
  subcategories: SubCategory[]
}

/** Accent-insensitive, URL-safe slug. "Circulation et Aménagement Urbain" -> "circulation-et-amenagement-urbain". */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Emoji per top-level category, matched on slug. Falls back to a generic box.
const CATEGORY_ICONS: Record<string, string> = {
  'amenagement-erp': '🏢',
  'circulation-et-amenagement-urbain': '🚦',
  'entrepots-et-industries': '🏭',
  construction: '🏗️',
  'equipement-agricole': '🚜',
  'materiel-evenementiel': '🎪',
  'espaces-verts': '🌳',
}

export function categoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug] ?? '📦'
}

/** Fetches the full n1/n2 taxonomy (with counts) and structures it as a tree, ordered by size. */
export async function getCategoryTree(): Promise<TopCategory[]> {
  const { data, error } = await supabase.rpc('get_category_tree')
  if (error || !data) return []

  const byName = new Map<string, TopCategory>()
  for (const row of data as { category_n1: string; category_n2: string | null; product_count: number }[]) {
    let top = byName.get(row.category_n1)
    if (!top) {
      top = { name: row.category_n1, slug: slugify(row.category_n1), count: 0, subcategories: [] }
      byName.set(row.category_n1, top)
    }
    top.count += Number(row.product_count)
    if (row.category_n2) {
      top.subcategories.push({ name: row.category_n2, count: Number(row.product_count) })
    }
  }

  return Array.from(byName.values()).sort((a, b) => b.count - a.count)
}

/** Resolves a URL slug back to its top-level category, or null if unknown. */
export async function getTopCategoryBySlug(slug: string): Promise<TopCategory | null> {
  const tree = await getCategoryTree()
  return tree.find((c) => c.slug === slug) ?? null
}
