import { Asset, User } from '../types';

export interface SystemStatusResponse {
  success: boolean;
  isSetupCompleted: boolean;
  appName: string;
  version: string;
  lastUpdatedAt: string;
  totalAssets: number;
  totalUsers: number;
  cloudBackupEnabled: boolean;
}

export interface AuthLoginResponse {
  success: boolean;
  requires2FA?: boolean;
  user?: User;
  message?: string;
}

export interface BackupItem {
  filename: string;
  filePath: string;
  sizeBytes: number;
  createdAt: string;
  tag?: string;
}

export interface BackupStatusResponse {
  success: boolean;
  status: {
    inAppSchedulerActive: boolean;
    intervalHours: number;
    retentionCount: number;
    totalLocalBackups: number;
    lastLocalBackupAt: string | null;
    lastCloudBackupAt: string | null;
    lastCloudStatus: string;
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
  };
}

const API_BASE = '/api';

export const ApiService = {
  /**
   * Cek status kesiapan sistem terpusat di server
   */
  async getSystemStatus(): Promise<SystemStatusResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/status`, {
        method: 'GET',
        headers: { credentials: 'omit' },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('Backend API /api/status tidak dapat dijangkau:', e);
      return null;
    }
  },

  /**
   * Otentikasi login pengguna ke database server
   */
  async login(identifier: string, password?: string): Promise<AuthLoginResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      return await res.json();
    } catch (e: any) {
      return {
        success: false,
        message: 'Koneksi ke server terputus. Pastikan server backend berjalan.',
      };
    }
  },

  /**
   * Ambil seluruh data master terpusat dari server
   */
  async getCentralizedData(): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE}/data`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.warn('Gagal mengambil data dari /api/data:', e);
      return null;
    }
  },

  /**
   * Sinkronisasikan pembaruan data lokal ke server
   */
  async syncCentralizedData(updates: Record<string, any>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      return res.ok;
    } catch (e) {
      console.warn('Gagal sinkronisasi data ke server:', e);
      return false;
    }
  },

  /**
   * Simpan / Perbarui aset secara terpusat di server
   */
  async saveAsset(assetData: Partial<Asset>): Promise<Asset[] | null> {
    try {
      const res = await fetch(`${API_BASE}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetData),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.assets || null;
    } catch (e) {
      console.warn('Gagal menyimpan aset ke /api/assets:', e);
      return null;
    }
  },

  /**
   * Mengambil status mesin pencadangan internal dan cloud
   */
  async getBackupStatus(): Promise<BackupStatusResponse['status'] | null> {
    try {
      const res = await fetch(`${API_BASE}/backup/status`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.status || null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Mengambil daftar berkas cadangan lokal di server
   */
  async listBackups(): Promise<BackupItem[]> {
    try {
      const res = await fetch(`${API_BASE}/backup/list`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.backups || [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Memicu pembuatan cadangan baru secara manual
   */
  async createBackup(tag: string = 'manual'): Promise<{
    success: boolean;
    message: string;
    cloudResult?: { success: boolean; message: string };
  }> {
    try {
      const res = await fetch(`${API_BASE}/backup/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e?.message || 'Gagal menghubungi server backup.' };
    }
  },

  /**
   * Dapatkan URL unduh berkas cadangan ke komputer lokal
   */
  getDownloadUrl(filename: string): string {
    return `${API_BASE}/backup/download/${encodeURIComponent(filename)}`;
  },

  /**
   * Pulihkan basis data dari berkas cadangan di server
   */
  async restoreBackup(filename: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const res = await fetch(`${API_BASE}/backup/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e?.message || 'Gagal memulihkan cadangan.' };
    }
  },

  /**
   * Pulihkan basis data dari berkas cadangan yang diunggah dari komputer admin
   */
  async restoreFromUploadedContent(content: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const res = await fetch(`${API_BASE}/backup/restore-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupContent: content }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e?.message || 'Gagal memulihkan data dari berkas unggahan.' };
    }
  },

  /**
   * Mengaktifkan atau menonaktifkan Penjadwal Otomatis Internal secara manual
   */
  async toggleBackupScheduler(enabled: boolean): Promise<{ success: boolean; active?: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/backup/scheduler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e?.message || 'Gagal mengubah status penjadwal internal.' };
    }
  },

  /**
   * Menghapus berkas snapshot arsip cadangan dari server
   */
  async deleteBackup(filename: string): Promise<{ success: boolean; message: string; backups?: BackupItem[] }> {
    try {
      const res = await fetch(`${API_BASE}/backup/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e?.message || 'Gagal menghapus berkas cadangan di server.' };
    }
  },

  /**
   * Membersihkan seluruh arsip cadangan snapshot di server
   */
  async clearAllBackups(): Promise<{ success: boolean; message: string; deletedCount?: number; backups?: BackupItem[] }> {
    try {
      const res = await fetch(`${API_BASE}/backup/clear-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e?.message || 'Gagal membersihkan seluruh arsip cadangan di server.' };
    }
  },
};
