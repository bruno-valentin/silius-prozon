'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LayoutDashboard, Search, ShieldCheck, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import SearchInput from '@/components/SearchInput'

// One aggregated keyword row from the `search_query_stats` view. Intentionally
// anonymous — there is no column linking a term to who typed it (RGPD).
type KeywordStat = {
  term: string
  search_count: number
  last_searched: string
  last_results_count: number | null
}

export default function AdminSearchesPage() {
  const [stats, setStats] = useState<KeywordStat[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    supabase
      .from('search_query_stats')
      .select('*')
      .order('search_count', { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setStats((data as KeywordStat[]) ?? [])
        setLoading(false)
      })
  }, [])

  // Client-side filtering: the keyword set is small and already loaded, so an
  // accent-insensitive substring match keeps the search bar instant.
  const normalise = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  const filtered = useMemo(() => {
    const q = normalise(filter.trim())
    if (!q) return stats
    return stats.filter((s) => normalise(s.term).includes(q))
  }, [stats, filter])

  const totalSearches = useMemo(
    () => stats.reduce((sum, s) => sum + s.search_count, 0),
    [stats],
  )
  const noResultCount = useMemo(
    () => stats.filter((s) => (s.last_results_count ?? 0) === 0).length,
    [stats],
  )

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin"
            className="flex items-center gap-2 text-prozon-orange text-xs font-bold uppercase tracking-widest mb-1 hover:underline"
          >
            <LayoutDashboard size={14} /> Back-office
          </Link>
          <h1 className="font-display text-3xl font-black uppercase">Gestion des recherches clients</h1>
        </div>
        <Link href="/admin" className="btn-secondary text-sm py-2">← Back-office</Link>
      </div>

      {/* RGPD notice — searches are stored without any link to the visitor */}
      <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 mb-6 text-sm">
        <ShieldCheck size={18} className="shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold">Données anonymisées (RGPD).</span> Seuls les
          mots-clés saisis sont enregistrés. Aucun lien vers le visiteur (identité, compte,
          session ou adresse IP) n&apos;est conservé : impossible de remonter à la personne
          qui a effectué la recherche.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Mots-clés distincts', value: stats.length.toLocaleString('fr-FR') },
          { label: 'Recherches totales', value: totalSearches.toLocaleString('fr-FR') },
          { label: 'Sans résultat', value: noResultCount.toLocaleString('fr-FR') },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-prozon-border p-4">
            <div className="font-display text-3xl font-black text-prozon-navy">{stat.value}</div>
            <div className="text-xs text-prozon-gray-mid mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="mb-4">
        <SearchInput
          value={filter}
          onChange={setFilter}
          placeholder="Filtrer les mots-clés…"
        />
      </div>

      {/* Keyword table */}
      <div className="bg-white border border-prozon-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-prozon-navy text-white text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Mot-clé</th>
              <th className="text-center px-4 py-3 w-32">Recherches</th>
              <th className="text-center px-4 py-3 w-32">Résultats</th>
              <th className="text-right px-4 py-3 w-48">Dernière recherche</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-12 text-prozon-gray-mid">Chargement…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-prozon-gray-mid">
                {stats.length === 0 ? 'Aucune recherche enregistrée.' : 'Aucun mot-clé ne correspond.'}
              </td></tr>
            ) : filtered.map((s, i) => (
              <tr key={s.term} className={`border-t border-prozon-border ${i % 2 === 0 ? '' : 'bg-prozon-gray/20'}`}>
                <td className="px-4 py-3 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <Search size={13} className="text-prozon-gray-mid" />
                    {s.term}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-display font-bold">
                  {s.search_count.toLocaleString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-center">
                  {(s.last_results_count ?? 0) === 0 ? (
                    <span className="inline-flex items-center gap-1 badge bg-red-100 text-red-600" title="Aucun produit ne correspond à ce mot-clé">
                      <AlertTriangle size={12} /> 0
                    </span>
                  ) : (
                    <span className="badge bg-green-100 text-green-700">{s.last_results_count}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-prozon-gray-mid whitespace-nowrap">
                  {formatDate(s.last_searched)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="mt-3 text-xs text-prozon-gray-mid">
          {filtered.length.toLocaleString('fr-FR')} mot{filtered.length > 1 ? 's' : ''}-clé{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
          {filter.trim() && ` sur ${stats.length.toLocaleString('fr-FR')}`}
        </div>
      )}
    </div>
  )
}
