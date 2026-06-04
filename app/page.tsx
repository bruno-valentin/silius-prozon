import Link from 'next/link'
import { supabase, Category } from '@/lib/supabase'
import { ArrowRight, Shield, Truck, Phone, Star } from 'lucide-react'

async function getCategories(): Promise<Category[]> {
  const { data } = await supabase.from('categories').select('*').order('name')
  return data ?? []
}

const ALL_CATEGORIES = [
  { name: 'Panneaux de signalisation', slug: 'panneaux-signalisation-routiere', icon: '🪧', count: 420 },
  { name: 'Mobilier urbain', slug: '#', icon: '🪑', count: null },
  { name: 'Balises & Cônes', slug: '#', icon: '🔶', count: null },
  { name: 'Marquage au sol', slug: '#', icon: '🎨', count: null },
  { name: 'Éclairage public', slug: '#', icon: '💡', count: null },
  { name: 'Fonte de voirie', slug: '#', icon: '⚙️', count: null },
]

export default async function HomePage() {
  const categories = await getCategories()

  return (
    <>
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
              Panneaux de signalisation, mobilier urbain, équipements de voirie — conformes NF & CE, livrés partout en France.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/category/panneaux-signalisation-routiere" className="btn-primary">
                Voir nos produits <ArrowRight size={16} />
              </Link>
              <a href="tel:+33484894343" className="btn-secondary border-white text-white hover:bg-white hover:text-prozon-navy">
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
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-prozon-orange text-xs font-bold uppercase tracking-widest mb-2">Catalogue</div>
            <h2 className="section-title">Nos catégories</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {ALL_CATEGORIES.map((cat) => {
            const isActive = cat.slug !== '#'
            const card = (
              <div className={`card p-5 text-center flex flex-col items-center gap-3 ${isActive ? 'cursor-pointer hover:border-prozon-orange' : 'opacity-50 cursor-not-allowed'} transition-all duration-200`}>
                <div className="text-4xl">{cat.icon}</div>
                <div className="text-xs font-semibold leading-snug text-prozon-navy">{cat.name}</div>
                {cat.count && <div className="text-xs text-prozon-gray-mid">{cat.count} produits</div>}
                {!cat.count && <div className="text-xs text-prozon-gray-mid">Bientôt</div>}
              </div>
            )
            return isActive
              ? <Link key={cat.slug} href={`/category/${cat.slug}`}>{card}</Link>
              : <div key={cat.name}>{card}</div>
          })}
        </div>
      </section>

      {/* Featured category */}
      <section className="bg-white border-y border-prozon-border">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-prozon-orange text-xs font-bold uppercase tracking-widest mb-2">En vedette</div>
              <h2 className="section-title">Panneaux de signalisation</h2>
            </div>
            <Link href="/category/panneaux-signalisation-routiere" className="btn-outline-orange text-sm hidden sm:inline-flex">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          <p className="text-prozon-gray-mid max-w-2xl mb-8">
            420 références disponibles. Panneaux conformes NF EN 12899-1, rétroréfléchissants Classe 1, 2 et 3. Idéaux pour mairies, syndicats intercommunaux et gestionnaires de voirie.
          </p>
          <Link href="/category/panneaux-signalisation-routiere" className="btn-primary">
            Explorer la catégorie <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  )
}
