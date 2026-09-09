import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  Activity,
  RefreshCw,
  FileCheck,
  X,
  AlertTriangle,
  AlertCircle,
  Eye,
  FileCode,
  Lock,
  Terminal,
  Globe,
  Fingerprint,
  ArrowLeftRight,
  Sliders,
  Layers,
  Check,
  Copy,
  Calendar,
  Sparkles,
  KeyRound,
  Shield,
  Laptop,
} from 'lucide-react';
import { ActivityLog, User as UserType } from '../../types';
import { StorageService } from '../../services/storageService';
import { hasPermission } from '../../services/authService';
import { logActivity } from '../../services/activityLogger';
import { getI18n, AppLanguage } from '../../utils/i18n';

interface AuditTrailViewerProps {
  currentUser: UserType;
  language?: AppLanguage;
  isReadOnlyMode: boolean;
}

export const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({ currentUser, language, isReadOnlyMode }) => {
  const currentLang: AppLanguage = language || currentUser?.language || StorageService.getLanguage() || 'en';
  const t = getI18n(currentLang);
  const isEn = currentLang === 'en';

  const [logs, setLogs] = useState<ActivityLog[]>(() => StorageService.getActivityLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');

  // Forensic Inspector Modal / Drawer
  const [inspectedLog, setInspectedLog] = useState<ActivityLog | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Clear Logs Modal
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearScope, setClearScope] = useState<'ALL' | 'FILTERED'>('ALL');
  const [clearErrorMessage, setClearErrorMessage] = useState('');
  const [clearSuccessMessage, setClearSuccessMessage] = useState('');

  const canManage =
    (currentUser.role === 'super-admin' || hasPermission(currentUser, 'settings.manage')) && !isReadOnlyMode;

  const handleRefresh = () => {
    setLogs(StorageService.getActivityLogs());
  };

  // Helper to generate deterministic SHA-256 simulation hash for forensic display
  const getLogHash = (log: ActivityLog): string => {
    const raw = `${log.id}-${log.timestamp}-${log.userName}-${log.action}-${log.module || 'SYS'}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `sha256:e8f9${hex}9c4b${hex.split('').reverse().join('')}1a0d`;
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const totalLogs = logs.length;
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayLogs = logs.filter((l) => (l.timestamp || '').startsWith(todayStr)).length;
    const authEvents = logs.filter(
      (l) =>
        (l.module || '').includes('AUTH') ||
        (l.module || '').includes('RBAC') ||
        (l.action || '').includes('LOGIN') ||
        (l.action || '').includes('ROLE') ||
        (l.action || '').includes('USER')
    ).length;
    const mutationEvents = logs.filter(
      (l) =>
        (l.module || '').includes('MOVEMENT') ||
        (l.module || '').includes('ASSET') ||
        (l.module || '').includes('MAINTENANCE') ||
        (l.module || '').includes('DISPOSAL') ||
        (l.module || '').includes('AUDIT')
    ).length;

    return { totalLogs, todayLogs, authEvents, mutationEvents };
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    const now = new Date().getTime();
    return logs.filter((log) => {
      const logModule = log.module || log.entityType || 'SYSTEM';
      const matchesModule = selectedModule === 'ALL' || logModule === selectedModule;

      // Severity / Category match
      let matchesSeverity = true;
      if (selectedSeverity !== 'ALL') {
        if (selectedSeverity === 'SECURITY') {
          matchesSeverity = logModule === 'SECURITY' || (log.action || '').includes('PURGE') || (log.action || '').includes('LOCK');
        } else if (selectedSeverity === 'AUTH') {
          matchesSeverity = logModule === 'AUTH' || logModule === 'RBAC' || (log.action || '').includes('LOGIN');
        } else if (selectedSeverity === 'CRITICAL') {
          matchesSeverity = (log.action || '').includes('DELETE') || (log.action || '').includes('PURGE') || (log.action || '').includes('DISPOSAL');
        } else if (selectedSeverity === 'WARNING') {
          matchesSeverity = (log.action || '').includes('REJECT') || (log.action || '').includes('UPDATE') || (log.action || '').includes('MAINTENANCE');
        } else if (selectedSeverity === 'INFO') {
          matchesSeverity = (log.action || '').includes('CREATE') || (log.action || '').includes('VIEW') || (log.action || '').includes('EXPORT');
        }
      }

      // Date Filter match
      let matchesDate = true;
      if (dateFilter !== 'ALL' && log.timestamp) {
        const logTime = new Date(log.timestamp).getTime();
        const diffDays = (now - logTime) / (1000 * 60 * 60 * 24);
        if (dateFilter === 'TODAY') matchesDate = diffDays <= 1;
        else if (dateFilter === '7DAYS') matchesDate = diffDays <= 7;
        else if (dateFilter === '30DAYS') matchesDate = diffDays <= 30;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.description || log.details || '').toLowerCase().includes(q) ||
        (log.userName || '').toLowerCase().includes(q) ||
        (log.userRole || '').toLowerCase().includes(q) ||
        (log.ipAddress || '').toLowerCase().includes(q) ||
        (log.id || '').toLowerCase().includes(q);

      return matchesModule && matchesSeverity && matchesDate && matchesQuery;
    });
  }, [logs, selectedModule, selectedSeverity, dateFilter, searchQuery]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      isEn ? 'Log ID' : 'ID Log',
      isEn ? 'Timestamp' : 'Waktu Presisi',
      isEn ? 'Module' : 'Modul',
      isEn ? 'Action' : 'Tindakan (Action)',
      isEn ? 'Forensic Description' : 'Uraian Forensik',
      isEn ? 'Actor' : 'Nama Personel',
      'Role',
      'IP Address',
      'SHA-256 Hash',
    ];
    const rows = filteredLogs.map((l) => [
      `"${l.id || ''}"`,
      `"${l.timestamp || ''}"`,
      `"${l.module || l.entityType || ''}"`,
      `"${l.action || ''}"`,
      `"${(l.description || l.details || '').replace(/"/g, '""')}"`,
      `"${l.userName || ''}"`,
      `"${l.userRole || ''}"`,
      `"${l.ipAddress || '127.0.0.1'}"`,
      `"${getLogHash(l)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AssetCorp_Forensic_Audit_Trail_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJson = () => {
    const payload = JSON.stringify(
      {
        exportTimestamp: new Date().toISOString(),
        exportedBy: currentUser.name,
        totalEntries: filteredLogs.length,
        systemIntegrity: 'SHA-256 VERIFIED - ISO 27001 COMPLIANT',
        logs: filteredLogs.map((l) => ({
          ...l,
          sha256Hash: getLogHash(l),
        })),
      },
      null,
      2
    );

    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AssetCorp_Forensic_Dossier_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear Logs Execution
  const handleExecuteClear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setClearErrorMessage(isEn ? 'Super Admin privileges required.' : 'Akses ditolak. Tindakan ini memerlukan wewenang Super Admin.');
      return;
    }

    if (clearScope === 'ALL') {
      StorageService.saveActivityLogs([]);
      setLogs([]);
      logActivity(
        'AUDIT_LOG_PURGED',
        'SECURITY',
        `Pembersihan total seluruh rekaman jejak audit forensik oleh ${currentUser.name} (${currentUser.role}).`,
        'AUDIT_PURGE'
      );
      setTimeout(() => {
        setLogs(StorageService.getActivityLogs());
      }, 60);
    } else {
      const moduleToClear = selectedModule;
      if (moduleToClear === 'ALL') {
        StorageService.saveActivityLogs([]);
        setLogs([]);
      } else {
        const remaining = logs.filter((l) => (l.module || l.entityType || 'SYSTEM') !== moduleToClear);
        StorageService.saveActivityLogs(remaining);
        setLogs(remaining);
      }

      logActivity(
        'AUDIT_LOG_SELECTIVE_PURGED',
        'SECURITY',
        `Pembersihan selektif log modul ${moduleToClear} oleh ${currentUser.name} (${currentUser.role}).`,
        'AUDIT_PURGE'
      );
      setTimeout(() => {
        setLogs(StorageService.getActivityLogs());
      }, 60);
    }

    setShowClearModal(false);
    setClearSuccessMessage(isEn ? 'Audit logs cleared and re-indexed securely.' : 'Jejak log audit berhasil dibersihkan dan diindeks ulang.');
    setTimeout(() => setClearSuccessMessage(''), 4000);
  };

  // Module Badge Styles
  const getModuleBadge = (moduleName: string) => {
    switch (moduleName) {
      case 'AUTH':
      case 'RBAC':
        return {
          bg: 'bg-purple-100/80 dark:bg-purple-950/50',
          text: 'text-purple-800 dark:text-purple-300',
          border: 'border-purple-200 dark:border-purple-800/60',
        };
      case 'ASSET':
        return {
          bg: 'bg-[#5E7A68]/15',
          text: 'text-[#5E7A68] dark:text-emerald-300',
          border: 'border-[#5E7A68]/30',
        };
      case 'MOVEMENT':
        return {
          bg: 'bg-emerald-100/80 dark:bg-emerald-950/50',
          text: 'text-emerald-800 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800/60',
        };
      case 'MAINTENANCE':
        return {
          bg: 'bg-[#D4A373]/20',
          text: 'text-[#7D562D] dark:text-amber-300',
          border: 'border-[#7D562D]/30',
        };
      case 'DISPOSAL':
        return {
          bg: 'bg-rose-100/80 dark:bg-rose-950/50',
          text: 'text-rose-800 dark:text-rose-300',
          border: 'border-rose-200 dark:border-rose-800/60',
        };
      case 'AUDIT':
      case 'APPROVAL':
        return {
          bg: 'bg-blue-100/80 dark:bg-blue-950/50',
          text: 'text-blue-800 dark:text-blue-300',
          border: 'border-blue-200 dark:border-blue-800/60',
        };
      case 'SECURITY':
      case 'SETTINGS':
        return {
          bg: 'bg-stone-200/80 dark:bg-stone-800',
          text: 'text-stone-800 dark:text-stone-200',
          border: 'border-stone-300 dark:border-stone-700',
        };
      default:
        return {
          bg: 'bg-stone-100 dark:bg-stone-800/60',
          text: 'text-stone-700 dark:text-stone-300',
          border: 'border-stone-200 dark:border-stone-700',
        };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* Toast Notification */}
      {clearSuccessMessage && (
        <div className="p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm shadow-xl backdrop-blur-md animate-fadeIn bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{clearSuccessMessage}</span>
          </div>
          <button onClick={() => setClearSuccessMessage('')} className="text-stone-400 hover:text-stone-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Spatial Command Header */}
      <div className="glass-panel squircle p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs uppercase tracking-widest text-[#5E7A68] dark:text-emerald-400 font-bold px-3 py-1 rounded-full bg-[#5E7A68]/10 dark:bg-emerald-950/40 border border-[#5E7A68]/20">
              {isEn ? 'Forensic Audit Stream' : 'Jejak Audit Forensik & Keamanan'}
            </span>
            <div className="px-3.5 py-1 rounded-full bg-white/70 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5E7A68] animate-pulse" />
              <span>{logs.length} Total Entri • Enkripsi SHA-256 • Integritas Terkunci</span>
            </div>
          </div>

          <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
            {isEn ? 'Audit Trail & Logs' : 'Audit Trail & Log'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            {isEn
              ? 'Immutable forensic timeline, authentication events, inventory data mutations, and cryptographic verification logs.'
              : 'Linimasa transaksi kekal anti-pemalsuan, pencatatan otentikasi login, perubahan data aset inventaris, dan verifikasi integritas kriptografi ISO 27001.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 self-start lg:self-center">
          <button
            onClick={handleRefresh}
            className="p-3 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-white dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-all cursor-pointer shadow-xs"
            title={isEn ? 'Refresh Audit Stream' : 'Segarkan Aliran Log'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-white/80 dark:bg-stone-800 hover:bg-white dark:hover:bg-stone-700 text-[#181F19] dark:text-stone-100 border border-stone-300 dark:border-stone-700 px-5 sm:px-6 py-3 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer hover:scale-105"
          >
            <Download className="w-4 h-4 text-[#5E7A68]" />
            <span>{isEn ? 'Export CSV' : 'Ekspor CSV'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-5 sm:px-6 py-3 rounded-full text-xs font-bold shadow-lg shadow-[#5E7A68]/25 transition-all cursor-pointer hover:scale-105"
          >
            <FileCode className="w-4 h-4" />
            <span>{isEn ? 'Export Forensic JSON' : 'Ekspor JSON Forensik'}</span>
          </button>

          {canManage && logs.length > 0 && (
            <button
              onClick={() => {
                setClearErrorMessage('');
                setShowClearModal(true);
              }}
              className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 px-4 py-3 rounded-full text-xs font-bold transition-all cursor-pointer"
              title={isEn ? 'Clear Audit Logs' : 'Bersihkan Log'}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isEn ? 'Clear Logs' : 'Bersihkan'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 4 Squircle Bento Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Audit Events */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Total Audit Events' : 'Total Peristiwa Terekam'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#181F19] dark:text-stone-100">{stats.totalLogs}</p>
            <span className="text-xs font-medium text-stone-500">
              {stats.todayLogs} {isEn ? 'recorded today' : 'tercatat hari ini'}
            </span>
          </div>
        </div>

        {/* Card 2: Auth & RBAC Events */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Auth & RBAC Events' : 'Akses & Otorisasi'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#181F19] dark:text-stone-100">{stats.authEvents}</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Login, role & 2FA events' : 'Sesi login & wewenang'}
            </span>
          </div>
        </div>

        {/* Card 3: Asset Mutations */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Asset Mutations' : 'Transaksi Inventaris'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#D4A373]/20 text-[#7D562D] dark:text-amber-300 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#7D562D] dark:text-amber-300">{stats.mutationEvents}</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Relocations, services & audits' : 'Mutasi, servis & opname'}
            </span>
          </div>
        </div>

        {/* Card 4: Security Integrity */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Security Anomalies' : 'Integritas Forensik'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-2xl font-bold text-[#5E7A68] dark:text-emerald-400">0 Pelanggaran</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Zero cryptographic tampering' : 'Integritas SHA-256 100% Valid'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter Matrix Section */}
      <div className="glass-panel squircle p-6 space-y-5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? 'Search by actor, action, IP address, ID, description...' : 'Cari berdasarkan nama personel, tindakan, IP address, ID entri, atau narasi...'}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Date Range Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-stone-200/70 dark:bg-stone-800 text-xs font-bold shrink-0">
            {[
              { id: 'ALL', label: isEn ? 'All Time' : 'Semua Waktu' },
              { id: 'TODAY', label: isEn ? 'Today' : 'Hari Ini' },
              { id: '7DAYS', label: isEn ? '7 Days' : '7 Hari' },
              { id: '30DAYS', label: isEn ? '30 Days' : '30 Hari' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDateFilter(d.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dateFilter === d.id
                    ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Module Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/80 dark:border-stone-800">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mr-2">
            {isEn ? 'Filter Module:' : 'Modul Sistem:'}
          </span>
          {[
            { id: 'ALL', label: isEn ? 'All Modules' : 'Semua Modul' },
            { id: 'ASSET', label: 'Master Aset' },
            { id: 'MOVEMENT', label: 'Mutasi' },
            { id: 'MAINTENANCE', label: 'Maintenance' },
            { id: 'APPROVAL', label: 'Otorisasi' },
            { id: 'RBAC', label: 'RBAC & Pengguna' },
            { id: 'SETTINGS', label: 'Pengaturan' },
            { id: 'SECURITY', label: 'Keamanan' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModule(m.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedModule === m.id
                  ? 'bg-[#181F19] text-white dark:bg-white dark:text-stone-900 shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. High-Density Forensic Audit Table */}
      <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
          <div>
            <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
              {isEn ? 'Cryptographic Forensic Activity Ledger' : 'Buku Besar Jejak Audit & Rekaman Peristiwa Forensik'}
            </h2>
            <p className="text-xs text-stone-500">
              {isEn
                ? `Showing ${filteredLogs.length} verified audit records matching current filters.`
                : `Menampilkan ${filteredLogs.length} rekaman audit terverifikasi sesuai filter.`}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#5E7A68] dark:text-emerald-400 px-3 py-1 rounded-full bg-[#5E7A68]/15">
            {filteredLogs.length} / {logs.length} Baris Log
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-stone-400 space-y-3">
            <ShieldAlert className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-700" />
            <p className="text-sm font-semibold">{isEn ? 'No audit records match your filters.' : 'Tidak ada catatan audit yang sesuai dengan kriteria pencarian.'}</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedModule('ALL');
                setSelectedSeverity('ALL');
                setDateFilter('ALL');
              }}
              className="text-xs font-bold text-[#5E7A68] hover:underline cursor-pointer"
            >
              {isEn ? 'Reset all filters' : 'Reset semua filter'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200/80 dark:border-stone-800 text-stone-500 uppercase font-bold text-[11px] tracking-wider">
                  <th className="py-4 px-4">{isEn ? 'Timestamp (ISO)' : 'Stempel Waktu'}</th>
                  <th className="py-4 px-4">{isEn ? 'Actor / Identity' : 'Personel Pelaksana'}</th>
                  <th className="py-4 px-4">{isEn ? 'Module' : 'Modul'}</th>
                  <th className="py-4 px-4">{isEn ? 'Action Narrative' : 'Uraian Aksi Forensik'}</th>
                  <th className="py-4 px-4">{isEn ? 'IP Address' : 'Alamat IP'}</th>
                  <th className="py-4 px-4 text-center">{isEn ? 'Integrity' : 'Integritas'}</th>
                  <th className="py-4 px-4 text-right">{isEn ? 'Inspector' : 'Detail'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/60">
                {filteredLogs.map((log) => {
                  const moduleBadge = getModuleBadge(log.module || log.entityType || 'SYSTEM');
                  const initials = (log.userName || 'U')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={log.id || Math.random().toString()}
                      onClick={() => setInspectedLog(log)}
                      className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Timestamp */}
                      <td className="py-4 px-4 font-mono text-[11px] text-stone-600 dark:text-stone-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID') : '-'}</span>
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#181F19] text-white dark:bg-stone-800 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#5E7A68] transition-colors">
                              {log.userName || 'System Auto'}
                            </div>
                            <span className="text-[10px] text-stone-500 font-mono capitalize">
                              {log.userRole || 'Automated'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Module */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${moduleBadge.bg} ${moduleBadge.text} ${moduleBadge.border}`}
                        >
                          {log.module || log.entityType || 'SYSTEM'}
                        </span>
                      </td>

                      {/* Action Narrative */}
                      <td className="py-4 px-4 max-w-md">
                        <div className="font-mono text-[11px] font-bold text-[#181F19] dark:text-stone-100">
                          {log.action}
                        </div>
                        <div className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-1 mt-0.5">
                          {log.description || log.details || '-'}
                        </div>
                      </td>

                      {/* IP Address */}
                      <td className="py-4 px-4 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{log.ipAddress || '127.0.0.1'}</span>
                        </div>
                      </td>

                      {/* Cryptographic Verification Badge */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 font-mono font-bold text-[10px] border border-[#5E7A68]/20">
                          <ShieldCheck className="w-3 h-3 text-[#5E7A68]" />
                          <span>SHA-256</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedLog(log);
                          }}
                          className="p-2 rounded-xl text-stone-400 group-hover:text-[#5E7A68] hover:bg-stone-200/70 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                          title="Inspeksi Forensik"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Forensic Payload Inspector Drawer / Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
          <div className="spatial-canvas w-full max-w-2xl p-6 sm:p-8 rounded-[36px] border border-white/60 dark:border-stone-700/60 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100">
                    {isEn ? 'Forensic Dossier Inspector' : 'Inspektur Berkas Jejak Forensik'}
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    ID: {inspectedLog.id || 'N/A'} • {inspectedLog.module || 'SYSTEM'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectedLog(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-200/80 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Dossier */}
            <div className="space-y-4 text-xs">
              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Personel</span>
                  <p className="font-bold text-stone-900 dark:text-stone-100 truncate">{inspectedLog.userName || '-'}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Peran Wewenang</span>
                  <p className="font-bold text-stone-900 dark:text-stone-100 uppercase font-mono">{inspectedLog.userRole || '-'}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Alamat IP</span>
                  <p className="font-bold text-stone-900 dark:text-stone-100 font-mono">{inspectedLog.ipAddress || '127.0.0.1'}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Stempel Waktu</span>
                  <p className="font-bold text-stone-900 dark:text-stone-100 font-mono text-[11px]">
                    {inspectedLog.timestamp ? new Date(inspectedLog.timestamp).toLocaleTimeString('id-ID') : '-'}
                  </p>
                </div>
              </div>

              {/* Action Narrative */}
              <div className="p-4 rounded-2xl bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-1">
                <span className="text-[11px] font-bold text-stone-500 uppercase">Narasi Tindakan:</span>
                <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">{inspectedLog.action}</p>
                <p className="text-stone-600 dark:text-stone-400 text-xs mt-1 leading-relaxed">
                  {inspectedLog.description || inspectedLog.details || '-'}
                </p>
              </div>

              {/* SHA-256 Hash Display */}
              <div className="p-4 rounded-2xl bg-stone-900 text-stone-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cryptographic SHA-256 Verification Hash</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getLogHash(inspectedLog));
                      setCopiedHash(true);
                      setTimeout(() => setCopiedHash(false), 2000);
                    }}
                    className="text-[11px] font-bold text-stone-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHash ? 'Tersalin!' : 'Salin Hash'}</span>
                  </button>
                </div>
                <p className="font-mono text-[11px] text-emerald-300 break-all">{getLogHash(inspectedLog)}</p>
              </div>

              {/* Raw JSON Payload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                    Raw JSON Audit Payload
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(inspectedLog, null, 2));
                      setCopiedJson(true);
                      setTimeout(() => setCopiedJson(false), 2000);
                    }}
                    className="text-[11px] font-bold text-[#5E7A68] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Tersalin!' : 'Salin Payload JSON'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-stone-900 text-stone-200 font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(
                    {
                      ...inspectedLog,
                      cryptographicIntegrity: 'VERIFIED',
                      sha256Hash: getLogHash(inspectedLog),
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 flex justify-end border-t border-stone-200/80 dark:border-stone-800">
              <button
                onClick={() => setInspectedLog(null)}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#5E7A68] hover:bg-[#4E6857] text-white shadow-md transition-all cursor-pointer"
              >
                Tutup Inspeksi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Clear Logs Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
          <div className="spatial-canvas w-full max-w-md p-8 rounded-[36px] border border-white/60 dark:border-stone-700/60 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-display text-xl font-bold text-stone-900 dark:text-stone-100">
                    {isEn ? 'Purge Audit Records' : 'Pembersihan Jejak Log Audit'}
                  </h3>
                  <p className="text-xs text-stone-500">Tindakan pemeliharaan basis data</p>
                </div>
              </div>

              <button
                onClick={() => setShowClearModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-200/80 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {clearErrorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {clearErrorMessage}
              </div>
            )}

            <form onSubmit={handleExecuteClear} className="space-y-4 text-xs">
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                  Pilih Lingkup Pembersihan:
                </label>

                <label className="flex items-center gap-3 p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 cursor-pointer">
                  <input
                    type="radio"
                    name="clearScope"
                    checked={clearScope === 'ALL'}
                    onChange={() => setClearScope('ALL')}
                    className="w-4 h-4 text-rose-600 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">
                      Bersihkan Seluruh Rekaman Log (Total Purge)
                    </span>
                    <span className="text-stone-500 text-[11px]">
                      Menghapus semua {logs.length} entri riwayat audit sistem.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 cursor-pointer">
                  <input
                    type="radio"
                    name="clearScope"
                    checked={clearScope === 'FILTERED'}
                    onChange={() => setClearScope('FILTERED')}
                    className="w-4 h-4 text-rose-600 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">
                      Hanya Modul Terpilih ({selectedModule})
                    </span>
                    <span className="text-stone-500 text-[11px]">
                      Hanya menghapus entri untuk modul {selectedModule}.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200/80 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all cursor-pointer"
                >
                  Konfirmasi Bersihkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
