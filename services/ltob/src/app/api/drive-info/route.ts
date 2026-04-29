import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import fs from 'fs'
import { detectLTOCapacity } from '@/lib/ltoCapacities'

const DRIVE = 'Y:\\'

function getDriveLabel(): string | null {
  // cmd vol is a built-in CMD command — always available and near-instant
  try {
    const out = execSync('cmd /c vol Y:', { encoding: 'utf8', timeout: 3000 })
    const match = out.match(/Volume in drive [A-Z] is (.+)/i)
    if (match) return match[1].trim()
  } catch {}

  // Fallback: PowerShell Get-Volume (slower startup, module may be absent)
  try {
    const label = execSync(
      'powershell -NoProfile -NonInteractive -Command "(Get-Volume -DriveLetter Y -ErrorAction Stop).FileSystemLabel"',
      { encoding: 'utf8', timeout: 6000 }
    ).trim()
    if (label) return label
  } catch {}

  return null
}

function getDriveSize(): number {
  // fs.statfsSync available since Node 19 — gives us bsize * blocks = total bytes
  try {
    const stat = fs.statfsSync(DRIVE)
    const total = stat.bsize * stat.blocks
    if (total > 0) return total
  } catch {}

  // Fallback: PowerShell Get-Volume .Size
  try {
    const out = execSync(
      'powershell -NoProfile -NonInteractive -Command "(Get-Volume -DriveLetter Y -ErrorAction Stop).Size"',
      { encoding: 'utf8', timeout: 6000 }
    ).trim()
    const n = Number(out)
    if (n > 0) return n
  } catch {}

  return 0
}

export async function GET() {
  const accessible = fs.existsSync(DRIVE)
  if (!accessible) {
    return NextResponse.json({ accessible: false, label: null, capacity: 0, error: 'Y: drive not found' })
  }
  const label = getDriveLabel()
  const driveSize = getDriveSize()
  const capacity = driveSize > 0 ? detectLTOCapacity(driveSize) : 0
  return NextResponse.json({ accessible: true, label, capacity })
}
