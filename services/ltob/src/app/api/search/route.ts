import { NextRequest, NextResponse } from 'next/server'
import Fuse from 'fuse.js'
import { getAllFiles, searchFilesPaged, type LTOFile } from '@/lib/db'

// Fuse index cache — used as typo-tolerance fallback when SQL returns 0 results
let fuseCache: { fuse: Fuse<LTOFile>; ts: number } | null = null
const CACHE_TTL = 30_000

function getFuse(): Fuse<LTOFile> {
  const now = Date.now()
  if (fuseCache && now - fuseCache.ts < CACHE_TTL) return fuseCache.fuse
  const files = getAllFiles()
  const fuse = new Fuse(files, {
    keys: [
      { name: 'name', weight: 3 },
      { name: 'path', weight: 1 },
      { name: 'cartridge_title', weight: 0.5 },
    ],
    threshold: 0.4,
    distance: 10_000,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 2,
    findAllMatches: true,
    useExtendedSearch: true,
  })
  fuseCache = { fuse, ts: now }
  return fuse
}

type SortBy = 'name' | 'size' | 'cartridge'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const q = sp.get('q') ?? ''
    const page = Math.max(1, parseInt(sp.get('page') ?? '1') || 1)
    const pageSize = 50
    const sortBy = (['name', 'size', 'cartridge'].includes(sp.get('sort') ?? '') ? sp.get('sort') : 'name') as SortBy
    const sortDir = sp.get('dir') === 'desc' ? 'desc' : 'asc'
    const typeFilter = sp.get('type') || undefined
    const cartridgeFilter = sp.get('cartridge') || undefined
    const sizeMin = sp.get('sizeMin') ? Number(sp.get('sizeMin')) : undefined
    const sizeMax = sp.get('sizeMax') ? Number(sp.get('sizeMax')) : undefined

    const params = { q, page, pageSize, sortBy, sortDir, typeFilter, cartridgeFilter, sizeMin, sizeMax }
    const result = searchFilesPaged(params)

    // If text search returned nothing, try fuse.js for typo tolerance
    if (q.trim() && result.total === 0) {
      const fuse = getFuse()
      const fuseMatches = fuse.search(q.trim())

      if (fuseMatches.length > 0) {
        let filtered = fuseMatches.map(r => r.item)

        // Compute aggregates from full fuse set (before facet filters)
        const typeCounts: Record<string, number> = {}
        const cartridgeCounts: Record<string, number> = {}
        let totalSize = 0
        for (const { item: f } of fuseMatches) {
          typeCounts[f.file_type] = (typeCounts[f.file_type] || 0) + 1
          if (f.cartridge_title) cartridgeCounts[f.cartridge_title] = (cartridgeCounts[f.cartridge_title] || 0) + 1
          totalSize += f.size
        }

        // Apply facet + size filters
        if (typeFilter) filtered = filtered.filter(f => f.file_type === typeFilter)
        if (cartridgeFilter) filtered = filtered.filter(f => f.cartridge_title === cartridgeFilter)
        if (sizeMin) filtered = filtered.filter(f => f.size >= sizeMin)
        if (sizeMax != null) filtered = filtered.filter(f => f.size <= sizeMax)

        // Sort
        const mul = sortDir === 'desc' ? -1 : 1
        filtered.sort((a, b) => {
          if (sortBy === 'size') return (a.size - b.size) * mul
          if (sortBy === 'cartridge') return ((a.cartridge_title ?? '').localeCompare(b.cartridge_title ?? '')) * mul
          return a.name.localeCompare(b.name) * mul
        })

        const total = filtered.length
        const totalPages = Math.max(1, Math.ceil(total / pageSize))
        const files = filtered.slice((page - 1) * pageSize, page * pageSize)
        return NextResponse.json({ files, total, page: Math.min(page, totalPages), totalPages, pageSize, typeCounts, cartridgeCounts, totalSize })
      }
    }

    const totalPages = Math.max(1, Math.ceil(result.total / pageSize))
    return NextResponse.json({ ...result, page: Math.min(page, totalPages), totalPages, pageSize })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
