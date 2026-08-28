import React from 'react';
import {
  LayoutDashboard,
  Box,
  ArrowLeftRight,
  Wrench,
  ClipboardCheck,
  CheckSquare,
  FileBarChart,
  Settings,
  Database,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Code2,
  QrCode,
  Building2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { User } from '../../types';
import { hasPermission, getRoleBadgeClass } from '../../services/authService';
import { StorageService } from '../../services/storageService';
import { getI18n, AppLanguage } from '../../utils/i18n';

export type NavigationTab =
  | 'dashboard'
  | 'assets'
  | 'movements'
  | 'maintenance'
  | 'audits'
  | 'approvals'
  | 'reports'
  | 'rbac'
  | 'system-settings'
  | 'master-data'
  | 'settings'
  | 'logs'
  | 'setup'
  | 'api-docs';

interface SidebarProps {
  currentTab: string;
  onSelectTab?: (tab: any) => void;
  onTabChange?: (tab: any) => void;
  currentUser: User;
  language?: AppLanguage;
  assetCount?: number;
  pendingApprovalCount?: number;
  pendingApprovalsCount?: number;
  maintenanceCount?: number;
  isReadOnlyMode?: boolean;
  onOpenScanner?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onTabChange,
  currentUser,
  language,
  assetCount = 0,
  pendingApprovalCount = 0,
  pendingApprovalsCount = 0,
  maintenanceCount = 0,
  isReadOnlyMode = false,
  onOpenScanner = () => {},
  isOpenMobile,
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
}) => {
  const handleSelectTab = onSelectTab || onTabChange || (() => {});
  const effectiveApprovalCount = pendingApprovalCount || pendingApprovalsCount || 0;
  const appName = StorageService.getAppName();
  const canManageSettings = hasPermission(currentUser, 'settings.manage');
  const canViewAudits = hasPermission(currentUser, 'audits.manage') || hasPermission(currentUser, 'settings.manage');

  const currentLang: AppLanguage = language || currentUser.language || StorageService.getLanguage() || 'id';
  const t = getI18n(currentLang);

  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: t.nav.dashboard,
      icon: LayoutDashboard,
      badge: null,
      visible: true,
    },
    {
      id: 'assets' as NavigationTab,
      label: t.nav.assets,
      icon: Box,
      badge: assetCount > 0 ? assetCount : null,
      visible: true,
    },
    {
      id: 'movements' as NavigationTab,
      label: t.nav.movements,
      icon: ArrowLeftRight,
      badge: null,
      visible: true,
    },
    {
      id: 'maintenance' as NavigationTab,
      label: t.nav.maintenance,
      icon: Wrench,
      badge: maintenanceCount > 0 ? maintenanceCount : null,
      badgeColor: 'bg-amber-500',
      visible: true,
    },
    {
      id: 'audits' as NavigationTab,
      label: t.nav.audits,
      icon: ClipboardCheck,
      badge: null,
      visible: canViewAudits,
    },
    {
      id: 'approvals' as NavigationTab,
      label: t.nav.approvals,
      icon: CheckSquare,
      badge: effectiveApprovalCount > 0 ? effectiveApprovalCount : null,
      badgeColor: 'bg-rose-500',
      visible: true,
    },
    {
      id: 'reports' as NavigationTab,
      label: t.nav.reports,
      icon: FileBarChart,
      badge: null,
      visible: true,
    },
    {
      id: 'rbac' as NavigationTab,
      label: t.nav.rbac,
      icon: ShieldCheck,
      badge: null,
      visible: canManageSettings,
    },
    {
      id: 'system-settings' as NavigationTab,
      label: t.nav.systemSettings,
      icon: Settings,
      badge: null,
      visible: true,
    },
    {
      id: 'master-data' as NavigationTab,
      label: t.nav.masterData,
      icon: Database,
      badge: isReadOnlyMode ? 'Locked' : null,
      badgeColor: 'bg-amber-500',
      visible: canManageSettings,
    },
    {
      id: 'logs' as NavigationTab,
      label: t.nav.logs,
      icon: ShieldAlert,
      badge: null,
      visible: canViewAudits,
    },
    {
      id: 'api-docs' as NavigationTab,
      label: t.nav.apiDocs,
      icon: Code2,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      visible: true,
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/70 z-50 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container — Hanya Mobile Drawer, Desktop selalu tersembunyi */}
      <aside
        className={`bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shrink-0 overflow-x-hidden
          md:hidden
          ${isOpenMobile
            ? 'fixed inset-y-0 left-0 w-72 max-w-[85vw] translate-x-0 z-50 shadow-2xl shadow-slate-900/40'
            : 'fixed inset-y-0 left-0 -translate-x-full pointer-events-none'
          }`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center border-b border-slate-200 dark:border-slate-800 h-[65px] transition-all px-4 justify-between shrink-0 overflow-hidden ${
            collapsed ? 'md:justify-center md:px-2' : 'md:justify-between md:px-4'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-lg cursor-pointer hover:scale-105 transition-transform"
              onClick={collapsed ? onToggleCollapse : undefined}
              title={collapsed ? 'Klik untuk Buka Menu Lengkap' : 'AssetCorp EAM'}
            >
              <Building2 className="w-5 h-5" />
            </div>
            {/* Desktop Brand Text when Expanded */}
            {!collapsed && (
              <div className="min-w-0 truncate hidden md:block">
                <div className="font-bold text-sm text-slate-900 dark:text-white tracking-tight truncate">
                  {appName}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Enterprise Asset Management
                </div>
              </div>
            )}
            {/* Mobile Brand Text (Always Shown on Mobile) */}
            <div className="min-w-0 truncate md:hidden">
              <div className="font-bold text-sm text-slate-900 dark:text-white tracking-tight truncate">
                {appName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Enterprise Asset Management
              </div>
            </div>
          </div>

          {/* Desktop Close (X) Button when Expanded */}
          {!collapsed && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Menu ke Mode Ikon"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Mobile Close Button (X) - Always visible on mobile */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Menu"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick QR/RFID Scanner Button */}
        <div className={`pt-3 transition-all px-3 shrink-0 overflow-hidden ${collapsed ? 'md:px-2' : 'md:px-3'}`}>
          <button
            onClick={() => {
              onOpenScanner();
              if (onCloseMobile) onCloseMobile();
            }}
            title="Scan QR / RFID Lapangan"
            className={`w-full flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer ${
              collapsed
                ? 'justify-center gap-2 py-2.5 px-3 md:justify-center md:p-2.5'
                : 'justify-center gap-2 py-2.5 px-3'
            }`}
          >
            <QrCode className="w-4 h-4 shrink-0" />
            {/* Desktop Label when expanded */}
            {!collapsed && <span className="truncate hidden md:inline">Scan QR / RFID</span>}
            {/* Mobile Label (Always shown on mobile) */}
            <span className="truncate md:hidden">Scan QR / RFID Lapangan</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 px-3 ${
            collapsed ? 'md:px-2' : 'md:px-3'
          }`}
        >
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;

              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => {
                      handleSelectTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    title={item.label}
                    className={`w-full flex items-center text-xs font-medium rounded-xl transition-all cursor-pointer ${
                      collapsed
                        ? 'justify-between px-3 py-2.5 md:justify-center md:p-2.5'
                        : 'justify-between px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 relative">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white'
                        }`}
                      />
                      {!collapsed && <span className="truncate hidden md:inline">{item.label}</span>}
                      <span className="truncate md:hidden">{item.label}</span>

                      {/* Mini Badge Dot when Collapsed on Desktop */}
                      {collapsed && item.badge !== null && item.badge !== undefined && (
                        <span className="absolute -top-1.5 -right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 hidden md:block" />
                      )}
                    </div>

                    {!collapsed && item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full hidden md:inline ${
                          item.badgeColor ||
                          (isActive
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Mobile Badge (Always Shown on Mobile) */}
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full md:hidden ${
                          item.badgeColor ||
                          (isActive
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
        </div>

        {/* User Scope / Status Footer */}
        <div
          className={`border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 transition-all p-3 shrink-0 overflow-hidden ${
            collapsed ? 'md:p-2 md:flex md:flex-col md:items-center' : 'md:p-3'
          }`}
        >
          {/* Desktop Collapsed Profile View */}
          {collapsed && (
            <div className="hidden md:block relative cursor-pointer" title={`${currentUser.name} (${currentUser.role}) - ${currentUser.department}`}>
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-blue-500/30"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
          )}

          {/* Desktop Expanded Profile View */}
          {!collapsed && (
            <div className="hidden md:block">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                <span>Peran Aktif:</span>
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded font-semibold border ${getRoleBadgeClass(
                    currentUser.role
                  )}`}
                >
                  {currentUser.role}
                </span>
              </div>
              <div className="text-[11px] text-slate-800 dark:text-slate-300 truncate font-medium">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {currentUser.department} • {currentUser.location}
              </div>
            </div>
          )}

          {/* Mobile Profile View (Always full and cleanly displayed on mobile) */}
          <div className="md:hidden">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              <span>Peran Aktif:</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded font-semibold border ${getRoleBadgeClass(
                  currentUser.role
                )}`}
              >
                {currentUser.role}
              </span>
            </div>
            <div className="text-[11px] text-slate-800 dark:text-slate-300 truncate font-medium">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {currentUser.department} • {currentUser.location}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
