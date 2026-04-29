import { NextRequest, NextResponse } from 'next/server'
import Fuse from 'fuse.js'
import { getAllFiles, type LTOFile } from '@/lib/db'

let fuseCache: { fuse: Fuse<LTOFile>; ts: number } | null = null
const CACHE_TTL = 10_000

function getFuse(): Fuse<LTOFile> {
  const now = Date.now()
  if (fuseCache && now - fuseCache.ts < CACHE_TTL) return fuseCache.fuse

  const files = getAllFiles()
  const fuse = new Fuse(files, {
    keys: ['name', 'path', 'cartridge_title'],
    threshold: 0.35,
    includeScore: true,
    minMatchCharLength: 2,
  })
  fuseCache = { fuse, ts: now }
  return fuse
}

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') || ''
    if (!q.trim()) return NextResponse.json([])

    const fuse = getFuse()
    const results = fuse.search(q.trim(), { limit: 200 })
    return NextResponse.json(results.map(r => r.item))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
