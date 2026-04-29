import type { LTOFile } from '@/lib/db'
import { formatBytes } from '@/lib/format'
import FileIcon from './FileIcon'

type Props = {
  file: LTOFile
  showCartridge?: boolean
}

export default function FileRow({ file, showCartridge = true }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-surface transition-colors group">
      <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-surface group-hover:bg-border transition-colors">
        <FileIcon fileType={file.file_type} className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text text-sm font-medium truncate">{file.name}</p>
        <p className="text-muted text-xs truncate mt-0.5">{file.path}</p>
      </div>
      <span className="shrink-0 text-muted text-xs tabular-nums">{formatBytes(file.size)}</span>
      {showCartridge && file.cartridge_title && (
        <span className="shrink-0 flex items-center gap-1.5 text-xs text-muted">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: file.cartridge_color || '#cf7c51' }}
          />
          {file.cartridge_title}
        </span>
      )}
    </div>
  )
}
