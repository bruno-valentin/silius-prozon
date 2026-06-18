import Link from 'next/link'
import { getCategoryTree, categoryIcon } from '@/lib/taxonomy'
import HomeSearch from '@/components/HomeSearch'
import { ArrowRight, Shield, Truck, Phone, Star } from 'lucide-react'

export default async function HomePage() {
  const categories = await getCategoryTree()
  const featured = categories[0]

  return (
    <HomeSearch>
      {/* Hero */}
      <section className="bg-prozon-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, #fff 40px, #fff 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #fff 40px, #fff 41px)' }} />
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-prozon-orange px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
              <Star size={12} fill="currentColor" /> Fournitures techniques professionnelles
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-black uppercase leading-none mb-6">
              Tout pour vos<br />
              <span className="text-prozon-orange">collectivités</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              Aménagement ERP, voirie, industrie, construction, agricole, événementiel — des milliers de références conformes NF &amp; CE, livrées partout en France.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={featured ? `/category/${featured.slug}` : '/'} className="btn-primary">
                Voir nos produits <ArrowRight size={16} />
              </Link>
              <a href="tel:XXXXXXXXXX" className="btn-secondary border-white text-white hover:bg-white hover:text-prozon-navy">
                <Phone size={16} /> Nous contacter
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-prozon-blue text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-center">
          {[
            { icon: <Shield size={18} />, label: 'Conformité NF & CE garantie' },
            { icon: <Truck size={18} />, label: 'Livraison rapide toute la France' },
            { icon: <Phone size={18} />, label: 'SAV basé en France' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-center gap-2 text-white/80">
              <span className="text-prozon-orange">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="max-w-7xl mx-auto px-4 py-16 scroll-mt-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-prozon-orange text-xs font-bold uppercase tracking-widest mb-2">Catalogue</div>
            <h2 className="section-title">Nos catégories</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/category/${cat.slug}`}>
              <div className="card p-5 text-center flex flex-col items-center gap-3 h-full cursor-pointer hover:border-prozon-orange transition-all duration-200">
                <div className="text-4xl">{categoryIcon(cat.slug)}</div>
                <div className="text-sm font-semibold leading-snug text-prozon-navy">{cat.name}</div>
                <div className="text-xs text-prozon-gray-mid mt-auto">
                  {cat.count.toLocaleString('fr-FR')} produits · {cat.subcategories.length} sous-catégories
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured category — largest in the catalogue */}
      {featured && (
        <section className="bg-white border-y border-prozon-border">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-prozon-orange text-xs font-bold uppercase tracking-widest mb-2">En vedette</div>
                <h2 className="section-title">{featured.name}</h2>
              </div>
              <Link href={`/category/${featured.slug}`} className="btn-outline-orange text-sm hidden sm:inline-flex">
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>
            <p className="text-prozon-gray-mid max-w-2xl mb-8">
              {featured.count.toLocaleString('fr-FR')} références disponibles, réparties en {featured.subcategories.length} sous-catégories
              {featured.subcategories[0] ? ` (${featured.subcategories.slice(0, 3).map((s) => s.name).join(', ')}…)` : ''}.
              Conformes aux normes en vigueur, livrées partout en France.
            </p>
            <Link href={`/category/${featured.slug}`} className="btn-primary">
              Explorer la catégorie <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}
    </HomeSearch>
  )
}
