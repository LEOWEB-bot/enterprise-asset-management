import fs from 'fs';
import path from 'path';
import {
  INITIAL_USERS,
  INITIAL_ROLES,
  INITIAL_CATEGORIES,
  INITIAL_LOCATIONS,
  INITIAL_CLASSES,
  INITIAL_SETTINGS,
  INITIAL_ASSETS,
  INITIAL_APPROVALS,
  INITIAL_MOVEMENTS,
  INITIAL_MAINTENANCE,
  INITIAL_AUDIT_CAMPAIGNS,
  INITIAL_AUDIT_ITEMS,
  INITIAL_ACTIVITY_LOGS,
} from '../data/enterprise-asset-management';
import {
  User,
  RoleDefinition,
  Asset,
  AssetCategory,
  AssetLocation,
  AssetClass,
  SystemSetting,
  ApprovalRequest,
  MovementRecord,
  DisposalRecord,
  MaintenanceRecord,
  AuditCampaign,
  AuditItemRecord,
  ActivityLog,
  AppNotification,
} from '../types';
import {
  isSqliteSupported,
  loadDatabaseFromSqlite,
  saveDatabaseToSqlite,
  updateCollectionInSqlite,
} from './sqliteDb';

export interface DatabaseSchema {
  version: string;
  isSetupCompleted: boolean;
  lastUpdatedAt: string;
  users: User[];
  roles: RoleDefinition[];
  assets: Asset[];
  categories: AssetCategory[];
  locations: AssetLocation[];
  classes: AssetClass[];
  settings: SystemSetting[];
  approvals: ApprovalRequest[];
  movements: MovementRecord[];
  disposals: DisposalRecord[];
  maintenance: MaintenanceRecord[];
  auditCampaigns: AuditCampaign[];
  auditItems: AuditItemRecord[];
  activityLogs: ActivityLog[];
  notifications: AppNotification[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const SQLITE_FILE = path.join(DATA_DIR, 'eam.db');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

function ensureDirectoriesExist(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

export function getDefaultSeedData(): DatabaseSchema {
  const now = new Date().toISOString();
  const isFreshInstall = process.env.VITE_FRESH_INSTALL === 'true';
  const defaultSettings = INITIAL_SETTINGS.some((s) => s.key === 'system.seed_mode')
    ? INITIAL_SETTINGS
    : [
        ...INITIAL_SETTINGS,
        {
          key: 'system.seed_mode',
          value: 'minimal',
          group: 'APPLICATION' as const,
          label: 'system.seed_mode',
          description: '',
          type: 'STRING' as const,
        },
      ];

  return {
    version: '1.0.0',
    isSetupCompleted: !isFreshInstall,
    lastUpdatedAt: now,
    users: [
      {
        ...INITIAL_USERS[0],
        twoFactorEnabled: false,
      },
    ],
    roles: INITIAL_ROLES,
    assets: [],
    categories: [],
    locations: [],
    classes: [],
    settings: defaultSettings,
    approvals: [],
    movements: [],
    disposals: [],
    maintenance: [],
    auditCampaigns: [],
    auditItems: [],
    activityLogs: [],
    notifications: [],
  };
}

let cachedDb: DatabaseSchema | null = null;
let useSqlite = false;

try {
  if (isSqliteSupported()) {
    useSqlite = true;
    console.log('[Database] SQLite Storage Engine (node:sqlite) aktif.');
  } else {
    console.log('[Database] SQLite tidak didukung di lingkungan ini, menggunakan mesin Atomic JSON.');
  }
} catch (e) {
  console.warn('[Database] Pengecekan SQLite gagal, beralih ke mesin Atomic JSON:', e);
  useSqlite = false;
}

function saveJsonShadow(data: DatabaseSchema): void {
  try {
    const tempFile = path.join(DATA_DIR, `database.tmp.${Date.now()}`);
    const jsonContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(tempFile, jsonContent, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.warn('[Database] Gagal memperbarui berkas bayangan database.json:', err);
  }
}

export function getDatabaseEngineInfo() {
  return {
    engine: useSqlite ? 'sqlite' : 'json',
    engineLabel: useSqlite ? 'SQLite 3 (WAL Mode)' : 'Atomic JSON File',
    primaryFile: useSqlite ? 'data/eam.db' : 'data/database.json',
    writeProtocol: useSqlite ? 'WAL + ACID Transaction' : 'Atomic File Rename (.tmp)',
    walEnabled: useSqlite,
    snapshotDir: 'data/backups/',
  };
}

export function getDatabase(): DatabaseSchema {
  ensureDirectoriesExist();

  // 1. Jika SQLite aktif, prioritaskan pembacaan dari SQLite
  if (useSqlite) {
    try {
      const sqliteData = loadDatabaseFromSqlite();
      if (sqliteData) {
        cachedDb = sqliteData;
        return sqliteData;
      }

      // Auto-migrasi: Jika SQLite masih kosong tetapi database.json ada, salin data ke SQLite
      if (fs.existsSync(DB_FILE)) {
        try {
          const raw = fs.readFileSync(DB_FILE, 'utf-8');
          const parsed = JSON.parse(raw) as DatabaseSchema;
          saveDatabaseToSqlite(parsed);
          console.log('[Database] Auto-migrasi data dari database.json ke SQLite (eam.db) berhasil.');
          cachedDb = parsed;
          return parsed;
        } catch (migErr) {
          console.warn('[Database] Gagal auto-migrasi dari database.json ke SQLite:', migErr);
        }
      }

      // Inisialisasi awal baru jika keduanya belum ada
      const seed = getDefaultSeedData();
      saveDatabaseToSqlite(seed);
      saveJsonShadow(seed);
      cachedDb = seed;
      return seed;
    } catch (sqliteErr) {
      console.warn('[Database] Gagal membaca dari SQLite, fallback ke berkas JSON:', sqliteErr);
    }
  }

  // 2. Fallback Mesin Atomic JSON
  if (!fs.existsSync(DB_FILE)) {
    const seed = getDefaultSeedData();
    saveJsonShadow(seed);
    cachedDb = seed;
    return seed;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    cachedDb = parsed;
    return parsed;
  } catch (error) {
    console.error('Gagal membaca database.json, menggunakan struktur seed default:', error);
    const fallback = getDefaultSeedData();
    saveJsonShadow(fallback);
    cachedDb = fallback;
    return fallback;
  }
}

export function saveDatabase(data: DatabaseSchema): void {
  ensureDirectoriesExist();
  data.lastUpdatedAt = new Date().toISOString();

  // 1. Simpan ke SQLite jika aktif
  if (useSqlite) {
    try {
      saveDatabaseToSqlite(data);
    } catch (sqliteErr) {
      console.warn('[Database] Gagal menyimpan ke SQLite, menggunakan fallback JSON:', sqliteErr);
    }
  }

  // 2. Simpan bayangan atomik ke database.json
  saveJsonShadow(data);

  cachedDb = data;
}

export function updateCollection<K extends keyof DatabaseSchema>(
  key: K,
  value: DatabaseSchema[K]
): void {
  const db = getDatabase();
  db[key] = value;
  saveDatabase(db);
}

export interface BackupMetadata {
  filename: string;
  filePath: string;
  sizeBytes: number;
  createdAt: string;
  tag?: string;
}

export function createLocalBackup(tag?: string): BackupMetadata {
  ensureDirectoriesExist();
  const db = getDatabase();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const tagSuffix = tag ? `-${tag.replace(/[^a-zA-Z0-9_-]/g, '')}` : '';
  const filename = `backup-eam-${timestamp}${tagSuffix}.json`;
  const filePath = path.join(BACKUPS_DIR, filename);

  const jsonContent = JSON.stringify(db, null, 2);
  fs.writeFileSync(filePath, jsonContent, 'utf-8');

  // Jika SQLite aktif, salin juga snapshot binary eam.db sebagai dual backup
  if (useSqlite && fs.existsSync(SQLITE_FILE)) {
    try {
      const sqliteBackupFile = path.join(BACKUPS_DIR, `backup-eam-${timestamp}${tagSuffix}.db`);
      fs.copyFileSync(SQLITE_FILE, sqliteBackupFile);
    } catch (dbCopyErr) {
      console.warn('Gagal menyalin backup binary SQLite:', dbCopyErr);
    }
  }

  const stats = fs.statSync(filePath);

  // Jalankan rotasi dan retensi
  pruneOldBackups();

  return {
    filename,
    filePath,
    sizeBytes: stats.size,
    createdAt: now.toISOString(),
    tag,
  };
}

export function listLocalBackups(): BackupMetadata[] {
  ensureDirectoriesExist();
  const files = fs.readdirSync(BACKUPS_DIR);
  const backups: BackupMetadata[] = [];

  for (const file of files) {
    if (file.endsWith('.json') && file.startsWith('backup-eam-')) {
      const filePath = path.join(BACKUPS_DIR, file);
      try {
        const stats = fs.statSync(filePath);
        backups.push({
          filename: file,
          filePath,
          sizeBytes: stats.size,
          createdAt: stats.mtime.toISOString(),
        });
      } catch (e) {
        // Skip file jika ada error membaca stat
      }
    }
  }

  // Urutkan dari yang terbaru ke terlama
  return backups.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function pruneOldBackups(): void {
  const retention = parseInt(process.env.BACKUP_RETENTION_COUNT || '15', 10);
  const backups = listLocalBackups();

  if (backups.length > retention) {
    const toDelete = backups.slice(retention);
    for (const b of toDelete) {
      try {
        if (fs.existsSync(b.filePath)) {
          fs.unlinkSync(b.filePath);
        }
        // Hapus juga file .db pasangannya jika ada
        const dbPair = b.filePath.replace(/\.json$/, '.db');
        if (fs.existsSync(dbPair)) {
          fs.unlinkSync(dbPair);
        }
      } catch (err) {
        console.warn(`Gagal menghapus cadangan kadaluarsa: ${b.filename}`, err);
      }
    }
  }
}

export function deleteLocalBackup(filename: string): boolean {
  ensureDirectoriesExist();
  const safeFilename = path.basename(filename);
  const targetPath = path.join(BACKUPS_DIR, safeFilename);

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Berkas cadangan ${safeFilename} tidak ditemukan di server.`);
  }

  fs.unlinkSync(targetPath);

  // Hapus juga pasangan .db jika ada
  const dbPair = targetPath.replace(/\.json$/, '.db');
  if (fs.existsSync(dbPair)) {
    try {
      fs.unlinkSync(dbPair);
    } catch (e) {
      // Abaikan jika tidak ada
    }
  }

  return true;
}

export function deleteAllLocalBackups(): { deletedCount: number } {
  ensureDirectoriesExist();
  const backups = listLocalBackups();
  let count = 0;

  for (const b of backups) {
    try {
      if (fs.existsSync(b.filePath)) {
        fs.unlinkSync(b.filePath);
        count++;
      }
      const dbPair = b.filePath.replace(/\.json$/, '.db');
      if (fs.existsSync(dbPair)) {
        fs.unlinkSync(dbPair);
      }
    } catch (err) {
      console.warn(`Gagal menghapus arsip: ${b.filename}`, err);
    }
  }

  return { deletedCount: count };
}

export function restoreBackup(filename: string): boolean {
  ensureDirectoriesExist();
  const safeFilename = path.basename(filename);
  const targetPath = path.join(BACKUPS_DIR, safeFilename);

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Berkas cadangan ${safeFilename} tidak ditemukan di server.`);
  }

  const content = fs.readFileSync(targetPath, 'utf-8');
  const parsed = JSON.parse(content) as DatabaseSchema;

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.assets)) {
    throw new Error('Format berkas cadangan tidak valid atau rusak.');
  }

  // Buat cadangan pengaman dari database saat ini sebelum menimpa
  try {
    createLocalBackup('pre-restore');
  } catch (e) {
    console.warn('Gagal membuat cadangan pre-restore:', e);
  }

  saveDatabase(parsed);
  return true;
}

export function restoreFromRawData(data: Partial<DatabaseSchema>): boolean {
  if (!data || typeof data !== 'object') {
    throw new Error('Data payload tidak valid.');
  }

  const current = getDatabase();
  const merged: DatabaseSchema = {
    ...current,
    ...data,
    lastUpdatedAt: new Date().toISOString(),
  };

  // Buat cadangan pengaman
  try {
    createLocalBackup('pre-restore-upload');
  } catch (e) {
    console.warn('Gagal membuat cadangan pre-restore-upload:', e);
  }

  saveDatabase(merged);
  return true;
}
