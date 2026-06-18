'use client'

import { SlidersHorizontal } from 'lucide-react'
import { Product } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import SearchInput from '@/components/SearchInput'
import SearchResults from '@/components/SearchResults'
import { useProductSearch } from '@/components/useProductSearch'

// Category-scoped search + browse listing. Search behaviour/UI is shared with the
// global search bar; only the scope (this category) and the empty-query "browse"
// state are specific to category pages.
export default function CatalogProducts({
  categoryName,
  initialProducts,
  totalCount,
}: {
  categoryName: string
  initialProducts: Product[]
  totalCount: number
}) {
  const { query, setQuery, products, loading, activeTerm } = useProductSearch({ categoryN1: categoryName })
  const searching = activeTerm !== ''

  const sortSelect = (
    <div className="flex items-center gap-2">
      <label className="text-xs text-prozon-gray-mid">Trier par</label>
      <select className="text-sm border border-prozon-border bg-white px-3 py-1.5 text-prozon-navy focus:outline-none focus:border-prozon-orange">
        <option>Prix croissant</option>
        <option>Prix décroissant</option>
        <option>Nom</option>
      </select>
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <SearchInput
          value={query}
          onChange={setQuery}
          loading={loading}
          placeholder="Rechercher un produit (nom, référence, catégorie…)"
        />
      </div>

      {searching ? (
        <SearchResults products={products} activeTerm={activeTerm} actions={sortSelect} />
      ) : (
        <>
          {/* Browse state: the initial (capped) category listing. */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-sm text-prozon-gray-mid">
              <SlidersHorizontal size={14} />
              <span>
                {totalCount.toLocaleString('fr-FR')} produit{totalCount > 1 ? 's' : ''} dans cette catégorie
              </span>
            </div>
            {sortSelect}
          </div>

          {totalCount > initialProducts.length && (
            <p className="text-xs text-prozon-gray-mid mb-4">
              {initialProducts.length} premiers produits affichés — utilisez la recherche pour affiner.
            </p>
          )}

          {initialProducts.length === 0 ? (
            <div className="text-center py-20 text-prozon-gray-mid">
              Aucun produit dans cette catégorie.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {initialProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
