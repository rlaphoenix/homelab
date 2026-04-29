import type { LTOFile } from '@/lib/db'
import { formatBytes } from '@/lib/format'
import FileIcon from './FileIcon'

type Props = {
  file: LTOFile
  showCartridge?: boolean
  onSelect?: (file: LTOFile) => void
}

export default function FileRow({ file, showCartridge = true, onSelect }: Props) {
  return (
    <div
      className={`flex items-center gap-5 py-3 group hover:bg-surface transition-colors px-2 -mx-2 ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={onSelect ? () => onSelect(file) : undefined}
    >
      <FileIcon fileType={file.file_type} className="w-4 h-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink truncate tracking-wide" title={file.name}>{file.name}</p>
        <p className="text-xs text-muted truncate mt-0.5 font-mono" title={file.path}>{file.path}</p>
      </div>
      <span className="shrink-0 text-xs text-muted font-mono tabular-nums">{formatBytes(file.size)}</span>
      {showCartridge && file.cartridge_title && (
        <span className="shrink-0 flex items-center gap-1.5 text-xs text-muted tracking-wide">
          <span
            className="inline-block w-1.5 h-1.5"
            style={{ background: file.cartridge_color || '#999' }}
          />
          {file.cartridge_title}
        </span>
      )}
    </div>
  )
}
