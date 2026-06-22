'use client'

import { useEffect, useState } from 'react'
import { supabase, Supplier, SupplyType } from '@/lib/supabase'
import { LayoutDashboard, Truck } from 'lucide-react'
import Link from 'next/link'

// Supplier admin (US-4.5). Suppliers are seeded in SQL (curated, no CRUD) — the ONLY
// editable field here is the "long delay" toggle: when ON, every product of that
// supplier renders as cautious (via the engine), so we stop promising short delays
// for a supplier that doesn't keep them. The action is traced (who/when).
const TYPE_LABELS: Record<SupplyType, string> = {
  prozon_stock: 'Stock propre',
  dropship_fr: 'Fournisseur France',
  dropship_eu: 'Fournisseur UE',
  made_to_order: 'Sur commande / import',
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  async function fetchSuppliers() {
    setLoading(true)
    const { data } = await supabase.from('suppliers').select('*').order('name')
    setSuppliers(data ?? [])
    setLoading(false)
  }

  async function toggleLongDelay(s: Supplier) {
    setSavingId(s.id)
    const next = !s.force_long_delay
    await supabase
      .from('suppliers')
      .update({
        force_long_delay: next,
        force_long_delay_at: next ? new Date().toISOString() : null,
        force_long_delay_by: next ? 'back-office' : null,
      })
      .eq('id', s.id)
    await fetchSuppliers()
    setSavingId(null)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="flex items-center gap-2 text-prozon-orange text-xs font-bold uppercase tracking-widest mb-1 hover:underline">
            <LayoutDashboard size={14} /> Back-office
          </Link>
          <h1 className="font-display text-3xl font-black uppercase">Fournisseurs &amp; délais</h1>
        </div>
        <Link href="/admin" className="btn-secondary text-sm py-2">← Back-office</Link>
      </div>

      <p className="text-sm text-prozon-gray-mid mb-6 max-w-2xl">
        Fournisseurs gérés en interne (lecture seule). Seul le <strong>délai long</strong> est modifiable :
        l’activer bascule <strong>tous les produits</strong> du fournisseur en « Expédié sous 5 à 7 semaines »,
        pour ne plus promettre un délai intenable.
      </p>

      <div className="bg-white border border-prozon-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-prozon-navy text-white text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Fournisseur</th>
              <th className="text-left px-4 py-3">Pays</th>
              <th className="text-left px-4 py-3">Type par défaut</th>
              <th className="text-center px-4 py-3">Délai long</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-12 text-prozon-gray-mid">Chargement…</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-prozon-gray-mid">Aucun fournisseur.</td></tr>
            ) : suppliers.map((s, i) => (
              <tr key={s.id} className={`border-t border-prozon-border ${i % 2 === 0 ? '' : 'bg-prozon-gray/20'}`}>
                <td className="px-4 py-3">
                  <div className="font-semibold flex items-center gap-2">
                    <Truck size={15} className="text-prozon-navy" /> {s.name}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{s.country ?? '—'}</td>
                <td className="px-4 py-3">{TYPE_LABELS[s.default_supply_type]}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      disabled={savingId === s.id}
                      onClick={() => toggleLongDelay(s)}
                      className={`w-12 h-6 rounded-full transition-colors duration-200 ${s.force_long_delay ? 'bg-prozon-orange' : 'bg-prozon-border'} relative disabled:opacity-50`}
                      title="Passer en délai long — Expédié sous 5 à 7 semaines"
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${s.force_long_delay ? 'translate-x-6' : ''}`} />
                    </button>
                    {s.force_long_delay && s.force_long_delay_at && (
                      <span className="text-[10px] text-prozon-gray-mid">
                        activé le {new Date(s.force_long_delay_at).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
