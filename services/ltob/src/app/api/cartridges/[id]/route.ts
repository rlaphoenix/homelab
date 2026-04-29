import { NextRequest, NextResponse } from 'next/server'
import { getCartridge, deleteCartridge } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cartridge = getCartridge(Number(params.id))
    if (!cartridge) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(cartridge)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ok = deleteCartridge(Number(params.id))
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
