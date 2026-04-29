import { NextRequest, NextResponse } from 'next/server'
import { getCartridges, createCartridge } from '@/lib/db'

export async function GET() {
  try {
    const cartridges = getCartridges()
    return NextResponse.json(cartridges)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, label_color } = body
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    const cartridge = createCartridge(title.trim(), label_color || '#e05a2b')
    return NextResponse.json(cartridge, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
