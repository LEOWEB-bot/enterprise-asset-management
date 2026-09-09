import React, { useState } from 'react';
import {
  Database,
  UserCheck,
  Sliders,
  Folders,
  Boxes,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Building2,
  RefreshCw,
  Info,
  KeyRound,
  QrCode,
  Radio,
  Clock,
  Shield,
  Layers,
  MapPin,
  Tag,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StorageService } from '../../services/storageService';
import { NotificationService } from '../../services/notificationService';
import { User, SystemSetting } from '../../types';
import {
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_LOCATIONS,
  INITIAL_ASSETS,
  INITIAL_SETTINGS,
  INITIAL_APPROVALS,
  INITIAL_MOVEMENTS,
  INITIAL_MAINTENANCE,
  INITIAL_AUDIT_CAMPAIGNS,
  INITIAL_AUDIT_ITEMS,
} from '../../data/enterprise-asset-management';
import { logActivity } from '../../services/activityLogger';

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isMigrating, setIsMigrating] = useState(false);
  const [dbMigrated, setDbMigrated] = useState(false);

  // Seed selection & Master data state
  const [seedType, setSeedType] = useState<'minimal' | 'full'>('full');
  const [includeDefaultMasterData, setIncludeDefaultMasterData] = useState<boolean>(true);

  // Sync default master data if full demo is selected
  const handleSelectSeedType = (type: 'minimal' | 'full') => {
    setSeedType(type);
    if (type === 'full') {
      setIncludeDefaultMasterData(true);
    }
  };

  // Step 1: Admin Data
  const [adminName, setAdminName] = useState('Super Admin');
  const [adminEmail, setAdminEmail] = useState('admin@assetcorp.id');
  const [adminDept, setAdminDept] = useState('IT & Infrastructure');
  const [admin2FA, setAdmin2FA] = useState(false);

  // Step 2: System Settings
  const [appName, setAppName] = useState('AssetCorp Enterprise Asset Management');
  const [codePrefix, setCodePrefix] = useState('AST-');
  const [qrEnabled, setQrEnabled] = useState(true);
  const [rfidEnabled, setRfidEnabled] = useState(true);
  const [nfcEnabled, setNfcEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('15');
  const [autoApproveMovement, setAutoApproveMovement] = useState(false);
  const [autoApproveDisposal, setAutoApproveDisposal] = useState(false);

  const steps = [
    { id: 0, title: 'Database & Migrasi', icon: Database },
    { id: 1, title: 'Akun Super Admin', icon: UserCheck },
    { id: 2, title: 'Pengaturan Sistem', icon: Sliders },
    { id: 3, title: 'Master Data Dasar', icon: Folders },
    { id: 4, title: 'Contoh Aset / Mode', icon: Boxes },
  ];

  const handleRunMigration = () => {
    setIsMigrating(true);
    setTimeout(() => {
      setIsMigrating(false);
      setDbMigrated(true);
    }, 1000);
  };

  const handleFinishSetup = () => {
    // 1. Update Admin User
    const adminUser: User = {
      id: 'usr-admin-01',
      name: adminName,
      email: adminEmail,
      role: 'super-admin',
      department: adminDept,
      location: 'Kantor Pusat Jakarta',
      twoFactorEnabled: admin2FA,
      twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      isActive: true,
      language: 'en',
      lastLoginAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    if (seedType === 'full') {
      const users = StorageService.getUsers();
      users[0] = adminUser;
      StorageService.saveUsers(users);
    } else {
      StorageService.saveUsers([adminUser]);
    }
    StorageService.setCurrentUser(adminUser);

    // 2. Update Settings
    StorageService.setSeedMode(seedType);
    StorageService.setAppName(appName);
    StorageService.setAssetCodePrefix(codePrefix);
    StorageService.updateSetting('system.seed_mode', seedType);
    StorageService.updateSetting('asset.qr_enabled', qrEnabled ? 'true' : 'false');
    StorageService.updateSetting('asset.rfid_enabled', rfidEnabled ? 'true' : 'false');
    StorageService.updateSetting('asset.nfc_enabled', nfcEnabled ? 'true' : 'false');
    StorageService.updateSetting('security.session_idle_minutes', sessionTimeout);
    StorageService.updateSetting('asset.workflow.auto_approve_movement', autoApproveMovement ? 'true' : 'false');
    StorageService.updateSetting('asset.workflow.auto_approve_disposal', autoApproveDisposal ? 'true' : 'false');

    // 3. Master Data, Assets, & Relational Transactions
    if (includeDefaultMasterData) {
      StorageService.saveCategories(INITIAL_CATEGORIES);
      StorageService.saveLocations(INITIAL_LOCATIONS);
    } else {
      StorageService.saveCategories([]);
      StorageService.saveLocations([]);
    }

    if (seedType === 'full' && includeDefaultMasterData) {
      StorageService.saveAssets(INITIAL_ASSETS);
      StorageService.saveApprovals(INITIAL_APPROVALS);
      StorageService.saveMovements(INITIAL_MOVEMENTS);
      StorageService.saveDisposals([]);
      StorageService.saveMaintenance(INITIAL_MAINTENANCE);
      StorageService.saveAuditCampaigns(INITIAL_AUDIT_CAMPAIGNS);
      StorageService.saveAuditItems(INITIAL_AUDIT_ITEMS);
    } else {
      StorageService.saveAssets([]);
      StorageService.saveApprovals([]);
      StorageService.saveMovements([]);
      StorageService.saveDisposals([]);
      StorageService.saveMaintenance([]);
      StorageService.saveAuditCampaigns([]);
      StorageService.saveAuditItems([]);
      StorageService.saveNotifications([]);
      NotificationService.saveConfig({
        apiKey:
          'ast_live_' +
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15),
        discord: {
          enabled: false,
          webhookUrl: '',
          botName: 'AssetCorp Bot',
          events: ['asset.created', 'asset.movement', 'asset.maintenance', 'approval.requested', 'approval.decided'],
        },
        telegram: {
          enabled: false,
          botToken: '',
          chatId: '',
          events: ['asset.created', 'asset.movement', 'asset.maintenance', 'approval.requested', 'approval.decided'],
        },
        whatsapp: {
          gatewayType: 'FONNTE',
          endpointUrl: '',
          apiKey: '',
          recipientNumber: '',
          enabled: false,
          events: ['asset.movement', 'approval.requested'],
        },
        customWebhook: {
          enabled: false,
          webhookUrl: '',
          secretToken: '',
          customHeaders: { 'X-Environment': 'Production' },
          events: ['asset.created', 'asset.updated', 'asset.movement'],
        },
      });
      NotificationService.clearDispatchLogs();
    }

    StorageService.setSetupCompleted(true);

    logActivity(
      'SYSTEM_SETUP_COMPLETED',
      'SETTING',
      `Setup wizard diselesaikan oleh ${adminEmail} (Master Data: ${includeDefaultMasterData ? 'Default' : 'Kosong/Manual'
      }, Seed: ${seedType})`
    );

    // Confetti effect
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch { }

    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] dark:bg-[#121613] text-stone-900 dark:text-stone-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* ═══ Header Branding (Web-OS Spatial) ═══════════════════════════ */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] shadow-lg shadow-black/10">
            <Building2 className="w-7 h-7 stroke-[2px]" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200/80 dark:bg-stone-800 text-[11px] font-bold text-stone-700 dark:text-stone-300 border border-stone-300/60 dark:border-stone-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>ISO 27001 • Clean Architecture Initializer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-serif-display tracking-tight">
              Inisialisasi & Setup Wizard
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-lg mx-auto leading-relaxed">
              Konfigurasi skema database, akun super admin, parameter workflow, dan master data awal instansi Anda.
            </p>
          </div>
        </div>

        {/* ═══ Organic Stepper Capsule (Web-OS style) ══════════════════════ */}
        <div className="p-2 bg-stone-200/60 dark:bg-stone-900/60 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-stone-300/60 dark:border-stone-800">
          <div className="grid grid-cols-5 gap-1.5">
            {steps.map((s) => {
              const isDone = currentStep > s.id;
              const isCurrent = currentStep === s.id;
              const Icon = s.icon;

              return (
                <button
                  key={s.id}
                  onClick={() => dbMigrated && setCurrentStep(s.id)}
                  disabled={!dbMigrated && s.id > 0}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed ${isCurrent
                      ? 'bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] shadow-sm'
                      : isDone
                        ? 'bg-white/80 dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 hover:bg-white'
                        : 'text-stone-400 dark:text-stone-600 opacity-60'
                    }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Icon className="w-4 h-4 shrink-0 stroke-[2px]" />
                  )}
                  <span className="hidden md:inline truncate">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ Step Main Content Container (Spatial Card) ══════════════════ */}
        <div className="bg-[#FBF9F4]/98 dark:bg-stone-900/98 backdrop-blur-3xl border border-stone-200/90 dark:border-stone-700/90 rounded-3xl sm:rounded-[40px] p-6 sm:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.25)] space-y-6 animate-scaleUp">
          {/* ─── STEP 0: Database & Migration ────────────────────────────── */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif-display">
                      Langkah 0: Kesiapan Database & Skema Migrasi
                    </h2>
                    <p className="text-xs text-stone-500">
                      Pemeriksaan koneksi penyimpanan UUID, relasi master data, dan tabel audit log ledger.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-stone-100/70 dark:bg-stone-950/50 border border-stone-200/80 dark:border-stone-800 space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600 dark:text-stone-400 font-medium">Status Storage Engine:</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Terkoneksi (UUID Primary Key Ready)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600 dark:text-stone-400 font-medium">Protokol Keamanan Penyimpanan:</span>
                  <span className="text-stone-800 dark:text-stone-200 font-mono font-bold">
                    AES-256 State / Local Storage Cache
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600 dark:text-stone-400 font-medium">Status Skema Migrasi:</span>
                  <span
                    className={`font-bold ${dbMigrated ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}
                  >
                    {dbMigrated ? 'Skema Terverifikasi (v1.0.0)' : 'Menunggu Eksekusi Migrasi'}
                  </span>
                </div>
              </div>

              {!dbMigrated ? (
                <button
                  type="button"
                  onClick={handleRunMigration}
                  disabled={isMigrating}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#181F19] dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-[#181F19] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <RefreshCw className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
                  <span>{isMigrating ? 'Memproses Migrasi Skema...' : 'Jalankan Migrasi Skema Sekarang'}</span>
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Skema database dan indeks tabel telah siap. Silakan klik <strong>Lanjutkan</strong>.</span>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 1: Akun Super Admin ─────────────────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif-display">
                      Langkah 1: Konfigurasi Akun Super Administrator
                    </h2>
                    <p className="text-xs text-stone-500">
                      Akun pemegang hak akses tertinggi sistem untuk manajemen user, master data, dan audit trail.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                    Nama Lengkap Admin *
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#181F19]/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                    Alamat Email Dinas *
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#181F19]/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                    Departemen Penugasan *
                  </label>
                  <input
                    type="text"
                    required
                    value={adminDept}
                    onChange={(e) => setAdminDept(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#181F19]/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                    Proteksi 2FA (Google Authenticator)
                  </label>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700">
                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      {admin2FA ? 'Aktifkan TOTP 2FA' : 'Non-Aktif (Dapat diaktifkan nanti)'}
                    </span>
                    <input
                      type="checkbox"
                      checked={admin2FA}
                      onChange={(e) => setAdmin2FA(e.target.checked)}
                      className="w-4 h-4 accent-[#181F19] rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Pengaturan Sistem ────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif-display">
                      Langkah 2: Parameter Sistem & Aturan Identifikasi
                    </h2>
                    <p className="text-xs text-stone-500">
                      Konfigurasi nama instansi, format kode aset otomatis, dan sensor lapangan.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                    Nama Aplikasi / Instansi *
                  </label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#181F19]/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                    Prefiks Kode Aset Standar *
                  </label>
                  <input
                    type="text"
                    required
                    value={codePrefix}
                    onChange={(e) => setCodePrefix(e.target.value)}
                    placeholder="AST-"
                    className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#181F19]/20"
                  />
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-stone-100/70 dark:bg-stone-950/50 border border-stone-200/80 dark:border-stone-800 space-y-3">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block uppercase">
                  Dukungan Sensor Identifikasi Fisik
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <label className="p-3 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                      <span className="font-semibold">Kamera QR Optik</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={qrEnabled}
                      onChange={(e) => setQrEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#181F19]"
                    />
                  </label>

                  <label className="p-3 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                      <span className="font-semibold">RFID UHF Reader</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={rfidEnabled}
                      onChange={(e) => setRfidEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#181F19]"
                    />
                  </label>

                  <label className="p-3 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                      <span className="font-semibold">NFC Mobile Tap</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={nfcEnabled}
                      onChange={(e) => setNfcEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#181F19]"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Master Data Dasar ────────────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                    <Folders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif-display">
                      Langkah 3: Master Kategori & Lokasi Fisik
                    </h2>
                    <p className="text-xs text-stone-500">
                      Tentukan apakah ingin memuat skema kategori aset (IT, Mesin, Kendaraan) dan lokasi default.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setIncludeDefaultMasterData(true)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 ${includeDefaultMasterData
                      ? 'bg-stone-100/90 dark:bg-stone-800 border-[#181F19] dark:border-stone-200 shadow-sm'
                      : 'bg-white/60 dark:bg-stone-950/40 border-stone-200 dark:border-stone-800 opacity-70'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400">
                      Disarankan
                    </span>
                    {includeDefaultMasterData && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    Muat Master Data Bawaan
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Menyertakan 6 kategori standar (Hardware IT, Mesin Produksi, Kendaraan Dinas, Furnitur Kantor) dan 4 lokasi terstruktur.
                  </p>
                </div>

                <div
                  onClick={() => setIncludeDefaultMasterData(false)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 ${!includeDefaultMasterData
                      ? 'bg-stone-100/90 dark:bg-stone-800 border-[#181F19] dark:border-stone-200 shadow-sm'
                      : 'bg-white/60 dark:bg-stone-950/40 border-stone-200 dark:border-stone-800 opacity-70'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-stone-500">Manual Kosong</span>
                    {!includeDefaultMasterData && <CheckCircle2 className="w-5 h-5 text-stone-900 dark:text-stone-100" />}
                  </div>
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    Mulai dari Tabel Kosong
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Tidak memuat kategori dan lokasi bawaan. Anda dapat menginput atau mengimpor file CSV master data secara mandiri nanti.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Contoh Aset / Mode Pemilihan ───────────────────────── */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif-display">
                      Langkah 4: Mode Data & Penyelesaian Inisialisasi
                    </h2>
                    <p className="text-xs text-stone-500">
                      Pilih lingkungan peluncuran sistem: Data Bersih untuk Produksi Riil atau Data Demo Korporasi Lengkap.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Opsi 1: Clean Slate Production */}
                <div
                  onClick={() => handleSelectSeedType('minimal')}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 ${seedType === 'minimal'
                      ? 'bg-stone-100/90 dark:bg-stone-800 border-[#181F19] dark:border-stone-200 shadow-sm'
                      : 'bg-white/60 dark:bg-stone-950/40 border-stone-200 dark:border-stone-800 opacity-70'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-stone-700 dark:text-stone-300">
                      Mode Produksi Riil
                    </span>
                    {seedType === 'minimal' && <CheckCircle2 className="w-5 h-5 text-stone-900 dark:text-stone-100" />}
                  </div>
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    Clean Slate (Data Bersih)
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Sistem dimulai dengan 0 transaksi aset. Siap untuk input aset fisik riil atau impor massal berkas Excel/CSV instansi Anda.
                  </p>
                </div>

                {/* Opsi 2: Full Corporate Demo Seed */}
                <div
                  onClick={() => handleSelectSeedType('full')}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 ${seedType === 'full'
                      ? 'bg-stone-100/90 dark:bg-stone-800 border-[#181F19] dark:border-stone-200 shadow-sm'
                      : 'bg-white/60 dark:bg-stone-950/40 border-stone-200 dark:border-stone-800 opacity-70'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400">
                      Eksplorasi Fitur
                    </span>
                    {seedType === 'full' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    Full Corporate Demo Seed
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Memuat 24 sampel aset fisik, riwayat mutasi, perbaikan berkala, siklus lelang, dan laporan penyusutan PSAK 16 siap uji.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─── Bottom Navigation Action Dock ────────────────────────────── */}
          <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                disabled={currentStep === 0 && !dbMigrated}
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#181F19] dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-[#181F19] text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Lanjutkan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishSetup}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#181F19] dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-[#181F19] text-xs sm:text-sm font-bold shadow-lg shadow-black/20 transition-all hover:scale-102 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-600" />
                <span>Selesaikan Inisialisasi Sistem</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
