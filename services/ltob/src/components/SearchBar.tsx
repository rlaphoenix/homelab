'use client'

import { Search, X, Loader2 } from 'lucide-react'

type Props = {
  value: string
  onChange: (v: string) => void
  loading?: boolean
}

export default function SearchBar({ value, onChange, loading }: Props) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search files across all cartridges…"
        className="w-full bg-surface border border-border rounded-xl pl-12 pr-12 py-3.5 text-text placeholder:text-muted text-base focus:outline-none focus:border-accent/60 focus:bg-surface transition-all"
      />
      {loading && (
        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-accent w-4 h-4 animate-spin" />
      )}
      {!loading && value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
