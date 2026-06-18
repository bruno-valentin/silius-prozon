import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'
import { getCategoryTree } from '@/lib/taxonomy'

export default async function Footer() {
  const categories = (await getCategoryTree()).slice(0, 6)

  return (
    <footer className="bg-prozon-navy text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="font-display text-2xl font-black tracking-widest mb-2">SILIUS</div>
          <p className="text-white/60 text-sm leading-relaxed">
            Fournitures techniques pour collectivités et professionnels — aménagement ERP, voirie, industrie, construction et bien plus.
          </p>
        </div>
        <div>
          <h4 className="font-display font-bold text-sm uppercase tracking-widest text-prozon-orange mb-4">Nos catégories</h4>
          <ul className="space-y-2 text-sm text-white/70">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/category/${cat.slug}`} className="hover:text-white transition-colors">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold text-sm uppercase tracking-widest text-prozon-orange mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2"><Phone size={14} /><a href="tel:+XXXXXXXXXX" className="hover:text-white transition-colors">XXXXXXXXXX</a></li>
            <li className="flex items-center gap-2"><Mail size={14} /><a href="mailto:XXXXX@XXXXXX.XXXXX" className="hover:text-white transition-colors">contact@XXXXX.XXXX</a></li>
            <li className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" /><span>France — Lun.–Ven. 9h–12h30 / 14h–17h30</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 text-center text-xs text-white/30 py-4">
        donées de test
      </div>
    </footer>
  )
}
