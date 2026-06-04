import { notFound } from 'next/navigation'
import { supabase, Category, Product } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'
import { ChevronRight, SlidersHorizontal } from 'lucide-react'

async function getCategory(slug: string): Promise<Category | null> {
  const { data } = await supabase.from('categories').select('*').eq('slug', slug).single()
  return data
}

async function getProducts(categoryId: string): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .eq('active', true)
    .order('price_ht')
  return data ?? []
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await getCategory(params.slug)
  if (!category) notFound()

  const products = await getProducts(category.id)

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
        <div className="text-prozon-orange text-xs font-bold uppercase tracking-widest mb-2">Catégorie</div>
        <h1 className="font-display text-3xl md:text-4xl font-black uppercase mb-3">{category.name}</h1>
        {category.description && (
          <p className="text-white/70 max-w-2xl text-sm leading-relaxed">{category.description}</p>
        )}
        <div className="mt-4 text-sm text-white/50">{products.length} produit{products.length > 1 ? 's' : ''}</div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-prozon-gray-mid">
          <SlidersHorizontal size={14} />
          <span>{products.length} résultat{products.length > 1 ? 's' : ''}</span>
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

      {/* Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20 text-prozon-gray-mid">
          Aucun produit dans cette catégorie.
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
