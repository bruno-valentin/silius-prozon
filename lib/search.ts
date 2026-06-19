import { supabase, Product, PRODUCT_COLUMNS } from '@/lib/supabase'

// Max rows returned per search (matches PostgREST's default page size).
export const SEARCH_LIMIT = 100

// Scope narrows the search. `{}` = global (whole catalogue);
// `{ categoryN1 }` = restricted to one top-level category.
export type SearchScope = { categoryN1?: string }

// The one product search used by every search bar in the app. The query logic is
// identical everywhere — accent-insensitive french full-text via the GIN index,
// with an ilike fallback. Only the scope differs.
export async function searchProducts(term: string, scope: SearchScope = {}): Promise<Product[]> {
  const base = () => {
    const q = supabase.from('products').select(PRODUCT_COLUMNS).eq('active', true)
    const scoped = scope.categoryN1 ? q.eq('category_n1', scope.categoryN1) : q
    return scoped.order('price_ht').limit(SEARCH_LIMIT)
  }

  // Primary path: full-text search backed by the GIN index on `search_vector`.
  const { data, error } = await base().textSearch('search_vector', term, {
    type: 'websearch',
    config: 'fr_unaccent',
  })
  if (!error) return (data as Product[]) ?? []

  // Fallback: if the tsvector column / config isn't available, degrade to a
  // case-insensitive substring match on name and ref.
  const escaped = term.replace(/[%,]/g, ' ')
  const { data: fallback } = await base().or(`name.ilike.%${escaped}%,ref.ilike.%${escaped}%`)
  return (fallback as Product[]) ?? []
}

// Records a customer search in the anonymous `search_queries` log, surfaced in
// the back-office ("Gestion des recherches clients"). GDPR by design: we persist
// only the typed term, its scope and the result count — never anything that
// could re-identify who searched (no user id, session, IP or persona link).
// Fire-and-forget: a logging failure must never break the actual search.
export function logSearch(term: string, resultsCount: number, scope?: string): void {
  const cleaned = term.trim()
  if (!cleaned) return
  void supabase
    .from('search_queries')
    .insert({ term: cleaned, results_count: resultsCount, scope: scope ?? null })
    .then(undefined, () => {}) // swallow errors — logging is best-effort
}
