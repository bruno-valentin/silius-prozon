'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, Product, Supplier, SupplyType } from '@/lib/supabase'
import { getCategoryTree, TopCategory } from '@/lib/taxonomy'
import { estimateDelivery } from '@/lib/delivery'
import { Plus, Pencil, X, Check, Upload, Eye, EyeOff, LayoutDashboard, ChevronLeft, ChevronRight, Truck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import DeliveryEstimateBlock from '@/components/DeliveryEstimate'

const EMPTY_FORM = {
  name: '', slug: '', ref: '', price_ht: '', description: '',
  category_n1: '', category_n2: '', category_n3: '', stock: '100', active: true, image_url: '',
  supply_type: '' as '' | SupplyType, supplier_id: '', force_long_delay: false,
}

// Internal admin labels for the 4 supply typologies (the customer never sees these — FR11).
const SUPPLY_TYPE_OPTIONS: { value: SupplyType; label: string }[] = [
  { value: 'prozon_stock', label: 'Stock propre (entrepôt) — date ferme' },
  { value: 'dropship_fr', label: 'Fournisseur France — fourchette courte' },
  { value: 'dropship_eu', label: 'Fournisseur UE — fourchette moyenne' },
  { value: 'made_to_order', label: 'Sur commande / import — délai long + devis' },
]

const PAGE_SIZE = 50

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [tree, setTree] = useState<TopCategory[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Category tree and suppliers are fetched once; the product list is fetched per page.
  useEffect(() => {
    getCategoryTree().then(setTree)
    supabase.from('suppliers').select('*').order('name').then(({ data }) => setSuppliers(data ?? []))
  }, [])

  useEffect(() => {
    fetchPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Fetches the current page of products plus exact total / active counts
  // (counts are independent of the page, so the stats stay accurate across the
  // whole 5k+ catalogue rather than just the rows currently displayed).
  async function fetchPage() {
    setLoading(true)
    const from = page * PAGE_SIZE
    const [pageRes, totalRes, activeRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true),
    ])
    setProducts(pageRes.data ?? [])
    setTotal(totalRes.count ?? 0)
    setActiveCount(activeRes.count ?? 0)
    setLoading(false)
  }

  function openCreate() {
    setEditProduct(null)
    const firstN1 = tree[0]
    setForm({
      ...EMPTY_FORM,
      category_n1: firstN1?.name ?? '',
      category_n2: firstN1?.subcategories[0]?.name ?? '',
    })
    setImageFile(null)
    setImagePreview(null)
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setEditProduct(p)
    setForm({
      name: p.name, slug: p.slug, ref: p.ref,
      price_ht: String(p.price_ht), description: p.description ?? '',
      category_n1: p.category_n1 ?? '', category_n2: p.category_n2 ?? '',
      category_n3: p.category_n3 ?? '', stock: String(p.stock),
      active: p.active, image_url: p.image_url ?? '',
      supply_type: p.supply_type ?? '', supplier_id: p.supplier_id ?? '',
      force_long_delay: p.force_long_delay ?? false,
    })
    setImageFile(null)
    setImagePreview(p.image_url)
    setShowForm(true)
  }

  function handleField(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'name' && !editProduct) {
      const slug = (v as string).toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      setForm(f => ({ ...f, name: v as string, slug }))
    }
    // Selecting a top-level category resets the subcategory to its first child.
    if (k === 'category_n1') {
      const n1 = tree.find(t => t.name === v)
      setForm(f => ({ ...f, category_n2: n1?.subcategories[0]?.name ?? '' }))
    }
    // Picking a supplier pre-fills the supply type from its default (inheritance, US-4.2) —
    // still overridable below.
    if (k === 'supplier_id') {
      const sup = suppliers.find(s => s.id === v)
      if (sup) setForm(f => ({ ...f, supply_type: sup.default_supply_type }))
    }
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      let image_url = form.image_url

      // Upload image if new file selected
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `panneau-${form.ref}-${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('products')
          .upload(path, imageFile, { upsert: true })
        if (uploadErr) throw uploadErr
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(path)
        image_url = urlData.publicUrl
      }

      const payload = {
        name: form.name,
        slug: form.slug,
        ref: form.ref,
        price_ht: parseFloat(form.price_ht),
        description: form.description || null,
        category_n1: form.category_n1 || null,
        category_n2: form.category_n2 || null,
        category_n3: form.category_n3 || null,
        stock: parseInt(form.stock),
        active: form.active,
        image_url: image_url || null,
        supply_type: form.supply_type || null,
        supplier_id: form.supplier_id || null,
        force_long_delay: form.force_long_delay,
        // Trace who/when the "long delay" override is set (public-markets audit, O3).
        force_long_delay_at: form.force_long_delay ? new Date().toISOString() : null,
        force_long_delay_by: form.force_long_delay ? 'back-office' : null,
      }

      if (editProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editProduct.id)
        if (error) throw error
        setMessage({ type: 'ok', text: 'Produit mis à jour ✓' })
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
        setMessage({ type: 'ok', text: 'Produit créé ✓' })
      }

      // New products are most recent, so jump to the first page to reveal them.
      if (!editProduct && page !== 0) {
        setPage(0)
      } else {
        await fetchPage()
      }
      setShowForm(false)
    } catch (err: unknown) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Erreur inconnue' })
    }
    setSaving(false)
  }

  async function toggleActive(p: Product) {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    fetchPage()
  }

  // Live customer preview — same engine as the product page (single source of truth),
  // recomputed on every render so it tracks each field change (FR16).
  const previewSupplier = suppliers.find(s => s.id === form.supplier_id) ?? null
  const previewEstimate = estimateDelivery(
    { supply_type: form.supply_type || null, force_long_delay: form.force_long_delay },
    {
      supplier: previewSupplier
        ? { default_supply_type: previewSupplier.default_supply_type, force_long_delay: previewSupplier.force_long_delay }
        : null,
    },
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="flex items-center gap-2 text-prozon-orange text-xs font-bold uppercase tracking-widest mb-1 hover:underline">
            <LayoutDashboard size={14} /> Back-office
          </Link>
          <h1 className="font-display text-3xl font-black uppercase">Gestion des produits</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin" className="btn-secondary text-sm py-2">← Back-office</Link>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Nouveau produit
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total produits', value: total.toLocaleString('fr-FR') },
          { label: 'Actifs', value: activeCount.toLocaleString('fr-FR') },
          { label: 'Inactifs', value: (total - activeCount).toLocaleString('fr-FR') },
          { label: 'Catégories', value: tree.length },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-prozon-border p-4">
            <div className="font-display text-3xl font-black text-prozon-navy">{stat.value}</div>
            <div className="text-xs text-prozon-gray-mid mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 px-4 py-3 text-sm font-semibold ${message.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Product table */}
      <div className="bg-white border border-prozon-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-prozon-navy text-white text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3 w-16">Image</th>
              <th className="text-left px-4 py-3">Produit</th>
              <th className="text-left px-4 py-3">Réf.</th>
              <th className="text-right px-4 py-3">Prix HT</th>
              <th className="text-center px-4 py-3">Stock</th>
              <th className="text-center px-4 py-3">Statut</th>
              <th className="text-center px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-prozon-gray-mid">Chargement…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-prozon-gray-mid">Aucun produit.</td></tr>
            ) : products.map((p, i) => (
              <tr key={p.id} className={`border-t border-prozon-border hover:bg-prozon-gray/50 transition-colors ${i % 2 === 0 ? '' : 'bg-prozon-gray/20'}`}>
                <td className="px-4 py-3">
                  <div className="relative w-12 h-12 bg-prozon-gray">
                    {p.image_url
                      ? <Image src={p.image_url} alt={p.name} fill className="object-contain p-1" sizes="48px" />
                      : <span className="flex items-center justify-center w-full h-full text-lg">🪧</span>
                    }
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold leading-snug line-clamp-1">{p.name}</div>
                  <div className="text-xs text-prozon-gray-mid">{p.slug}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{p.ref}</td>
                <td className="px-4 py-3 text-right font-display font-bold">{p.price_ht.toFixed(2)} €</td>
                <td className="px-4 py-3 text-center">{p.stock}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`badge ${p.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {p.active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 hover:text-prozon-orange transition-colors" title="Modifier">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => toggleActive(p)} className="p-1.5 hover:text-prozon-orange transition-colors" title={p.active ? 'Désactiver' : 'Activer'}>
                      {p.active ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <Link href={`/product/${p.slug}`} target="_blank" className="p-1.5 hover:text-prozon-orange transition-colors" title="Voir">
                      <Eye size={15} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="text-prozon-gray-mid">
            {(page * PAGE_SIZE + 1).toLocaleString('fr-FR')}–
            {Math.min((page + 1) * PAGE_SIZE, total).toLocaleString('fr-FR')} sur {total.toLocaleString('fr-FR')}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={15} /> Précédent
            </button>
            <span className="text-prozon-gray-mid">Page {page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => (p + 1 < totalPages ? p + 1 : p))}
              disabled={page + 1 >= totalPages || loading}
              className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl my-8">
            {/* Modal header */}
            <div className="bg-prozon-navy text-white px-6 py-4 flex items-center justify-between">
              <h2 className="font-display font-bold text-lg uppercase">
                {editProduct ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <button onClick={() => setShowForm(false)} className="hover:text-prozon-orange transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-prozon-navy mb-2">Image produit</label>
                <div
                  className="border-2 border-dashed border-prozon-border h-36 flex flex-col items-center justify-center cursor-pointer hover:border-prozon-orange transition-colors relative overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <Image src={imagePreview} alt="preview" fill className="object-contain p-3" />
                  ) : (
                    <>
                      <Upload size={24} className="text-prozon-gray-mid mb-2" />
                      <span className="text-xs text-prozon-gray-mid">Cliquer pour uploader (JPG, PNG)</span>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
                {form.image_url && !imageFile && (
                  <div className="mt-1 text-xs text-prozon-gray-mid truncate">URL actuelle : {form.image_url}</div>
                )}
              </div>

              {/* Taxonomy: n1 / n2 / n3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-prozon-navy mb-1">Catégorie (N1) *</label>
                  <select
                    value={form.category_n1}
                    onChange={e => handleField('category_n1', e.target.value)}
                    className="w-full border border-prozon-border px-3 py-2 text-sm focus:outline-none focus:border-prozon-orange"
                  >
                    <option value="">—</option>
                    {tree.map(t => <option key={t.slug} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-prozon-navy mb-1">Sous-catégorie (N2)</label>
                  <select
                    value={form.category_n2}
                    onChange={e => handleField('category_n2', e.target.value)}
                    className="w-full border border-prozon-border px-3 py-2 text-sm focus:outline-none focus:border-prozon-orange"
                  >
                    <option value="">—</option>
                    {(tree.find(t => t.name === form.category_n1)?.subcategories ?? []).map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-prozon-navy mb-1">Sous-sous-catégorie (N3)</label>
                <input
                  value={form.category_n3}
                  onChange={e => handleField('category_n3', e.target.value)}
                  className="w-full border border-prozon-border px-3 py-2 text-sm focus:outline-none focus:border-prozon-orange"
                  placeholder="Optionnel — ex : Panneaux de danger"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-prozon-navy mb-1">Nom *</label>
                <input
                  value={form.name}
                  onChange={e => handleField('name', e.target.value)}
                  className="w-full border border-prozon-border px-3 py-2 text-sm focus:outline-none focus:border-prozon-orange"
                  placeholder="Ex: B14 - Panneau limitation de vitesse à 50 km/h"
                />
              </div>

              {/* Slug + Ref */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-prozon-navy mb-1">Slug *</label>
                  <input
                    value={form.slug}
                    onChange={e => handleField('slug', e.target.value)}
                    className="w-full border border-prozon-border px-3 py-2 text-sm font-mono focus:outline-none focus:border-prozon-orange"
                    placeholder="b14-limitation-vitesse-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-prozon-navy mb-1">Référence *</label>
                  <input
                    value={form.ref}
                    onChange={e => handleField('ref', e.target.value)}
                    className="w-full border border-prozon-border px-3 py-2 text-sm font-mono focus:outline-none focus:border-prozon-orange"
                    placeholder="00065"
                  />
                </div>
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-prozon-navy mb-1">Prix HT (€) *</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={form.price_ht}
                    onChange={e => handleField('price_ht', e.target.value)}
                    className="w-full border border-prozon-border px-3 py-2 text-sm focus:outline-none focus:border-prozon-orange"
                    placeholder="28.99"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-prozon-navy mb-1">Stock</label>
                  <input
                    type="number" min="0"
                    value={form.stock}
                    onChange={e => handleField('stock', e.target.value)}
                    className="w-full border border-prozon-border px-3 py-2 text-sm focus:outline-none focus:border-prozon-orange"
                    placeholder="100"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-prozon-navy mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => handleField('description', e.target.value)}
                  className="w-full border border-prozon-border px-3 py-2 text-sm focus:outline-none focus:border-prozon-orange resize-none"
                  placeholder="Description détaillée du produit…"
                />
              </div>

              {/* Supply & delivery estimate (EPIC-4 / D9) */}
              <div className="border border-prozon-border bg-prozon-gray/50 p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-prozon-navy">
                  <Truck size={14} /> Approvisionnement &amp; délai de livraison
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Supplier */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-prozon-navy mb-1">Fournisseur</label>
                    <select
                      value={form.supplier_id}
                      onChange={e => handleField('supplier_id', e.target.value)}
                      className="w-full border border-prozon-border px-3 py-2 text-sm focus:outline-none focus:border-prozon-orange bg-white"
                    >
                      <option value="">— Aucun (stock propre)</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}{s.force_long_delay ? ' — délai long actif' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Supply type */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-prozon-navy mb-1">Type de livraison</label>
                    <select
                      value={form.supply_type}
                      onChange={e => handleField('supply_type', e.target.value)}
                      className="w-full border border-prozon-border px-3 py-2 text-sm focus:outline-none focus:border-prozon-orange bg-white"
                    >
                      <option value="">— Défaut prudent (sur commande)</option>
                      {SUPPLY_TYPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    {form.supplier_id && (
                      <div className="text-xs text-prozon-gray-mid mt-1">Hérité du fournisseur — modifiable</div>
                    )}
                  </div>
                </div>

                {/* Force "long delay" toggle (product level) — one-way, degrade only */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleField('force_long_delay', !form.force_long_delay)}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.force_long_delay ? 'bg-prozon-orange' : 'bg-prozon-border'} relative`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.force_long_delay ? 'translate-x-6' : ''}`} />
                  </button>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-prozon-navy">
                      Passer en délai long — Expédié sous 5 à 7 semaines
                    </div>
                    <div className="text-xs text-prozon-gray-mid mt-0.5">
                      Sens unique : on ne peut que rendre la promesse plus prudente, jamais raccourcir.
                    </div>
                  </div>
                </div>

                {/* Live customer preview — exactly what the visitor will see */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-prozon-gray-mid mb-2">Aperçu client</div>
                  <DeliveryEstimateBlock estimate={previewEstimate} />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-prozon-navy">Actif</label>
                <button
                  type="button"
                  onClick={() => handleField('active', !form.active)}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ${form.active ? 'bg-green-500' : 'bg-prozon-border'} relative`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.active ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {/* Error */}
              {message?.type === 'err' && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{message.text}</div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">
                  <X size={16} /> Annuler
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                  <Check size={16} /> {saving ? 'Enregistrement…' : (editProduct ? 'Mettre à jour' : 'Créer le produit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
