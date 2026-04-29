import { NextRequest } from 'next/server'
import fsp from 'fs/promises'
import path from 'path'
import { getCartridge, clearCartridgeFiles, addFiles, setLastIndexed } from '@/lib/db'
import { inferFileType } from '@/lib/fileTypes'

const DRIVE = 'Y:\\'

type SseEvent = { type: 'info' | 'warn' | 'success' | 'error' | 'done'; message: string; count?: number; total?: number }

async function* walkDir(
  dir: string,
  onDir: (d: string) => void,
): AsyncGenerator<{ path: string; name: string; size: number }> {
  onDir(dir)
  let entries: string[]
  try {
    entries = await fsp.readdir(dir, { encoding: 'utf8' })
  } catch (e) {
    return
  }
  for (const name of entries) {
    const full = path.join(dir, name)
    let stat
    try { stat = await fsp.stat(full) } catch { continue }
    if (stat.isDirectory()) {
      yield* walkDir(full, onDir)
    } else if (stat.isFile()) {
      const rel = '/' + full.replace(/^Y:[\\\/]?/i, '').replace(/\\/g, '/')
      yield { path: rel, name, size: stat.size }
    }
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const cartridgeId = params.id
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (evt: SseEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`))

      try {
        send({ type: 'info', message: `SELECT * FROM cartridges WHERE id = '${cartridgeId}'` })
        const cartridge = getCartridge(cartridgeId)
        if (!cartridge) {
          send({ type: 'error', message: 'Cartridge not found in database.' })
          controller.close(); return
        }

        send({ type: 'info', message: `fsp.access('${DRIVE}')` })
        try {
          await fsp.access(DRIVE)
        } catch {
          send({ type: 'error', message: 'Y: drive is not accessible. Is the LTO tape mounted?' })
          controller.close(); return
        }

        const files: { path: string; name: string; size: number; file_type: string }[] = []

        for await (const file of walkDir(DRIVE, (dir) => {
          send({ type: 'info', message: `fsp.readdir('${dir}')` })
        })) {
          files.push({ ...file, file_type: inferFileType(file.name) })
        }

        send({ type: 'info', message: `fsp.stat() — ${files.length} files found` })

        send({ type: 'info', message: `DELETE FROM files WHERE cartridge_id = '${cartridgeId}'` })
        const cleared = clearCartridgeFiles(cartridgeId)
        send({ type: 'info', message: `${cleared} row${cleared !== 1 ? 's' : ''} deleted` })

        send({ type: 'info', message: `INSERT INTO files (cartridge_id, path, name, size, file_type) — ${files.length} row${files.length !== 1 ? 's' : ''}` })
        addFiles(cartridgeId, files)
        setLastIndexed(cartridgeId)

        send({ type: 'done', message: `Done. ${files.length} files indexed.`, total: files.length })

      } catch (e) {
        send({ type: 'error', message: `Unexpected error: ${String(e)}` })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  })
}
