import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  User as UserIcon,
  Camera,
  Upload,
  Trash2,
  KeyRound,
  Globe,
  SunMoon,
  LogOut,
  CheckCircle2,
  Shield,
  CreditCard,
  Calendar,
  AtSign,
  Mail,
  Building,
  Building2,
  Tag,
  Hash,
  MapPin,
  Save,
  Lock,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Sliders,
  RotateCcw,
  Download,
  AlertTriangle,
  GitBranch,
  RefreshCw,
  ExternalLink,
  Terminal,
  FileText,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  X,
  Layers,
  HardDrive,
  Database,
  Cpu,
  Fingerprint,
  ArrowRight,
} from 'lucide-react';
import { User as UserType } from '../../types';
import { StorageService } from '../../services/storageService';
import { logActivity } from '../../services/activityLogger';
import { getRoleBadgeClass, hasPermission } from '../../services/authService';
import { TwoFactorSetupModal } from '../auth/TwoFactorSetupModal';
import { getI18n, AppLanguage } from '../../utils/i18n';
import { ApiService, BackupItem } from '../../services/apiService';

interface SystemSettingsProps {
  currentUser: UserType;
  language?: AppLanguage;
  onLanguageChange?: (lang: AppLanguage) => void;
  onUpdateCurrentUser: (updatedUser: UserType) => void;
  onLogout?: () => void;
  onLaunchSetupWizard?: () => void;
  onNavigateTab?: (tab: string) => void;
  isReadOnlyMode?: boolean;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({
  currentUser,
  language: propLanguage,
  onLanguageChange,
  onUpdateCurrentUser,
  onLogout,
  onLaunchSetupWizard,
  onNavigateTab,
  isReadOnlyMode = false,
}) => {
  const currentLang: AppLanguage = propLanguage || currentUser?.language || StorageService.getLanguage() || 'en';
  const isEn = currentLang === 'en';

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SECURITY' | 'BRANDING' | 'MAINTENANCE'>('BRANDING');

  // Profile Form States
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [userId, setUserId] = useState(currentUser.userId || currentUser.email.split('@')[0]);
  const [idCard, setIdCard] = useState(currentUser.idCard || 'EMP-2026-0041');
  const [birthDate, setBirthDate] = useState(currentUser.birthDate || '1990-01-01');
  const [department, setDepartment] = useState(currentUser.department || 'IT & Infrastructure');
  const [location, setLocation] = useState(currentUser.location || 'Kantor Pusat Jakarta');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [appName, setAppName] = useState(StorageService.getAppName());
  const [assetCodePrefix, setAssetCodePrefix] = useState(StorageService.getAssetCodePrefix());

  // Granular RBAC Permissions
  const isDemoMode = StorageService.isDemoMode();
  const canManageIdentity = (hasPermission(currentUser, 'settings.company_identity') || hasPermission(currentUser, 'settings.manage')) && !isReadOnlyMode;
  const canManageAssetFormat = (hasPermission(currentUser, 'settings.asset_format') || hasPermission(currentUser, 'settings.manage')) && !isReadOnlyMode;
  const canViewBrandingSection = hasPermission(currentUser, 'settings.company_identity') || hasPermission(currentUser, 'settings.asset_format') || hasPermission(currentUser, 'settings.manage');
  const canRunSetupWizard = hasPermission(currentUser, 'system.wizard_setup') && !isReadOnlyMode;

  // Localization & Appearance States
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(currentUser.theme || 'light');
  const [language, setLanguage] = useState<'id' | 'en'>(currentLang);

  // Sync language state when prop or currentUser changes
  useEffect(() => {
    const activeLang = propLanguage || currentUser?.language || StorageService.getLanguage() || 'en';
    setLanguage(activeLang);
  }, [propLanguage, currentUser.language]);

  // 2FA Security States
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(currentUser.twoFactorEnabled || false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string>(currentUser.twoFactorSecret || 'JBSWY3DPEHPK3PXP');
  const [show2FAModal, setShow2FAModal] = useState(false);

  // Password Reset States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Setup Wizard & Factory Reset States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMode, setResetMode] = useState<'clean_assets' | 'seed_defaults' | 'full_wizard'>('clean_assets');
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // GitHub Updater States
  const currentAppVersion = 'v1.0.0';
  const githubRepo = (import.meta as any).env?.VITE_GITHUB_REPO || 'LEOWEB-bot/enterprise-asset-management';
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{
    checked: boolean;
    hasUpdate: boolean;
    latestVersion?: string;
    releaseNotes?: string[];
    releaseUrl?: string;
    publishedAt?: string;
    errorMessage?: string;
  }>({
    checked: false,
    hasUpdate: false,
    latestVersion: 'v1.0.0',
  });
  const [copiedCommand, setCopiedCommand] = useState(false);

  // Status Toast Notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toggle 2FA Handler
  const handleToggle2FA = (enable: boolean) => {
    if (enable) {
      setShow2FAModal(true);
    } else {
      setTwoFactorEnabled(false);
      const updatedUser: UserType = {
        ...currentUser,
        twoFactorEnabled: false,
      };
      StorageService.setCurrentUser(updatedUser);
      const allUsers = StorageService.getUsers().map((u) => (u.id === currentUser.id ? updatedUser : u));
      StorageService.saveUsers(allUsers);
      onUpdateCurrentUser(updatedUser);
      logActivity('2FA_DISABLED', 'AUTH', `Pengguna ${currentUser.name} menonaktifkan proteksi 2FA`);
      showToast(isEn ? 'Two-Factor Authentication disabled.' : 'Proteksi autentikasi 2FA telah dinonaktifkan.');
    }
  };

  const handleConfirm2FAEnable = (secret: string) => {
    setTwoFactorSecret(secret);
    setTwoFactorEnabled(true);
    const updatedUser: UserType = {
      ...currentUser,
      twoFactorEnabled: true,
      twoFactorSecret: secret,
    };
    StorageService.setCurrentUser(updatedUser);
    const allUsers = StorageService.getUsers().map((u) => (u.id === currentUser.id ? updatedUser : u));
    StorageService.saveUsers(allUsers);
    onUpdateCurrentUser(updatedUser);
    logActivity('2FA_ENABLED', 'AUTH', `Pengguna ${currentUser.name} berhasil mengaktifkan proteksi 2FA TOTP`);
    showToast(isEn ? 'Two-Factor Authentication successfully activated!' : 'Autentikasi Ganda 2FA TOTP berhasil diaktifkan!');
  };

  // Real-time Theme Switcher
  const handleThemeSelect = (selectedTheme: 'light' | 'dark' | 'system') => {
    setTheme(selectedTheme);
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (selectedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (selectedTheme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    const updatedUser: UserType = {
      ...currentUser,
      theme: selectedTheme,
    };
    StorageService.setCurrentUser(updatedUser);
    const allUsers = StorageService.getUsers().map((u) => (u.id === currentUser.id ? updatedUser : u));
    StorageService.saveUsers(allUsers);
    onUpdateCurrentUser(updatedUser);
  };

  // Real-time Language Switcher
  const handleLanguageSelect = (selectedLang: 'id' | 'en') => {
    setLanguage(selectedLang);
    StorageService.setLanguage(selectedLang);
    if (onLanguageChange) {
      onLanguageChange(selectedLang);
    }
    const updatedUser: UserType = {
      ...currentUser,
      language: selectedLang,
    };
    StorageService.setCurrentUser(updatedUser);
    const allUsers = StorageService.getUsers().map((u) => (u.id === currentUser.id ? updatedUser : u));
    StorageService.saveUsers(allUsers);
    onUpdateCurrentUser(updatedUser);
    showToast(selectedLang === 'id' ? 'Bahasa sistem diubah ke Bahasa Indonesia.' : 'System language changed to English.');
  };

  // Avatar Upload Handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast(isEn ? 'Please select an image file (JPG, PNG, WebP).' : 'Silakan pilih file gambar (JPG, PNG, WebP).', 'error');
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        showToast(isEn ? 'Max image size is 3MB' : 'Ukuran foto maksimal 3MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setAvatarUrl(result);
        showToast(isEn ? 'Profile photo loaded.' : 'Foto profil berhasil dimuat.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast(isEn ? 'Profile photo removed.' : 'Foto profil berhasil dihapus.');
  };

  // Save Settings
  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isReadOnlyMode) {
      showToast(isEn ? 'System in Read-Only mode.' : 'Mode baca saja aktif. Tidak dapat mengubah data.', 'error');
      return;
    }

    if (!name.trim()) {
      showToast(isEn ? 'Full name cannot be empty.' : 'Nama lengkap tidak boleh kosong.', 'error');
      return;
    }

    if (!email.trim()) {
      showToast(isEn ? 'Email address cannot be empty.' : 'Alamat email tidak boleh kosong.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast(isEn ? 'Invalid email format (example: name@assetcorp.id).' : 'Format email tidak valid (contoh: nama@assetcorp.id).', 'error');
      return;
    }

    const allUsers = StorageService.getUsers();
    const isEmailTaken = allUsers.some(
      (u) => u.id !== currentUser.id && u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (isEmailTaken) {
      showToast(isEn ? 'Email is already in use by another account.' : 'Alamat email sudah digunakan oleh akun lain.', 'error');
      return;
    }

    const updatedUser: UserType = {
      ...currentUser,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      userId: userId.toLowerCase().trim(),
      idCard: idCard.trim(),
      birthDate,
      department: department.trim(),
      location: location.trim(),
      avatarUrl,
      theme,
      language,
    };

    const updatedUsers = allUsers.map((u) => (u.id === currentUser.id ? updatedUser : u));
    StorageService.saveUsers(updatedUsers);
    StorageService.setCurrentUser(updatedUser);

    if (canManageIdentity && appName.trim()) {
      StorageService.setAppName(appName.trim());
      document.title = `${appName.trim()} - EAM`;
    }
    if (canManageAssetFormat && assetCodePrefix.trim()) {
      StorageService.setAssetCodePrefix(assetCodePrefix.trim());
    }

    onUpdateCurrentUser(updatedUser);

    logActivity(
      'USER_PROFILE_UPDATED',
      'AUTH',
      `Memperbarui data profil & preferensi sistem: ${updatedUser.name} (${updatedUser.userId})`
    );

    showToast(isEn ? 'System configuration saved successfully!' : 'Konfigurasi profil & sistem berhasil disimpan!');
  };

  // Handle Password Reset
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError(isEn ? 'New password must be at least 6 characters.' : 'Password baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(isEn ? 'Passwords do not match!' : 'Konfirmasi password tidak cocok!');
      return;
    }

    const updatedUser: UserType = {
      ...currentUser,
      password: newPassword,
    };
    StorageService.setCurrentUser(updatedUser);
    const allUsers = StorageService.getUsers().map((u) => (u.id === currentUser.id ? updatedUser : u));
    StorageService.saveUsers(allUsers);
    onUpdateCurrentUser(updatedUser);

    logActivity(
      'PASSWORD_RESET',
      'AUTH',
      `Pengguna ${currentUser.name} (${currentUser.userId || currentUser.email}) berhasil mereset kata sandi.`
    );

    setPasswordSuccess(true);
    showToast(isEn ? 'Password changed successfully!' : 'Kata sandi berhasil diperbarui!');
    setTimeout(() => {
      setPasswordSuccess(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 2000);
  };

  // Download JSON Backup Local
  const handleDownloadBackup = () => {
    try {
      const backupData = StorageService.exportDatabase();
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assetcorp_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      logActivity('DATABASE_BACKUP_EXPORTED', 'SETTINGS', `Ekspor file cadangan basis data JSON oleh ${currentUser.name}`);
      showToast(isEn ? 'Database JSON backup downloaded successfully.' : 'File cadangan basis data JSON berhasil diunduh.');
    } catch (err) {
      console.error('Backup download failed', err);
      showToast('Gagal mengunduh file cadangan.', 'error');
    }
  };

  const handleCopyVPSUpdateCommand = () => {
    const cmd = 'git pull origin main && npm install && npm run build && pm2 restart assetcorp';
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 3000);
    showToast(isEn ? 'VPS update command copied!' : 'Perintah pembaruan VPS berhasil disalin!');
  };

  const handleCheckGitHubUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      const response = await fetch(`https://api.github.com/repos/${githubRepo}/releases/latest`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No release or unpublished
          setUpdateStatus({
            checked: true,
            hasUpdate: false,
            latestVersion: currentAppVersion,
            releaseNotes: ['Versi saat ini adalah rilis rujukan aktif.'],
          });
          showToast(isEn ? 'System is running current release.' : 'Sistem menggunakan versi rilis aktif saat ini.');
          return;
        }
        throw new Error(`GitHub API HTTP ${response.status}`);
      }

      const releaseData = await response.json();
      const rawTag = releaseData.tag_name || releaseData.name || currentAppVersion;
      const cleanLatest = rawTag.replace(/^v/, '').trim();
      const cleanCurrent = currentAppVersion.replace(/^v/, '').trim();

      const isNewer = cleanLatest !== cleanCurrent && cleanLatest > cleanCurrent;

      const bodyNotes = releaseData.body
        ? releaseData.body.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0 && !s.startsWith('#')).slice(0, 5)
        : ['Pembaruan rilis resmi di GitHub.'];

      setUpdateStatus({
        checked: true,
        hasUpdate: isNewer,
        latestVersion: rawTag.startsWith('v') ? rawTag : `v${rawTag}`,
        releaseUrl: releaseData.html_url,
        publishedAt: releaseData.published_at ? new Date(releaseData.published_at).toLocaleDateString('id-ID') : undefined,
        releaseNotes: bodyNotes.length > 0 ? bodyNotes : ['Pembaruan performa dan peningkatan fitur.'],
      });

      if (isNewer) {
        showToast(isEn ? `New version ${rawTag} available!` : `Pembaruan versi ${rawTag} tersedia di GitHub!`);
      } else {
        showToast(isEn ? 'System version is up to date.' : `Versi sistem Anda (${currentAppVersion}) sudah mutakhir.`);
      }
    } catch (err: any) {
      console.warn('GitHub update check notice:', err);
      // Fallback graceful
      setUpdateStatus({
        checked: true,
        hasUpdate: false,
        latestVersion: currentAppVersion,
        errorMessage: 'Pemeriksaan menggunakan versi build lokal.',
      });
      showToast(isEn ? 'Checked against local build version.' : `Pemeriksaan selesai: Versi lokal aktif (${currentAppVersion}).`);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleExecuteSystemReset = () => {
    const text = resetConfirmText.trim().toUpperCase();
    if (text !== 'RESET' && text !== 'RESET SEMUA DATA') {
      showToast('Ketik kata RESET untuk mengonfirmasi tindakan.', 'error');
      return;
    }
    setIsResetting(true);

    if (resetMode === 'clean_assets') {
      logActivity('ASSET_DATA_CLEARED', 'SETTINGS', `Mengosongkan seluruh data transaksi aset oleh ${currentUser.name}`);
      setTimeout(() => {
        StorageService.clearAssetsOnly();
        setIsResetting(false);
        setShowResetModal(false);
        setResetConfirmText('');
        showToast('Data transaksi aset berhasil dikosongkan.');
        window.location.reload();
      }, 600);
    } else if (resetMode === 'seed_defaults') {
      logActivity('SYSTEM_RESET_SEED', 'SETTINGS', `Memulihkan data sistem ke kondisi awal demo oleh ${currentUser.name}`);
      setTimeout(() => {
        StorageService.resetToDefaults();
        setIsResetting(false);
        setShowResetModal(false);
        setResetConfirmText('');
        showToast('Sistem berhasil dipulihkan ke data demo awal.');
        window.location.reload();
      }, 600);
    } else {
      logActivity('FACTORY_RESET_INITIATED', 'SETTINGS', `Eksekusi reset total dan peluncuran ulang setup wizard oleh ${currentUser.name}`);
      setTimeout(() => {
        StorageService.resetToSetupWizard();
        if (onLaunchSetupWizard) {
          onLaunchSetupWizard();
        } else {
          window.location.reload();
        }
      }, 600);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm shadow-xl backdrop-blur-md animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50/90 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Spatial Command Header */}
      <div className="glass-panel squircle p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs uppercase tracking-widest text-[#5E7A68] dark:text-emerald-400 font-bold px-3 py-1 rounded-full bg-[#5E7A68]/10 dark:bg-emerald-950/40 border border-[#5E7A68]/20">
              {isEn ? 'Enterprise Governance' : 'Tata Kelola Enterprise'}
            </span>
            <div className="px-3.5 py-1 rounded-full bg-white/70 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5E7A68] animate-pulse" />
              <span>{currentAppVersion} • {twoFactorEnabled ? '2FA Enforced' : 'Standard 2FA'} • Database Synchronized</span>
            </div>
          </div>

          <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
            {isEn ? 'Enterprise System Settings & Governance' : 'Pusat Pengaturan Sistem, Profil & Tata Kelola Instansi'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            {isEn
              ? 'Centralized corporate identity, personnel access profiles, multi-factor security enforcement, and automated database backups.'
              : 'Konfigurasi identitas resmi instansi, profil akses personel, penegakan keamanan autentikasi ganda (2FA), dan pemeliharaan cadangan basis data.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 bg-white/80 dark:bg-stone-800/80 hover:bg-stone-100 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-700 px-5 py-3 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer hover:scale-105"
          >
            <Download className="w-4 h-4 text-[#7D562D]" />
            <span>{isEn ? 'Download Backup JSON' : 'Unduh Backup JSON'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveProfile()}
            disabled={isReadOnlyMode}
            className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-6 sm:px-7 py-3 rounded-full text-xs font-bold shadow-lg shadow-[#5E7A68]/25 transition-all cursor-pointer hover:scale-105 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isEn ? 'Save Changes' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Squircle Bento Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Security Posture */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Account Security' : 'Postur Keamanan Akun'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100">
              {twoFactorEnabled ? (isEn ? '2FA Enforced' : '2FA Aktif') : (isEn ? 'Standard Level' : 'Tingkat Standar')}
            </p>
            <span className="text-xs font-medium text-[#5E7A68] dark:text-emerald-400 font-mono">
              {twoFactorEnabled ? 'TOTP Authenticator Active' : 'Rekomendasi: Aktifkan 2FA'}
            </span>
          </div>
        </div>

        {/* Card 2: Corporate Entity */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Corporate Entity' : 'Identitas Resmi Instansi'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100 truncate">
              {appName}
            </p>
            <span className="text-xs font-medium text-stone-500 truncate block">
              {location}
            </span>
          </div>
        </div>

        {/* Card 3: Asset Tag Formula */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Asset Tag Formula' : 'Formula Kode Aset'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#D4A373]/20 text-[#7D562D] dark:text-amber-300 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-mono text-xl font-bold text-[#7D562D] dark:text-amber-300">
              {assetCodePrefix || 'AST'}-YYYY-XXXX
            </p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Prefix auto-generation' : 'Penomoran otomatis aktif'}
            </span>
          </div>
        </div>

        {/* Card 4: Localization & Theme */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Localization & Theme' : 'Lokalisasi & Tampilan'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100">
              {language === 'id' ? 'Bahasa Indonesia' : 'English (US)'}
            </p>
            <span className="text-xs font-medium text-stone-500 capitalize">
              {theme} Mode • Warm Spatial UI
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Switcher */}
      <div className="glass-panel squircle p-3 sm:p-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab('BRANDING')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'BRANDING'
              ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-[#7D562D]" />
          <span>{isEn ? 'Corporate Branding & Prefix' : 'Branding & Konfigurasi Instansi'}</span>
        </button>

        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'PROFILE'
              ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <UserIcon className="w-4 h-4 text-[#5E7A68]" />
          <span>{isEn ? 'Personnel Profile & Account' : 'Profil Personel & Akun'}</span>
        </button>

        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SECURITY'
              ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#5E7A68]" />
          <span>{isEn ? 'Security & 2FA Policies' : 'Keamanan & Autentikasi 2FA'}</span>
        </button>

        <button
          onClick={() => setActiveTab('MAINTENANCE')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'MAINTENANCE'
              ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Sliders className="w-4 h-4 text-[#7D562D]" />
          <span>{isEn ? 'System Updates & Reset' : 'Pembaruan & Reset Sistem'}</span>
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: CORPORATE BRANDING & ASSET PREFIX */}
      {activeTab === 'BRANDING' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Form: Branding & Formula */}
          <div className="lg:col-span-2 glass-panel squircle p-6 sm:p-8 space-y-6">
            <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <h2 className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Corporate Identity & Asset Code Prefix' : 'Identitas Resmi Perusahaan & Prefix Kode Aset'}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                {isEn
                  ? 'Official organization name, application header banner, and automated asset identification formula.'
                  : 'Nama resmi entitas instansi, branding judul portal, dan formula penomoran kode aset fisik otomatis.'}
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                  {isEn ? 'Official Company / Institution Name' : 'Nama Resmi Perusahaan / Instansi'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={!canManageIdentity}
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Contoh: AssetCorp Global Indonesia"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68] disabled:opacity-60"
                  />
                  <Building2 className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Nama ini akan ditampilkan pada seluruh header, dokumen Berita Acara, dan laporan keuangan resmi.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                  {isEn ? 'Automated Asset Code Prefix Formula' : 'Formula Prefix Penomoran Kode Aset'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={!canManageAssetFormat}
                    value={assetCodePrefix}
                    onChange={(e) => setAssetCodePrefix(e.target.value.toUpperCase())}
                    placeholder="AST"
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-bold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68] disabled:opacity-60"
                  />
                  <Tag className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-stone-500">Preset Rekomendasi:</span>
                  {['AST', 'PLN', 'DINKES', 'IT', 'LOG'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={!canManageAssetFormat}
                      onClick={() => setAssetCodePrefix(preset)}
                      className="px-2.5 py-1 rounded-lg bg-stone-200/70 dark:bg-stone-800 text-[10px] font-mono font-bold text-stone-700 dark:text-stone-300 hover:bg-[#5E7A68] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme & Language Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-stone-200/80 dark:border-stone-800">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-2">
                    {isEn ? 'Interface Theme Mode' : 'Tema Tampilan Antarmuka'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'light', label: 'Light' },
                      { id: 'dark', label: 'Dark' },
                      { id: 'system', label: 'Auto' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleThemeSelect(m.id as any)}
                        className={`p-2.5 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
                          theme === m.id
                            ? 'bg-[#5E7A68] text-white border-[#5E7A68] shadow-xs'
                            : 'bg-white/80 dark:bg-stone-900/80 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-2">
                    {isEn ? 'System Language' : 'Bahasa Aplikasi'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleLanguageSelect('id')}
                      className={`p-2.5 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
                        language === 'id'
                          ? 'bg-[#5E7A68] text-white border-[#5E7A68] shadow-xs'
                          : 'bg-white/80 dark:bg-stone-900/80 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      Bahasa ID
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLanguageSelect('en')}
                      className={`p-2.5 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
                        language === 'en'
                          ? 'bg-[#5E7A68] text-white border-[#5E7A68] shadow-xs'
                          : 'bg-white/80 dark:bg-stone-900/80 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      English US
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isReadOnlyMode}
                  className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-7 py-3 rounded-full text-xs font-bold shadow-md shadow-[#5E7A68]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isEn ? 'Save Branding Settings' : 'Simpan Pengaturan Branding'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Card: Live Asset Sticker Tag Preview */}
          <div className="glass-panel squircle p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div>
              <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
                <h3 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                  {isEn ? 'Live Asset Tag Sticker' : 'Pratinjau Stiker QR Aset'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Visualisasi stiker label fisik yang dicetak untuk seluruh aset.
                </p>
              </div>

              <div className="mt-6 p-6 rounded-3xl bg-white dark:bg-stone-900 border-2 border-stone-900/10 dark:border-stone-700 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">PROPERTY OF</span>
                    <strong className="text-xs font-serif-display text-stone-900 dark:text-stone-100 block truncate max-w-[170px]">
                      {appName}
                    </strong>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-[#5E7A68]/15 text-[#5E7A68] font-mono text-[9px] font-bold">
                    VERIFIED EAM
                  </span>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center p-2 border border-stone-300 dark:border-stone-700 shrink-0">
                    <QrCode className="w-full h-full text-stone-900 dark:text-stone-100" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] text-stone-400 font-medium">KODE IDENTIFIKASI</span>
                    <div className="font-mono text-sm font-bold text-stone-900 dark:text-stone-100 tracking-wider">
                      {assetCodePrefix || 'AST'}-2026-0042
                    </div>
                    <span className="text-[11px] text-stone-500 truncate block">MacBook Pro M3 Max 16"</span>
                    <span className="text-[10px] text-[#5E7A68] font-semibold block">{location}</span>
                  </div>
                </div>

                <div className="text-[9px] text-center text-stone-400 border-t border-stone-100 dark:border-stone-800 pt-2 font-mono">
                  SCAN UNTUK VERIFIKASI RIWAYAT & AUDIT FISIK
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#5E7A68]/10 dark:bg-emerald-950/30 border border-[#5E7A68]/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#5E7A68] dark:text-emerald-400">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Format Otomatis Terstandarisasi</span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                Setiap kali aset baru didaftarkan, formula prefix <code className="font-mono font-bold text-[#5E7A68]">{assetCodePrefix || 'AST'}-</code> akan di-generate otomatis secara unik.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONNEL PROFILE & ACCOUNT */}
      {activeTab === 'PROFILE' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <h2 className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100">
              {isEn ? 'Personnel Profile & Credentials' : 'Profil Personel & Data Akun Pengguna'}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {isEn
                ? 'Manage your personal account details, employee ID, department, and facility assignment.'
                : 'Kelola data identitas personel, ID Karyawan / NIK, penugasan departemen, dan lokasi gedung kerja.'}
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-3xl bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-3xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 font-serif-display text-2xl font-bold flex items-center justify-center overflow-hidden border-2 border-white dark:border-stone-700 shadow-md">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">{name}</h4>
                <p className="text-xs text-stone-500">
                  {isEn ? 'Upload a high-resolution JPG or PNG (Max 3MB).' : 'Unggah foto profil format JPG, PNG, atau WebP (Maksimal 3MB).'}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-100 cursor-pointer shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Upload Photo' : 'Pilih Foto'}</span>
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="px-4 py-1.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      {isEn ? 'Remove' : 'Hapus Foto'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                  {isEn ? 'Full Name *' : 'Nama Lengkap *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                  {isEn ? 'Official Email Address *' : 'Alamat Email Dinas *'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                  {isEn ? 'User ID (Login Username) *' : 'ID Pengguna (Username Login) *'}
                </label>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                  {isEn ? 'Employee ID (NIK)' : 'ID Karyawan (NIK)'}
                </label>
                <input
                  type="text"
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                  {isEn ? 'Assigned Department' : 'Departemen Penugasan'}
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                  {isEn ? 'Assigned Facility / Location' : 'Gedung / Lokasi Penugasan'}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isReadOnlyMode}
                className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-7 py-3 rounded-full text-xs font-bold shadow-md shadow-[#5E7A68]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isEn ? 'Update Profile Details' : 'Perbarui Profil Personel'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: SECURITY & 2FA POLICIES */}
      {activeTab === 'SECURITY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 2FA TOTP Card */}
          <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
            <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                    {isEn ? 'Two-Factor Authentication (2FA)' : 'Autentikasi Ganda (2FA TOTP)'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {isEn ? 'Time-based One-Time Password (Google Authenticator).' : 'Proteksi akun dengan Google Authenticator / Authy.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-4">
              <div>
                <strong className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  {twoFactorEnabled ? (isEn ? '2FA Protection is ACTIVE' : 'Proteksi 2FA Sedang AKTIF') : (isEn ? '2FA Protection is INACTIVE' : 'Proteksi 2FA NON-AKTIF')}
                </strong>
                <span className="text-[11px] text-stone-500">
                  {twoFactorEnabled
                    ? 'Setiap login mewajibkan kode verifikasi 6-digit dari aplikasi authenticator Anda.'
                    : 'Aktifkan untuk melindungi akun Anda dari pencurian kredensial dan serangan siber.'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleToggle2FA(!twoFactorEnabled)}
                disabled={isReadOnlyMode}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 disabled:opacity-40 ${
                  twoFactorEnabled ? 'bg-[#5E7A68]' : 'bg-stone-300 dark:bg-stone-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                    twoFactorEnabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#7D562D] dark:text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Zero-Trust Enterprise Policy</span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                Di lingkungan korporat berlisensi, seluruh admin dan auditor wajib menyalakan autentikasi ganda guna mematuhi standar ISO/IEC 27001.
              </p>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
            <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                    {isEn ? 'Update Account Password' : 'Ganti Kata Sandi Akun'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {isEn ? 'Change your active login password.' : 'Perbarui kata sandi login untuk menjaga keamanan akun.'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  {isEn ? 'Password updated successfully!' : 'Kata sandi berhasil diperbarui!'}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                  {isEn ? 'New Password *' : 'Kata Sandi Baru *'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter kombinasi"
                    className="w-full pl-3 pr-10 py-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                  {isEn ? 'Confirm New Password *' : 'Konfirmasi Kata Sandi Baru *'}
                </label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isReadOnlyMode}
                  className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#5E7A68]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isEn ? 'Update Password' : 'Ganti Kata Sandi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM MAINTENANCE & UPDATES */}
      {activeTab === 'MAINTENANCE' && (
        <div className="space-y-8">
          {/* Quick Banner: Backup & Recovery Now Dedicated in Sidebar */}
          <div className="p-6 rounded-3xl bg-[#5E7A68]/10 border border-[#5E7A68]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-[#5E7A68]/20 text-[#5E7A68] dark:text-emerald-300 shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {isEn ? 'Dedicated Backup & Recovery Center' : 'Pusat Cadangan & Pemulihan Sistem (Menu Mandiri)'}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 max-w-xl leading-relaxed">
                  {isEn
                    ? 'Automated 24h scheduler, AWS S3/Cloudflare R2 cloud sync, instant snapshot creation, and disaster rollback are now managed in their own dedicated workspace.'
                    : 'Penjadwal otomatis 24 jam, replikasi cloud S3/R2, pembuatan snapshot instan, dan rollback data kini dikelola secara mandiri pada menu khusus di Sidebar.'}
                </p>
              </div>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('backup')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5E7A68] hover:bg-[#4E6857] text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md shadow-[#5E7A68]/20"
              >
                <span>{isEn ? 'Open Backup & Recovery' : 'Buka Pusat Cadangan'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* GitHub Updater & VPS Commands */}
          <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
            <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                    {isEn ? 'VPS Deployment & 1-Click Update' : 'Pusat Pembaruan Aplikasi & VPS Script'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {currentAppVersion} • Jalur rilis produksi terverifikasi.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                  {isEn ? 'VPS 1-Click Pull & Restart Command' : 'Perintah Eksekusi Pembaruan VPS'}
                </label>
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-stone-900 text-emerald-400 font-mono text-[11px]">
                  <span className="truncate flex-1">git pull origin main && npm install && npm run build && pm2 restart assetcorp</span>
                  <button
                    type="button"
                    onClick={handleCopyVPSUpdateCommand}
                    className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Salin Perintah"
                  >
                    {copiedCommand ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleCheckGitHubUpdate}
                  disabled={isCheckingUpdate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-100 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                  <span>{isCheckingUpdate ? (isEn ? 'Checking...' : 'Memeriksa...') : (isEn ? 'Check for Updates' : 'Cek Pembaruan Sistem')}</span>
                </button>

                {updateStatus.checked && (
                  updateStatus.hasUpdate ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        <span>Pembaruan Tersedia ({updateStatus.latestVersion})</span>
                      </span>
                      {updateStatus.releaseUrl && (
                        <a
                          href={updateStatus.releaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-[10px] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Lihat Rilis</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-[#5E7A68] flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Versi Anda mutakhir ({updateStatus.latestVersion || currentAppVersion})</span>
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* CARD 3: Factory Reset & Setup Wizard Recovery Hub (Spans 2 columns) */}
          <div className="lg:col-span-2 glass-panel squircle p-6 sm:p-8 space-y-6 border-rose-200/80 dark:border-rose-900/40">
            <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-rose-600/10 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5 stroke-[2px]" />
                </div>
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-stone-900 dark:text-stone-100">
                    Pusat Pemulihan Pabrik (Factory Reset) & Inisialisasi Ulang
                  </h3>
                  <p className="text-xs text-stone-500">
                    Pembersihan data operasional transaksi atau inisialisasi ulang Setup Wizard instansi.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                    isDemoMode
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-[#7D562D] dark:text-amber-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {isDemoMode ? 'Mode Demo Sandbox' : 'Mode Produksi Riil (Clean Slate)'}
                </span>
                <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-full text-[11px] font-bold">
                  Tindakan Berdampak Luas
                </span>
              </div>
            </div>

            {/* Opsi Pemulihan Terstruktur (2 Kolom untuk Mode Produksi, 3 Kolom untuk Mode Demo) */}
            <div className={`grid grid-cols-1 ${isDemoMode ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 text-xs`}>
              {/* Opsi 1: Bersihkan Data Aset Saja */}
              <div className="p-5 rounded-3xl bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-[10px] font-bold text-stone-700 dark:text-stone-300">
                      Operasional
                    </span>
                    <Trash2 className="w-4 h-4 text-stone-400" />
                  </div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    Kosongkan Transaksi Aset
                  </h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Menghapus data aset fisik, mutasi, perbaikan, approval, dan audit. Akun pengguna, hak akses RBAC, dan profil instansi tetap aman.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isReadOnlyMode}
                  onClick={() => {
                    setResetMode('clean_assets');
                    setResetConfirmText('');
                    setShowResetModal(true);
                  }}
                  className="w-full py-2.5 px-4 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100 rounded-2xl font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Kosongkan Data Aset
                </button>
              </div>

              {/* Opsi 2: Kembalikan ke Demo Seed (HANYA DITAMPILKAN DI MODE DEMO SANDBOX) */}
              {isDemoMode && (
                <div className="p-5 rounded-3xl bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 flex flex-col justify-between space-y-4 animate-fadeIn">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-[10px] font-bold text-stone-700 dark:text-stone-300">
                        Demo Sandbox
                      </span>
                      <RotateCcw className="w-4 h-4 text-stone-400" />
                    </div>
                    <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                      Pulihkan Data Demo Awal
                    </h4>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Mengembalikan seluruh tabel ke kondisi awal demo siap pakai dengan contoh aset, lokasi gedung, dan akun staf operasional.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isReadOnlyMode}
                    onClick={() => {
                      setResetMode('seed_defaults');
                      setResetConfirmText('');
                      setShowResetModal(true);
                    }}
                    className="w-full py-2.5 px-4 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100 rounded-2xl font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Pulihkan Data Demo
                  </button>
                </div>
              )}

              {/* Opsi 3: Factory Reset & Setup Wizard */}
              <div className="p-5 rounded-3xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-rose-200 dark:bg-rose-900 text-[10px] font-bold text-rose-800 dark:text-rose-200">
                      Hard Reset
                    </span>
                    <Sparkles className="w-4 h-4 text-rose-500" />
                  </div>
                  <h4 className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                    Setup Wizard & Reset Total
                  </h4>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                    Mengosongkan total memori browser dan meluncurkan kembali Setup Wizard 5-langkah untuk konfigurasi instansi baru dari awal.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isReadOnlyMode}
                  onClick={() => {
                    setResetMode('full_wizard');
                    setResetConfirmText('');
                    setShowResetModal(true);
                  }}
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
                >
                  Luncurkan Setup Wizard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <TwoFactorSetupModal
          isOpen={show2FAModal}
          onClose={() => setShow2FAModal(false)}
          accountEmail={email}
          accountName={name}
          appName={appName}
          initialSecret={twoFactorSecret}
          onConfirmEnable={handleConfirm2FAEnable}
        />
      )}

      {/* ═══ Factory Reset & Setup Wizard Confirmation Modal ═══════════════ */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#FBF9F4] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-3xl sm:rounded-[36px] w-full max-w-lg shadow-2xl p-6 sm:p-7 space-y-5 animate-scaleUp">
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-600/10 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 stroke-[2px]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 font-serif-display leading-tight">
                    {resetMode === 'clean_assets' && 'Konfirmasi Pengosongan Data Aset'}
                    {resetMode === 'seed_defaults' && 'Konfirmasi Pemulihan Data Demo'}
                    {resetMode === 'full_wizard' && 'Konfirmasi Factory Reset & Setup Wizard'}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Protokol Keamanan Validasi Tindakan Administrator
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowResetModal(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2px]" />
              </button>
            </div>

            {/* Deskripsi & Peringatan */}
            <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              <p className="font-semibold text-rose-900 dark:text-rose-200">
                Peringatan: Tindakan ini akan memodifikasi penyimpanan data lokal browser!
              </p>
              {resetMode === 'clean_assets' && (
                <p>
                  Seluruh daftar aset, mutasi, perbaikan, approval, dan audit akan dihapus. Data profil akun dan master kategori tetap dipertahankan.
                </p>
              )}
              {resetMode === 'seed_defaults' && (
                <p>
                  Seluruh data akan digantikan dengan data bawaan pabrik (seed demo) AssetCorp EAM.
                </p>
              )}
              {resetMode === 'full_wizard' && (
                <p>
                  Seluruh basis data lokal akan dikosongkan total dan sesi dialihkan langsung ke <strong>Setup Wizard 5-Langkah</strong> untuk konfigurasi ulang nama instansi, logo, PIC, dan format kode aset.
                </p>
              )}
            </div>

            {/* Input Verifikasi Kata Kunci */}
            <div className="space-y-2 text-xs">
              <label className="block font-bold text-stone-700 dark:text-stone-300">
                Ketik kata <span className="font-mono font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md border border-rose-300 dark:border-rose-800">RESET</span> di bawah ini untuk melanjutkan:
              </label>
              <input
                type="text"
                placeholder="RESET"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-2xl text-xs font-mono font-bold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Tombol Aksi */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-5 py-2.5 rounded-2xl bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={resetConfirmText.trim().toUpperCase() !== 'RESET' || isResetting}
                onClick={handleExecuteSystemReset}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses Reset...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Eksekusi Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
