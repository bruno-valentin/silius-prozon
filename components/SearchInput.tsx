'use client'

import { Search, Loader2 } from 'lucide-react'

// Shared search text input (icon + spinner). Visual only — state lives in the caller.
export default function SearchInput({
  value,
  onChange,
  loading = false,
  placeholder,
  autoFocus = false,
}: {
  value: string
  onChange: (value: string) => void
  loading?: boolean
  placeholder?: string
  autoFocus?: boolean
}) {
  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-prozon-gray-mid pointer-events-none"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder ?? 'Rechercher'}
        autoFocus={autoFocus}
        className="w-full border border-prozon-border bg-white pl-11 pr-11 py-3 text-sm text-prozon-navy placeholder:text-prozon-gray-mid focus:outline-none focus:border-prozon-orange transition-colors"
      />
      {loading && (
        <Loader2
          size={18}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-prozon-orange animate-spin"
        />
      )}
    </div>
  )
}
