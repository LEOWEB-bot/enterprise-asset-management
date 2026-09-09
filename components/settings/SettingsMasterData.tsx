import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Layers,
  MapPin,
  Sliders,
  Database,
  Plus,
  Trash2,
  Edit2,
  Save,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Building,
  Building2,
  Shield,
  Globe,
  Radio,
  Server,
  Terminal,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Lock,
  Cpu,
  FileCode,
  Share2,
  ArrowUpRight,
  ArrowRight,
  Laptop,
  X,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { AssetCategory, AssetLocation, SystemSetting, User as UserType } from '../../types';
import { StorageService } from '../../services/storageService';
import { logActivity } from '../../services/activityLogger';
import { hasPermission } from '../../services/authService';
import { generateQrDataUrl } from '../../services/qrService';
import { getI18n, AppLanguage } from '../../utils/i18n';

interface SettingsMasterDataProps {
  currentUser: UserType;
  language?: AppLanguage;
  categories: AssetCategory[];
  locations: AssetLocation[];
  onRefreshData: () => void;
  isReadOnlyMode: boolean;
}

export const SettingsMasterData: React.FC<SettingsMasterDataProps> = ({
  currentUser,
  language,
  categories,
  locations,
  onRefreshData,
  isReadOnlyMode,
}) => {
  const currentLang: AppLanguage = language || currentUser?.language || StorageService.getLanguage() || 'en';
  const isEn = currentLang === 'en';

  const [activeTab, setActiveTab] = useState<'categories' | 'locations' | 'workflow' | 'network'>('categories');

  // Workflow Settings State
  const [settings, setSettings] = useState<SystemSetting[]>(StorageService.getSettings());
  const [companyName, setCompanyName] = useState(StorageService.getAppName());
  const [codePrefix, setCodePrefix] = useState(StorageService.getAssetCodePrefix());
  const [autoApproveMovement, setAutoApproveMovement] = useState(
    StorageService.getSettingValue('asset.workflow.auto_approve_movement', 'false') === 'true'
  );
  const [autoApproveDisposal, setAutoApproveDisposal] = useState(
    StorageService.getSettingValue('asset.workflow.auto_approve_disposal', 'false') === 'true'
  );
  const [readOnlyMode, setReadOnlyMode] = useState(
    StorageService.getSettingValue('system.read_only_mode', 'false') === 'true'
  );

  // Granular RBAC Permissions & Environment State
  const isDemoMode = StorageService.isDemoMode();

  // Network & DevOps Tunneling State
  const [tunnelMethod, setTunnelMethod] = useState<'cf_named' | 'vps' | 'docker' | 'cf_quick'>('cf_named');
  const [tunnelUrl, setTunnelUrl] = useState<string>(() => StorageService.getSettingValue('network.tunnel_url', ''));
  const [tunnelQrData, setTunnelQrData] = useState<string>('');

  // Real-time Dynamic Host, Port, and Protocol Auto-Detection
  const currentHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
  const currentPort = typeof window !== 'undefined' && window.location.port ? window.location.port : '4173';
  const currentProtocol = typeof window !== 'undefined' && window.location.protocol ? window.location.protocol : 'http:';
  const localTargetUrl = `${currentProtocol}//${currentHost === '0.0.0.0' ? 'localhost' : currentHost}:${currentPort}`;

  const [vpsDomain, setVpsDomain] = useState<string>(() => {
    const raw = StorageService.getSettingValue('network.vps_domain', '');
    if (raw) return raw;
    const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanName ? `aset.${cleanName}.com` : 'aset.instansi.com';
  });
  const [vpsTab, setVpsTab] = useState<'nginx' | 'script' | 'docker' | 'systemd' | 'env'>('nginx');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Generate QR Code when tunnel URL changes
  useEffect(() => {
    if (tunnelUrl.trim()) {
      generateQrDataUrl(tunnelUrl.trim(), 280).then((url) => setTunnelQrData(url));
    } else {
      setTunnelQrData('');
    }
  }, [tunnelUrl]);

  const copyToClipboard = (text: string, snippetId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(snippetId);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catLife, setCatLife] = useState(4);
  const [catSalvage, setCatSalvage] = useState(10);

  // Location Modal State
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<AssetLocation | null>(null);
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locCity, setLocCity] = useState('Jakarta Selatan');
  const [locAddress, setLocAddress] = useState('');

  // Toast Notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const canManage = hasPermission(currentUser, 'settings.manage') && !isReadOnlyMode;
  const canManageIdentity = (hasPermission(currentUser, 'settings.company_identity') || hasPermission(currentUser, 'settings.manage')) && !isReadOnlyMode;
  const canManageAssetFormat = (hasPermission(currentUser, 'settings.asset_format') || hasPermission(currentUser, 'settings.manage')) && !isReadOnlyMode;

  // Save Settings
  const handleSaveSettings = () => {
    if (!canManage) {
      triggerToast(isEn ? 'Super Admin permission required.' : 'Hanya Super Admin yang berwenang mengubah konfigurasi sistem.', 'error');
      return;
    }

    if (canManageIdentity) {
      StorageService.setAppName(companyName);
    }
    if (canManageAssetFormat) {
      StorageService.setAssetCodePrefix(codePrefix);
    }
    StorageService.setSettingValue('asset.workflow.auto_approve_movement', autoApproveMovement ? 'true' : 'false');
    StorageService.setSettingValue('asset.workflow.auto_approve_disposal', autoApproveDisposal ? 'true' : 'false');
    StorageService.setSettingValue('system.read_only_mode', readOnlyMode ? 'true' : 'false');

    logActivity('SETTINGS_UPDATED', 'SETTINGS', `Memperbarui konfigurasi alur kerja sistem oleh ${currentUser.name}`);
    triggerToast(isEn ? 'Workflow policies saved successfully!' : 'Pengaturan kebijakan & alur kerja berhasil disimpan!');
    onRefreshData();
  };

  // Category Actions
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    let updated = [...categories];
    if (editingCategory) {
      updated = updated.map((c) =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: catName,
              code: catCode.toUpperCase(),
              depreciationPeriodYears: catLife,
              salvagePercentage: catSalvage,
            }
          : c
      );
    } else {
      updated.push({
        id: `cat-${Date.now()}`,
        name: catName,
        code: (catCode || catName.substring(0, 3)).toUpperCase(),
        depreciationPeriodYears: catLife,
        salvagePercentage: catSalvage,
        depreciationMethod: 'STRAIGHT_LINE',
      });
    }
    StorageService.saveCategories(updated);
    logActivity('CATEGORY_UPDATED', 'SETTINGS', `Menyimpan master kategori "${catName}"`);
    setShowCategoryModal(false);
    setEditingCategory(null);
    triggerToast(isEn ? `Category "${catName}" saved.` : `Kategori aset "${catName}" berhasil disimpan.`);
    onRefreshData();
  };

  const handleDeleteCategory = (cat: AssetCategory) => {
    if (!canManage) return;
    if (window.confirm(isEn ? `Delete category "${cat.name}"?` : `Hapus master kategori "${cat.name}"?`)) {
      const updated = categories.filter((c) => c.id !== cat.id);
      StorageService.saveCategories(updated);
      triggerToast(isEn ? `Category "${cat.name}" deleted.` : `Kategori "${cat.name}" berhasil dihapus.`);
      onRefreshData();
    }
  };

  // Location Actions
  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim()) return;

    let updated = [...locations];
    if (editingLocation) {
      updated = updated.map((l) =>
        l.id === editingLocation.id
          ? {
              ...l,
              name: locName,
              code: locCode.toUpperCase(),
              city: locCity,
              address: locAddress,
            }
          : l
      );
    } else {
      updated.push({
        id: `loc-${Date.now()}`,
        name: locName,
        code: (locCode || locName.substring(0, 3)).toUpperCase(),
        city: locCity,
        address: locAddress,
      });
    }
    StorageService.saveLocations(updated);
    logActivity('LOCATION_UPDATED', 'SETTINGS', `Menyimpan master lokasi "${locName}"`);
    setShowLocationModal(false);
    setEditingLocation(null);
    triggerToast(isEn ? `Location "${locName}" saved.` : `Lokasi fisik "${locName}" berhasil disimpan.`);
    onRefreshData();
  };

  const handleDeleteLocation = (loc: AssetLocation) => {
    if (!canManage) return;
    if (window.confirm(isEn ? `Delete location "${loc.name}"?` : `Hapus lokasi fisik "${loc.name}"?`)) {
      const updated = locations.filter((l) => l.id !== loc.id);
      StorageService.saveLocations(updated);
      triggerToast(isEn ? `Location "${loc.name}" deleted.` : `Lokasi "${loc.name}" berhasil dihapus.`);
      onRefreshData();
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
              {isEn ? 'Master Taxonomy & Policies' : 'Struktur Taksonomi & Kebijakan'}
            </span>
            <div className="px-3.5 py-1 rounded-full bg-white/70 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5E7A68] animate-pulse" />
              <span>{categories.length} {isEn ? 'Categories' : 'Kategori'} • {locations.length} {isEn ? 'Facilities' : 'Lokasi Fisik'} • Zero-Trust Tunnel</span>
            </div>
          </div>

          <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
            {isEn ? 'Master Data, Facilities & System Policies' : 'Pusat Master Data Kategori, Lokasi & Kebijakan Sistem'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            {isEn
              ? 'Standard asset classifications, physical facilities, automated movement approval parameters, and DevOps tunneling infrastructure.'
              : 'Klasifikasi aset tetap, masa manfaat penyusutan fiskal, master gedung fasilitas, parameter alur persetujuan, dan infrastruktur terowongan DevOps.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 self-start lg:self-center">
          {activeTab === 'categories' && canManage && (
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setCatName('');
                setCatCode('');
                setCatLife(4);
                setCatSalvage(10);
                setShowCategoryModal(true);
              }}
              className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-6 sm:px-7 py-3 rounded-full text-xs font-bold shadow-lg shadow-[#5E7A68]/25 transition-all cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>{isEn ? 'Add Asset Category' : 'Tambah Kategori Aset'}</span>
            </button>
          )}

          {activeTab === 'locations' && canManage && (
            <button
              type="button"
              onClick={() => {
                setEditingLocation(null);
                setLocName('');
                setLocCode('');
                setLocCity('Jakarta Selatan');
                setLocAddress('');
                setShowLocationModal(true);
              }}
              className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-6 sm:px-7 py-3 rounded-full text-xs font-bold shadow-lg shadow-[#5E7A68]/25 transition-all cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>{isEn ? 'Add Physical Location' : 'Tambah Lokasi Fisik'}</span>
            </button>
          )}

          {activeTab === 'workflow' && canManage && (
            <button
              type="button"
              onClick={handleSaveSettings}
              className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-6 sm:px-7 py-3 rounded-full text-xs font-bold shadow-lg shadow-[#5E7A68]/25 transition-all cursor-pointer hover:scale-105"
            >
              <Save className="w-4 h-4" />
              <span>{isEn ? 'Save Policies' : 'Simpan Kebijakan'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 4 Squircle Bento Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Categories */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Asset Categories' : 'Kategori Aset Terdaftar'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#181F19] dark:text-stone-100">{categories.length}</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Standard asset classifications' : 'Klasifikasi penyusutan aktif'}
            </span>
          </div>
        </div>

        {/* Card 2: Physical Locations */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Physical Facilities' : 'Gedung & Fasilitas'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#181F19] dark:text-stone-100">{locations.length}</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Workplaces & warehouses' : 'Kantor & gudang logistik'}
            </span>
          </div>
        </div>

        {/* Card 3: Governance Policies */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Workflow Policies' : 'Parameter Otorisasi'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#D4A373]/20 text-[#7D562D] dark:text-amber-300 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#7D562D] dark:text-amber-300">3</p>
            <span className="text-xs font-medium text-stone-500">
              {readOnlyMode ? (isEn ? 'System Locked (Read-Only)' : 'Sistem Terkunci (Audit)') : (isEn ? 'Active Approval Rules' : 'Alur kerja persetujuan aktif')}
            </span>
          </div>
        </div>

        {/* Card 4: DevOps Tunnel */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'DevOps Tunnel' : 'Infrastruktur Jaringan'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100 truncate">
              {tunnelUrl ? 'Tunnel Online' : 'Cloudflare Ready'}
            </p>
            <span className="text-xs font-medium text-stone-500 truncate block">
              {tunnelUrl ? tunnelUrl.replace(/^https?:\/\//, '') : 'Akses Tablet Scan QR'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Switcher */}
      <div className="glass-panel squircle p-3 sm:p-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Layers className="w-4 h-4 text-[#5E7A68]" />
          <span>{isEn ? 'Asset Categories & Depreciation' : 'Kategori Aset & Penyusutan'}</span>
          <span className="px-2 py-0.5 rounded-full bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-400 text-[10px] font-mono font-bold">
            {categories.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('locations')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'locations'
              ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <MapPin className="w-4 h-4 text-[#7D562D]" />
          <span>{isEn ? 'Physical Locations & Facilities' : 'Lokasi Fisik & Fasilitas'}</span>
          <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-mono font-bold">
            {locations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('workflow')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'workflow'
              ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Sliders className="w-4 h-4 text-[#5E7A68]" />
          <span>{isEn ? 'Approval Policies & Governance' : 'Kebijakan Alur Kerja & Otorisasi'}</span>
        </button>

        <button
          onClick={() => setActiveTab('network')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'network'
              ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Server className="w-4 h-4 text-[#7D562D]" />
          <span>{isEn ? 'DevOps Tunnel & VPS Guide' : 'Jaringan DevOps & Terowongan Lapangan'}</span>
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: ASSET CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Master Asset Categories & Useful Life Schedule' : 'Master Klasifikasi Kategori & Jadwal Penyusutan Fiskal'}
              </h2>
              <p className="text-xs text-stone-500">
                {isEn
                  ? 'Configures fiscal useful life (years) and salvage residual percentage using Straight-Line Depreciation.'
                  : 'Parameter masa manfaat ekonomis fiskal (tahun) dan estimasi nilai sisa (residu) dengan metode Garis Lurus.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-500 px-3 py-1 rounded-full bg-stone-200/60 dark:bg-stone-800">
              {categories.length} {isEn ? 'Categories' : 'Klasifikasi'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200/80 dark:border-stone-800 text-stone-500 uppercase font-bold text-[11px] tracking-wider">
                  <th className="py-4 px-4">{isEn ? 'Category Code' : 'Kode Kategori'}</th>
                  <th className="py-4 px-4">{isEn ? 'Classification Name' : 'Nama Klasifikasi Kategori'}</th>
                  <th className="py-4 px-4 text-center">{isEn ? 'Useful Life (Years)' : 'Masa Manfaat (Tahun)'}</th>
                  <th className="py-4 px-4 text-center">{isEn ? 'Salvage Residual (%)' : 'Estimasi Residu (%)'}</th>
                  <th className="py-4 px-4">{isEn ? 'Depreciation Method' : 'Metode Depresiasi'}</th>
                  <th className="py-4 px-4 text-right">{isEn ? 'Actions' : 'Tindakan'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/60">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors group">
                    <td className="py-4 px-4 font-mono font-bold text-[#5E7A68] dark:text-emerald-400">
                      {c.code}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#5E7A68] transition-colors">
                        {c.name}
                      </div>
                      {c.description && (
                        <div className="text-[11px] text-stone-500 mt-0.5">{c.description}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-stone-800 dark:text-stone-200">
                      <span className="px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                        {c.depreciationPeriodYears} {isEn ? 'Years' : 'Tahun'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-[#7D562D] dark:text-amber-300">
                      {c.salvagePercentage}%
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 font-semibold text-[11px]">
                        Garis Lurus (Straight-Line)
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {canManage && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(c);
                              setCatName(c.name);
                              setCatCode(c.code);
                              setCatLife(c.depreciationPeriodYears);
                              setCatSalvage(c.salvagePercentage);
                              setShowCategoryModal(true);
                            }}
                            className="p-2 rounded-xl text-stone-500 hover:text-[#5E7A68] hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                            title={isEn ? 'Edit Category' : 'Ubah Kategori'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c)}
                            className="p-2 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title={isEn ? 'Delete Category' : 'Hapus Kategori'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PHYSICAL LOCATIONS */}
      {activeTab === 'locations' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Master Physical Facilities, Warehouses & Branches' : 'Master Fasilitas Gedung, Gudang Logistik & Cabang'}
              </h2>
              <p className="text-xs text-stone-500">
                {isEn
                  ? 'Physical installation sites, corporate headquarters, and regional distribution branches.'
                  : 'Lokasi fisik penempatan aset, gedung kantor pusat, dan cabang logistik regional.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-500 px-3 py-1 rounded-full bg-stone-200/60 dark:bg-stone-800">
              {locations.length} {isEn ? 'Facilities' : 'Fasilitas'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200/80 dark:border-stone-800 text-stone-500 uppercase font-bold text-[11px] tracking-wider">
                  <th className="py-4 px-4">{isEn ? 'Location Code' : 'Kode Lokasi'}</th>
                  <th className="py-4 px-4">{isEn ? 'Facility / Building Name' : 'Nama Fasilitas / Gedung'}</th>
                  <th className="py-4 px-4">{isEn ? 'City / Region' : 'Kota / Wilayah'}</th>
                  <th className="py-4 px-4">{isEn ? 'Complete Physical Address' : 'Alamat Lengkap'}</th>
                  <th className="py-4 px-4 text-right">{isEn ? 'Actions' : 'Tindakan'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/60">
                {locations.map((l) => (
                  <tr key={l.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors group">
                    <td className="py-4 px-4 font-mono font-bold text-[#7D562D] dark:text-amber-300">
                      {l.code}
                    </td>
                    <td className="py-4 px-4 font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#5E7A68] transition-colors">
                      {l.name}
                    </td>
                    <td className="py-4 px-4 font-semibold text-stone-800 dark:text-stone-200">
                      {l.city}
                    </td>
                    <td className="py-4 px-4 text-stone-500 max-w-xs truncate">
                      {l.address || '-'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {canManage && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLocation(l);
                              setLocName(l.name);
                              setLocCode(l.code);
                              setLocCity(l.city);
                              setLocAddress(l.address || '');
                              setShowLocationModal(true);
                            }}
                            className="p-2 rounded-xl text-stone-500 hover:text-[#5E7A68] hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                            title={isEn ? 'Edit Location' : 'Ubah Lokasi'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLocation(l)}
                            className="p-2 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title={isEn ? 'Delete Location' : 'Hapus Lokasi'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WORKFLOW POLICIES */}
      {activeTab === 'workflow' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <h2 className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100">
              {isEn ? 'System Governance & Approval Policies' : 'Kebijakan Alur Kerja & Otorisasi Sistem'}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {isEn
                ? 'Automate routine asset relocation or enforce strict dual-control authorization.'
                : 'Atur otomasi persetujuan mutasi atau tegakkan kontrol otorisasi ganda untuk seluruh transaksi.'}
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-center justify-between p-5 rounded-3xl bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-bold text-stone-900 dark:text-stone-100 text-sm block">
                  {isEn ? 'Auto-Approve Asset Movements' : 'Otomatisasi Persetujuan Mutasi (Auto-Approve Movement)'}
                </span>
                <span className="text-stone-500 text-xs">
                  {isEn
                    ? 'Internal transfers apply immediately without requiring Asset Manager confirmation.'
                    : 'Pemindahan lokasi antar ruangan langsung berlaku tanpa menunggu persetujuan manual Asset Manager.'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoApproveMovement}
                onChange={(e) => setAutoApproveMovement(e.target.checked)}
                className="w-5 h-5 text-[#5E7A68] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-5 rounded-3xl bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-bold text-stone-900 dark:text-stone-100 text-sm block">
                  {isEn ? 'Auto-Approve Asset Disposals' : 'Otomatisasi Persetujuan Disposal (Auto-Approve Disposal)'}
                </span>
                <span className="text-stone-500 text-xs">
                  {isEn
                    ? 'Asset write-offs execute without pending approval steps.'
                    : 'Permohonan penghapusan/lelang aset langsung disetujui tanpa verifikasi ganda Admin.'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoApproveDisposal}
                onChange={(e) => setAutoApproveDisposal(e.target.checked)}
                className="w-5 h-5 text-[#5E7A68] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-5 rounded-3xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-bold text-rose-900 dark:text-rose-200 text-sm block">
                  {isEn ? 'Emergency System Read-Only Lock' : 'Mode Terkunci Baca-Saja Sistem (Audit Lock)'}
                </span>
                <span className="text-rose-700 dark:text-rose-400 text-xs">
                  {isEn
                    ? 'Locks all modifications, mutations, and deletions during official annual audit reconciliation.'
                    : 'Kunci seluruh penambahan, pengeditan, mutasi, dan penghapusan data selama proses audit rekonsiliasi tahunan.'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={readOnlyMode}
                onChange={(e) => setReadOnlyMode(e.target.checked)}
                className="w-5 h-5 text-rose-600 rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={!canManage}
              className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-7 py-3 rounded-full text-xs font-bold shadow-md shadow-[#5E7A68]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isEn ? 'Save Policy Parameters' : 'Simpan Parameter Kebijakan'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: DEVOPS TUNNEL & VPS */}
      {activeTab === 'network' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Domain Endpoint & Tablet QR Code */}
          <div className="glass-panel squircle p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div>
              <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                    {isEn ? 'Public Access & Mobile QR' : 'Akses Publik & QR Tablet'}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      isDemoMode
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-[#7D562D] dark:text-amber-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {isDemoMode ? 'Mode Sandbox' : 'Mode Produksi Riil'}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Domain resmi untuk akses lapangan petugas barcode scanner dan tablet audit.
                </p>
              </div>

              <div className="space-y-4 text-xs mt-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                    {isEn ? 'Production Domain / Endpoint URL' : 'Domain Produksi / URL Endpoint'}
                  </label>
                  <input
                    type="text"
                    value={tunnelUrl || `https://${vpsDomain}`}
                    onChange={(e) => setTunnelUrl(e.target.value)}
                    placeholder={`https://${vpsDomain || 'aset.perusahaan.com'}`}
                    className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-stone-500">
                      Tersimpan sebagai basis URL pencetakan stiker QR aset fisik.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const target = tunnelUrl.trim() || `https://${vpsDomain}`;
                        StorageService.setSettingValue('network.tunnel_url', target);
                        triggerToast(isEn ? 'Domain URL saved!' : 'URL domain berhasil disimpan!');
                      }}
                      className="text-[11px] font-bold text-[#5E7A68] hover:underline cursor-pointer"
                    >
                      Simpan URL
                    </button>
                  </div>
                </div>

                {tunnelQrData || tunnelUrl || vpsDomain ? (
                  <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center space-y-3 shadow-md">
                    {tunnelQrData ? (
                      <img src={tunnelQrData} alt="Tunnel QR" className="w-44 h-44 mx-auto rounded-2xl" />
                    ) : (
                      <div className="w-44 h-44 mx-auto flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-2xl">
                        <QrCode className="w-12 h-12 text-stone-400" />
                      </div>
                    )}
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#5E7A68] block">
                        Pindai untuk Akses Tablet & Lapangan
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono break-all mt-0.5 block">
                        {tunnelUrl || `https://${vpsDomain}`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-3xl bg-stone-100/70 dark:bg-stone-800/50 border border-dashed border-stone-300 dark:border-stone-700 text-center text-stone-400 space-y-2">
                    <QrCode className="w-10 h-10 mx-auto text-stone-400" />
                    <p className="text-xs">Masukkan domain resmi instansi untuk memunculkan QR Code akses lapangan.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#5E7A68]/10 dark:bg-emerald-950/30 border border-[#5E7A68]/20 space-y-1 mt-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#5E7A68] dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Enkripsi TLS/SSL Universal & Zero Inbound Ports</span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                Koneksi terenkripsi penuh tanpa mengekspos port router atau firewall internal perusahaan ke publik.
              </p>
            </div>
          </div>

          {/* Right Panel: Production Tunnel Providers & 1-Click Commands */}
          <div className="lg:col-span-2 glass-panel squircle p-6 sm:p-8 space-y-6">
            <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                    {isEn ? 'Production Deployment & Tunneling Guide' : 'Panduan Arsitektur & Terowongan Produksi'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
                    Port Lokal: {currentPort}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Pilih infrastruktur penyebaran (*deployment*) yang sesuai dengan arsitektur server VPS Anda.
                </p>
              </div>

              {/* Method Switcher: Only shows cf_quick in Sandbox/Demo mode */}
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-stone-200/70 dark:bg-stone-800 text-xs font-bold shrink-0">
                {[
                  { id: 'cf_named', label: 'Cloudflare Named (Zero-Trust)' },
                  { id: 'vps', label: 'VPS Nginx + SSL' },
                  { id: 'docker', label: 'Docker & Systemd' },
                  ...(isDemoMode ? [{ id: 'cf_quick', label: 'Quick Tunnel (Sandbox)' }] : []),
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTunnelMethod(m.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      tunnelMethod === m.id
                        ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* METHOD 1: CLOUDFLARE NAMED TUNNEL (PRODUCTION ZERO-TRUST - 100% FREE) */}
            {tunnelMethod === 'cf_named' && (
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Cloudflare Named Tunnel (Rekomendasi Mutlak Produksi • 100% Gratis)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-400 font-mono text-[10px] font-bold self-start sm:self-auto">
                      Zero-Trust SLA Ready
                    </span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
                    Sangat stabil 24/7, menggunakan <strong>Domain Sendiri Tetap</strong>, tanpa membuka port firewall (Zero Inbound Port), SSL universal gratis, dan otomatis berjalan di latar belakang sebagai <em>systemd service</em>.
                  </p>
                </div>

                {/* Subdomain Input */}
                <div className="p-3.5 rounded-2xl bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-stone-800 dark:text-stone-200 block text-xs">
                      Subdomain / Domain Resmi Instansi Anda:
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Perintah terminal di bawah akan otomatis menyesuaikan dengan domain ini.
                    </span>
                  </div>
                  <input
                    type="text"
                    value={vpsDomain}
                    onChange={(e) => {
                      setVpsDomain(e.target.value);
                      StorageService.setSettingValue('network.vps_domain', e.target.value.trim());
                    }}
                    placeholder="aset.perusahaan.com"
                    className="p-2.5 px-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 font-mono text-xs font-bold text-stone-900 dark:text-stone-100 w-full sm:w-64"
                  />
                </div>

                {/* Step 1: Login & Create Tunnel */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                    1. Otentikasi Akun Cloudflare & Buat Named Tunnel
                  </label>
                  <div className="relative">
                    <pre className="p-3.5 pr-28 rounded-2xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
{`cloudflared tunnel login
cloudflared tunnel create assetcorp-eam`}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`cloudflared tunnel login\ncloudflared tunnel create assetcorp-eam`, 'cf_step1')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSnippet === 'cf_step1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet === 'cf_step1' ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                {/* Step 2: Route DNS */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                    2. Sambungkan DNS Subdomain ke Named Tunnel
                  </label>
                  <div className="relative">
                    <pre className="p-3.5 pr-28 rounded-2xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                      cloudflared tunnel route dns assetcorp-eam {vpsDomain || 'aset.perusahaan.com'}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`cloudflared tunnel route dns assetcorp-eam ${vpsDomain || 'aset.perusahaan.com'}`, 'cf_step2')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSnippet === 'cf_step2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet === 'cf_step2' ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                {/* Step 3: Config YAML */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                    3. Berkas Konfigurasi /root/.cloudflared/config.yml
                  </label>
                  <div className="relative">
                    <pre className="p-3.5 pr-28 rounded-2xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
{`tunnel: <UUID_TUNNEL_ANDA>
credentials-file: /root/.cloudflared/<UUID_TUNNEL_ANDA>.json

ingress:
  - hostname: ${vpsDomain || 'aset.perusahaan.com'}
    service: http://localhost:${currentPort}
  - service: http_status:404`}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`tunnel: <UUID_TUNNEL_ANDA>\ncredentials-file: /root/.cloudflared/<UUID_TUNNEL_ANDA>.json\n\ningress:\n  - hostname: ${vpsDomain || 'aset.perusahaan.com'}\n    service: http://localhost:${currentPort}\n  - service: http_status:404`, 'cf_step3')}
                      className="absolute right-3 top-3 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSnippet === 'cf_step3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet === 'cf_step3' ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                {/* Step 4: Systemd Service */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                    4. Pasang sebagai Systemd Linux Service (Auto-Start Saat Boot)
                  </label>
                  <div className="relative">
                    <pre className="p-3.5 pr-28 rounded-2xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
{`sudo cloudflared service install
sudo systemctl enable --now cloudflared`}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`sudo cloudflared service install\nsudo systemctl enable --now cloudflared`, 'cf_step4')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSnippet === 'cf_step4' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet === 'cf_step4' ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* METHOD 2: VPS NGINX & CERTBOT SSL */}
            {tunnelMethod === 'vps' && (
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-2">
                  <span className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Nginx Reverse Proxy + Let's Encrypt SSL (IP Publik Statis)
                  </span>
                  <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
                    Standar industri jika VPS Anda memiliki IP Publik terbuka. Nginx meneruskan request port 80/443 ke port lokal {currentPort}.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                    1. Konfigurasi Nginx (/etc/nginx/sites-available/assetcorp)
                  </label>
                  <div className="relative">
                    <pre className="p-4 rounded-2xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-56">
{`server {
    listen 80;
    server_name ${vpsDomain || 'aset.perusahaan.com'};

    location / {
        proxy_pass http://127.0.0.1:${currentPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`server {\n    listen 80;\n    server_name ${vpsDomain || 'aset.perusahaan.com'};\n\n    location / {\n        proxy_pass http://127.0.0.1:${currentPort};\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection 'upgrade';\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n    }\n}`, 'nginx_conf')}
                      className="absolute right-3 top-3 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSnippet === 'nginx_conf' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet === 'nginx_conf' ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                    2. Perintah Otomatis Sertifikat SSL Gratis (Certbot Let's Encrypt)
                  </label>
                  <div className="relative">
                    <pre className="p-3.5 pr-28 rounded-2xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                      sudo certbot --nginx -d {vpsDomain || 'aset.perusahaan.com'}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`sudo certbot --nginx -d ${vpsDomain || 'aset.perusahaan.com'}`, 'certbot_cmd')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSnippet === 'certbot_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet === 'certbot_cmd' ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* METHOD 3: DOCKER & SYSTEMD DAEMON */}
            {tunnelMethod === 'docker' && (
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-2">
                  <span className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    Containerization (Docker Compose & Systemd Service)
                  </span>
                  <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
                    Memastikan aplikasi EAM tetap hidup 24/7 di VPS dan otomatis hidup kembali jika VPS mengalami restart/reboot.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                    1. Berkas docker-compose.yml
                  </label>
                  <div className="relative">
                    <pre className="p-4 rounded-2xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-56">
{`version: '3.8'
services:
  assetcorp-eam:
    build: .
    ports:
      - "${currentPort}:${currentPort}"
    environment:
      - NODE_ENV=production
    restart: always`}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`version: '3.8'\nservices:\n  assetcorp-eam:\n    build: .\n    ports:\n      - "${currentPort}:${currentPort}"\n    environment:\n      - NODE_ENV=production\n    restart: always`, 'docker_compose')}
                      className="absolute right-3 top-3 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSnippet === 'docker_compose' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet === 'docker_compose' ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                    2. Berkas Linux Systemd Service (/etc/systemd/system/assetcorp.service)
                  </label>
                  <div className="relative">
                    <pre className="p-4 rounded-2xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-56">
{`[Unit]
Description=AssetCorp Enterprise Asset Management Daemon
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/assetcorp
ExecStart=/usr/bin/npm run preview -- --port ${currentPort} --host 0.0.0.0
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target`}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`[Unit]\nDescription=AssetCorp Enterprise Asset Management Daemon\nAfter=network.target\n\n[Service]\nType=simple\nUser=www-data\nWorkingDirectory=/var/www/assetcorp\nExecStart=/usr/bin/npm run preview -- --port ${currentPort} --host 0.0.0.0\nRestart=on-failure\nRestartSec=5\n\n[Install]\nWantedBy=multi-user.target`, 'systemd_conf')}
                      className="absolute right-3 top-3 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSnippet === 'systemd_conf' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet === 'systemd_conf' ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* METHOD 4: QUICK TUNNEL (ONLY IN SANDBOX / DEMO MODE) */}
            {isDemoMode && tunnelMethod === 'cf_quick' && (
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#7D562D] dark:text-amber-300 text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Cloudflare Quick Tunnel (Mode Sandbox & Demo Instan)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900 text-[#7D562D] dark:text-amber-200 font-mono text-[10px] font-bold">
                      Link Sementara
                    </span>
                  </div>
                  <p className="text-amber-800 dark:text-amber-300/90 text-xs leading-relaxed">
                    Hanya untuk uji coba cepat di tablet/HP tester. <strong>Perhatian:</strong> URL acak ini akan mati saat terminal ditutup dan tidak boleh digunakan untuk mencetak stiker barcode aset produksi.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                    Perintah Instan NPX (Tanpa Perlu Instalasi Software)
                  </label>
                  <div className="relative">
                    <pre className="p-3.5 pr-28 rounded-2xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                      npx cloudflared tunnel --url {localTargetUrl}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`npx cloudflared tunnel --url ${localTargetUrl}`, 'cf_quick_cmd')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSnippet === 'cf_quick_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet === 'cf_quick_cmd' ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
          <div className="spatial-canvas w-full max-w-md p-8 rounded-[36px] border border-white/60 dark:border-stone-700/60 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <h3 className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100">
                {editingCategory ? (isEn ? 'Edit Asset Category' : 'Ubah Kategori Aset') : (isEn ? 'New Asset Category' : 'Tambah Kategori Aset')}
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-200/80 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  {isEn ? 'Category Name *' : 'Nama Klasifikasi Kategori *'}
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Contoh: Infrastruktur Server & Cloud"
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  {isEn ? 'Category Code *' : 'Kode Singkatan Kategori *'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value.toUpperCase())}
                  placeholder="SRV"
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-bold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                    {isEn ? 'Useful Life (Years)' : 'Masa Manfaat (Tahun)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={catLife}
                    onChange={(e) => setCatLife(Number(e.target.value))}
                    className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                    {isEn ? 'Salvage Residual (%)' : 'Nilai Sisa Residu (%)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={catSalvage}
                    onChange={(e) => setCatSalvage(Number(e.target.value))}
                    className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200/80 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#5E7A68] hover:bg-[#4E6857] text-white shadow-md shadow-[#5E7A68]/20 transition-all cursor-pointer"
                >
                  {isEn ? 'Save Category' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
          <div className="spatial-canvas w-full max-w-md p-8 rounded-[36px] border border-white/60 dark:border-stone-700/60 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <h3 className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100">
                {editingLocation ? (isEn ? 'Edit Physical Location' : 'Ubah Lokasi Fisik') : (isEn ? 'New Physical Location' : 'Tambah Lokasi Fisik')}
              </h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-200/80 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  {isEn ? 'Facility / Building Name *' : 'Nama Fasilitas / Gedung *'}
                </label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="Contoh: Gedung Graha Asset Lt. 4"
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                    {isEn ? 'Location Code *' : 'Kode Lokasi *'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={locCode}
                    onChange={(e) => setLocCode(e.target.value.toUpperCase())}
                    placeholder="JKT-HQ"
                    className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-bold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                    {isEn ? 'City' : 'Kota'}
                  </label>
                  <input
                    type="text"
                    value={locCity}
                    onChange={(e) => setLocCity(e.target.value)}
                    placeholder="Jakarta Selatan"
                    className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  {isEn ? 'Physical Address' : 'Alamat Lengkap'}
                </label>
                <textarea
                  rows={3}
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                  placeholder="Jl. Jenderal Sudirman Kav. 52-53"
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200/80 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#5E7A68] hover:bg-[#4E6857] text-white shadow-md shadow-[#5E7A68]/20 transition-all cursor-pointer"
                >
                  {isEn ? 'Save Location' : 'Simpan Lokasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
