const VIDEO_EXT = new Set(['mp4', 'mkv', 'avi', 'mov', 'wmv', 'm4v', 'flv', 'webm', 'ts', 'm2ts', 'vob', 'mpg', 'mpeg'])
const AUDIO_EXT = new Set(['mp3', 'flac', 'aac', 'wav', 'ogg', 'opus', 'm4a', 'wma', 'aiff'])
const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'svg', 'heic', 'heif', 'raw', 'cr2', 'nef', 'arw'])
const ARCHIVE_EXT = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'zst', 'iso'])
const DOC_EXT = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'epub', 'mobi'])
const CODE_EXT = new Set(['js', 'ts', 'py', 'rs', 'go', 'java', 'cpp', 'c', 'h', 'cs', 'rb', 'php', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'sh', 'bat', 'ps1'])

export function inferFileType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (VIDEO_EXT.has(ext)) return 'video'
  if (AUDIO_EXT.has(ext)) return 'audio'
  if (IMAGE_EXT.has(ext)) return 'image'
  if (ARCHIVE_EXT.has(ext)) return 'archive'
  if (DOC_EXT.has(ext)) return 'document'
  if (CODE_EXT.has(ext)) return 'code'
  return 'other'
}

export type FileType = 'video' | 'audio' | 'image' | 'archive' | 'document' | 'code' | 'other'

export const FILE_TYPE_LABELS: Record<string, string> = {
  video: 'Video',
  audio: 'Audio',
  image: 'Image',
  archive: 'Archive',
  document: 'Document',
  code: 'Code',
  other: 'Other',
}
