'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { Product } from '@/lib/supabase'

export default function ProductCard({ product }: { product: Product }) {
  const { dispatch } = useCart()

  return (
    <div className="card group flex flex-col">
      <Link href={`/product/${product.slug}`} className="block overflow-hidden bg-white">
        <div className="relative h-48 bg-prozon-gray flex items-center justify-center p-4">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="text-prozon-gray-mid text-sm text-center">
              <div className="w-16 h-16 bg-prozon-border mx-auto mb-2 flex items-center justify-center">
                <span className="text-2xl">🪧</span>
              </div>
              Image non disponible
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs text-prozon-gray-mid font-mono mb-1">Réf. {product.ref}</div>
        <Link href={`/product/${product.slug}`} className="hover:text-prozon-orange transition-colors flex-1">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2">{product.name}</h3>
        </Link>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <div className="text-xl font-display font-bold text-prozon-navy">
              {product.price_ht.toFixed(2)} €
            </div>
            <div className="text-xs text-prozon-gray-mid">HT / unité</div>
          </div>
          <button
            onClick={() => dispatch({ type: 'ADD', product })}
            className="btn-primary text-sm px-3 py-2 shrink-0"
            title="Ajouter au panier"
          >
            <ShoppingCart size={15} />
            <span className="hidden sm:inline">Ajouter</span>
          </button>
        </div>
      </div>
    </div>
  )
}
