import { NextRequest, NextResponse } from 'next/server'
import { getCartridgeFiles, addFiles, deleteFile } from '@/lib/db'
import { inferFileType } from '@/lib/fileTypes'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const files = getCartridgeFiles(params.id)
    return NextResponse.json(files)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const cartridgeId = params.id
    const rawFiles: Array<{ path?: string; name?: string; size?: number; file_type?: string }> = Array.isArray(body) ? body : body.files

    if (!rawFiles?.length) {
      return NextResponse.json({ error: 'files array required' }, { status: 400 })
    }

    const files = rawFiles.map(f => {
      const name = f.name || (f.path ? f.path.split('/').pop()! : 'unknown')
      return {
        path: f.path || `/${name}`,
        name,
        size: Number(f.size) || 0,
        file_type: f.file_type || inferFileType(name),
      }
    })

    const count = addFiles(cartridgeId, files)
    return NextResponse.json({ added: count }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    const ok = deleteFile(Number(id))
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
