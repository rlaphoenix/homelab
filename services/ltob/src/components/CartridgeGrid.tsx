'use client'

import dynamic from 'next/dynamic'
import type { Cartridge } from '@/lib/db'
import { formatBytes } from '@/lib/format'
import { Plus, Layers } from 'lucide-react'

const LTOCartridge3D = dynamic(() => import('./LTOCartridge3D'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-surface rounded-xl animate-pulse" />,
})

type Props = {
  cartridges: Cartridge[]
  onSelect: (c: Cartridge) => void
  onAddNew: () => void
}

export default function CartridgeGrid({ cartridges, onSelect, onAddNew }: Props) {
  if (cartridges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center">
          <Layers className="w-10 h-10 text-muted" />
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-text mb-1">No cartridges yet</p>
          <p className="text-muted text-sm">Add your first LTO tape to get started</p>
        </div>
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Cartridge
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-6">
        {cartridges.map(c => (
          <div
            key={c.id}
            className="group relative bg-surface border border-border rounded-2xl overflow-hidden hover:border-accent/40 transition-all duration-300"
            style={{ aspectRatio: '4/5' }}
          >
            {/* 3D Cartridge */}
            <div className="absolute inset-0 pb-20" onClick={() => onSelect(c)}>
              <LTOCartridge3D
                title={c.title}
                color={c.label_color}
                onClick={() => onSelect(c)}
              />
            </div>

            {/* Card footer */}
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-surface/95 backdrop-blur-sm border-t border-border">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-text truncate leading-tight">{c.title}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {c.file_count ?? 0} file{(c.file_count ?? 0) !== 1 ? 's' : ''}
                    {(c.total_size ?? 0) > 0 && <> · {formatBytes(c.total_size ?? 0)}</>}
                  </p>
                </div>
                <span
                  className="shrink-0 w-3 h-3 rounded-full mt-0.5 ring-1 ring-white/10"
                  style={{ background: c.label_color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add new button */}
      <div className="flex justify-center mt-10">
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 px-8 py-3.5 bg-surface border border-border rounded-xl text-text hover:border-accent/50 hover:text-accent transition-all duration-200 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add New Cartridge
        </button>
      </div>
    </div>
  )
}
