import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase, Product } from '@/lib/supabase'
import { slugify } from '@/lib/taxonomy'
import { ChevronRight, CheckCircle, Shield, Truck, Package } from 'lucide-react'
import AddToCartButton from '@/components/AddToCartButton'

async function getProduct(slug: string): Promise<Product | null> {
  const { data } = await supabase.from('products').select('*').eq('slug', slug).single()
  return data
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug)
  if (!product) notFound()

  // Breadcrumb / back-link are derived from the product's taxonomy columns.
  const topCategory = product.category_n1
    ? { name: product.category_n1, slug: slugify(product.category_n1) }
    : null

  const priceTTC = (product.price_ht * 1.2).toFixed(2)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-prozon-gray-mid mb-8 flex-wrap">
        <Link href="/" className="hover:text-prozon-orange transition-colors">Accueil</Link>
        <ChevronRight size={12} />
        {topCategory && (
          <>
            <Link href={`/category/${topCategory.slug}`} className="hover:text-prozon-orange transition-colors">
              {topCategory.name}
            </Link>
            <ChevronRight size={12} />
          </>
        )}
        {product.category_n2 && (
          <>
            <span className="text-prozon-gray-mid">{product.category_n2}</span>
            <ChevronRight size={12} />
          </>
        )}
        <span className="text-prozon-navy font-semibold line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image */}
        <div className="bg-white border border-prozon-border">
          <div className="relative h-80 md:h-96 flex items-center justify-center p-8 bg-prozon-gray">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-contain p-6"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="text-prozon-gray-mid text-center">
                <div className="text-6xl mb-4">🪧</div>
                <div className="text-sm">Image non disponible</div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-prozon-border text-xs text-prozon-gray-mid text-center">
            Les images sont présentées à titre indicatif
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="text-xs text-prozon-gray-mid font-mono mb-2">Réf. {product.ref}</div>
          <h1 className="font-display text-2xl md:text-3xl font-black uppercase mb-4 leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <div className="bg-prozon-gray border border-prozon-border p-4 mb-6">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-black text-prozon-navy">
                {product.price_ht.toFixed(2)} €
              </span>
              <span className="text-sm text-prozon-gray-mid">HT / unité</span>
            </div>
            <div className="text-xs text-prozon-gray-mid mt-1">
              Soit {priceTTC} € TTC — TVA 20%
            </div>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 text-sm text-green-700 font-semibold mb-6">
            <CheckCircle size={16} />
            En stock ({product.stock} unités disponibles)
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-prozon-gray-mid text-sm leading-relaxed mb-6">
              {product.description}
            </p>
          )}

          {/* Add to cart */}
          <AddToCartButton product={product} />

          {/* Reassurances */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {[
              { icon: <Shield size={20} />, label: 'Conforme NF & CE' },
              { icon: <Truck size={20} />, label: 'Livraison France' },
              { icon: <Package size={20} />, label: 'Emballage sécurisé' },
            ].map((item, i) => (
              <div key={i} className="bg-prozon-gray border border-prozon-border p-3">
                <div className="text-prozon-orange flex justify-center mb-1">{item.icon}</div>
                <div className="text-xs font-semibold text-prozon-navy">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Back to category */}
          {topCategory && (
            <div className="mt-6">
              <Link href={`/category/${topCategory.slug}`} className="text-sm text-prozon-orange hover:underline flex items-center gap-1">
                ← Retour à {topCategory.name}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
