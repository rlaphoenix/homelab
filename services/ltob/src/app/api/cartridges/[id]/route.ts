import { NextRequest, NextResponse } from 'next/server'
import { getCartridge, deleteCartridge, updateCartridge } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cartridge = getCartridge(params.id)
    if (!cartridge) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(cartridge)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, label_color, category, capacity } = await req.json()
    const updated = updateCartridge(params.id, { name, label_color, category, capacity: capacity !== undefined ? Number(capacity) : undefined })
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ok = deleteCartridge(params.id)
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
