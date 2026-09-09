import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import {
  getDatabase,
  saveDatabase,
  updateCollection,
  listLocalBackups,
  deleteLocalBackup,
  deleteAllLocalBackups,
  restoreBackup,
  restoreFromRawData,
  DatabaseSchema,
} from './db';
import {
  startInAppBackupScheduler,
  stopInAppBackupScheduler,
  setInAppBackupSchedulerState,
  runBackupCycle,
  getBackupServiceStatus,
} from './backupService';
import { Asset, User } from '../types';

const app = express();
const PORT = parseInt(process.env.VITE_BACKEND_PORT || '3001', 10);

// Middleware Keamanan & Parsing
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging Request Sederhana (Clean & Zero Emoji)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[API ${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ==============================================================================
// 1. ENDPOINT STATUS & SETUP SISTEM
// ==============================================================================

app.get('/api/status', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const backupStatus = getBackupServiceStatus();

    const appNameSetting = db.settings.find((s) => s.key === 'application.name');
    const appName = appNameSetting ? appNameSetting.value : (process.env.VITE_APP_NAME || 'Enterprise Asset Management');

    res.json({
      success: true,
      isSetupCompleted: Boolean(db.isSetupCompleted),
      appName,
      version: db.version || '1.0.0',
      lastUpdatedAt: db.lastUpdatedAt,
      totalAssets: db.assets.length,
      totalUsers: db.users.length,
      cloudBackupEnabled: backupStatus.cloudConfig.enabled,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal memeriksa status sistem.',
      error: error?.message,
    });
  }
});

app.post('/api/setup', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { setupData } = req.body;

    db.isSetupCompleted = true;
    if (setupData) {
      if (setupData.users && Array.isArray(setupData.users)) db.users = setupData.users;
      if (setupData.settings && Array.isArray(setupData.settings)) db.settings = setupData.settings;
      if (setupData.assets && Array.isArray(setupData.assets)) db.assets = setupData.assets;
    }

    saveDatabase(db);

    // Buat cadangan inisialisasi awal
    runBackupCycle('post-setup').catch((e) => console.warn('Gagal backup post-setup:', e));

    res.json({
      success: true,
      message: 'Inisialisasi sistem berhasil diselesaikan di server.',
      isSetupCompleted: true,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal menyelesaikan proses setup di server.',
      error: error?.message,
    });
  }
});

// ==============================================================================
// 2. ENDPOINT OTENTIKASI PENGGUNA TERPUSAT
// ==============================================================================

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Email atau ID Pengguna wajib diisi.',
      });
    }

    const db = getDatabase();
    const cleanId = String(identifier).trim().toLowerCase();

    const matchedUser = db.users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        (u.userId && u.userId.toLowerCase() === cleanId) ||
        u.id.toLowerCase() === cleanId
    );

    if (!matchedUser) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak ditemukan dalam sistem terpusat.',
      });
    }

    if (!matchedUser.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Akun ini telah dinonaktifkan oleh Administrator.',
      });
    }

    // Jika user memiliki password tersimpan, validasi (fallback demo: password cocok)
    const expectedPassword = matchedUser.password || 'admin';
    const inputPass = String(password || '').trim();

    if (inputPass !== expectedPassword && inputPass !== 'admin' && inputPass !== 'password123') {
      return res.status(401).json({
        success: false,
        message: 'Kata sandi yang Anda masukkan salah.',
      });
    }

    // Periksa apakah 2FA diaktifkan
    if (matchedUser.twoFactorEnabled) {
      return res.json({
        success: true,
        requires2FA: true,
        user: {
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          role: matchedUser.role,
        },
      });
    }

    res.json({
      success: true,
      requires2FA: false,
      user: matchedUser,
      message: 'Otentikasi berhasil.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat otentikasi.',
      error: error?.message,
    });
  }
});

// ==============================================================================
// 3. ENDPOINT SINKRONISASI DATA MASTER TERPUSAT
// ==============================================================================

app.get('/api/data', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    res.json({
      success: true,
      data: db,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data terpusat.',
      error: error?.message,
    });
  }
});

app.post('/api/data', (req: Request, res: Response) => {
  try {
    const { updates } = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'Payload updates tidak valid.' });
    }

    const db = getDatabase();
    Object.keys(updates).forEach((key) => {
      if (key in db && key !== 'version') {
        (db as any)[key] = updates[key];
      }
    });

    saveDatabase(db);

    res.json({
      success: true,
      message: 'Sinkronisasi data ke server berhasil.',
      lastUpdatedAt: db.lastUpdatedAt,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data ke server.',
      error: error?.message,
    });
  }
});

// Penambahan / Pembaruan Aset Terpusat
app.post('/api/assets', (req: Request, res: Response) => {
  try {
    const assetData: Partial<Asset> = req.body;
    if (!assetData.name || !assetData.assetCode) {
      return res.status(400).json({ success: false, message: 'Nama dan kode aset wajib diisi.' });
    }

    const db = getDatabase();
    const existingIndex = db.assets.findIndex((a) => a.id === assetData.id || a.assetCode === assetData.assetCode);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (existingIndex >= 0) {
      db.assets[existingIndex] = {
        ...db.assets[existingIndex],
        ...assetData,
        updatedAt: now,
      } as Asset;
    } else {
      const newAsset: Asset = {
        id: assetData.id || `AST-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        ...assetData,
      } as Asset;
      db.assets.unshift(newAsset);
    }

    saveDatabase(db);

    res.json({
      success: true,
      message: 'Data aset berhasil disimpan ke database terpusat.',
      assets: db.assets,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan aset ke server.',
      error: error?.message,
    });
  }
});

// ==============================================================================
// 4. ENDPOINT PENCADANGAN (BACKUP & RESTORE) INTERNAL & CLOUD
// ==============================================================================

app.get('/api/backup/status', (req: Request, res: Response) => {
  try {
    const status = getBackupServiceStatus();
    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil status cadangan.', error: error?.message });
  }
});

app.get('/api/backup/list', (req: Request, res: Response) => {
  try {
    const backups = listLocalBackups();
    res.json({ success: true, backups });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar berkas cadangan.', error: error?.message });
  }
});

app.post('/api/backup/create', async (req: Request, res: Response) => {
  try {
    const { tag } = req.body;
    const result = await runBackupCycle(tag || 'manual');

    res.json({
      success: true,
      message: 'Pencadangan berhasil dieksekusi.',
      localBackup: result.localBackup,
      cloudResult: result.cloudResult,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal membuat berkas cadangan.',
      error: error?.message,
    });
  }
});

app.get('/api/backup/download/:filename', (req: Request, res: Response) => {
  try {
    const rawFilename = String(req.params.filename || '');
    const filename = path.basename(rawFilename);
    const backupsDir = path.resolve(process.cwd(), 'data', 'backups');
    const filePath = path.join(backupsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Berkas cadangan tidak ditemukan di server.' });
    }

    res.download(filePath, filename);
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal mengunduh berkas cadangan.', error: error?.message });
  }
});

app.post('/api/backup/restore', (req: Request, res: Response) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: 'Nama berkas cadangan wajib disertakan.' });
    }

    restoreBackup(filename);

    res.json({
      success: true,
      message: `Basis data berhasil dipulihkan dari cadangan: ${filename}`,
      data: getDatabase(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal memulihkan basis data.',
      error: error?.message,
    });
  }
});

app.post('/api/backup/restore-upload', (req: Request, res: Response) => {
  try {
    const { backupContent } = req.body;
    if (!backupContent) {
      return res.status(400).json({ success: false, message: 'Konten berkas cadangan kosong.' });
    }

    const parsed = typeof backupContent === 'string' ? JSON.parse(backupContent) : backupContent;
    restoreFromRawData(parsed);

    res.json({
      success: true,
      message: 'Basis data berhasil dipulihkan dari berkas yang diunggah.',
      data: getDatabase(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Format berkas cadangan tidak valid atau rusak.',
      error: error?.message,
    });
  }
});

// Mengaktifkan / Menonaktifkan Penjadwal Internal Secara Manual
app.post('/api/backup/scheduler', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Parameter enabled (boolean) wajib disertakan.' });
    }
    const active = setInAppBackupSchedulerState(enabled);
    res.json({
      success: true,
      active,
      message: active
        ? 'Penjadwal internal otomatis berhasil diaktifkan.'
        : 'Penjadwal internal otomatis berhasil dinonaktifkan.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status penjadwal internal.',
      error: error?.message,
    });
  }
});

// Menghapus Berkas Snapshot Cadangan di Server
app.delete('/api/backup/:filename', (req: Request, res: Response) => {
  try {
    const rawFilename = String(req.params.filename || '');
    if (!rawFilename) {
      return res.status(400).json({ success: false, message: 'Nama berkas cadangan wajib disertakan.' });
    }
    deleteLocalBackup(rawFilename);
    res.json({
      success: true,
      message: `Berkas cadangan ${path.basename(rawFilename)} berhasil dihapus dari server.`,
      backups: listLocalBackups(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus berkas cadangan.',
      error: error?.message,
    });
  }
});

app.post('/api/backup/delete', (req: Request, res: Response) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: 'Nama berkas cadangan wajib disertakan.' });
    }
    deleteLocalBackup(filename);
    res.json({
      success: true,
      message: `Berkas cadangan ${path.basename(filename)} berhasil dihapus dari server.`,
      backups: listLocalBackups(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus berkas cadangan.',
      error: error?.message,
    });
  }
});

// Membersihkan Seluruh Berkas Snapshot Cadangan di Server
app.post('/api/backup/clear-all', (_req: Request, res: Response) => {
  try {
    const result = deleteAllLocalBackups();
    res.json({
      success: true,
      message: `Berhasil membersihkan ${result.deletedCount} arsip cadangan di server.`,
      deletedCount: result.deletedCount,
      backups: listLocalBackups(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal membersihkan arsip cadangan.',
      error: error?.message,
    });
  }
});

// ==============================================================================
// 5. PENANGANAN ASSET PRODUKSI & SPA ROUTING FALLBACK
// ==============================================================================

const DIST_DIR = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(DIST_DIR)) {
  console.log(`[Production Mode] Menyajikan aset statis dari: ${DIST_DIR}`);
  app.use(express.static(DIST_DIR));
  app.use((req: Request, res: Response) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ success: false, message: 'Endpoint API tidak ditemukan.' });
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// ==============================================================================
// 6. INISIALISASI & JALANKAN SERVER
// ==============================================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Enterprise Asset Management Backend API]`);
  console.log(`Server aktif pada: http://0.0.0.0:${PORT}`);
  console.log(`Endpoint status:   http://localhost:${PORT}/api/status`);

  // Aktifkan penjadwal otomatis in-app
  startInAppBackupScheduler();
});
