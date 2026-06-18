import { notFound } from 'next/navigation'
import { supabase, Product, PRODUCT_COLUMNS } from '@/lib/supabase'
import { getTopCategoryBySlug, categoryIcon } from '@/lib/taxonomy'
import CatalogProducts from '@/components/CatalogProducts'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

// First page of products shown before the user searches. Categories can hold
// well over a thousand items, so we cap the initial render and let search narrow.
const INITIAL_PAGE_SIZE = 48

async function getProducts(categoryN1: string): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('category_n1', categoryN1)
    .eq('active', true)
    .order('price_ht')
    .limit(INITIAL_PAGE_SIZE)
  return (data as Product[]) ?? []
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await getTopCategoryBySlug(params.slug)
  if (!category) notFound()

  const products = await getProducts(category.name)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-prozon-gray-mid mb-8">
        <Link href="/" className="hover:text-prozon-orange transition-colors">Accueil</Link>
        <ChevronRight size={12} />
        <span className="text-prozon-navy font-semibold">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="bg-prozon-navy text-white px-8 py-10 mb-10">
        <div className="text-prozon-orange text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
          <span className="text-base">{categoryIcon(category.slug)}</span> Catégorie
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-black uppercase mb-3">{category.name}</h1>
        {category.subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {category.subcategories.map((sub) => (
              <span key={sub.name} className="text-xs bg-white/10 text-white/80 px-2 py-1">
                {sub.name} <span className="text-white/40">({sub.count})</span>
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 text-sm text-white/50">
          {category.count.toLocaleString('fr-FR')} produit{category.count > 1 ? 's' : ''}
        </div>
      </div>

      {/* Search + results (client-side, debounced full-text search) */}
      <CatalogProducts
        categoryName={category.name}
        initialProducts={products}
        totalCount={category.count}
      />
    </div>
  )
}
