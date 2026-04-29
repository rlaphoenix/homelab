'use client'

import { useMemo, useState } from 'react'
import type { LTOFile } from '@/lib/db'
import { FILE_TYPE_LABELS } from '@/lib/fileTypes'
import FileRow from './FileRow'
import { Search } from 'lucide-react'

type Props = {
  results: LTOFile[]
  query: string
  loading?: boolean
}

export default function SearchResults({ results, query, loading }: Props) {
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [cartridgeFilter, setCartridgeFilter] = useState<string | null>(null)

  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const f of results) m[f.file_type] = (m[f.file_type] || 0) + 1
    return m
  }, [results])

  const cartridgeCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const f of results) {
      const k = f.cartridge_title || 'Unknown'
      m[k] = (m[k] || 0) + 1
    }
    return m
  }, [results])

  const filtered = useMemo(() => {
    return results.filter(f => {
      if (typeFilter && f.file_type !== typeFilter) return false
      if (cartridgeFilter && f.cartridge_title !== cartridgeFilter) return false
      return true
    })
  }, [results, typeFilter, cartridgeFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted">
        <Search className="w-5 h-5 mr-2 animate-pulse" />
        Searching…
      </div>
    )
  }

  return (
    <div className="flex gap-0 min-h-[calc(100vh-160px)]">
      {/* Filters sidebar */}
      <aside className="w-52 shrink-0 pr-6 border-r border-border">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">Type</p>
        <button
          onClick={() => setTypeFilter(null)}
          className={`w-full text-left text-sm px-2 py-1.5 rounded-md mb-0.5 transition-colors ${!typeFilter ? 'text-accent' : 'text-muted hover:text-text'}`}
        >
          All ({results.length})
        </button>
        {Object.entries(typeCounts).map(([type, count]) => (
          <button
            key={type}
            onClick={() => setTypeFilter(typeFilter === type ? null : type)}
            className={`w-full text-left text-sm px-2 py-1.5 rounded-md mb-0.5 flex items-center justify-between transition-colors ${typeFilter === type ? 'text-accent' : 'text-muted hover:text-text'}`}
          >
            <span>{FILE_TYPE_LABELS[type] || type}</span>
            <span className="text-xs">{count}</span>
          </button>
        ))}

        <div className="border-t border-border my-4" />

        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">Cartridge</p>
        <button
          onClick={() => setCartridgeFilter(null)}
          className={`w-full text-left text-sm px-2 py-1.5 rounded-md mb-0.5 transition-colors ${!cartridgeFilter ? 'text-accent' : 'text-muted hover:text-text'}`}
        >
          All
        </button>
        {Object.entries(cartridgeCounts).map(([title, count]) => (
          <button
            key={title}
            onClick={() => setCartridgeFilter(cartridgeFilter === title ? null : title)}
            className={`w-full text-left text-sm px-2 py-1.5 rounded-md mb-0.5 flex items-center justify-between transition-colors ${cartridgeFilter === title ? 'text-accent' : 'text-muted hover:text-text'}`}
          >
            <span className="truncate">{title}</span>
            <span className="text-xs shrink-0 ml-1">{count}</span>
          </button>
        ))}
      </aside>

      {/* Results */}
      <div className="flex-1 pl-6">
        <p className="text-xs text-muted mb-4">
          {filtered.length === results.length
            ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
            : `${filtered.length} of ${results.length} results`}
        </p>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted gap-3">
            <Search className="w-8 h-8 opacity-30" />
            <span className="text-sm">No results found</span>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map(f => (
              <FileRow key={f.id} file={f} showCartridge />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
