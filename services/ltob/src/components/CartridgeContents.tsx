'use client'

import { useState } from 'react'
import type { Cartridge, LTOFile } from '@/lib/db'
import { formatBytes } from '@/lib/format'
import { ArrowLeft, Upload, Plus, Loader2 } from 'lucide-react'
import FileRow from './FileRow'
import { FILE_TYPE_LABELS } from '@/lib/fileTypes'

type Props = {
  cartridge: Cartridge
  files: LTOFile[]
  onBack: () => void
  onFilesAdded: () => void
}

export default function CartridgeContents({ cartridge, files, onBack, onFilesAdded }: Props) {
  const [showImport, setShowImport] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  const typeCounts = files.reduce<Record<string, number>>((m, f) => {
    m[f.file_type] = (m[f.file_type] || 0) + 1
    return m
  }, {})

  const handleImport = async () => {
    setImportError('')
    let parsed: unknown
    try {
      parsed = JSON.parse(importJson)
    } catch {
      setImportError('Invalid JSON. Expected an array of file objects.')
      return
    }
    if (!Array.isArray(parsed)) {
      setImportError('Expected a JSON array.')
      return
    }
    setImporting(true)
    try {
      const res = await fetch(`/api/cartridges/${cartridge.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })
      if (!res.ok) {
        const err = await res.json()
        setImportError(err.error || 'Import failed')
        return
      }
      setImportJson('')
      setShowImport(false)
      onFilesAdded()
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          All cartridges
        </button>
        <span className="text-border">|</span>
        <div className="flex items-center gap-3">
          <span
            className="w-3 h-3 rounded-full ring-1 ring-white/10"
            style={{ background: cartridge.label_color }}
          />
          <h1 className="text-2xl font-bold text-text">{cartridge.title}</h1>
        </div>
        <div className="flex items-center gap-4 ml-auto text-sm text-muted">
          <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
          {files.length > 0 && (
            <span>{formatBytes(files.reduce((s, f) => s + f.size, 0))}</span>
          )}
          <button
            onClick={() => setShowImport(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface border border-border rounded-lg text-text hover:border-accent/50 hover:text-accent transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Import Files
          </button>
        </div>
      </div>

      {/* Import panel */}
      {showImport && (
        <div className="mb-6 p-5 bg-surface border border-border rounded-xl slide-in">
          <p className="text-sm font-medium text-text mb-1">Import files from JSON</p>
          <p className="text-xs text-muted mb-3">
            Paste a JSON array: <code className="text-accent">[&#123;"name":"file.mkv","path":"/dir/file.mkv","size":12345678&#125;, …]</code>
          </p>
          <textarea
            value={importJson}
            onChange={e => setImportJson(e.target.value)}
            className="w-full h-32 bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text font-mono placeholder:text-muted focus:outline-none focus:border-accent/60 resize-none"
            placeholder='[{"name": "movie.mkv", "path": "/movies/movie.mkv", "size": 8589934592}]'
          />
          {importError && <p className="text-red-400 text-xs mt-2">{importError}</p>}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleImport}
              disabled={importing || !importJson.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Import
            </button>
            <button
              onClick={() => { setShowImport(false); setImportError('') }}
              className="px-4 py-2 text-sm text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Type summary */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(typeCounts).map(([type, count]) => (
            <span key={type} className="px-3 py-1 bg-surface border border-border rounded-full text-xs text-muted">
              {FILE_TYPE_LABELS[type] || type} · {count}
            </span>
          ))}
        </div>
      )}

      {/* File list */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted gap-3">
          <Upload className="w-8 h-8 opacity-30" />
          <span className="text-sm">No files yet — import a JSON listing</span>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {files.map(f => (
            <FileRow key={f.id} file={f} showCartridge={false} />
          ))}
        </div>
      )}
    </div>
  )
}
