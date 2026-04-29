'use client'

import { useState } from 'react'
import type { Cartridge } from '@/lib/db'
import { X, Loader2 } from 'lucide-react'

const PRESET_COLORS = [
  '#e05a2b', '#e8a030', '#4fad5b', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6', '#ef4444', '#f97316', '#a78bfa',
]

type Props = {
  onClose: () => void
  onAdded: (c: Cartridge) => void
}

export default function AddCartridgeModal({ onClose, onAdded }: Props) {
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/cartridges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), label_color: color }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to create cartridge')
        return
      }
      const cartridge = await res.json()
      onAdded(cartridge)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md mx-4 bg-surface border border-border rounded-2xl shadow-2xl fade-in">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">New Cartridge</h2>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-widest mb-2">
              Title
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Homelab Backup 2024 #01"
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text placeholder:text-muted focus:outline-none focus:border-accent/60 text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-widest mb-2">
              Label Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c,
                    outline: color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
              <label className="w-8 h-8 rounded-full border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors overflow-hidden">
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="opacity-0 absolute w-px h-px"
                />
                <span className="text-muted text-lg leading-none">+</span>
              </label>
            </div>

            {/* Preview */}
            <div className="mt-4 h-24 rounded-xl flex items-center justify-center" style={{ background: color }}>
              <span className="font-hand text-2xl text-white/90 drop-shadow">{title || 'Cartridge Title'}</span>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Cartridge
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
