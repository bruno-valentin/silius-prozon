'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react'
import { supabase, Product, PRODUCT_COLUMNS } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'

// Cap on rows pulled back for a single search, matching PostgREST's default.
const SEARCH_LIMIT = 100

export default function CatalogProducts({
  categoryName,
  initialProducts,
  totalCount,
}: {
  categoryName: string
  initialProducts: Product[]
  totalCount: number
}) {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  // The term that produced the currently displayed results — used for the
  // "Aucun résultat pour [terme]" message so it always reflects what's shown.
  const [activeTerm, setActiveTerm] = useState('')

  // Guards against out-of-order responses overwriting newer ones.
  const requestId = useRef(0)

  useEffect(() => {
    const term = query.trim()

    // Empty search → restore the initial category listing, no request needed.
    if (!term) {
      requestId.current++
      setActiveTerm('')
      setProducts(initialProducts)
      setLoading(false)
      return
    }

    setLoading(true)
    const handle = setTimeout(() => {
      const id = ++requestId.current

      searchProducts(categoryName, term).then((results) => {
        // Ignore if a newer keystroke superseded this request.
        if (id !== requestId.current) return
        setProducts(results)
        setActiveTerm(term)
        setLoading(false)
      })
    }, 300)

    return () => clearTimeout(handle)
  }, [query, categoryName, initialProducts])

  const searching = activeTerm !== ''
  const countLabel = searching
    ? `${products.length} produit${products.length > 1 ? 's' : ''} trouvé${products.length > 1 ? 's' : ''}`
    : `${totalCount.toLocaleString('fr-FR')} produit${totalCount > 1 ? 's' : ''} dans cette catégorie`

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-prozon-gray-mid pointer-events-none"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit (nom, référence, catégorie…)"
          aria-label="Rechercher un produit"
          className="w-full border border-prozon-border bg-white pl-11 pr-11 py-3 text-sm text-prozon-navy placeholder:text-prozon-gray-mid focus:outline-none focus:border-prozon-orange transition-colors"
        />
        {loading && (
          <Loader2
            size={18}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-prozon-orange animate-spin"
          />
        )}
      </div>

      {/* Results bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-prozon-gray-mid">
          <SlidersHorizontal size={14} />
          <span>{countLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-prozon-gray-mid">Trier par</label>
          <select className="text-sm border border-prozon-border bg-white px-3 py-1.5 text-prozon-navy focus:outline-none focus:border-prozon-orange">
            <option>Prix croissant</option>
            <option>Prix décroissant</option>
            <option>Nom</option>
          </select>
        </div>
      </div>

      {/* Hint when browsing a partial listing */}
      {!searching && totalCount > products.length && (
        <p className="text-xs text-prozon-gray-mid mb-4">
          {products.length} premiers produits affichés — utilisez la recherche pour affiner.
        </p>
      )}

      {/* Grid / empty states */}
      {products.length === 0 ? (
        searching ? (
          <div className="text-center py-20">
            <p className="text-prozon-navy font-semibold">
              Aucun résultat pour «&nbsp;{activeTerm}&nbsp;»
            </p>
            <p className="text-prozon-gray-mid text-sm mt-2">
              Essayez un autre terme ou vérifiez l’orthographe.
            </p>
          </div>
        ) : (
          <div className="text-center py-20 text-prozon-gray-mid">
            Aucun produit dans cette catégorie.
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

async function searchProducts(categoryN1: string, term: string): Promise<Product[]> {
  const base = () =>
    supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('category_n1', categoryN1)
      .eq('active', true)
      .order('price_ht')
      .limit(SEARCH_LIMIT)

  // Primary path: accent-insensitive french full-text search backed by the GIN
  // index on `search_vector` (fr_unaccent = french stemmer + unaccent).
  const { data, error } = await base().textSearch('search_vector', term, {
    type: 'websearch',
    config: 'fr_unaccent',
  })

  if (!error) return (data as Product[]) ?? []

  // Fallback: if the tsvector column / config isn't available, degrade to a
  // case-insensitive substring match on name and ref.
  const escaped = term.replace(/[%,]/g, ' ')
  const { data: fallback } = await base().or(
    `name.ilike.%${escaped}%,ref.ilike.%${escaped}%`
  )
  return (fallback as Product[]) ?? []
}
