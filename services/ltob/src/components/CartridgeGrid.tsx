'use client'

import Image from 'next/image'
import type { Cartridge } from '@/lib/db'
import { formatBytesSI } from '@/lib/format'

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

type Props = {
  cartridges: Cartridge[]
  onSelect: (c: Cartridge) => void
}

export default function CartridgeGrid({ cartridges, onSelect }: Props) {
  if (cartridges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48">
        <p className="text-[10px] tracking-ultra uppercase text-muted">no cartridges</p>
      </div>
    )
  }

  // Group by category
  const order: string[] = []
  const groups: Record<string, Cartridge[]> = {}
  for (const c of cartridges) {
    const cat = c.category || 'Uncategorized'
    if (!groups[cat]) { groups[cat] = []; order.push(cat) }
    groups[cat].push(c)
  }

  // Natural sort: categories a→z, cartridges within each category a→z
  order.sort((a, b) => collator.compare(a, b))
  for (const cat of order) {
    groups[cat].sort((a, b) => collator.compare(a.name, b.name))
  }

  return (
    <div className="space-y-20">
      {order.map(cat => (
        <section key={cat}>
          <p className="text-[14px] font-[300] tracking-widest uppercase text-muted mb-10">{cat}</p>
          <div className="grid grid-cols-4 gap-x-12 gap-y-20">
            {groups[cat].map(c => (
              <CartridgeCard key={c.id} cartridge={c} onSelect={onSelect} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function CircleProgress({ ratio, warn }: { ratio: number; warn: boolean }) {
  const r = 5
  const circ = 2 * Math.PI * r
  const filled = Math.min(Math.max(ratio, 0), 1) * circ
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" className="shrink-0">
      <circle cx="6.5" cy="6.5" r={r} fill="none" stroke="#e0dbd0" strokeWidth="1.75" />
      <circle
        cx="6.5" cy="6.5" r={r} fill="none"
        stroke={warn ? '#ef4444' : '#22c55e'}
        strokeWidth="1.75"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 6.5 6.5)"
      />
    </svg>
  )
}

function CartridgeCard({ cartridge: c, onSelect }: { cartridge: Cartridge; onSelect: (c: Cartridge) => void }) {
  const used = c.total_size ?? 0
  const capacity = c.capacity ?? 0
  const ratio = capacity > 0 ? used / capacity : 0
  const warn = ratio > 0.8

  return (
    <button
      onClick={() => onSelect(c)}
      className="group flex flex-col items-center gap-3 focus:outline-none"
    >
      {/* Image + circle shadow */}
      <div className="relative w-full flex items-end justify-center">
        {/* Shadow — smoothstep gradient (eliminates Mach band optical edge) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(90%+30px)] aspect-square transition-opacity duration-[900ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:opacity-0"
          style={{ background: 'radial-gradient(circle closest-side, rgba(0,0,0,1) 0%, rgba(0,0,0,0.972) 10%, rgba(0,0,0,0.896) 20%, rgba(0,0,0,0.784) 30%, rgba(0,0,0,0.648) 40%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.352) 60%, rgba(0,0,0,0.216) 70%, rgba(0,0,0,0.104) 80%, rgba(0,0,0,0.028) 90%, rgba(0,0,0,0) 100%)' }}
        />
        {/* Hover shadow — same curve compressed to 50% radius */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(90%+30px)] aspect-square opacity-0 transition-opacity duration-[900ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:opacity-100"
          style={{ background: 'radial-gradient(circle closest-side, rgba(0,0,0,1) 0%, rgba(0,0,0,0.972) 5%, rgba(0,0,0,0.896) 10%, rgba(0,0,0,0.784) 15%, rgba(0,0,0,0.648) 20%, rgba(0,0,0,0.5) 25%, rgba(0,0,0,0.352) 30%, rgba(0,0,0,0.216) 35%, rgba(0,0,0,0.104) 40%, rgba(0,0,0,0.028) 45%, rgba(0,0,0,0) 50%)' }}
        />
        <div
          className="
            relative z-10 w-4/5
            transition-transform duration-[900ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
            group-hover:scale-[1.08]
          "
        >
          <Image
            src="/lto-tape.png"
            alt={c.name}
            width={500}
            height={500}
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* Display name */}
      <span
        className="
          relative z-10
          text-[15px] font-[300] tracking-wide
          transition-opacity duration-[900ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
          opacity-80 group-hover:opacity-100
        "
        style={{ color: c.label_color }}
      >
        {c.name}
      </span>

      {/* Status badge */}
      {c.status === 'failing' && (
        <span className="relative z-10 text-[10px] tracking-widest uppercase font-medium text-orange-400 -mt-1">failing</span>
      )}
      {c.status === 'failed' && (
        <span className="relative z-10 text-[10px] tracking-widest uppercase font-medium text-red-400 -mt-1">failed</span>
      )}

      {/* Stats */}
      {capacity > 0 && (
        <div className="relative z-10 flex items-center gap-2 -mt-1">
          <span className="text-[11px] text-muted tracking-wide tabular-nums">
            {formatBytesSI(used)} / {formatBytesSI(capacity)}
          </span>
          <CircleProgress ratio={ratio} warn={warn} />
        </div>
      )}
    </button>
  )
}
