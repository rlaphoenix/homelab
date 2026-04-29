import { Film, Music, Image, Archive, FileText, Code, File } from 'lucide-react'

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Film,
  audio: Music,
  image: Image,
  archive: Archive,
  document: FileText,
  code: Code,
  other: File,
}

type Props = { fileType: string; className?: string }

export default function FileIcon({ fileType, className }: Props) {
  const Icon = icons[fileType] || File
  return <Icon className={`text-muted ${className || 'w-4 h-4'}`} />
}
