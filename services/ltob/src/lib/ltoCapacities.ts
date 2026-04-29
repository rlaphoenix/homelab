export const LTO_CAPACITIES = [
  { name: 'LTO-5 · 1.5 TB', bytes: 1_500_000_000_000 },
  { name: 'LTO-6 · 2.5 TB', bytes: 2_500_000_000_000 },
  { name: 'LTO-7 · 6 TB',   bytes: 6_000_000_000_000 },
  { name: 'LTO-8 · 12 TB',  bytes: 12_000_000_000_000 },
  { name: 'LTO-9 · 18 TB',  bytes: 18_000_000_000_000 },
]

// Returns the smallest advertised LTO capacity that is >= the actual detected size,
// or 0 if none matches (unknown generation).
export function detectLTOCapacity(sizeBytes: number): number {
  const match = LTO_CAPACITIES.find(t => t.bytes >= sizeBytes)
  return match?.bytes ?? 0
}
