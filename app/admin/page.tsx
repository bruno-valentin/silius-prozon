import Link from 'next/link'
import { LayoutDashboard, Package, Search, Truck, ChevronRight } from 'lucide-react'

// Back-office landing. Two areas: the catalogue (CRUD) and the anonymous
// customer-search log. Each is a card linking to its dedicated page.
const SECTIONS = [
  {
    href: '/admin/produits',
    icon: Package,
    title: 'Gestion des produits',
    desc: 'Créer, modifier, activer ou désactiver les produits du catalogue.',
  },
  {
    href: '/admin/recherches',
    icon: Search,
    title: 'Gestion des recherches clients',
    desc: 'Mots-clés recherchés par les visiteurs, de façon anonyme (conforme RGPD).',
  },
  {
    href: '/admin/fournisseurs',
    icon: Truck,
    title: 'Fournisseurs & délais',
    desc: 'Basculer tout le catalogue d’un fournisseur en délai long quand il ne tient pas ses délais.',
  },
]

export default function AdminHome() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-prozon-orange text-xs font-bold uppercase tracking-widest mb-1">
            <LayoutDashboard size={14} /> Back-office
          </div>
          <h1 className="font-display text-3xl font-black uppercase">Tableau de bord</h1>
        </div>
        <Link href="/" className="btn-secondary text-sm py-2">← Site</Link>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {SECTIONS.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="group bg-white border border-prozon-border p-6 hover:border-prozon-orange transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-prozon-navy text-white flex items-center justify-center">
                <Icon size={22} />
              </div>
              <ChevronRight
                size={20}
                className="text-prozon-gray-mid group-hover:text-prozon-orange transition-colors"
              />
            </div>
            <h2 className="font-display text-xl font-black uppercase mb-2">{title}</h2>
            <p className="text-sm text-prozon-gray-mid leading-relaxed">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
