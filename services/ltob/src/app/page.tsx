'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { flushSync } from 'react-dom'
import type { Cartridge, LTOFile } from '@/lib/db'
import { CARTRIDGE_COLORS } from '@/lib/colors'
import { formatBytesSI } from '@/lib/format'
import SearchBar from '@/components/SearchBar'
import CartridgeGrid from '@/components/CartridgeGrid'
import SearchResults from '@/components/SearchResults'
import CartridgeContents from '@/components/CartridgeContents'

type View = 'grid' | 'search' | 'cartridge'
type ScanState = 'idle' | 'checking'

const DEFAULT_COLOR = CARTRIDGE_COLORS[0].hex

const BLOCKED_LABELS = new Set(['ltfs volume', 'unformatted cartridge', 'no cartridge'])

function withTransition(fn: () => void): void {
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(document as any).startViewTransition(() => { flushSync(fn) })
  } else {
    fn()
  }
}

function StatsCircle({ ratio }: { ratio: number }) {
  const r = 8
  const circ = 2 * Math.PI * r
  const filled = Math.min(Math.max(ratio, 0), 1) * circ
  const warn = ratio > 0.8
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0">
      <circle cx="10" cy="10" r={r} fill="none" stroke="#e0dbd0" strokeWidth="2" />
      <circle
        cx="10" cy="10" r={r} fill="none"
        stroke={warn ? '#ef4444' : '#22c55e'}
        strokeWidth="2"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 10 10)"
      />
    </svg>
  )
}

export default function Home() {
  const [view, setView] = useState<View>('grid')
  const [query, setQuery] = useState('')
  const [browseAll, setBrowseAll] = useState(false)
  const [cartridges, setCartridges] = useState<Cartridge[]>([])
  const [cartridgesReady, setCartridgesReady] = useState(false)
  const [selectedCartridge, setSelectedCartridge] = useState<Cartridge | null>(null)
  const [cartridgeFiles, setCartridgeFiles] = useState<LTOFile[]>([])
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [scanMessage, setScanMessage] = useState<{ text: string; error: boolean } | null>(null)
  const searchHistoryPushed = useRef(false)

  const totalUsed = cartridges.reduce((s, c) => s + (c.total_size ?? 0), 0)
  const totalCapacity = cartridges.reduce((s, c) => s + (c.capacity ?? 0), 0)
  const totalRatio = totalCapacity > 0 ? totalUsed / totalCapacity : 0

  const flashMessage = useCallback((text: string, error = false) => {
    setScanMessage({ text, error })
    setTimeout(() => setScanMessage(null), 5000)
  }, [])

  const refreshCartridges = useCallback(async () => {
    const res = await fetch('/api/cartridges')
    const data = await res.json()
    setCartridges(Array.isArray(data) ? data : [])
  }, [])

  // Initial load
  useEffect(() => {
    let cancelled = false
    fetch('/api/cartridges')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        withTransition(() => {
          setCartridges(list)
          setCartridgesReady(true)
        })
      })
      .catch(() => { if (!cancelled) setCartridgesReady(true) })
    return () => { cancelled = true }
  }, [])

  const loadCartridgeById = useCallback(async (id: string) => {
    const [cartRes, filesRes] = await Promise.all([
      fetch(`/api/cartridges/${id}`),
      fetch(`/api/cartridges/${id}/files`),
    ])
    if (!cartRes.ok) {
      history.replaceState({ view: 'grid' }, '', '/')
      withTransition(() => { setView('grid') })
      return
    }
    const [cartridge, filesData] = await Promise.all([cartRes.json(), filesRes.json()])
    withTransition(() => {
      setSelectedCartridge(cartridge)
      setCartridgeFiles(Array.isArray(filesData) ? filesData : [])
      setView('cartridge')
    })
  }, [])

  // Parse initial URL on mount
  useEffect(() => {
    const path = window.location.pathname
    const search = window.location.search
    if (path.startsWith('/cartridge/')) {
      const id = path.slice('/cartridge/'.length).split('/')[0]
      history.replaceState({ view: 'cartridge', id }, '', `/cartridge/${id}`)
      loadCartridgeById(id)
    } else if (path === '/search' || path.startsWith('/search?')) {
      const q = new URLSearchParams(search).get('q') ?? ''
      const ba = !q
      history.replaceState({ view: 'search', q, browseAll: ba }, '', q ? `/search?q=${encodeURIComponent(q)}` : '/search')
      setQuery(q)
      setBrowseAll(ba)
      setView('search')
      searchHistoryPushed.current = true
    } else {
      history.replaceState({ view: 'grid' }, '', '/')
    }
  }, [loadCartridgeById])

  // Browser back/forward
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      const state = e.state ?? { view: 'grid' }
      if (state.view === 'cartridge') {
        loadCartridgeById(state.id)
      } else if (state.view === 'search') {
        withTransition(() => {
          setQuery(state.q ?? '')
          setBrowseAll(state.browseAll ?? false)
          setView('search')
          setSelectedCartridge(null)
          setCartridgeFiles([])
          searchHistoryPushed.current = true
        })
      } else {
        withTransition(() => {
          setView('grid')
          setQuery('')
          setBrowseAll(false)
          setSelectedCartridge(null)
          setCartridgeFiles([])
          searchHistoryPushed.current = false
        })
      }
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [loadCartridgeById])

  // Drive search activation (query-based only — no focus/blur)
  useEffect(() => {
    if (!browseAll && !query.trim()) {
      setView('grid')
      searchHistoryPushed.current = false
      return
    }
    if (!searchHistoryPushed.current) {
      const url = query.trim() ? `/search?q=${encodeURIComponent(query)}` : '/search'
      history.pushState({ view: 'search', q: query, browseAll }, '', url)
      searchHistoryPushed.current = true
    }
    setView('search')
  }, [query, browseAll])

  // Keep search URL in sync (query changes)
  useEffect(() => {
    if (view !== 'search') return
    const url = query.trim() ? `/search?q=${encodeURIComponent(query)}` : '/search'
    history.replaceState({ view: 'search', q: query, browseAll }, '', url)
  }, [query, browseAll, view])

  const handleBrowseFiles = useCallback(() => {
    if (!searchHistoryPushed.current) {
      history.pushState({ view: 'search', q: '', browseAll: true }, '', '/search')
      searchHistoryPushed.current = true
    }
    withTransition(() => {
      setBrowseAll(true)
      setQuery('')
      setView('search')
    })
  }, [])

  const handleSelectCartridge = useCallback(async (c: Cartridge) => {
    history.pushState({ view: 'cartridge', id: c.id }, '', `/cartridge/${c.id}`)
    searchHistoryPushed.current = false
    const filesData = await fetch(`/api/cartridges/${c.id}/files`)
      .then(r => r.json()).catch(() => [])
    withTransition(() => {
      setSelectedCartridge(c)
      setCartridgeFiles(Array.isArray(filesData) ? filesData : [])
      setView('cartridge')
    })
  }, [])

  const handleBack = useCallback(() => { history.back() }, [])

  const handleFilesAdded = useCallback(async () => {
    if (!selectedCartridge) return
    const [cartData, filesData] = await Promise.all([
      fetch(`/api/cartridges/${selectedCartridge.id}`).then(r => r.json()).catch(() => selectedCartridge),
      fetch(`/api/cartridges/${selectedCartridge.id}/files`).then(r => r.json()).catch(() => []),
    ])
    setSelectedCartridge(cartData)
    setCartridgeFiles(Array.isArray(filesData) ? filesData : [])
    refreshCartridges()
  }, [selectedCartridge, refreshCartridges])

  const handleCartridgeUpdated = useCallback((updated: Cartridge) => {
    setSelectedCartridge(updated)
    setCartridges(prev => prev.map(c => c.id === updated.id ? updated : c))
  }, [])

  const handleSelectSearchResult = useCallback((file: LTOFile) => {
    history.pushState({ view: 'cartridge', id: file.cartridge_id }, '', `/cartridge/${file.cartridge_id}`)
    searchHistoryPushed.current = false
    loadCartridgeById(file.cartridge_id)
  }, [loadCartridgeById])

  const handleLogoClick = useCallback(() => {
    searchHistoryPushed.current = false
    history.pushState({ view: 'grid' }, '', '/')
    withTransition(() => {
      setView('grid')
      setQuery('')
      setBrowseAll(false)
      setSelectedCartridge(null)
      setCartridgeFiles([])
    })
  }, [])

  const handleAddCartridge = useCallback(async () => {
    if (scanState === 'checking') return
    setScanState('checking')
    try {
      const info = await fetch('/api/drive-info').then(r => r.json())
      if (!info.accessible) { flashMessage('Y: drive not accessible', true); return }
      if (!info.label?.trim()) { flashMessage('Y: drive has no volume label', true); return }

      const label = info.label.trim()
      if (BLOCKED_LABELS.has(label.toLowerCase())) { flashMessage('Y: drive has no volume label', true); return }

      const duplicate = cartridges.find(c => c.title.toLowerCase() === label.toLowerCase())
      if (duplicate) { flashMessage(`"${label}" already indexed`, true); return }

      const res = await fetch('/api/cartridges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: label, label_color: DEFAULT_COLOR, category: 'Uncategorized', capacity: info.capacity ?? 0 }),
      })
      if (!res.ok) { flashMessage('Failed to create cartridge', true); return }
      const newCartridge: Cartridge = await res.json()

      // Silently drain SSE stream
      await new Promise<void>(resolve => {
        fetch(`/api/cartridges/${newCartridge.id}/update-from-drive`)
          .then(async r => {
            const reader = r.body!.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              buffer += decoder.decode(value, { stream: true })
              const parts = buffer.split('\n\n')
              buffer = parts.pop() ?? ''
              for (const part of parts) {
                const line = part.trim()
                if (!line.startsWith('data:')) continue
                try {
                  const evt = JSON.parse(line.slice(5).trim())
                  if (evt.type === 'done' || evt.type === 'error') { resolve(); return }
                } catch { /* ignore */ }
              }
            }
            resolve()
          })
          .catch(() => resolve())
      })

      // Fetch fresh cartridge (has updated total_size + last_indexed_at) and files
      const [updatedCartridge, filesData] = await Promise.all([
        fetch(`/api/cartridges/${newCartridge.id}`).then(r => r.json()).catch(() => newCartridge),
        fetch(`/api/cartridges/${newCartridge.id}/files`).then(r => r.json()).catch(() => []),
      ])

      history.pushState({ view: 'cartridge', id: newCartridge.id }, '', `/cartridge/${newCartridge.id}`)
      searchHistoryPushed.current = false
      withTransition(() => {
        setCartridges(prev => [updatedCartridge, ...prev])
        setSelectedCartridge(updatedCartridge)
        setCartridgeFiles(Array.isArray(filesData) ? filesData : [])
        setView('cartridge')
      })
    } finally {
      setScanState('idle')
    }
  }, [scanState, cartridges, flashMessage])

  return (
    <main className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-bg">
        <div className="max-w-[1400px] mx-auto px-12 py-8 flex items-center gap-10">
          <span
            className="text-sm font-medium tracking-widest uppercase text-ink shrink-0 select-none cursor-pointer"
            onClick={handleLogoClick}
          >
            LTO Archive
          </span>
          <div className="flex-1 px-2">
            <SearchBar value={query} onChange={setQuery} />
          </div>
          <div className="shrink-0 flex items-center gap-3">
            {scanMessage && (
              <span className={`text-[10px] tracking-wide ${scanMessage.error ? 'text-red-400' : 'text-muted'}`}>
                {scanMessage.text}
              </span>
            )}
            <button
              onClick={handleBrowseFiles}
              className="text-xs tracking-widest uppercase text-muted hover:text-ink transition-colors px-5 py-2.5 rounded-lg bg-surface hover:bg-border"
            >
              browse files
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-[1400px] mx-auto w-full px-12 py-16">
        {view === 'grid' && cartridgesReady && (
          <>
            {/* Stats bar */}
            {cartridges.length > 0 && (
              <div className="flex items-center gap-6 mb-12 pb-8 border-b border-border">
                <span className="text-xs text-muted tracking-widest uppercase">
                  {cartridges.length} cartridge{cartridges.length !== 1 ? 's' : ''}
                </span>
                {totalCapacity > 0 && (
                  <>
                    <div className="w-px h-3.5 bg-border" />
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-muted tracking-widest uppercase tabular-nums">
                        {formatBytesSI(totalUsed)} / {formatBytesSI(totalCapacity)}
                      </span>
                      <StatsCircle ratio={totalRatio} />
                    </div>
                  </>
                )}
              </div>
            )}

            <CartridgeGrid cartridges={cartridges} onSelect={handleSelectCartridge} />

            {/* Add new cartridge */}
            <div className="mt-20 flex flex-col items-center gap-3">
              {scanMessage && (
                <span className={`text-[10px] tracking-wide ${scanMessage.error ? 'text-red-400' : 'text-muted'}`}>
                  {scanMessage.text}
                </span>
              )}
              <button
                onClick={handleAddCartridge}
                disabled={scanState === 'checking'}
                className="text-xs tracking-widest uppercase text-muted hover:text-ink transition-colors px-8 py-3 rounded-lg bg-surface hover:bg-border disabled:opacity-40 disabled:cursor-wait"
              >
                {scanState === 'checking' ? 'scanning…' : 'add new cartridge'}
              </button>
            </div>
          </>
        )}
        {view === 'search' && (
          <SearchResults
            query={query}
            browseAll={browseAll}
            onSelectFile={handleSelectSearchResult}
          />
        )}
        {view === 'cartridge' && selectedCartridge && (
          <CartridgeContents
            cartridge={selectedCartridge}
            files={cartridgeFiles}
            onBack={handleBack}
            onFilesAdded={handleFilesAdded}
            onCartridgeUpdated={handleCartridgeUpdated}
          />
        )}
      </div>
    </main>
  )
}
