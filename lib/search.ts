import { supabase, Product, PRODUCT_COLUMNS } from '@/lib/supabase'

// Max rows returned per search (matches PostgREST's default page size).
export const SEARCH_LIMIT = 100

// Scope narrows the search. `{}` = global (whole catalogue);
// `{ categoryN1 }` = restricted to one top-level category.
export type SearchScope = { categoryN1?: string }

// The one product search used by every search bar in the app. The query logic is
// identical everywhere — accent-insensitive french full-text, results ranked by
// relevance (ts_rank_cd with per-field weights), with an ilike fallback. Only the
// scope differs.
export async function searchProducts(term: string, scope: SearchScope = {}): Promise<Product[]> {
  // Primary path: relevance-ranked search via the `search_products` RPC
  // (ts_rank_cd over the weighted GIN-indexed search_vector, name/ref > category).
  const { data, error } = await supabase
    .rpc('search_products', {
      p_term: term,
      p_scope: scope.categoryN1 ?? null,
      p_limit: SEARCH_LIMIT,
    })
    .select(PRODUCT_COLUMNS)
  if (!error) return (data as Product[]) ?? []

  // Fallback: if the RPC isn't available, degrade to a case-insensitive substring
  // match on name and ref (ordered by price, no relevance ranking).
  const escaped = term.replace(/[%,]/g, ' ')
  const q = supabase.from('products').select(PRODUCT_COLUMNS).eq('active', true)
  const scoped = scope.categoryN1 ? q.eq('category_n1', scope.categoryN1) : q
  const { data: fallback } = await scoped
    .or(`name.ilike.%${escaped}%,ref.ilike.%${escaped}%`)
    .order('price_ht')
    .limit(SEARCH_LIMIT)
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
