'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { ShoppingCart, Phone, ChevronDown, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const { count } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="bg-prozon-navy text-white sticky top-0 z-50 shadow-lg">
      {/* Top bar */}
      <div className="bg-prozon-blue border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-8 text-xs text-white/70">
          <span>Collectivités & Professionnels — Service client du lun. au ven. 9h–17h30</span>
          <a href="tel:+XXXXXXXXXX" className="flex items-center gap-1 hover:text-prozon-orange transition-colors">
            <Phone size={11} />
            XXXXXXXXXX
          </a>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="font-display text-2xl font-black tracking-widest text-white group-hover:text-prozon-orange transition-colors">
              SILIUS
            </div>
            <div className="hidden sm:block text-xs text-white/40 font-light leading-tight ml-1">
              Fournitures<br/>techniques
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="px-4 py-5 text-sm font-semibold hover:text-prozon-orange transition-colors border-b-2 border-transparent hover:border-prozon-orange">
              Accueil
            </Link>
            <Link href="/category/panneaux-signalisation-routiere" className="px-4 py-5 text-sm font-semibold hover:text-prozon-orange transition-colors border-b-2 border-transparent hover:border-prozon-orange flex items-center gap-1">
              Nos produits <ChevronDown size={14} />
            </Link>
            <Link href="/admin" className="px-4 py-5 text-sm font-semibold text-prozon-orange border-b-2 border-prozon-orange">
              Back-office
            </Link>
          </nav>

          {/* Cart + mobile toggle */}
          <div className="flex items-center gap-3">
            <Link href="/cart" className="relative flex items-center gap-2 bg-prozon-orange hover:bg-prozon-orange-light px-4 py-2 transition-colors">
              <ShoppingCart size={18} />
              <span className="hidden sm:inline text-sm font-semibold">Panier</span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-prozon-orange text-xs font-black w-5 h-5 flex items-center justify-center rounded-full">
                  {count}
                </span>
              )}
            </Link>
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-prozon-blue border-t border-white/10 px-4 py-4 flex flex-col gap-2">
          <Link href="/" className="py-2 text-sm font-semibold" onClick={() => setMobileOpen(false)}>Accueil</Link>
          <Link href="/category/panneaux-signalisation-routiere" className="py-2 text-sm font-semibold" onClick={() => setMobileOpen(false)}>Nos produits</Link>
          <Link href="/admin" className="py-2 text-sm font-semibold text-prozon-orange" onClick={() => setMobileOpen(false)}>Back-office</Link>
        </div>
      )}
    </header>
  )
}
