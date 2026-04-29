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

const colors: Record<string, string> = {
  video: 'text-blue-400',
  audio: 'text-purple-400',
  image: 'text-emerald-400',
  archive: 'text-yellow-400',
  document: 'text-orange-400',
  code: 'text-cyan-400',
  other: 'text-muted',
}

type Props = {
  fileType: string
  className?: string
}

export default function FileIcon({ fileType, className }: Props) {
  const Icon = icons[fileType] || File
  const color = colors[fileType] || 'text-muted'
  return <Icon className={`${color} ${className || 'w-5 h-5'}`} />
}
