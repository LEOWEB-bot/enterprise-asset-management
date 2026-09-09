import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  RefreshCw,
  Upload,
  Download,
  ShieldCheck,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RotateCcw,
  Sparkles,
  Server,
  ArrowRight,
  ShieldAlert,
  Info,
  Trash2,
  Power,
} from 'lucide-react';
import { User } from '../../types';
import { AppLanguage, getI18n } from '../../utils/i18n';
import { ApiService, BackupItem, BackupStatusResponse } from '../../services/apiService';
import { StorageService } from '../../services/storageService';
import { hasPermission } from '../../services/authService';

interface BackupCenterProps {
  currentUser: User;
  language?: AppLanguage;
  onNavigateTab?: (tab: string) => void;
}

export const BackupCenter: React.FC<BackupCenterProps> = ({
  currentUser,
  language,
  onNavigateTab,
}) => {
  const currentLang: AppLanguage = language || currentUser.language || StorageService.getLanguage() || 'en';
  const isEn = currentLang === 'en';
  const t = getI18n(currentLang);

  // RBAC Permission checks
  const canManage = hasPermission(currentUser, 'backup.manage') || hasPermission(currentUser, 'settings.manage');
  const canView = hasPermission(currentUser, 'backup.view') || canManage;

  // States
  const [backupStatus, setBackupStatus] = useState<BackupStatusResponse['status'] | null>(null);
  const [serverBackups, setServerBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [isTogglingScheduler, setIsTogglingScheduler] = useState(false);
  const [isDeletingBackup, setIsDeletingBackup] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // In-App Confirmation Modal State (Reliable across all browsers without window.confirm suppression)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    actionType: 'DELETE_SINGLE' | 'DELETE_ALL' | 'RESTORE';
    targetFilename?: string;
  }>({
    isOpen: false,
    actionType: 'DELETE_SINGLE',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadServerBackupInfo = async () => {
    setLoading(true);
    try {
      const [status, list] = await Promise.all([
        ApiService.getBackupStatus(),
        ApiService.listBackups(),
      ]);
      setBackupStatus(status);
      setServerBackups(list);
    } catch (e) {
      console.warn('Failed to load backup data:', e);
      showToast(isEn ? 'Failed to fetch backup status from server.' : 'Gagal memuat status cadangan dari server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServerBackupInfo();
  }, []);

  // Handle Manual Backup
  const handleCreateServerBackup = async () => {
    if (!canManage) {
      showToast(isEn ? 'Permission denied: backup.manage required.' : 'Akses ditolak: izin backup.manage diperlukan.', 'error');
      return;
    }
    setIsCreatingBackup(true);
    try {
      const res = await ApiService.createBackup('manual');
      if (res.success) {
        showToast(
          isEn
            ? `Backup snapshot created successfully! ${res.cloudResult?.success ? '(Replicated to cloud)' : ''}`
            : `Cadangan snapshot berhasil dibuat! ${res.cloudResult?.success ? '(Tereplikasi ke cloud)' : ''}`
        );
        loadServerBackupInfo();
      } else {
        showToast(res.message || (isEn ? 'Failed to create backup.' : 'Gagal membuat cadangan.'), 'error');
      }
    } catch {
      showToast(isEn ? 'Failed to communicate with backup server.' : 'Gagal menghubungi server pencadangan.', 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Prompt Restore Modal
  const promptRestore = (filename: string) => {
    if (!canManage) {
      showToast(isEn ? 'Permission denied: backup.manage required.' : 'Akses ditolak: izin backup.manage diperlukan.', 'error');
      return;
    }
    setActionModal({
      isOpen: true,
      actionType: 'RESTORE',
      targetFilename: filename,
    });
  };

  // Handle File Upload Restore
  const handleUploadRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canManage) {
      showToast(isEn ? 'Permission denied: backup.manage required.' : 'Akses ditolak: izin backup.manage diperlukan.', 'error');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      isEn
        ? `Restore database from uploaded file "${file.name}"? Active data will be overwritten.`
        : `Pulihkan basis data dari berkas yang diunggah "${file.name}"? Data aktif saat ini akan ditimpa.`
    );
    if (!confirmed) {
      e.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      setIsRestoringBackup(true);
      const res = await ApiService.restoreFromUploadedContent(text);
      if (res.success) {
        showToast(isEn ? 'Database successfully restored from archive!' : 'Basis data berhasil dipulihkan dari arsip unggahan!');
        await StorageService.fetchAndSyncFromServer();
        setTimeout(() => window.location.reload(), 900);
      } else {
        showToast(res.message || (isEn ? 'Upload restore failed.' : 'Pemulihan berkas gagal.'), 'error');
      }
    } catch {
      showToast(isEn ? 'Invalid backup file format.' : 'Format berkas cadangan tidak valid.', 'error');
    } finally {
      setIsRestoringBackup(false);
      e.target.value = '';
    }
  };

  // Handle Manual Toggle of Internal Scheduler
  const handleToggleScheduler = async () => {
    if (!canManage) {
      showToast(isEn ? 'Permission denied: backup.manage required.' : 'Akses ditolak: izin backup.manage diperlukan.', 'error');
      return;
    }
    const currentlyActive = !!backupStatus?.inAppSchedulerActive;
    const targetState = !currentlyActive;
    setIsTogglingScheduler(true);
    try {
      const res = await ApiService.toggleBackupScheduler(targetState);
      if (res.success) {
        setBackupStatus((prev) => prev ? { ...prev, inAppSchedulerActive: targetState } : null);
        showToast(
          targetState
            ? (isEn ? 'Internal scheduler activated successfully.' : 'Penjadwal internal berhasil diaktifkan.')
            : (isEn ? 'Internal scheduler deactivated.' : 'Penjadwal internal berhasil dinonaktifkan.')
        );
        loadServerBackupInfo();
      } else {
        showToast(res.message || (isEn ? 'Failed to update scheduler.' : 'Gagal memperbarui status penjadwal.'), 'error');
      }
    } catch {
      showToast(isEn ? 'Error toggling scheduler.' : 'Terjadi galat saat mengubah status penjadwal.', 'error');
    } finally {
      setIsTogglingScheduler(false);
    }
  };

  // Open Delete Single Modal
  const promptDeleteSingle = (filename: string) => {
    if (!canManage) {
      showToast(isEn ? 'Permission denied: backup.manage required.' : 'Akses ditolak: izin backup.manage diperlukan.', 'error');
      return;
    }
    setActionModal({
      isOpen: true,
      actionType: 'DELETE_SINGLE',
      targetFilename: filename,
    });
  };

  // Open Clear All Modal
  const promptClearAll = () => {
    if (!canManage) {
      showToast(isEn ? 'Permission denied: backup.manage required.' : 'Akses ditolak: izin backup.manage diperlukan.', 'error');
      return;
    }
    if (serverBackups.length === 0) return;
    setActionModal({
      isOpen: true,
      actionType: 'DELETE_ALL',
    });
  };

  // Close Action Modal
  const closeActionModal = () => {
    if (isDeletingBackup !== null || isClearingAll || isRestoringBackup) return;
    setActionModal({ isOpen: false, actionType: 'DELETE_SINGLE' });
  };

  // Execute Confirmed Modal Action
  const handleConfirmAction = async () => {
    if (actionModal.actionType === 'DELETE_SINGLE' && actionModal.targetFilename) {
      const filename = actionModal.targetFilename;
      setIsDeletingBackup(filename);
      try {
        const res = await ApiService.deleteBackup(filename);
        if (res.success) {
          showToast(isEn ? `Snapshot archive "${filename}" deleted.` : `Berkas snapshot "${filename}" berhasil dihapus.`);
          setServerBackups((prev) => prev.filter((b) => b.filename !== filename));
          if (backupStatus) {
            setBackupStatus({
              ...backupStatus,
              totalLocalBackups: Math.max(0, (backupStatus.totalLocalBackups || 1) - 1),
            });
          }
          closeActionModal();
          loadServerBackupInfo();
        } else {
          showToast(res.message || (isEn ? 'Failed to delete snapshot.' : 'Gagal menghapus snapshot.'), 'error');
        }
      } catch {
        showToast(isEn ? 'Error deleting snapshot file.' : 'Terjadi galat saat menghapus berkas snapshot.', 'error');
      } finally {
        setIsDeletingBackup(null);
      }
    } else if (actionModal.actionType === 'DELETE_ALL') {
      setIsClearingAll(true);
      try {
        const res = await ApiService.clearAllBackups();
        if (res.success) {
          showToast(
            isEn
              ? `All ${res.deletedCount ?? serverBackups.length} snapshot archives have been purged from server.`
              : `Seluruh ${res.deletedCount ?? serverBackups.length} berkas arsip snapshot berhasil dibersihkan dari server.`
          );
          setServerBackups([]);
          closeActionModal();
          loadServerBackupInfo();
        } else {
          showToast(res.message || (isEn ? 'Failed to clear archives.' : 'Gagal membersihkan arsip cadangan.'), 'error');
        }
      } catch {
        showToast(isEn ? 'Error clearing snapshots.' : 'Terjadi galat saat membersihkan arsip snapshot.', 'error');
      } finally {
        setIsClearingAll(false);
      }
    } else if (actionModal.actionType === 'RESTORE' && actionModal.targetFilename) {
      const filename = actionModal.targetFilename;
      setIsRestoringBackup(true);
      try {
        const res = await ApiService.restoreBackup(filename);
        if (res.success) {
          showToast(isEn ? 'Database restored successfully! Reloading...' : 'Basis data berhasil dipulihkan! Memuat ulang...');
          await StorageService.fetchAndSyncFromServer();
          closeActionModal();
          setTimeout(() => window.location.reload(), 900);
        } else {
          showToast(res.message || (isEn ? 'Restore failed.' : 'Pemulihan cadangan gagal.'), 'error');
        }
      } catch {
        showToast(isEn ? 'Error while restoring backup.' : 'Terjadi galat saat memulihkan cadangan.', 'error');
      } finally {
        setIsRestoringBackup(false);
      }
    }
  };

  // Format File Size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Access check guard
  if (!canView) {
    return (
      <div className="glass-panel squircle p-8 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
          {isEn ? 'Access Restricted' : 'Akses Dibatasi'}
        </h3>
        <p className="text-xs text-stone-500 leading-relaxed">
          {isEn
            ? 'You do not have permission to view or manage system disaster recovery backups (requires backup.view or backup.manage).'
            : 'Akun Anda tidak memiliki izin untuk melihat atau mengelola cadangan sistem (memerlukan izin backup.view atau backup.manage).'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all ${
            notification.type === 'success'
              ? 'bg-[#5E7A68] text-white shadow-[#5E7A68]/30'
              : 'bg-rose-600 text-white shadow-rose-600/30'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel squircle p-6 sm:p-8 space-y-4 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#5E7A68]/10 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 border border-[#5E7A68]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isEn ? 'ISO 27001 & ISO 55001 Continuity' : 'Standar Kelangsungan ISO 27001 & ISO 55001'}</span>
            </div>
            <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
              {isEn ? 'Backup & Disaster Recovery Center' : 'Pusat Cadangan & Pemulihan Sistem'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              {isEn
                ? 'Automated transactional persistence engine with dual-layer safety: local in-app cron retention on server disk and asynchronous S3-compatible cloud replication.'
                : 'Mesin pencadangan transaksi terpusat dual-layer: penjadwal cron otomatis di server lokal dengan retensi rotasi dan replikasi cloud S3/R2 untuk pemulihan bencana.'}
            </p>
          </div>

          {/* Quick Actions */}
          {canManage && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={loadServerBackupInfo}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                title={isEn ? 'Refresh status' : 'Segarkan status'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{isEn ? 'Refresh' : 'Segarkan'}</span>
              </button>

              <label className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{isRestoringBackup ? (isEn ? 'Restoring...' : 'Memulihkan...') : (isEn ? 'Upload & Restore' : 'Unggah & Pulihkan')}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleUploadRestore}
                  disabled={isRestoringBackup}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleCreateServerBackup}
                disabled={isCreatingBackup}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5E7A68] hover:bg-[#4E6857] text-white text-xs font-bold shadow-md shadow-[#5E7A68]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isCreatingBackup ? 'animate-spin' : ''}`} />
                <span>{isCreatingBackup ? (isEn ? 'Creating...' : 'Memproses...') : (isEn ? 'Create Backup Now' : 'Buat Cadangan Sekarang')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bento Grid: 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Internal Scheduler */}
        <div className="glass-panel squircle p-6 space-y-4 border-l-4 border-l-[#5E7A68] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-[#5E7A68] dark:text-emerald-400">
                <div className="p-2 rounded-xl bg-[#5E7A68]/15">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  {isEn ? 'Internal Scheduler' : 'Penjadwal Internal'}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  backupStatus?.inAppSchedulerActive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    backupStatus?.inAppSchedulerActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                  }`}
                ></span>
                {backupStatus?.inAppSchedulerActive
                  ? (isEn ? 'Active Cron' : 'Aktif Otomatis')
                  : (isEn ? 'Disabled' : 'Dinonaktifkan')}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>{isEn ? 'Execution Cycle:' : 'Siklus Eksekusi:'}</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  {isEn ? `Every ${backupStatus?.intervalHours || 24} hours` : `Setiap ${backupStatus?.intervalHours || 24} jam`}
                </span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>{isEn ? 'Rotation Retention:' : 'Retensi Rotasi:'}</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  {isEn ? `Last ${backupStatus?.retentionCount || 15} files (FIFO)` : `${backupStatus?.retentionCount || 15} berkas terakhir (FIFO)`}
                </span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>{isEn ? 'Local Storage Total:' : 'Total Snapshot Tersimpan:'}</span>
                <span className="font-bold text-[#5E7A68] dark:text-emerald-400">
                  {backupStatus?.totalLocalBackups ?? serverBackups.length} {isEn ? 'archives' : 'berkas'}
                </span>
              </div>
            </div>
          </div>

          {/* Manual Scheduler Toggle Control */}
          {canManage && (
            <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800/80 flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-medium">
                {isEn ? 'Manual Override:' : 'Kontrol Manual:'}
              </span>
              <button
                type="button"
                onClick={handleToggleScheduler}
                disabled={isTogglingScheduler}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                  backupStatus?.inAppSchedulerActive
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50'
                }`}
                title={
                  backupStatus?.inAppSchedulerActive
                    ? (isEn ? 'Deactivate automatic scheduler' : 'Nonaktifkan penjadwal otomatis')
                    : (isEn ? 'Activate automatic scheduler' : 'Aktifkan penjadwal otomatis')
                }
              >
                <Power className="w-3.5 h-3.5" />
                <span>
                  {isTogglingScheduler
                    ? (isEn ? 'Updating...' : 'Memproses...')
                    : backupStatus?.inAppSchedulerActive
                    ? (isEn ? 'Deactivate' : 'Nonaktifkan')
                    : (isEn ? 'Activate' : 'Aktifkan')}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Card 2: Cloud Storage Sync */}
        <div className="glass-panel squircle p-6 space-y-4 border-l-4 border-l-[#7D562D]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-[#7D562D] dark:text-amber-400">
              <div className="p-2 rounded-xl bg-[#7D562D]/15">
                <Cloud className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                {isEn ? 'Cloud Replication' : 'Replikasi Cloud S3/R2'}
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                backupStatus?.cloudConfig?.enabled
                  ? backupStatus.lastCloudStatus === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backupStatus?.cloudConfig?.enabled
                    ? backupStatus.lastCloudStatus === 'SUCCESS'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                    : 'bg-stone-400'
                }`}
              ></span>
              {backupStatus?.cloudConfig?.enabled
                ? isEn ? 'Cloud Synced' : 'Cloud Terhubung'
                : isEn ? 'Disabled (.env)' : 'Nonaktif di .env'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>{isEn ? 'Cloud Provider:' : 'Penyedia Cloud:'}</span>
              <span className="font-bold uppercase text-stone-800 dark:text-stone-200">
                {backupStatus?.cloudConfig?.provider || 'S3 API'}
              </span>
            </div>
            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>{isEn ? 'Target Bucket:' : 'Nama Bucket:'}</span>
              <span className="font-mono text-stone-800 dark:text-stone-200">
                {backupStatus?.cloudConfig?.bucket || '-'}
              </span>
            </div>
            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>{isEn ? 'Last Cloud Sync:' : 'Sync Terakhir:'}</span>
              <span className="text-stone-800 dark:text-stone-200">
                {backupStatus?.lastCloudBackupAt ? backupStatus.lastCloudBackupAt.substring(0, 16) : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Storage Engine & SQLite Safety */}
        <div className="glass-panel squircle p-6 space-y-4 border-l-4 border-l-[#5E7A68]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-stone-700 dark:text-stone-300">
              <div className="p-2 rounded-xl bg-[#5E7A68]/15 text-[#5E7A68] dark:bg-[#5E7A68]/25 dark:text-[#8EAE98]">
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                {backupStatus?.databaseEngine?.engine === 'sqlite'
                  ? (isEn ? 'SQLite Database Engine' : 'Mesin Database SQLite')
                  : (isEn ? 'Storage Safety' : 'Keamanan Penyimpanan')}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#5E7A68]/15 text-[#3E5A48] dark:bg-[#5E7A68]/30 dark:text-[#A8C8B2]">
              {backupStatus?.databaseEngine?.walEnabled
                ? (isEn ? 'SQLite 3 / WAL Active' : 'SQLite 3 / WAL Aktif')
                : (isEn ? 'Crash-Resistant' : 'Tahan Kerusakan')}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>{isEn ? 'Write Protocol:' : 'Protokol Tulis:'}</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">
                {backupStatus?.databaseEngine?.writeProtocol || 'WAL + ACID Transaction'}
              </span>
            </div>
            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>{isEn ? 'Primary DB File:' : 'Berkas DB Utama:'}</span>
              <span className="font-mono text-stone-800 dark:text-stone-200 font-bold">
                {backupStatus?.databaseEngine?.primaryFile || 'data/eam.db'}
              </span>
            </div>
            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>{isEn ? 'Snapshot Directory:' : 'Direktori Snapshot:'}</span>
              <span className="font-mono text-stone-800 dark:text-stone-200">
                {backupStatus?.databaseEngine?.snapshotDir || 'data/backups/'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Setup Guidance Callout (If Cloud is Disabled) */}
      {!backupStatus?.cloudConfig?.enabled && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-stone-900 dark:text-stone-100">
                {isEn ? 'Replicate Backups to Cloud (AWS S3 / Cloudflare R2 / MinIO)' : 'Ingin Mereplikasi Cadangan ke Cloud (AWS S3 / Cloudflare R2 / MinIO)?'}
              </h4>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                {isEn
                  ? 'Set BACKUP_CLOUD_ENABLED=true in your server .env file and specify your S3 bucket credentials for offsite disaster recovery.'
                  : 'Atur BACKUP_CLOUD_ENABLED=true pada berkas .env server dan lengkapi kredensial bucket S3 Anda untuk perlindungan bencana tingkat enterprise.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Backup Archive History Table */}
      <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-4">
          <div>
            <h3 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
              {isEn ? 'Historical Snapshot Archives' : 'Daftar Arsip Snapshot di Server'}
            </h3>
            <p className="text-xs text-stone-500">
              {isEn
                ? 'Download JSON snapshots to your workstation or trigger an instant rollback.'
                : 'Unduh berkas JSON ke komputer lokal Anda atau jalankan pemulihan instan ke kondisi snapshot terpilih.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-stone-500 font-medium">
              {isEn ? `Showing ${serverBackups.length} snapshots` : `Menampilkan ${serverBackups.length} snapshot`}
            </div>
            {canManage && serverBackups.length > 0 && (
              <button
                type="button"
                onClick={promptClearAll}
                disabled={isClearingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                title={isEn ? 'Clear all snapshot archives from server' : 'Bersihkan semua arsip snapshot di server'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isClearingAll ? (isEn ? 'Clearing...' : 'Membersihkan...') : (isEn ? 'Clear All' : 'Hapus Semua')}</span>
              </button>
            )}
          </div>
        </div>

        {serverBackups.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-xs text-stone-500">
              {isEn ? 'No server backup files found. Click "Create Backup Now" to capture the current state.' : 'Belum ada berkas cadangan di server. Klik "Buat Cadangan Sekarang" untuk menyimpan kondisi saat ini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold tracking-wider uppercase text-[10px]">
                  <th className="pb-3 px-3">{isEn ? 'Snapshot File' : 'Nama Berkas Snapshot'}</th>
                  <th className="pb-3 px-3">{isEn ? 'Creation Time' : 'Waktu Pembuatan'}</th>
                  <th className="pb-3 px-3">{isEn ? 'Size' : 'Ukuran'}</th>
                  <th className="pb-3 px-3">{isEn ? 'Trigger Type' : 'Tipe Pemicu'}</th>
                  <th className="pb-3 px-3 text-right">{isEn ? 'Actions' : 'Aksi'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {serverBackups.map((backup) => (
                  <tr key={backup.filename} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-stone-800 dark:text-stone-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-[#5E7A68]" />
                        <span>{backup.filename}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-stone-600 dark:text-stone-400">
                      {backup.createdAt}
                    </td>
                    <td className="py-3 px-3 text-stone-600 dark:text-stone-400 font-mono">
                      {formatBytes(backup.sizeBytes)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          backup.tag === 'scheduled'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {backup.tag === 'scheduled' ? (isEn ? 'Scheduled' : 'Terjadwal') : (isEn ? 'Manual' : 'Manual')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={ApiService.getDownloadUrl(backup.filename)}
                          download={backup.filename}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 font-bold transition-all text-[11px]"
                          title={isEn ? 'Download archive' : 'Unduh arsip'}
                        >
                          <Download className="w-3.5 h-3.5 text-[#5E7A68]" />
                          <span>{isEn ? 'Download' : 'Unduh'}</span>
                        </a>

                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => promptRestore(backup.filename)}
                              disabled={isRestoringBackup}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold transition-all text-[11px] cursor-pointer disabled:opacity-50"
                              title={isEn ? 'Restore database from this snapshot' : 'Pulihkan data dari snapshot ini'}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{isEn ? 'Restore' : 'Pulihkan'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => promptDeleteSingle(backup.filename)}
                              disabled={isDeletingBackup === backup.filename}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold transition-all text-[11px] cursor-pointer disabled:opacity-50"
                              title={isEn ? 'Delete snapshot archive from server' : 'Hapus berkas arsip snapshot dari server'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isDeletingBackup === backup.filename ? (isEn ? 'Deleting...' : 'Menghapus...') : (isEn ? 'Delete' : 'Hapus')}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Confirmation Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
          <div className="glass-panel squircle bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  actionModal.actionType === 'RESTORE'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                }`}
              >
                {actionModal.actionType === 'RESTORE' ? (
                  <RotateCcw className="w-6 h-6" />
                ) : (
                  <Trash2 className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <h3 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                  {actionModal.actionType === 'DELETE_SINGLE' && (isEn ? 'Delete Snapshot Archive' : 'Hapus Berkas Snapshot')}
                  {actionModal.actionType === 'DELETE_ALL' && (isEn ? 'Clear All Snapshot Archives' : 'Hapus Semua Arsip Snapshot')}
                  {actionModal.actionType === 'RESTORE' && (isEn ? 'Restore Database' : 'Pulihkan Basis Data')}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {actionModal.actionType === 'DELETE_SINGLE' && (
                    isEn
                      ? `Are you sure you want to permanently delete snapshot file "${actionModal.targetFilename}" from the server? This action cannot be undone.`
                      : `Apakah Anda yakin ingin menghapus berkas snapshot "${actionModal.targetFilename}" secara permanen dari server? Tindakan ini tidak dapat dibatalkan.`
                  )}
                  {actionModal.actionType === 'DELETE_ALL' && (
                    isEn
                      ? `CAUTION: Are you sure you want to delete ALL ${serverBackups.length} snapshot archives on the server? Server storage will be completely cleared.`
                      : `PERHATIAN: Apakah Anda yakin ingin menghapus SEMUA ${serverBackups.length} berkas arsip snapshot di server? Penyimpanan server akan dibersihkan sepenuhnya.`
                  )}
                  {actionModal.actionType === 'RESTORE' && (
                    isEn
                      ? `Are you sure you want to restore the database from "${actionModal.targetFilename}"? All current transactional data will be replaced by this snapshot.`
                      : `Apakah Anda yakin ingin memulihkan basis data dari "${actionModal.targetFilename}"? Seluruh data transaksi aktif saat ini akan digantikan oleh status snapshot ini.`
                  )}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeActionModal}
                disabled={isDeletingBackup !== null || isClearingAll || isRestoringBackup}
                className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isDeletingBackup !== null || isClearingAll || isRestoringBackup}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                  actionModal.actionType === 'RESTORE'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                }`}
              >
                {(isDeletingBackup || isClearingAll || isRestoringBackup) && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {actionModal.actionType === 'DELETE_SINGLE' && (isDeletingBackup ? (isEn ? 'Deleting...' : 'Menghapus...') : (isEn ? 'Delete Archive' : 'Ya, Hapus Berkas'))}
                  {actionModal.actionType === 'DELETE_ALL' && (isClearingAll ? (isEn ? 'Purging...' : 'Membersihkan...') : (isEn ? 'Purge All Files' : 'Ya, Hapus Semua'))}
                  {actionModal.actionType === 'RESTORE' && (isRestoringBackup ? (isEn ? 'Restoring...' : 'Memulihkan...') : (isEn ? 'Restore Database' : 'Ya, Pulihkan Data'))}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
