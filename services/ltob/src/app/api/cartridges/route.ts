import { NextRequest, NextResponse } from 'next/server'
import { getCartridges, createCartridge } from '@/lib/db'

export async function GET() {
  try {
    const cartridges = getCartridges()
    return NextResponse.json(cartridges)
  } catch (e) {
    console.error('[GET /api/cartridges]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, label_color, category, capacity } = body
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    const cartridge = createCartridge(title.trim(), label_color || '#b0aba0', category?.trim() || 'Uncategorized', capacity ? Number(capacity) : 0)
    return NextResponse.json(cartridge, { status: 201 })
  } catch (e) {
    console.error('[POST /api/cartridges]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
