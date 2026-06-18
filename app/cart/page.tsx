'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, ChevronRight } from 'lucide-react'

export default function CartPage() {
  const { state, dispatch, total, count } = useCart()

  if (state.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingCart size={64} className="mx-auto text-prozon-gray-mid mb-6" />
        <h1 className="font-display text-3xl font-black uppercase mb-3">Votre panier est vide</h1>
        <p className="text-prozon-gray-mid mb-8">Parcourez notre catalogue pour ajouter des produits.</p>
        <Link href="/#categories" className="btn-primary">
          Voir nos produits <ArrowRight size={16} />
        </Link>
      </div>
    )
  }

  const totalTTC = (total * 1.2).toFixed(2)
  const tva = (total * 0.2).toFixed(2)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-prozon-gray-mid mb-8">
        <Link href="/" className="hover:text-prozon-orange">Accueil</Link>
        <ChevronRight size={12} />
        <span className="text-prozon-navy font-semibold">Mon panier</span>
      </nav>

      <h1 className="font-display text-3xl font-black uppercase mb-8">
        Mon panier <span className="text-prozon-orange">({count} article{count > 1 ? 's' : ''})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {state.items.map((item) => (
            <div key={item.id} className="card flex items-center gap-4 p-4">
              {/* Image */}
              <div className="relative w-20 h-20 shrink-0 bg-prozon-gray">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.name} fill className="object-contain p-1" sizes="80px" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-2xl">🪧</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-prozon-gray-mid font-mono">Réf. {item.ref}</div>
                <Link href={`/product/${item.slug}`} className="text-sm font-semibold hover:text-prozon-orange transition-colors line-clamp-2">
                  {item.name}
                </Link>
                <div className="text-xs text-prozon-gray-mid mt-1">{item.price_ht.toFixed(2)} € HT / unité</div>
              </div>

              {/* Qty */}
              <div className="flex items-center border border-prozon-border bg-white">
                <button onClick={() => dispatch({ type: 'DECREMENT', id: item.id })} className="px-2 py-1.5 hover:bg-prozon-gray">
                  <Minus size={12} />
                </button>
                <span className="px-3 py-1.5 text-sm font-bold min-w-[32px] text-center">{item.quantity}</span>
                <button onClick={() => dispatch({ type: 'INCREMENT', id: item.id })} className="px-2 py-1.5 hover:bg-prozon-gray">
                  <Plus size={12} />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right shrink-0 w-24">
                <div className="font-display font-bold text-prozon-navy">
                  {(item.price_ht * item.quantity).toFixed(2)} €
                </div>
                <div className="text-xs text-prozon-gray-mid">HT</div>
              </div>

              {/* Remove */}
              <button
                onClick={() => dispatch({ type: 'REMOVE', id: item.id })}
                className="text-prozon-gray-mid hover:text-red-500 transition-colors p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <button onClick={() => dispatch({ type: 'CLEAR' })} className="text-xs text-prozon-gray-mid hover:text-red-500 transition-colors underline">
            Vider le panier
          </button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-prozon-border p-6 sticky top-24">
            <h2 className="font-display font-bold text-lg uppercase mb-6">Récapitulatif</h2>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-prozon-gray-mid">Sous-total HT</span>
                <span className="font-semibold">{total.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-prozon-gray-mid">TVA (20%)</span>
                <span className="font-semibold">{tva} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-prozon-gray-mid">Livraison</span>
                <span className="text-green-600 font-semibold">À calculer</span>
              </div>
            </div>

            <div className="border-t border-prozon-border pt-4 mb-6">
              <div className="flex justify-between items-baseline">
                <span className="font-display font-bold text-lg uppercase">Total TTC</span>
                <span className="font-display font-black text-3xl text-prozon-navy">{totalTTC} €</span>
              </div>
            </div>

            <Link href="/checkout" className="btn-primary w-full justify-center text-base py-4">
              Commander <ArrowRight size={18} />
            </Link>

            <p className="text-xs text-prozon-gray-mid text-center mt-4">
              Paiement sécurisé — Facture HT émise à la commande
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
