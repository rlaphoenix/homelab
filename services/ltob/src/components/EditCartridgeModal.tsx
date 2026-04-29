'use client'

import { useRef, useState, useEffect } from 'react'
import type { Cartridge } from '@/lib/db'
import { CARTRIDGE_COLORS } from '@/lib/colors'
import { LTO_CAPACITIES } from '@/lib/ltoCapacities'

type Props = {
  cartridge: Cartridge
  onClose: () => void
  onSaved: (updated: Cartridge) => void
}

export default function EditCartridgeModal({ cartridge, onClose, onSaved }: Props) {
  const [name, setName] = useState(cartridge.name)
  const [category, setCategory] = useState(cartridge.category)
  const [color, setColor] = useState(cartridge.label_color)
  const [capacity, setCapacity] = useState(cartridge.capacity ?? 0)
  const [status, setStatus] = useState<'good' | 'failing' | 'failed'>(cartridge.status ?? 'good')
  const [categories, setCategories] = useState<string[]>([])
  const [showCatDrop, setShowCatDrop] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const mouseDownOnBackdrop = useRef(false)

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setCategories(d)
    }).catch(() => {})
  }, [])

  const filteredCats = category.trim()
    ? categories.filter(c => c.toLowerCase().includes(category.toLowerCase()))
    : categories

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('name required'); return }
    if (!category.trim()) { setError('category required'); return }
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/cartridges/${cartridge.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), label_color: color, category: category.trim(), capacity, status }),
      })
      if (!res.ok) { setError((await res.json()).error || 'failed'); return }
      onSaved(await res.json())
    } finally { setSaving(false) }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/75 backdrop-blur-sm"
      onMouseDown={e => { mouseDownOnBackdrop.current = e.target === e.currentTarget }}
      onMouseUp={e => { if (mouseDownOnBackdrop.current && e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm mx-6 bg-bg border border-border fade-up shadow-sm">
        <div className="flex items-center justify-between px-8 py-5 border-b border-border">
          <span className="text-[10px] tracking-ultra uppercase text-ink">cartridge settings</span>
          <button
            onClick={onClose}
            className="text-[10px] tracking-widest uppercase text-muted hover:text-ink transition-colors px-2 py-1 rounded bg-surface hover:bg-border"
          >
            esc
          </button>
        </div>

        <form onSubmit={handleSave} className="px-8 py-8 space-y-7">
          {/* Name */}
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-muted mb-3">name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-border pb-2 text-sm text-ink placeholder:text-dim focus:outline-none focus:border-text transition-colors tracking-wide"
            />
          </div>

          {/* Category */}
          <div className="relative">
            <label className="block text-[10px] tracking-widest uppercase text-muted mb-3">category</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              onFocus={() => setShowCatDrop(true)}
              onBlur={() => setTimeout(() => setShowCatDrop(false), 150)}
              className="w-full bg-transparent border-0 border-b border-border pb-2 text-sm text-ink placeholder:text-dim focus:outline-none focus:border-text transition-colors tracking-wide"
            />
            {showCatDrop && filteredCats.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 bg-bg border border-border shadow-sm mt-1 max-h-40 overflow-y-auto">
                {filteredCats.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onMouseDown={() => setCategory(cat)}
                    className="w-full text-left px-4 py-2.5 text-xs tracking-wide text-text hover:bg-surface hover:text-ink transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-muted mb-3">tape capacity</label>
            <select
              value={capacity}
              onChange={e => setCapacity(Number(e.target.value))}
              className="w-full bg-transparent border-0 border-b border-border pb-2 text-sm text-ink focus:outline-none focus:border-text transition-colors tracking-wide appearance-none cursor-pointer"
            >
              <option value={0}>Not set</option>
              {LTO_CAPACITIES.map(t => (
                <option key={t.bytes} value={t.bytes}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-muted mb-3">status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as 'good' | 'failing' | 'failed')}
              className="w-full bg-transparent border-0 border-b border-border pb-2 text-sm text-ink focus:outline-none focus:border-text transition-colors tracking-wide appearance-none cursor-pointer"
            >
              <option value="good">Good</option>
              <option value="failing">Failing</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-muted mb-3">color</label>
            <div className="flex flex-wrap gap-2">
              {CARTRIDGE_COLORS.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => setColor(c.hex)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] tracking-widest uppercase transition-colors border"
                  style={
                    color === c.hex
                      ? { borderColor: c.hex, background: c.hex, color: '#f9f7f2' }
                      : { borderColor: 'transparent', background: 'transparent', color: c.hex }
                  }
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Read-only fields */}
          <div className="space-y-4 pt-2 border-t border-border">
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-muted mb-1.5">label</label>
              <p className="text-sm text-muted tracking-wide font-mono select-all">{cartridge.title}</p>
            </div>
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-muted mb-1.5">guid</label>
              <p className="text-[11px] text-muted tracking-wide font-mono select-all break-all">{cartridge.id}</p>
            </div>
          </div>

          {error && <p className="text-[10px] text-red-500 tracking-wide">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || !name.trim() || !category.trim()}
              className="text-[10px] tracking-widest uppercase px-4 py-2 rounded-md bg-ink text-bg hover:opacity-80 transition-opacity disabled:opacity-30"
            >
              {saving ? 'saving…' : 'save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] tracking-widest uppercase px-4 py-2 rounded-md bg-surface hover:bg-border text-muted hover:text-ink transition-colors"
            >
              cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
