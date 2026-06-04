'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { ChevronRight, Lock, CreditCard, Building2 } from 'lucide-react'
import { useState } from 'react'

export default function CheckoutPage() {
  const { state, total } = useCart()
  const [step, setStep] = useState<'delivery' | 'payment'>('delivery')
  const totalTTC = (total * 1.2).toFixed(2)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-prozon-gray-mid mb-8">
        <Link href="/" className="hover:text-prozon-orange">Accueil</Link>
        <ChevronRight size={12} />
        <Link href="/cart" className="hover:text-prozon-orange">Panier</Link>
        <ChevronRight size={12} />
        <span className="text-prozon-navy font-semibold">Commande</span>
      </nav>

      {/* Steps */}
      <div className="flex items-center gap-4 mb-10">
        {[
          { id: 'delivery', label: '1. Livraison' },
          { id: 'payment', label: '2. Paiement' },
        ].map((s) => (
          <div key={s.id} className={`flex items-center gap-2 text-sm font-semibold ${step === s.id ? 'text-prozon-orange' : 'text-prozon-gray-mid'}`}>
            <div className={`w-6 h-6 flex items-center justify-center text-xs font-black ${step === s.id ? 'bg-prozon-orange text-white' : 'bg-prozon-border text-prozon-gray-mid'}`}>
              {s.id === 'delivery' ? '1' : '2'}
            </div>
            {s.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          {step === 'delivery' && (
            <div className="bg-white border border-prozon-border p-6">
              <h2 className="font-display font-bold text-xl uppercase mb-6 flex items-center gap-2">
                <Building2 size={20} className="text-prozon-orange" />
                Coordonnées de livraison
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Organisme / Société', span: 2 },
                  { label: 'Prénom' },
                  { label: 'Nom' },
                  { label: 'Adresse', span: 2 },
                  { label: 'Code postal' },
                  { label: 'Ville' },
                  { label: 'Email', span: 2 },
                  { label: 'Téléphone', span: 2 },
                ].map((field) => (
                  <div key={field.label} className={field.span === 2 ? 'col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-prozon-navy mb-1">{field.label}</label>
                    <input
                      type="text"
                      className="w-full border border-prozon-border px-3 py-2 text-sm focus:outline-none focus:border-prozon-orange transition-colors"
                      placeholder={field.label}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep('payment')}
                className="btn-primary mt-6 w-full justify-center"
              >
                Continuer vers le paiement
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div className="bg-white border border-prozon-border p-6">
              <h2 className="font-display font-bold text-xl uppercase mb-6 flex items-center gap-2">
                <Lock size={20} className="text-prozon-orange" />
                Paiement
              </h2>

              {/* Payment method selector */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: 'Carte bancaire', icon: <CreditCard size={18} />, active: true },
                  { label: 'Virement', icon: <Building2 size={18} />, active: false },
                ].map((method) => (
                  <div key={method.label} className={`border-2 p-3 flex items-center gap-2 text-sm font-semibold cursor-pointer ${method.active ? 'border-prozon-orange text-prozon-orange' : 'border-prozon-border text-prozon-gray-mid'}`}>
                    {method.icon} {method.label}
                  </div>
                ))}
              </div>

              {/* Fake card form */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-prozon-navy mb-1">Numéro de carte</label>
                  <input disabled className="w-full border border-prozon-border px-3 py-2 text-sm bg-prozon-gray text-prozon-gray-mid" placeholder="•••• •••• •••• ••••" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-prozon-navy mb-1">Expiration</label>
                    <input disabled className="w-full border border-prozon-border px-3 py-2 text-sm bg-prozon-gray text-prozon-gray-mid" placeholder="MM/AA" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-prozon-navy mb-1">CVV</label>
                    <input disabled className="w-full border border-prozon-border px-3 py-2 text-sm bg-prozon-gray text-prozon-gray-mid" placeholder="•••" />
                  </div>
                </div>
              </div>

              {/* DEMO BANNER */}
              <div className="bg-prozon-orange/10 border-2 border-prozon-orange p-4 text-center">
                <div className="font-display font-bold text-prozon-orange uppercase text-sm mb-1">
                  🚧 Démo — Paiement désactivé
                </div>
                <div className="text-xs text-prozon-navy/70">
                  Cette application est une démonstration. Aucun paiement ne peut être effectué.
                </div>
              </div>

              <button disabled className="btn-primary mt-4 w-full justify-center opacity-50 cursor-not-allowed">
                <Lock size={16} /> Payer {totalTTC} € TTC
              </button>

              <button onClick={() => setStep('delivery')} className="mt-3 w-full text-center text-xs text-prozon-gray-mid hover:text-prozon-navy underline">
                ← Revenir à la livraison
              </button>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div>
          <div className="bg-white border border-prozon-border p-5 sticky top-24">
            <h3 className="font-display font-bold text-sm uppercase mb-4">Votre commande</h3>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {state.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs gap-2">
                  <span className="text-prozon-gray-mid line-clamp-2">{item.name} × {item.quantity}</span>
                  <span className="font-semibold shrink-0">{(item.price_ht * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
            </div>
            <div className="border-t border-prozon-border pt-3 space-y-1 text-xs">
              <div className="flex justify-between text-prozon-gray-mid">
                <span>HT</span><span>{total.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-prozon-gray-mid">
                <span>TVA 20%</span><span>{(total * 0.2).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-display font-bold text-base mt-2 pt-2 border-t border-prozon-border">
                <span>TOTAL TTC</span><span>{totalTTC} €</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
