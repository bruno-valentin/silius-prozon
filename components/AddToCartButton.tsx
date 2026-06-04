'use client'

import { useState } from 'react'
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { Product } from '@/lib/supabase'

export default function AddToCartButton({ product }: { product: Product }) {
  const { dispatch } = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      dispatch({ type: 'ADD', product })
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Qty selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-prozon-navy">Quantité</label>
        <div className="flex items-center border border-prozon-border bg-white">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="px-3 py-2 hover:bg-prozon-gray transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="px-4 py-2 text-sm font-bold min-w-[40px] text-center">{qty}</span>
          <button
            onClick={() => setQty(q => q + 1)}
            className="px-3 py-2 hover:bg-prozon-gray transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Add button */}
      <button
        onClick={handleAdd}
        className={`w-full py-4 font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 ${
          added
            ? 'bg-green-600 text-white'
            : 'bg-prozon-orange hover:bg-prozon-orange-light text-white'
        }`}
      >
        {added ? <><Check size={18} /> Ajouté au panier</> : <><ShoppingCart size={18} /> Ajouter au panier</>}
      </button>

      <p className="text-xs text-prozon-gray-mid text-center">
        Tarif HT — TVA applicable à la facturation
      </p>
    </div>
  )
}
