import { ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/lib/supabase'

// Shared presentation for a set of search results: the "X produits trouvés"
// count, the product grid, and the zero-result message. Used by every search bar.
export default function SearchResults({
  products,
  activeTerm,
  actions,
}: {
  products: Product[]
  activeTerm: string
  actions?: ReactNode
}) {
  const plural = products.length > 1 ? 's' : ''

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-prozon-gray-mid">
          <SlidersHorizontal size={14} />
          <span>{products.length} produit{plural} trouvé{plural}</span>
        </div>
        {actions}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-prozon-navy font-semibold">
            Aucun résultat pour «&nbsp;{activeTerm}&nbsp;»
          </p>
          <p className="text-prozon-gray-mid text-sm mt-2">
            Essayez un autre terme ou vérifiez l’orthographe.
          </p>
        </div>
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
