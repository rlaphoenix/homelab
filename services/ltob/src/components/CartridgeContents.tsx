'use client'

import { useRef, useState } from 'react'
import type { Cartridge, LTOFile } from '@/lib/db'
import { formatBytes } from '@/lib/format'
import { FILE_TYPE_LABELS } from '@/lib/fileTypes'
import FileRow from './FileRow'
import TerminalModal from './TerminalModal'
import EditCartridgeModal from './EditCartridgeModal'

type Props = {
  cartridge: Cartridge
  files: LTOFile[]
  onBack: () => void
  onFilesAdded: () => void
  onCartridgeUpdated: (updated: Cartridge) => void
}

type DriveState =
  | { step: 'idle' }
  | { step: 'checking' }
  | { step: 'confirm'; driveLabel: string }
  | { step: 'terminal' }

function formatIndexedAt(ts: string | null | undefined): string | null {
  if (!ts) return null
  const d = new Date(ts.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return null
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = d.getUTCFullYear()
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const min = String(d.getUTCMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

export default function CartridgeContents({ cartridge, files, onBack, onFilesAdded, onCartridgeUpdated }: Props) {
  const [drive, setDrive] = useState<DriveState>({ step: 'idle' })
  const [showSettings, setShowSettings] = useState(false)
  const confirmMouseDownOnBackdrop = useRef(false)

  const handleUpdateClick = async () => {
    setDrive({ step: 'checking' })
    try {
      const res = await fetch('/api/drive-info')
      const info = await res.json()

      if (!info.accessible) {
        alert(`Y: drive is not accessible.\n\n${info.error ?? 'Make sure the LTO tape is mounted as Y:'}`)
        setDrive({ step: 'idle' }); return
      }

      const labelNorm = (info.label ?? '').trim().toLowerCase()
      const titleNorm = cartridge.title.trim().toLowerCase()

      if (labelNorm && labelNorm === titleNorm) {
        setDrive({ step: 'terminal' })
      } else {
        setDrive({ step: 'confirm', driveLabel: info.label ?? '(no label)' })
      }
    } catch (e) {
      alert(`Failed to check drive: ${e}`)
      setDrive({ step: 'idle' })
    }
  }

  const typeCounts = files.reduce<Record<string, number>>((m, f) => {
    m[f.file_type] = (m[f.file_type] || 0) + 1
    return m
  }, {})

  const totalSize = files.reduce((s, f) => s + f.size, 0)
  const indexedAt = formatIndexedAt(cartridge.last_indexed_at)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-5">
          <button
            onClick={onBack}
            className="text-[10px] tracking-widest uppercase text-muted hover:text-ink transition-colors px-3 py-1.5 rounded-md bg-surface hover:bg-border"
          >
            ← back
          </button>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: cartridge.label_color }} />
            <h1 className="text-sm font-medium text-ink tracking-wide">{cartridge.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-muted">
          {indexedAt && (
            <span className="tracking-wide">Last updated {indexedAt}</span>
          )}
          <span className="tracking-wide">
            {files.length} files
            {totalSize > 0 && ` · ${formatBytes(totalSize)}`}
          </span>

          <button
            onClick={() => setShowSettings(true)}
            className="tracking-widest uppercase px-3 py-1.5 rounded-md bg-surface hover:bg-border hover:text-ink transition-colors"
          >
            edit
          </button>

          <button
            onClick={handleUpdateClick}
            disabled={drive.step === 'checking'}
            className="tracking-widest uppercase px-3 py-1.5 rounded-md bg-ink text-bg hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {drive.step === 'checking' ? 'checking…' : 'update files'}
          </button>
        </div>
      </div>

      {/* Type tags */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-5 mb-8">
          {Object.entries(typeCounts).map(([type, count]) => (
            <span key={type} className="text-[10px] text-muted tracking-widest uppercase">
              {FILE_TYPE_LABELS[type] || type} {count}
            </span>
          ))}
        </div>
      )}

      {/* File list */}
      {files.length === 0 ? (
        <p className="text-[10px] text-muted tracking-widest uppercase py-20">no files — use update files</p>
      ) : (
        <div className="divide-y divide-border">
          {files.map(f => <FileRow key={f.id} file={f} showCartridge={false} />)}
        </div>
      )}

      {/* Drive name mismatch confirmation */}
      {drive.step === 'confirm' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm"
          onMouseDown={e => { confirmMouseDownOnBackdrop.current = e.target === e.currentTarget }}
          onMouseUp={e => { if (confirmMouseDownOnBackdrop.current && e.target === e.currentTarget) setDrive({ step: 'idle' }) }}
        >
          <div className="w-full max-w-sm mx-6 bg-bg border border-border shadow-sm fade-up">
            <div className="px-8 py-6 border-b border-border">
              <p className="text-[10px] tracking-ultra uppercase text-ink">drive name mismatch</p>
            </div>
            <div className="px-8 py-6 space-y-3 text-xs text-text">
              <div className="flex justify-between">
                <span className="text-muted tracking-wide">Drive Y: label</span>
                <span className="font-medium text-ink">{drive.driveLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted tracking-wide">Cartridge label</span>
                <span className="font-medium text-ink">{cartridge.title}</span>
              </div>
              <p className="text-[10px] text-muted tracking-wide pt-2">
                The mounted drive does not match this cartridge. Proceeding will overwrite all indexed files.
              </p>
            </div>
            <div className="px-8 py-5 border-t border-border flex items-center gap-3">
              <button
                onClick={() => setDrive({ step: 'terminal' })}
                className="text-[10px] tracking-widest uppercase px-4 py-2 rounded-md bg-ink text-bg hover:opacity-80 transition-opacity"
              >
                proceed anyway
              </button>
              <button
                onClick={() => setDrive({ step: 'idle' })}
                className="text-[10px] tracking-widest uppercase px-4 py-2 rounded-md bg-surface hover:bg-border text-muted hover:text-ink transition-colors"
              >
                cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal modal */}
      {drive.step === 'terminal' && (
        <TerminalModal
          cartridgeId={cartridge.id}
          onClose={() => setDrive({ step: 'idle' })}
          onDone={onFilesAdded}
        />
      )}

      {/* Settings / edit modal */}
      {showSettings && (
        <EditCartridgeModal
          cartridge={cartridge}
          onClose={() => setShowSettings(false)}
          onSaved={updated => { setShowSettings(false); onCartridgeUpdated(updated) }}
        />
      )}
    </div>
  )
}
