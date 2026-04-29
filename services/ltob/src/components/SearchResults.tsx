'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { LTOFile } from '@/lib/db'
import { FILE_TYPE_LABELS } from '@/lib/fileTypes'
import { formatBytes } from '@/lib/format'
import FileRow from './FileRow'

type SortBy = 'name' | 'size' | 'cartridge'
type SortDir = 'asc' | 'desc'

type SizeRange = { label: string; sizeMin?: number; sizeMax?: number }
const SIZE_RANGES: SizeRange[] = [
  { label: '< 100 MB', sizeMax: 100_000_000 },
  { label: '100 MB – 1 GB', sizeMin: 100_000_000, sizeMax: 1_000_000_000 },
  { label: '1 GB – 10 GB', sizeMin: 1_000_000_000, sizeMax: 10_000_000_000 },
  { label: '> 10 GB', sizeMin: 10_000_000_000 },
]

type ApiResult = {
  files: LTOFile[]
  total: number
  page: number
  totalPages: number
  pageSize: number
  typeCounts: Record<string, number>
  cartridgeCounts: Record<string, number>
  totalSize: number
}

type Props = {
  query: string
  browseAll: boolean
  onSelectFile: (file: LTOFile) => void
}

function readUrlParam(key: string): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(key)
}

export default function SearchResults({ query, browseAll, onSelectFile }: Props) {
  const [page, setPage] = useState(() => Math.max(1, parseInt(readUrlParam('page') ?? '1') || 1))
  const [sortBy, setSortBy] = useState<SortBy>(() => {
    const s = readUrlParam('sort') ?? ''
    return (['name', 'size', 'cartridge'].includes(s) ? s : 'name') as SortBy
  })
  const [sortDir, setSortDir] = useState<SortDir>(() =>
    readUrlParam('dir') === 'desc' ? 'desc' : 'asc'
  )
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [cartridgeFilter, setCartridgeFilter] = useState<string | null>(null)
  const [sizeRange, setSizeRange] = useState<SizeRange | null>(null)
  const [result, setResult] = useState<ApiResult | null>(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const prevQueryRef = useRef(query)
  const prevBrowseAllRef = useRef(browseAll)

  // Reset to page 1 and clear filters when search query changes
  useEffect(() => {
    if (query !== prevQueryRef.current || browseAll !== prevBrowseAllRef.current) {
      prevQueryRef.current = query
      prevBrowseAllRef.current = browseAll
      setPage(1)
      setTypeFilter(null)
      setCartridgeFilter(null)
      setSizeRange(null)
    }
  }, [query, browseAll])

  // Sync page/sort to URL
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    if (page > 1) sp.set('page', String(page)); else sp.delete('page')
    if (sortBy !== 'name') sp.set('sort', sortBy); else sp.delete('sort')
    if (sortDir !== 'asc') sp.set('dir', sortDir); else sp.delete('dir')
    const qs = sp.toString()
    history.replaceState(history.state, '', `${window.location.pathname}${qs ? '?' + qs : ''}`)
  }, [page, sortBy, sortDir])

  // Fetch search results
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    const sp = new URLSearchParams()
    if (query.trim()) sp.set('q', query.trim())
    sp.set('page', String(page))
    sp.set('sort', sortBy)
    sp.set('dir', sortDir)
    if (typeFilter) sp.set('type', typeFilter)
    if (cartridgeFilter) sp.set('cartridge', cartridgeFilter)
    if (sizeRange?.sizeMin !== undefined) sp.set('sizeMin', String(sizeRange.sizeMin))
    if (sizeRange?.sizeMax !== undefined) sp.set('sizeMax', String(sizeRange.sizeMax))

    setLoading(true)
    fetch(`/api/search?${sp}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => { setResult(data); setLoading(false) })
      .catch(e => { if (e.name !== 'AbortError') setLoading(false) })
  }, [query, browseAll, page, sortBy, sortDir, typeFilter, cartridgeFilter, sizeRange])

  const handleSort = useCallback((col: SortBy) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
    setPage(1)
  }, [sortBy])

  if (loading && !result) {
    return (
      <div className="flex items-center py-24">
        <span className="text-xs tracking-widest uppercase text-muted animate-pulse">searching</span>
      </div>
    )
  }

  const files = result?.files ?? []
  const total = result?.total ?? 0
  const totalPages = result?.totalPages ?? 1
  const pageSize = result?.pageSize ?? 50
  const typeCounts = result?.typeCounts ?? {}
  const cartridgeCounts = result?.cartridgeCounts ?? {}
  const totalSize = result?.totalSize ?? 0
  const cartridgeCount = Object.keys(cartridgeCounts).length
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const pageEnd = Math.min(page * pageSize, total)

  const sortArrow = (col: SortBy) => {
    if (sortBy !== col) return <span className="opacity-30">↕</span>
    return <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="flex gap-0 min-h-[calc(100vh-160px)]">
      {/* Sidebar filters */}
      <aside className="w-44 shrink-0 pr-8 border-r border-border">
        {/* File Type */}
        <p className="text-[10px] tracking-widest uppercase text-muted mb-4">file type</p>
        <FilterBtn
          active={!typeFilter}
          onClick={() => { setTypeFilter(null); setPage(1) }}
          count={total}
          label="all"
        />
        {Object.entries(typeCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => (
            <FilterBtn
              key={type}
              active={typeFilter === type}
              onClick={() => { setTypeFilter(typeFilter === type ? null : type); setPage(1) }}
              count={count}
              label={FILE_TYPE_LABELS[type] || type}
            />
          ))}

        {/* Size Range */}
        <p className="text-[10px] tracking-widest uppercase text-muted mb-4 mt-8">file size</p>
        <FilterBtn
          active={!sizeRange}
          onClick={() => { setSizeRange(null); setPage(1) }}
          label="all sizes"
        />
        {SIZE_RANGES.map(r => (
          <FilterBtn
            key={r.label}
            active={sizeRange?.label === r.label}
            onClick={() => { setSizeRange(sizeRange?.label === r.label ? null : r); setPage(1) }}
            label={r.label}
          />
        ))}

        {/* Cartridge */}
        <p className="text-[10px] tracking-widest uppercase text-muted mb-4 mt-8">cartridge</p>
        <FilterBtn
          active={!cartridgeFilter}
          onClick={() => { setCartridgeFilter(null); setPage(1) }}
          label="all"
        />
        {Object.entries(cartridgeCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([title, count]) => (
            <FilterBtn
              key={title}
              active={cartridgeFilter === title}
              onClick={() => { setCartridgeFilter(cartridgeFilter === title ? null : title); setPage(1) }}
              count={count}
              label={title}
            />
          ))}
      </aside>

      {/* Results column */}
      <div className="flex-1 min-w-0 pl-10">
        {/* Header row */}
        <div className="flex items-baseline justify-between mb-6">
          <p className="text-xs text-muted tracking-widest uppercase">
            {browseAll && !query.trim()
              ? `All files on ${cartridgeCount} cartridge${cartridgeCount !== 1 ? 's' : ''}`
              : `${total} result${total !== 1 ? 's' : ''}${
                  typeFilter || cartridgeFilter || sizeRange
                    ? ' · filtered'
                    : query.trim() ? ` for "${query}"` : ''
                }`
            }
          </p>
          <div className="flex items-center gap-5 text-[10px] text-muted tracking-widest uppercase tabular-nums">
            {browseAll && !query.trim() && totalSize > 0 && (
              <span>{formatBytes(totalSize)}</span>
            )}
            {total > 0 && (
              <span>
                {pageStart}–{pageEnd} of {total} · page {page}/{totalPages}
              </span>
            )}
          </div>
        </div>

        {/* Sort headers */}
        {total > 0 && (
          <div className="flex items-center gap-4 pb-2 mb-1 border-b border-border">
            <div className="w-4 shrink-0" />
            <button
              className="flex-1 min-w-0 text-left flex items-center gap-1 text-[10px] tracking-widest uppercase text-muted hover:text-ink transition-colors"
              onClick={() => handleSort('name')}
            >
              filename {sortArrow('name')}
            </button>
            <button
              className="shrink-0 w-24 text-right flex items-center justify-end gap-1 text-[10px] tracking-widest uppercase text-muted hover:text-ink transition-colors"
              onClick={() => handleSort('size')}
            >
              file size {sortArrow('size')}
            </button>
            <button
              className="shrink-0 w-32 text-right flex items-center justify-end gap-1 text-[10px] tracking-widest uppercase text-muted hover:text-ink transition-colors"
              onClick={() => handleSort('cartridge')}
            >
              cartridge {sortArrow('cartridge')}
            </button>
          </div>
        )}

        {/* File list */}
        {files.length === 0 && !loading ? (
          <p className="text-xs text-muted tracking-widest uppercase py-16">no results</p>
        ) : (
          <div className={`divide-y divide-border transition-opacity duration-150 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {files.map(f => (
              <FileRow key={f.id} file={f} showCartridge onSelect={onSelectFile} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-10">
            <PageBtn
              label="prev"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            />
            {buildPageNumbers(page, totalPages).map((n, i) =>
              n === '...'
                ? <span key={`el-${i}`} className="px-1.5 text-xs text-muted select-none">…</span>
                : (
                  <PageBtn
                    key={n}
                    label={String(n)}
                    active={n === page}
                    onClick={() => setPage(n as number)}
                  />
                )
            )}
            <PageBtn
              label="next"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set<number>()
  set.add(1)
  set.add(total)
  for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) set.add(i)

  const sorted = Array.from(set).sort((a, b) => a - b)
  const result: (number | '...')[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...')
    result.push(sorted[i])
  }
  return result
}

function FilterBtn({
  active, onClick, label, count,
}: {
  active: boolean; onClick: () => void; label: string; count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-baseline justify-between gap-2 py-1 text-xs tracking-wide transition-colors mb-0.5 ${
        active ? 'text-ink' : 'text-muted hover:text-text'
      }`}
    >
      <span className="truncate capitalize">{label}</span>
      {count !== undefined && <span className="tabular-nums shrink-0 text-[11px]">{count}</span>}
    </button>
  )
}

function PageBtn({
  label, onClick, active, disabled,
}: {
  label: string; onClick: () => void; active?: boolean; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[28px] h-7 px-2 text-[10px] tracking-widest uppercase rounded transition-colors ${
        active
          ? 'bg-ink text-bg cursor-default'
          : disabled
          ? 'text-dim cursor-not-allowed'
          : 'text-muted hover:text-ink hover:bg-surface'
      }`}
    >
      {label}
    </button>
  )
}
