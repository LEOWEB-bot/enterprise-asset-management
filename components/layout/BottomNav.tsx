import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Box,
  ArrowLeftRight,
  Wrench,
  CheckSquare,
  FileBarChart,
  Settings,
  QrCode,
  LayoutGrid,
  X,
  Database,
  ShieldCheck,
  ShieldAlert,
  Code2,
  ClipboardCheck,
  ChevronRight,
  Scale,
  Search,
} from 'lucide-react';
import { getI18n, AppLanguage } from '../../utils/i18n';
import { StorageService } from '../../services/storageService';
import { User } from '../../types';
import { hasPermission } from '../../services/authService';

interface BottomNavProps {
  currentTab: string;
  language?: AppLanguage;
  onSelectTab?: (tab: any) => void;
  onTabChange?: (tab: any) => void;
  onOpenScanner?: () => void;
  pendingApprovalCount?: number;
  pendingApprovalsCount?: number;
  maintenanceCount?: number;
  currentUser?: User;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  language,
  onSelectTab,
  onTabChange,
  onOpenScanner = () => {},
  pendingApprovalCount = 0,
  pendingApprovalsCount = 0,
  maintenanceCount = 0,
  currentUser,
}) => {
  const [showAppLauncher, setShowAppLauncher] = useState(false);
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const launcherRef = useRef<HTMLDivElement>(null);

  const handleSelectTab = onSelectTab || onTabChange || (() => {});
  const effectiveApprovalCount = pendingApprovalCount || pendingApprovalsCount || 0;
  const currentLang: AppLanguage = language || StorageService.getLanguage() || 'id';
  const t = getI18n(currentLang);

  const canManageSettings = currentUser ? hasPermission(currentUser, 'settings.manage') : true;
  const canViewAudits = currentUser
    ? hasPermission(currentUser, 'audits.manage') || hasPermission(currentUser, 'settings.manage')
    : true;

  // Tutup popup Web-OS App Launcher jika klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (launcherRef.current && !launcherRef.current.contains(e.target as Node)) {
        setShowAppLauncher(false);
      }
    };
    if (showAppLauncher) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAppLauncher]);

  // Helper untuk menentukan tab aktif dengan alias
  const isItemActive = (id: string) => {
    if (id === 'dashboard') return currentTab === 'dashboard';
    if (id === 'assets') return currentTab === 'assets';
    if (id === 'movements') return currentTab === 'movements';
    if (id === 'maintenance') return currentTab === 'maintenance';
    if (id === 'approvals') return currentTab === 'approvals';
    if (id === 'reports') return currentTab === 'reports' || currentTab === 'depreciation';
    if (id === 'system-settings') return currentTab === 'system-settings' || currentTab === 'settings';
    if (id === 'audits') return currentTab === 'audits' || currentTab === 'stocktake';
    if (id === 'disposals') return currentTab === 'disposals' || currentTab === 'disposal';
    if (id === 'rbac') return currentTab === 'rbac';
    if (id === 'master-data') return currentTab === 'master-data';
    if (id === 'logs') return currentTab === 'logs' || currentTab === 'audittrail';
    if (id === 'integrations') return currentTab === 'integrations' || currentTab === 'api-docs';
    return currentTab === id;
  };

  // Cek apakah salah satu item di sub-menu sedang aktif
  const isLauncherActive = [
    'audits',
    'stocktake',
    'disposals',
    'disposal',
    'rbac',
    'master-data',
    'logs',
    'audittrail',
    'integrations',
    'api-docs',
  ].includes(currentTab);

  // Navigasi Utama Web-OS Dock (Grup Kiri)
  const dockLeftItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard, badge: null as number | null, badgeColor: '' },
    { id: 'assets', label: t.nav.assets, icon: Box, badge: null as number | null, badgeColor: '' },
    { id: 'movements', label: t.nav.movements, icon: ArrowLeftRight, badge: null as number | null, badgeColor: '' },
    { id: 'maintenance', label: t.nav.maintenance, icon: Wrench, badge: maintenanceCount > 0 ? maintenanceCount : null, badgeColor: 'bg-amber-500' },
  ];

  // Navigasi Utama Web-OS Dock (Grup Kanan)
  const dockRightItems = [
    { id: 'approvals', label: t.nav.approvals, icon: CheckSquare, badge: effectiveApprovalCount > 0 ? effectiveApprovalCount : null, badgeColor: 'bg-rose-500' },
    { id: 'reports', label: t.nav.reports, icon: FileBarChart, badge: null as number | null, badgeColor: '' },
    { id: 'system-settings', label: t.nav.systemSettings, icon: Settings, badge: null as number | null, badgeColor: '' },
  ];

  // Modul Bento Grid (Cluster Strategis)
  const bentoClusters = [
    {
      clusterName: 'Operasional & Likuidasi',
      items: [
        {
          id: 'disposals',
          label: 'Pelepasan & Lelang Aset',
          icon: Scale,
          desc: 'Likuidasi, lelang tender B2B & Berita Acara BAP',
          visible: true,
          badge: 'PSAK 16',
        },
        {
          id: 'audits',
          label: 'Audit Opname Fisik',
          icon: ClipboardCheck,
          desc: 'Scan barcode stocktake massal & rekonsiliasi',
          visible: canViewAudits,
          badge: 'Stocktake',
        },
      ],
    },
    {
      clusterName: 'Tata Kelola & Keamanan',
      items: [
        {
          id: 'rbac',
          label: 'RBAC & Hak Akses',
          icon: ShieldCheck,
          desc: 'Manajemen multi-role & otorisasi pengguna',
          visible: canManageSettings,
          badge: 'Security',
        },
        {
          id: 'logs',
          label: 'Audit Trail Forensik',
          icon: ShieldAlert,
          desc: 'Log jejak aktivitas & histori keamanan',
          visible: canViewAudits,
          badge: 'ISO 27001',
        },
      ],
    },
    {
      clusterName: 'Integrasi & Master Data',
      items: [
        {
          id: 'master-data',
          label: 'Master Data & Kebijakan',
          icon: Database,
          desc: 'Kategori, lokasi aset & PSAK 16 depresiasi',
          visible: canManageSettings,
          badge: 'Config',
        },
        {
          id: 'integrations',
          label: 'REST API & Webhooks',
          icon: Code2,
          desc: 'Gateway OpenAPI 3.0 & log event triggers',
          visible: true,
          badge: 'API Hub',
        },
      ],
    },
  ];

  const handleModuleClick = (id: string) => {
    handleSelectTab(id);
    setShowAppLauncher(false);
  };

  // Navigasi Mobile Kompak (2 item kiri + QR Scanner + Approvals + App Launcher)
  const mobileDockLeft = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard, badge: null as number | null, badgeColor: '' },
    { id: 'assets', label: t.nav.assets, icon: Box, badge: null as number | null, badgeColor: '' },
  ];

  const mobileDockRight = [
    { id: 'approvals', label: t.nav.approvals, icon: CheckSquare, badge: effectiveApprovalCount > 0 ? effectiveApprovalCount : null, badgeColor: 'bg-rose-500' },
  ];

  return (
    <>
      {/* ═══ 1. Web-OS Bento App Launcher Popover ════════════════════════════ */}
      {showAppLauncher && (
        <>
          {/* Spatial Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-xs animate-fadeIn"
            onClick={() => setShowAppLauncher(false)}
          />

          {/* Bento Grid Popover Container */}
          <div
            ref={launcherRef}
            className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-[860px] max-h-[82vh] overflow-y-auto bg-[#FBF9F4]/95 dark:bg-stone-900/95 backdrop-blur-3xl border border-stone-200/80 dark:border-stone-700/80 rounded-3xl sm:rounded-[36px] shadow-[0_25px_70px_rgba(0,0,0,0.25)] p-5 sm:p-7 space-y-6 animate-scaleUp scrollbar-none"
          >
            {/* Header Popover */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80 dark:border-stone-800/80">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#181F19]/5 dark:bg-white/10 text-[#181F19] dark:text-stone-200 border border-[#181F19]/10 dark:border-white/10">
                    AssetCorp OS • App Library
                  </span>
                </div>
                <h2 className="font-serif-display text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                  Modul & Aplikasi Enterprise
                </h2>
              </div>

              {/* Quick Search in Popover */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Cari modul atau fungsi..."
                    value={moduleSearchQuery}
                    onChange={(e) => setModuleSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full bg-white/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#181F19]/20"
                  />
                </div>
                <button
                  onClick={() => setShowAppLauncher(false)}
                  className="p-1.5 rounded-full hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors cursor-pointer"
                  title="Tutup Launcher"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 3 Clusters in Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {bentoClusters.map((cluster, cIdx) => {
                const filteredItems = cluster.items.filter(
                  (item) =>
                    item.visible &&
                    (item.label.toLowerCase().includes(moduleSearchQuery.toLowerCase()) ||
                      item.desc.toLowerCase().includes(moduleSearchQuery.toLowerCase()))
                );

                if (filteredItems.length === 0) return null;

                return (
                  <div key={cIdx} className="space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 px-1">
                      {cluster.clusterName}
                    </div>

                    <div className="space-y-2">
                      {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const active = isItemActive(item.id);

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleModuleClick(item.id)}
                            className={`w-full flex items-start gap-3.5 p-3.5 rounded-2xl transition-all text-left cursor-pointer border group ${
                              active
                                ? 'bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] border-[#181F19] dark:border-stone-100 shadow-md scale-[1.01]'
                                : 'bg-white/70 dark:bg-stone-800/60 border-stone-200/70 dark:border-stone-700/70 text-stone-800 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-xs'
                            }`}
                          >
                            <div
                              className={`p-2.5 rounded-xl transition-transform group-hover:scale-105 shrink-0 ${
                                active
                                  ? 'bg-white/15 dark:bg-black/10 text-white dark:text-[#181F19]'
                                  : 'bg-stone-100 dark:bg-stone-700/60 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-600/60'
                              }`}
                            >
                              <Icon className="w-5 h-5 stroke-[2px]" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-xs font-bold truncate ${active ? 'text-white dark:text-[#181F19]' : 'text-stone-900 dark:text-stone-100'}`}>
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span
                                    className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold ${
                                      active
                                        ? 'bg-white/20 dark:bg-black/15 text-white dark:text-[#181F19]'
                                        : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className={`text-[10px] mt-0.5 leading-relaxed line-clamp-2 ${active ? 'text-stone-300 dark:text-stone-600' : 'text-stone-500 dark:text-stone-400'}`}>
                                {item.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ═══ 2. Universal Floating Web-OS Dock ═══════════════════════════════ */}
      <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
        <div className="bg-white/85 dark:bg-stone-900/90 backdrop-blur-2xl border border-stone-200/70 dark:border-stone-700/70 rounded-full px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-1.5 shadow-[0_16px_40px_rgba(24,31,25,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
          {/* ─── DESKTOP & TABLET DOCK (md:flex) ─────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {/* Grup Kiri */}
            {dockLeftItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  title={item.label}
                  className={`group relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] shadow-md scale-105'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/80 dark:hover:bg-stone-800/80'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2px]" />

                  {/* Micro Badge */}
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-bold text-white shadow-xs ${
                        item.badgeColor || 'bg-rose-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Floating Desktop Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all pointer-events-none shadow-md">
                    {item.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Divider Spasial */}
          <div className="w-px h-6 bg-stone-300/60 dark:bg-stone-700/60 mx-1 hidden md:block" />

          {/* ─── Elevated Scanner Orb Center Hero ─────────────────────────── */}
          <div className="relative mx-0.5">
            <button
              onClick={onOpenScanner}
              className="group relative flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 -mt-2 sm:-mt-3 rounded-full bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] shadow-lg shadow-black/20 hover:scale-108 active:scale-95 transition-all duration-200 cursor-pointer ring-3 ring-[#FBF9F4] dark:ring-stone-950"
              title="Pindai QR / Barcode / RFID"
              aria-label="Pindai QR / Barcode / RFID"
            >
              <div className="absolute inset-0 rounded-full border border-white/20 dark:border-black/15" />
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2px] transition-transform group-hover:rotate-12" />

              {/* Floating Desktop Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all pointer-events-none shadow-md hidden md:block">
                Pindai QR / NFC
              </div>
            </button>
          </div>

          {/* Divider Spasial */}
          <div className="w-px h-6 bg-stone-300/60 dark:bg-stone-700/60 mx-1 hidden md:block" />

          {/* ─── DESKTOP & TABLET DOCK KANAN ─────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {/* Grup Kanan */}
            {dockRightItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  title={item.label}
                  className={`group relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] shadow-md scale-105'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/80 dark:hover:bg-stone-800/80'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2px]" />

                  {/* Micro Badge */}
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-bold text-white shadow-xs ${
                        item.badgeColor || 'bg-rose-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Floating Desktop Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all pointer-events-none shadow-md">
                    {item.label}
                  </div>
                </button>
              );
            })}

            {/* Tombol Web-OS App Launcher (Lainnya) */}
            <button
              onClick={() => setShowAppLauncher(!showAppLauncher)}
              title="Modul & Aplikasi Lainnya (App Library)"
              className={`group relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 cursor-pointer ${
                isLauncherActive || showAppLauncher
                  ? 'bg-[#7D562D] text-white shadow-md scale-105'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/80 dark:hover:bg-stone-800/80'
              }`}
            >
              <LayoutGrid className="w-5 h-5 stroke-[2px] transition-transform group-hover:scale-110" />

              {/* Floating Desktop Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all pointer-events-none shadow-md">
                Modul Lainnya
              </div>
            </button>
          </div>

          {/* ─── MOBILE DOCK (< 768px) ───────────────────────────────────── */}
          <div className="flex md:hidden items-center gap-1">
            {/* 2 Item Kiri */}
            {mobileDockLeft.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all cursor-pointer ${
                    active
                      ? 'bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19]'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 stroke-[2px]" />
                </button>
              );
            })}

            {/* 1 Item Kanan: Approvals */}
            {mobileDockRight.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all cursor-pointer ${
                    active
                      ? 'bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19]'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 stroke-[2px]" />
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center rounded-full text-[8px] font-bold bg-rose-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Tombol App Launcher Mobile */}
            <button
              onClick={() => setShowAppLauncher(!showAppLauncher)}
              className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all cursor-pointer ${
                isLauncherActive || showAppLauncher
                  ? 'bg-[#7D562D] text-white'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              <LayoutGrid className="w-4.5 h-4.5 stroke-[2px]" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
