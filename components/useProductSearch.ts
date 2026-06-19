'use client'

import { useEffect, useRef, useState } from 'react'
import { Product } from '@/lib/supabase'
import { searchProducts, logSearch, SearchScope } from '@/lib/search'

// Shared search behaviour for every search bar: 300ms debounce, an out-of-order
// response guard, and the loading / active-term bookkeeping. When the query is
// empty it resets to no results — the caller decides what to show in that case.
export function useProductSearch(scope: SearchScope = {}) {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  // The term that produced the currently displayed results — used so the
  // "Aucun résultat pour [terme]" message always matches what's shown.
  const [activeTerm, setActiveTerm] = useState('')

  const requestId = useRef(0)
  const categoryN1 = scope.categoryN1

  useEffect(() => {
    const term = query.trim()

    if (!term) {
      requestId.current++
      setActiveTerm('')
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    const handle = setTimeout(() => {
      const id = ++requestId.current
      searchProducts(term, { categoryN1 }).then((results) => {
        if (id !== requestId.current) return // superseded by a newer keystroke
        setProducts(results)
        setActiveTerm(term)
        setLoading(false)
        // Log the committed search (after debounce, once it's the live term) in
        // the anonymous back-office log — never per keystroke.
        logSearch(term, results.length, categoryN1)
      })
    }, 300)

    return () => clearTimeout(handle)
  }, [query, categoryN1])

  return { query, setQuery, products, loading, activeTerm }
}
