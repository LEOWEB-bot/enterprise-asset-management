import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { DatabaseSchema } from './db';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SQLITE_FILE = path.join(DATA_DIR, 'eam.db');

let sqliteInstance: DatabaseSync | null = null;

export function isSqliteSupported(): boolean {
  try {
    return typeof DatabaseSync === 'function';
  } catch {
    return false;
  }
}

export function getSqliteDb(): DatabaseSync {
  if (sqliteInstance) {
    return sqliteInstance;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new DatabaseSync(SQLITE_FILE);

  // Optimasi performa dan ketahanan transaksi
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Inisialisasi Skema Tabel
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      name TEXT,
      role TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      code TEXT,
      name TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      code TEXT,
      name TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      code TEXT,
      name TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      group_name TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      code TEXT,
      name TEXT,
      category_id TEXT,
      location_id TEXT,
      status TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      type TEXT,
      status TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS movements (
      id TEXT PRIMARY KEY,
      asset_id TEXT,
      movement_date TEXT,
      status TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS disposals (
      id TEXT PRIMARY KEY,
      asset_id TEXT,
      status TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS maintenance (
      id TEXT PRIMARY KEY,
      asset_id TEXT,
      maintenance_type TEXT,
      status TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_campaigns (
      id TEXT PRIMARY KEY,
      title TEXT,
      status TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_items (
      id TEXT PRIMARY KEY,
      campaign_id TEXT,
      asset_id TEXT,
      status TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      user_email TEXT,
      action TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      is_read INTEGER,
      data_json TEXT NOT NULL
    );

    -- Indeks performa untuk query cepat
    CREATE INDEX IF NOT EXISTS idx_assets_code ON assets (code);
    CREATE INDEX IF NOT EXISTS idx_assets_status ON assets (status);
    CREATE INDEX IF NOT EXISTS idx_movements_asset ON movements (asset_id);
    CREATE INDEX IF NOT EXISTS idx_maintenance_asset ON maintenance (asset_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_time ON activity_logs (timestamp);
  `);

  sqliteInstance = db;
  return db;
}

export function loadDatabaseFromSqlite(): DatabaseSchema | null {
  try {
    const db = getSqliteDb();

    // Periksa apakah tabel system_meta sudah memiliki data
    const metaRows = db.prepare('SELECT key, value FROM system_meta').all() as Array<{ key: string; value: string }>;
    if (!metaRows || metaRows.length === 0) {
      return null;
    }

    const metaMap: Record<string, string> = {};
    for (const row of metaRows) {
      metaMap[row.key] = row.value;
    }

    const readTable = <T>(tableName: string): T[] => {
      try {
        const rows = db.prepare(`SELECT data_json FROM ${tableName}`).all() as Array<{ data_json: string }>;
        return rows.map((r) => JSON.parse(r.data_json) as T);
      } catch (err) {
        console.warn(`Gagal membaca tabel SQLite ${tableName}:`, err);
        return [];
      }
    };

    return {
      version: metaMap['version'] || '1.0.0',
      isSetupCompleted: metaMap['isSetupCompleted'] === 'true',
      lastUpdatedAt: metaMap['lastUpdatedAt'] || new Date().toISOString(),
      users: readTable('users'),
      roles: readTable('roles'),
      assets: readTable('assets'),
      categories: readTable('categories'),
      locations: readTable('locations'),
      classes: readTable('classes'),
      settings: readTable('settings'),
      approvals: readTable('approvals'),
      movements: readTable('movements'),
      disposals: readTable('disposals'),
      maintenance: readTable('maintenance'),
      auditCampaigns: readTable('audit_campaigns'),
      auditItems: readTable('audit_items'),
      activityLogs: readTable('activity_logs'),
      notifications: readTable('notifications'),
    };
  } catch (error) {
    console.error('Gagal membaca data dari SQLite:', error);
    return null;
  }
}

export function saveDatabaseToSqlite(data: DatabaseSchema): void {
  const db = getSqliteDb();

  // Simpan metadata
  const insertMeta = db.prepare('INSERT OR REPLACE INTO system_meta (key, value) VALUES (?, ?)');
  insertMeta.run('version', data.version || '1.0.0');
  insertMeta.run('isSetupCompleted', data.isSetupCompleted ? 'true' : 'false');
  insertMeta.run('lastUpdatedAt', data.lastUpdatedAt || new Date().toISOString());

  // Helper untuk menyimpan koleksi ke tabel secara bersih
  const syncTable = <T extends Record<string, any>>(
    tableName: string,
    items: T[],
    keyExtractor: (item: T) => string,
    extraExtractor?: (item: T) => any[]
  ) => {
    db.exec(`DELETE FROM ${tableName}`);
    if (!items || items.length === 0) return;

    if (tableName === 'users') {
      const stmt = db.prepare('INSERT INTO users (id, email, name, role, data_json) VALUES (?, ?, ?, ?, ?)');
      for (const u of items) {
        stmt.run(u.id, u.email || '', u.name || '', u.role || '', JSON.stringify(u));
      }
    } else if (tableName === 'roles') {
      const stmt = db.prepare('INSERT INTO roles (id, name, data_json) VALUES (?, ?, ?)');
      for (const r of items) {
        stmt.run(r.id, r.name || '', JSON.stringify(r));
      }
    } else if (tableName === 'categories') {
      const stmt = db.prepare('INSERT INTO categories (id, code, name, data_json) VALUES (?, ?, ?, ?)');
      for (const c of items) {
        stmt.run(c.id, c.code || '', c.name || '', JSON.stringify(c));
      }
    } else if (tableName === 'locations') {
      const stmt = db.prepare('INSERT INTO locations (id, code, name, data_json) VALUES (?, ?, ?, ?)');
      for (const l of items) {
        stmt.run(l.id, l.code || '', l.name || '', JSON.stringify(l));
      }
    } else if (tableName === 'classes') {
      const stmt = db.prepare('INSERT INTO classes (id, code, name, data_json) VALUES (?, ?, ?, ?)');
      for (const cl of items) {
        stmt.run(cl.id, cl.code || '', cl.name || '', JSON.stringify(cl));
      }
    } else if (tableName === 'settings') {
      const stmt = db.prepare('INSERT INTO settings (key, value, group_name, data_json) VALUES (?, ?, ?, ?)');
      for (const s of items) {
        stmt.run(s.key, String(s.value || ''), s.group || '', JSON.stringify(s));
      }
    } else if (tableName === 'assets') {
      const stmt = db.prepare('INSERT INTO assets (id, code, name, category_id, location_id, status, data_json) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const a of items) {
        stmt.run(a.id, a.code || '', a.name || '', a.categoryId || '', a.locationId || '', a.status || '', JSON.stringify(a));
      }
    } else if (tableName === 'approvals') {
      const stmt = db.prepare('INSERT INTO approvals (id, type, status, data_json) VALUES (?, ?, ?, ?)');
      for (const ap of items) {
        stmt.run(ap.id, ap.type || '', ap.status || '', JSON.stringify(ap));
      }
    } else if (tableName === 'movements') {
      const stmt = db.prepare('INSERT INTO movements (id, asset_id, movement_date, status, data_json) VALUES (?, ?, ?, ?, ?)');
      for (const m of items) {
        stmt.run(m.id, m.assetId || '', m.movementDate || '', m.status || '', JSON.stringify(m));
      }
    } else if (tableName === 'disposals') {
      const stmt = db.prepare('INSERT INTO disposals (id, asset_id, status, data_json) VALUES (?, ?, ?, ?)');
      for (const d of items) {
        stmt.run(d.id, d.assetId || '', d.status || '', JSON.stringify(d));
      }
    } else if (tableName === 'maintenance') {
      const stmt = db.prepare('INSERT INTO maintenance (id, asset_id, maintenance_type, status, data_json) VALUES (?, ?, ?, ?, ?)');
      for (const mt of items) {
        stmt.run(mt.id, mt.assetId || '', mt.maintenanceType || '', mt.status || '', JSON.stringify(mt));
      }
    } else if (tableName === 'audit_campaigns') {
      const stmt = db.prepare('INSERT INTO audit_campaigns (id, title, status, data_json) VALUES (?, ?, ?, ?)');
      for (const ac of items) {
        stmt.run(ac.id, ac.title || '', ac.status || '', JSON.stringify(ac));
      }
    } else if (tableName === 'audit_items') {
      const stmt = db.prepare('INSERT INTO audit_items (id, campaign_id, asset_id, status, data_json) VALUES (?, ?, ?, ?, ?)');
      for (const ai of items) {
        stmt.run(ai.id, ai.campaignId || '', ai.assetId || '', ai.status || '', JSON.stringify(ai));
      }
    } else if (tableName === 'activity_logs') {
      const stmt = db.prepare('INSERT INTO activity_logs (id, timestamp, user_email, action, data_json) VALUES (?, ?, ?, ?, ?)');
      for (const al of items) {
        stmt.run(al.id, al.timestamp || '', al.userEmail || '', al.action || '', JSON.stringify(al));
      }
    } else if (tableName === 'notifications') {
      const stmt = db.prepare('INSERT INTO notifications (id, user_id, is_read, data_json) VALUES (?, ?, ?, ?)');
      for (const n of items) {
        stmt.run(n.id, n.userId || '', n.isRead ? 1 : 0, JSON.stringify(n));
      }
    }
  };

  syncTable('users', data.users, (u) => u.id);
  syncTable('roles', data.roles, (r) => r.id);
  syncTable('categories', data.categories, (c) => c.id);
  syncTable('locations', data.locations, (l) => l.id);
  syncTable('classes', data.classes, (cl) => cl.id);
  syncTable('settings', data.settings, (s) => s.key);
  syncTable('assets', data.assets, (a) => a.id);
  syncTable('approvals', data.approvals, (ap) => ap.id);
  syncTable('movements', data.movements, (m) => m.id);
  syncTable('disposals', data.disposals, (d) => d.id);
  syncTable('maintenance', data.maintenance, (mt) => mt.id);
  syncTable('audit_campaigns', data.auditCampaigns, (ac) => ac.id);
  syncTable('audit_items', data.auditItems, (ai) => ai.id);
  syncTable('activity_logs', data.activityLogs, (al) => al.id);
  syncTable('notifications', data.notifications, (n) => n.id);
}

export function updateCollectionInSqlite<K extends keyof DatabaseSchema>(
  key: K,
  value: DatabaseSchema[K]
): void {
  const current = loadDatabaseFromSqlite();
  if (current) {
    current[key] = value;
    current.lastUpdatedAt = new Date().toISOString();
    saveDatabaseToSqlite(current);
  }
}
