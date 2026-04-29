import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.join(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const DB_PATH = path.join(DATA_DIR, 'lto.db')

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
    migrate(_db)
  }
  return _db
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cartridges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      label_color TEXT NOT NULL DEFAULT '#e05a2b',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cartridge_id INTEGER NOT NULL REFERENCES cartridges(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      name TEXT NOT NULL,
      size INTEGER NOT NULL DEFAULT 0,
      file_type TEXT NOT NULL DEFAULT 'other',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_files_cartridge ON files(cartridge_id);
    CREATE INDEX IF NOT EXISTS idx_files_name ON files(name);
  `)
}

export type Cartridge = {
  id: number
  title: string
  label_color: string
  created_at: string
  file_count?: number
  total_size?: number
}

export type LTOFile = {
  id: number
  cartridge_id: number
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

export function getCartridge(id: number): Cartridge | null {
  const db = getDb()
  return db.prepare(`
    SELECT c.*, COUNT(f.id) as file_count, COALESCE(SUM(f.size), 0) as total_size
    FROM cartridges c
    LEFT JOIN files f ON f.cartridge_id = c.id
    WHERE c.id = ?
    GROUP BY c.id
  `).get(id) as Cartridge | null
}

export function createCartridge(title: string, label_color: string): Cartridge {
  const db = getDb()
  const result = db.prepare(
    'INSERT INTO cartridges (title, label_color) VALUES (?, ?)'
  ).run(title, label_color)
  return getCartridge(result.lastInsertRowid as number)!
}

export function deleteCartridge(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM cartridges WHERE id = ?').run(id)
  return result.changes > 0
}

export function getCartridgeFiles(cartridgeId: number): LTOFile[] {
  const db = getDb()
  return db.prepare(
    'SELECT * FROM files WHERE cartridge_id = ? ORDER BY path ASC'
  ).all(cartridgeId) as LTOFile[]
}

type FileInput = { path: string; name: string; size: number; file_type: string }

export function addFiles(cartridgeId: number, files: FileInput[]): number {
  const db = getDb()
  const stmt = db.prepare(
    'INSERT INTO files (cartridge_id, path, name, size, file_type) VALUES (?, ?, ?, ?, ?)'
  )
  const insertMany = db.transaction((rows: FileInput[]) => {
    for (const f of rows) {
      stmt.run(cartridgeId, f.path, f.name, f.size, f.file_type)
    }
  })
  insertMany(files)
  return files.length
}

export function deleteFile(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM files WHERE id = ?').run(id)
  return result.changes > 0
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
