'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Cartridge, LTOFile } from '@/lib/db'
import SearchBar from '@/components/SearchBar'
import CartridgeGrid from '@/components/CartridgeGrid'
import SearchResults from '@/components/SearchResults'
import CartridgeContents from '@/components/CartridgeContents'
import AddCartridgeModal from '@/components/AddCartridgeModal'

type View = 'grid' | 'search' | 'cartridge'

export default function Home() {
  const [view, setView] = useState<View>('grid')
  const [query, setQuery] = useState('')
  const [cartridges, setCartridges] = useState<Cartridge[]>([])
  const [searchResults, setSearchResults] = useState<LTOFile[]>([])
  const [selectedCartridge, setSelectedCartridge] = useState<Cartridge | null>(null)
  const [cartridgeFiles, setCartridgeFiles] = useState<LTOFile[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const loadCartridges = useCallback(async () => {
    const res = await fetch('/api/cartridges')
    const data = await res.json()
    setCartridges(data)
  }, [])

  useEffect(() => { loadCartridges() }, [loadCartridges])

  useEffect(() => {
    if (!query.trim()) {
      setView('grid')
      setSearchResults([])
      return
    }
    setView('search')
    setSearchLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSearchResults(Array.isArray(data) ? data : [])
      } finally {
        setSearchLoading(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelectCartridge = async (c: Cartridge) => {
    setSelectedCartridge(c)
    setView('cartridge')
    const res = await fetch(`/api/cartridges/${c.id}/files`)
    const data = await res.json()
    setCartridgeFiles(Array.isArray(data) ? data : [])
  }

  const handleBack = () => {
    setView('grid')
    setSelectedCartridge(null)
    setCartridgeFiles([])
  }

  const handleCartridgeAdded = (c: Cartridge) => {
    setCartridges(prev => [c, ...prev])
    setShowAddModal(false)
  }

  const handleFilesAdded = async () => {
    if (!selectedCartridge) return
    const res = await fetch(`/api/cartridges/${selectedCartridge.id}/files`)
    const data = await res.json()
    setCartridgeFiles(Array.isArray(data) ? data : [])
    loadCartridges()
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 py-5 flex items-center gap-6">
          <span className="text-2xl font-bold tracking-tight text-accent shrink-0">LTO Archive</span>
          <div className="flex-1">
            <SearchBar value={query} onChange={setQuery} loading={searchLoading} />
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-8">
        {view === 'grid' && (
          <div className="fade-in">
            <CartridgeGrid
              cartridges={cartridges}
              onSelect={handleSelectCartridge}
              onAddNew={() => setShowAddModal(true)}
            />
          </div>
        )}

        {view === 'search' && (
          <div className="fade-in">
            <SearchResults results={searchResults} query={query} loading={searchLoading} />
          </div>
        )}

        {view === 'cartridge' && selectedCartridge && (
          <div className="fade-in">
            <CartridgeContents
              cartridge={selectedCartridge}
              files={cartridgeFiles}
              onBack={handleBack}
              onFilesAdded={handleFilesAdded}
            />
          </div>
        )}
      </div>

      {showAddModal && (
        <AddCartridgeModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleCartridgeAdded}
        />
      )}
    </main>
  )
}
