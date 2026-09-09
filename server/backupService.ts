import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createLocalBackup, listLocalBackups, BackupMetadata, getDatabase, getDatabaseEngineInfo } from './db';

export interface CloudBackupConfig {
  enabled: boolean;
  provider: string;
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  region: string;
}

export interface BackupServiceStatus {
  inAppSchedulerActive: boolean;
  intervalHours: number;
  retentionCount: number;
  totalLocalBackups: number;
  lastLocalBackupAt: string | null;
  lastCloudBackupAt: string | null;
  lastCloudStatus: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'DISABLED';
  lastCloudMessage: string;
  cloudConfig: {
    enabled: boolean;
    provider: string;
    endpoint: string;
    bucket: string;
    region: string;
  };
  databaseEngine?: {
    engine: string;
    engineLabel: string;
    primaryFile: string;
    writeProtocol: string;
    walEnabled: boolean;
    snapshotDir: string;
  };
}

let lastCloudBackupAt: string | null = null;
let lastCloudStatus: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'DISABLED' = 'DISABLED';
let lastCloudMessage: string = 'Pencadangan cloud belum diaktifkan dalam konfigurasi .env.';
let schedulerTimer: NodeJS.Timeout | null = null;

export function getCloudConfig(): CloudBackupConfig {
  return {
    enabled: process.env.BACKUP_CLOUD_ENABLED === 'true',
    provider: process.env.BACKUP_CLOUD_PROVIDER || 's3',
    endpoint: process.env.BACKUP_CLOUD_ENDPOINT || '',
    bucket: process.env.BACKUP_CLOUD_BUCKET || '',
    accessKey: process.env.BACKUP_CLOUD_ACCESS_KEY || process.env.BACKUP_CLOUD_ACCESS_KEY_ID || '',
    secretKey: process.env.BACKUP_CLOUD_SECRET_KEY || process.env.BACKUP_CLOUD_SECRET_ACCESS_KEY || '',
    region: process.env.BACKUP_CLOUD_REGION || 'auto',
  };
}

/**
 * Upload berkas cadangan ke Cloud Storage yang kompatibel dengan S3 API
 * (Mendukung AWS S3, Cloudflare R2, MinIO, Wasabi, Google Cloud Storage S3 API)
 */
export async function uploadToCloudStorage(
  backup: BackupMetadata
): Promise<{ success: boolean; message: string }> {
  const config = getCloudConfig();

  if (!config.enabled) {
    lastCloudStatus = 'DISABLED';
    lastCloudMessage = 'Pencadangan cloud dinonaktifkan.';
    return { success: false, message: lastCloudMessage };
  }

  if (!config.endpoint || !config.bucket || !config.accessKey || !config.secretKey) {
    lastCloudStatus = 'SKIPPED';
    lastCloudMessage = 'Parameter kredensial cloud storage (endpoint, bucket, access key) belum lengkap di .env.';
    return { success: false, message: lastCloudMessage };
  }

  try {
    const fileContent = fs.readFileSync(backup.filePath);
    const contentSha256 = crypto.createHash('sha256').update(fileContent).digest('hex');

    // Buat URL endpoint S3
    const cleanEndpoint = config.endpoint.replace(/\/$/, '');
    const targetUrl = `${cleanEndpoint}/${config.bucket}/${backup.filename}`;

    const dateIso = new Date().toISOString();
    const dateStamp = dateIso.substring(0, 10).replace(/-/g, '');
    const amzDate = dateIso.replace(/[:-]|\.\d{3}/g, '');

    // Signature S3 AWS V4 dasar untuk otentikasi REST API
    const method = 'PUT';
    const parsedUrl = new URL(targetUrl);
    const canonicalUri = parsedUrl.pathname;
    const canonicalQuerystring = '';
    const host = parsedUrl.host;

    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${contentSha256}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const payloadHash = contentSha256;

    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;

    const getSignatureKey = (key: string, date: string, region: string, service: string) => {
      const kDate = crypto.createHmac('sha256', `AWS4${key}`).update(date).digest();
      const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
      const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
      return crypto.createHmac('sha256', kService).update('aws4_request').digest();
    };

    const signingKey = getSignatureKey(config.secretKey, dateStamp, config.region, 's3');
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    const authorizationHeader = `${algorithm} Credential=${config.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Host': host,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': contentSha256,
        'Authorization': authorizationHeader,
        'Content-Type': 'application/json',
      },
      body: fileContent,
    });

    if (response.ok) {
      lastCloudBackupAt = new Date().toISOString();
      lastCloudStatus = 'SUCCESS';
      lastCloudMessage = `Berhasil mengunggah ${backup.filename} ke bucket ${config.bucket}.`;
      return { success: true, message: lastCloudMessage };
    } else {
      const errorText = await response.text();
      lastCloudStatus = 'FAILED';
      lastCloudMessage = `Cloud server merespons kode ${response.status}: ${errorText.substring(0, 150)}`;
      return { success: false, message: lastCloudMessage };
    }
  } catch (err: any) {
    lastCloudStatus = 'FAILED';
    lastCloudMessage = `Gagal mengunggah ke cloud: ${err?.message || String(err)}`;
    return { success: false, message: lastCloudMessage };
  }
}

/**
 * Eksekusi siklus pencadangan: Lokal + Cloud (jika aktif)
 */
export async function runBackupCycle(tag: string = 'scheduled'): Promise<{
  localBackup: BackupMetadata;
  cloudResult?: { success: boolean; message: string };
}> {
  // 1. Buat cadangan lokal
  const local = createLocalBackup(tag);

  // 2. Jika konfigurasi cloud aktif, kirim ke cloud
  let cloudRes: { success: boolean; message: string } | undefined;
  const config = getCloudConfig();
  if (config.enabled) {
    cloudRes = await uploadToCloudStorage(local);
  }

  return {
    localBackup: local,
    cloudResult: cloudRes,
  };
}

/**
 * Inisialisasi Penjadwal Otomatis Internal (In-App Scheduler)
 */
export function startInAppBackupScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  const intervalHours = parseInt(process.env.BACKUP_INTERVAL_HOURS || '24', 10);
  const intervalMs = Math.max(1, intervalHours) * 60 * 60 * 1000;

  console.log(`[Backup Engine] Penjadwal otomatis aktif. Siklus interval: setiap ${intervalHours} jam.`);

  // Buat satu cadangan awal saat server pertama kali menyala jika belum ada cadangan
  const existing = listLocalBackups();
  if (existing.length === 0) {
    console.log('[Backup Engine] Belum ada cadangan lokal ditemukan. Membuat cadangan inisialisasi awal...');
    try {
      runBackupCycle('init').catch((e) => console.warn('[Backup Engine] Gagal inisialisasi awal:', e));
    } catch (e) {
      console.warn('[Backup Engine] Error cadangan inisialisasi:', e);
    }
  }

  schedulerTimer = setInterval(() => {
    console.log('[Backup Engine] Menjalankan siklus pencadangan otomatis internal...');
    runBackupCycle('auto').catch((err) => {
      console.error('[Backup Engine] Gagal menjalankan siklus cadangan otomatis:', err);
    });
  }, intervalMs);
}

/**
 * Menghentikan Penjadwal Otomatis Internal secara manual
 */
export function stopInAppBackupScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log('[Backup Engine] Penjadwal otomatis dinonaktifkan secara manual.');
  }
}

/**
 * Mengaktifkan atau menonaktifkan Penjadwal Otomatis Internal sesuai status yang diminta
 */
export function setInAppBackupSchedulerState(enable: boolean): boolean {
  if (enable) {
    startInAppBackupScheduler();
  } else {
    stopInAppBackupScheduler();
  }
  return schedulerTimer !== null;
}

export function getBackupServiceStatus(): BackupServiceStatus {
  const localList = listLocalBackups();
  const config = getCloudConfig();
  const intervalHours = parseInt(process.env.BACKUP_INTERVAL_HOURS || '24', 10);
  const retentionCount = parseInt(process.env.BACKUP_RETENTION_COUNT || '15', 10);

  return {
    inAppSchedulerActive: schedulerTimer !== null,
    intervalHours,
    retentionCount,
    totalLocalBackups: localList.length,
    lastLocalBackupAt: localList.length > 0 ? localList[0].createdAt : null,
    lastCloudBackupAt,
    lastCloudStatus,
    lastCloudMessage,
    cloudConfig: {
      enabled: config.enabled,
      provider: config.provider,
      endpoint: config.endpoint,
      bucket: config.bucket,
      region: config.region,
    },
    databaseEngine: getDatabaseEngineInfo(),
  };
}
