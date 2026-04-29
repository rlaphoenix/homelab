export type NamedColor = { name: string; hex: string }

export const CARTRIDGE_COLORS: NamedColor[] = [
  { name: 'Stone',  hex: '#b0aba0' },
  { name: 'Slate',  hex: '#64748b' },
  { name: 'Rust',   hex: '#e05a2b' },
  { name: 'Amber',  hex: '#d4842a' },
  { name: 'Gold',   hex: '#c9a227' },
  { name: 'Sage',   hex: '#5c8a5c' },
  { name: 'Teal',   hex: '#2d9b9b' },
  { name: 'Sky',    hex: '#3d7ab5' },
  { name: 'Iris',   hex: '#7065a8' },
  { name: 'Rose',   hex: '#b54a6b' },
]

export function colorName(hex: string): string | undefined {
  return CARTRIDGE_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase())?.name
}
