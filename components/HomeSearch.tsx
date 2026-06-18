'use client'

import { ReactNode } from 'react'
import SearchInput from '@/components/SearchInput'
import SearchResults from '@/components/SearchResults'
import { useProductSearch } from '@/components/useProductSearch'

// Global (whole-catalogue) search bar shown under the header on the home page.
// Uses the exact same search as category pages — just with no scope. While a
// query is active it replaces the marketing sections (children) with results.
export default function HomeSearch({ children }: { children: ReactNode }) {
  const { query, setQuery, products, loading, activeTerm } = useProductSearch()
  const searching = query.trim() !== ''

  return (
    <>
      {/* Search bar, right under the header */}
      <div className="border-b border-prozon-border bg-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <SearchInput
            value={query}
            onChange={setQuery}
            loading={loading}
            placeholder="Rechercher dans tout le catalogue (nom, référence, catégorie…)"
          />
        </div>
      </div>

      {searching ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          {activeTerm ? (
            <SearchResults products={products} activeTerm={activeTerm} />
          ) : (
            <div className="text-center py-20 text-prozon-gray-mid">Recherche…</div>
          )}
        </div>
      ) : (
        children
      )}
    </>
  )
}
