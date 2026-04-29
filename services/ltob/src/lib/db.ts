import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.join(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const DB_PATH = path.join(DATA_DIR, 'lto.db')

let _db: DatabaseSync | null = null

function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH)
    _db.exec('PRAGMA journal_mode = WAL')
    _db.exec('PRAGMA foreign_keys = ON')
    migrate(_db)
  }
  return _db
}

function migrate(db: DatabaseSync) {
  // Detect old integer-ID schema and recreate tables with TEXT UUIDs
  const tableInfo = db.prepare("PRAGMA table_info(cartridges)").all() as { name: string; type: string }[]
  const idCol = tableInfo.find(c => c.name === 'id')
  if (idCol && idCol.type !== 'TEXT') {
    db.exec('DROP TABLE IF EXISTS files')
    db.exec('DROP TABLE IF EXISTS cartridges')
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS cartridges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      label_color TEXT NOT NULL DEFAULT '#e05a2b',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cartridge_id TEXT NOT NULL REFERENCES cartridges(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      name TEXT NOT NULL,
      size INTEGER NOT NULL DEFAULT 0,
      file_type TEXT NOT NULL DEFAULT 'other',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  db.exec('CREATE INDEX IF NOT EXISTS idx_files_cartridge ON files(cartridge_id)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_files_name ON files(name)')

  // Add columns to existing databases that predate them
  const cartridgeCols = db.prepare('PRAGMA table_info(cartridges)').all() as { name: string }[]
  if (!cartridgeCols.find(c => c.name === 'category')) {
    db.exec("ALTER TABLE cartridges ADD COLUMN category TEXT NOT NULL DEFAULT ''")
  }
  if (!cartridgeCols.find(c => c.name === 'name')) {
    db.exec("ALTER TABLE cartridges ADD COLUMN name TEXT NOT NULL DEFAULT ''")
    db.exec("UPDATE cartridges SET name = title WHERE name = ''")
  }
  if (!cartridgeCols.find(c => c.name === 'capacity')) {
    db.exec('ALTER TABLE cartridges ADD COLUMN capacity INTEGER NOT NULL DEFAULT 0')
  }
  if (!cartridgeCols.find(c => c.name === 'status')) {
    db.exec("ALTER TABLE cartridges ADD COLUMN status TEXT NOT NULL DEFAULT 'good'")
  }
  if (!cartridgeCols.find(c => c.name === 'last_indexed_at')) {
    db.exec('ALTER TABLE cartridges ADD COLUMN last_indexed_at TEXT')
  }
}

export type Cartridge = {
  id: string
  title: string  // immutable Y: volume label
  name: string   // user-editable display name (defaults to title)
  label_color: string
  category: string
  capacity: number  // tape capacity in bytes; 0 = unset
  status: 'good' | 'failing' | 'failed'
  last_indexed_at: string | null
  created_at: string
  file_count?: number
  total_size?: number
}

export type LTOFile = {
  id: number
  cartridge_id: string
  path: string
  name: string
  size: number
  file_type: string
  created_at: string
  cartridge_title?: string
  cartridge_color?: string
}

export function getCartridges(): Cartridge[] {
  const db = getDb()
  return db.prepare(`
    SELECT c.*, COUNT(f.id) as file_count, COALESCE(SUM(f.size), 0) as total_size
    FROM cartridges c
    LEFT JOIN files f ON f.cartridge_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all() as Cartridge[]
}

export function getCartridge(id: string): Cartridge | null {
  const db = getDb()
  return db.prepare(`
    SELECT c.*, COUNT(f.id) as file_count, COALESCE(SUM(f.size), 0) as total_size
    FROM cartridges c
    LEFT JOIN files f ON f.cartridge_id = c.id
    WHERE c.id = ?
    GROUP BY c.id
  `).get(id) as Cartridge | null
}

export function createCartridge(title: string, label_color: string, category: string, capacity = 0): Cartridge {
  const db = getDb()
  const id = randomUUID()
  // name defaults to title; user can rename it later via updateCartridge
  db.prepare('INSERT INTO cartridges (id, title, name, label_color, category, capacity) VALUES (?, ?, ?, ?, ?, ?)').run(id, title, title, label_color, category, capacity)
  return getCartridge(id)!
}

export function updateCartridge(id: string, updates: { name?: string; label_color?: string; category?: string; capacity?: number; status?: string }): Cartridge | null {
  const db = getDb()
  const fields: string[] = []
  const values: unknown[] = []
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name) }
  if (updates.label_color !== undefined) { fields.push('label_color = ?'); values.push(updates.label_color) }
  if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category) }
  if (updates.capacity !== undefined) { fields.push('capacity = ?'); values.push(updates.capacity) }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status) }
  if (!fields.length) return getCartridge(id)
  values.push(id)
  db.prepare(`UPDATE cartridges SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return getCartridge(id)
}

export function getCategories(): string[] {
  const db = getDb()
  return (db.prepare("SELECT DISTINCT category FROM cartridges WHERE category != '' ORDER BY category").all() as { category: string }[])
    .map(r => r.category)
}

export function deleteCartridge(id: string): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM cartridges WHERE id = ?').run(id)
  return result.changes > 0
}

export function clearCartridgeFiles(cartridgeId: string): number {
  const db = getDb()
  const result = db.prepare('DELETE FROM files WHERE cartridge_id = ?').run(cartridgeId)
  return Number(result.changes)
}

export function getCartridgeFiles(cartridgeId: string): LTOFile[] {
  const db = getDb()
  return db.prepare(
    'SELECT * FROM files WHERE cartridge_id = ? ORDER BY path ASC'
  ).all(cartridgeId) as LTOFile[]
}

type FileInput = { path: string; name: string; size: number; file_type: string }

export function addFiles(cartridgeId: string, files: FileInput[]): number {
  const db = getDb()
  const stmt = db.prepare(
    'INSERT INTO files (cartridge_id, path, name, size, file_type) VALUES (?, ?, ?, ?, ?)'
  )
  db.exec('BEGIN')
  try {
    for (const f of files) {
      stmt.run(cartridgeId, f.path, f.name, f.size, f.file_type)
    }
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
  return files.length
}

export function deleteFile(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM files WHERE id = ?').run(id)
  return result.changes > 0
}

export function setLastIndexed(id: string): void {
  getDb().prepare("UPDATE cartridges SET last_indexed_at = datetime('now') WHERE id = ?").run(id)
}

type SearchParams = {
  q: string
  page: number
  pageSize: number
  sortBy: 'name' | 'size' | 'cartridge'
  sortDir: 'asc' | 'desc'
  typeFilter?: string
  cartridgeFilter?: string
  sizeMin?: number
  sizeMax?: number
}

const SORT_COL: Record<string, string> = {
  name: 'LOWER(f.name)',
  size: 'f.size',
  cartridge: 'LOWER(c.title)',
}

export function searchFilesPaged(params: SearchParams): {
  files: LTOFile[]
  total: number
  typeCounts: Record<string, number>
  cartridgeCounts: Record<string, number>
  totalSize: number
} {
  const db = getDb()
  const { page, pageSize, sortBy, sortDir, typeFilter, cartridgeFilter, sizeMin, sizeMax } = params
  const q = params.q.trim()

  // Text: each space-separated token must appear in name or path (AND logic)
  const textConds: string[] = []
  const textVals: unknown[] = []
  for (const token of q ? q.split(/\s+/).filter(Boolean) : []) {
    const like = `%${token.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`
    textConds.push(`(f.name LIKE ? ESCAPE '\\' OR f.path LIKE ? ESCAPE '\\')`)
    textVals.push(like, like)
  }

  // Size filter
  const sizeConds: string[] = []
  const sizeVals: unknown[] = []
  if (sizeMin != null && sizeMin > 0) { sizeConds.push('f.size >= ?'); sizeVals.push(sizeMin) }
  if (sizeMax != null) { sizeConds.push('f.size <= ?'); sizeVals.push(sizeMax) }

  // Facet filters (type + cartridge) — only applied to main query, not aggregates
  const facetConds: string[] = []
  const facetVals: unknown[] = []
  if (typeFilter) { facetConds.push('f.file_type = ?'); facetVals.push(typeFilter) }
  if (cartridgeFilter) { facetConds.push('c.title = ?'); facetVals.push(cartridgeFilter) }

  const join = 'FROM files f JOIN cartridges c ON c.id = f.cartridge_id'

  // Aggregates use text + size only (so sidebar counts reflect query, not each other's filters)
  const aggConds = [...textConds, ...sizeConds]
  const aggVals = [...textVals, ...sizeVals] as unknown[]
  const aggWhere = aggConds.length ? `WHERE ${aggConds.join(' AND ')}` : ''

  // Main query uses all filters
  const allConds = [...textConds, ...sizeConds, ...facetConds]
  const allVals = [...textVals, ...sizeVals, ...facetVals] as unknown[]
  const allWhere = allConds.length ? `WHERE ${allConds.join(' AND ')}` : ''

  const col = SORT_COL[sortBy] ?? 'LOWER(f.name)'
  const dir = sortDir === 'desc' ? 'DESC' : 'ASC'
  const offset = (page - 1) * pageSize

  // Type counts
  const typeCounts: Record<string, number> = {}
  for (const row of db.prepare(`SELECT f.file_type, COUNT(*) as cnt ${join} ${aggWhere} GROUP BY f.file_type`).all(...aggVals) as { file_type: string; cnt: number }[]) {
    typeCounts[row.file_type] = row.cnt
  }

  // Cartridge counts
  const cartridgeCounts: Record<string, number> = {}
  for (const row of db.prepare(`SELECT c.title, COUNT(*) as cnt ${join} ${aggWhere} GROUP BY c.title`).all(...aggVals) as { title: string; cnt: number }[]) {
    cartridgeCounts[row.title] = row.cnt
  }

  // Total size (text only, no size/facet filters — for browse-all header)
  const totalSizeWhere = textConds.length ? `WHERE ${textConds.join(' AND ')}` : ''
  const totalSize = (db.prepare(`SELECT COALESCE(SUM(f.size), 0) as s ${join} ${totalSizeWhere}`).get(...textVals) as { s: number }).s

  const total = (db.prepare(`SELECT COUNT(*) as cnt ${join} ${allWhere}`).get(...allVals) as { cnt: number }).cnt
  const files = db.prepare(`
    SELECT f.*, c.title as cartridge_title, c.label_color as cartridge_color
    ${join} ${allWhere}
    ORDER BY ${col} ${dir}, f.id ASC
    LIMIT ? OFFSET ?
  `).all(...allVals, pageSize, offset) as LTOFile[]

  return { files, total, typeCounts, cartridgeCounts, totalSize }
}

export function searchFiles(query: string): LTOFile[] {
  const db = getDb()
  if (!query.trim()) return []
  const like = `%${query.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`
  return db.prepare(`
    SELECT f.*, c.title as cartridge_title, c.label_color as cartridge_color
    FROM files f
    JOIN cartridges c ON c.id = f.cartridge_id
    WHERE f.name LIKE ? ESCAPE '\\' OR f.path LIKE ? ESCAPE '\\'
    ORDER BY f.name ASC
    LIMIT 500
  `).all(like, like) as LTOFile[]
}

export function getAllFiles(): LTOFile[] {
  const db = getDb()
  return db.prepare(`
    SELECT f.*, c.title as cartridge_title, c.label_color as cartridge_color
    FROM files f
    JOIN cartridges c ON c.id = f.cartridge_id
    ORDER BY f.name ASC
  `).all() as LTOFile[]
}
