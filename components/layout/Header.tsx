import React, { useState } from 'react';
import {
  Bell,
  ShieldCheck,
  Search,
  LogOut,
  ChevronDown,
  QrCode,
  Lock,
  Settings,
  Globe,
  Building2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Menu,
} from 'lucide-react';
import { User, AppNotification } from '../../types';
import { INITIAL_USERS } from '../../data/enterprise-asset-management';
import { StorageService } from '../../services/storageService';
import { getRoleBadgeClass } from '../../services/authService';
import { getI18n, AppLanguage } from '../../utils/i18n';

interface HeaderProps {
  currentUser: User;
  users?: User[];
  language?: AppLanguage;
  onLanguageChange?: (lang: AppLanguage) => void;
  onSwitchUser?: (user: User) => void;
  onUserChange?: (user: User) => void;
  onLogout?: () => void;
  onOpenScanner?: () => void;
  onNavigateToSettings?: () => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onMarkNotificationsAsRead?: () => void;
  isReadOnlyMode?: boolean;
  onToggleSidebar?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  language,
  onLanguageChange,
  onSwitchUser,
  onUserChange,
  onLogout,
  onOpenScanner = () => { },
  onNavigateToSettings,
  onSearch = (_query: string) => { },
  searchQuery = '',
  notifications = [],
  onMarkNotificationRead = (_id: string) => { },
  onMarkAllNotificationsRead,
  onMarkNotificationsAsRead,
  isReadOnlyMode = false,
  onToggleSidebar,
  onOpenMobileMenu,
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(true);

  const currentLang: AppLanguage = language || currentUser.language || StorageService.getLanguage() || 'en';
  const t = getI18n(currentLang);
  const appName = StorageService.getAppName();

  const handleLanguageToggle = () => {
    const nextLang: AppLanguage = currentLang === 'id' ? 'en' : 'id';
    StorageService.setLanguage(nextLang);
    if (onLanguageChange) {
      onLanguageChange(nextLang);
    }
  };

  const handleSwitchUser = onSwitchUser || onUserChange || (() => { });
  const handleMarkAllRead = onMarkAllNotificationsRead || onMarkNotificationsAsRead || (() => { });
  const handleToggleMenu = onToggleSidebar || onOpenMobileMenu || (() => { });
  const availableUsers = users && users.length > 0 ? users : [INITIAL_USERS[0]];

  const unreadCount = (notifications || []).filter((n) => !n.isRead).length;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex flex-col bg-[#FBF9F4]/85 dark:bg-stone-900/90 backdrop-blur-2xl border-b border-stone-200/60 dark:border-stone-700/60 shadow-xs transition-colors">
      {/* ─── Mode Read-Only / Audit Freeze Banner ───────────────────────── */}
      {isReadOnlyMode && (
        <div className="bg-amber-500 text-stone-950 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-1 text-xs font-semibold flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2 w-full">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>{t.header.readOnlyBanner}</span>
          </div>
        </div>
      )}

      {/* ─── Main Spatial Top Bar Container ─────────────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-2.5 gap-2 sm:gap-4 w-full">
        {/* ─── 1. Left Cluster: Brand, Logo & Compliance Status ─────────── */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Desktop & Mobile Brand Identity */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] flex items-center justify-center font-bold text-sm shadow-xs shadow-black/10">
              <Building2 className="w-4 h-4 stroke-[2px]" />
            </div>
            <div className="leading-tight">
              <div className="text-xs font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif-display truncate max-w-[150px]">
                {appName}
              </div>
              <div className="text-[9px] font-semibold text-[#7D562D] dark:text-amber-400 uppercase tracking-wider">
                Enterprise EAM
              </div>
            </div>
          </div>

          {/* Compliance & Security Pill Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 text-[10px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ISO 27001 Verified • Live Sync</span>
          </div>
        </div>

        {/* ─── 2. Center Cluster: Global Command Omnibar ─────────────────── */}
        <div className="flex-1 max-w-lg mx-2 hidden md:block">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder={t.header.searchPlaceholder || 'Cari aset, serial number, lokasi, dokumen BAP...'}
              value={searchQuery || ''}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-9 pr-16 py-1.5 text-xs bg-white/70 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700/80 rounded-full text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#181F19]/20 dark:focus:ring-white/20 transition-all"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold text-stone-500 bg-stone-100 dark:bg-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-600 rounded-md">
                Ctrl K
              </kbd>
            </div>
          </div>
        </div>

        {/* ─── 3. Right Cluster: Quick Control Center & Profile Capsule ──── */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Language Toggle Capsule (ID / EN) */}
          <button
            onClick={handleLanguageToggle}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-800 rounded-full border border-stone-200/80 dark:border-stone-700/80 transition-all cursor-pointer shadow-xs"
            title={currentLang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
            aria-label="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
            <span>{currentLang === 'id' ? 'ID' : 'EN'}</span>
          </button>

          {/* Notification Hub with Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 rounded-full text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white bg-white/80 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80 transition-all cursor-pointer shadow-xs"
              title={t.header.notifications}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-stone-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Panel */}
            {showNotifDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FBF9F4]/98 dark:bg-stone-900/98 backdrop-blur-2xl rounded-3xl shadow-2xl border border-stone-200/90 dark:border-stone-700/90 py-3 z-50 animate-scaleUp">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-stone-200/80 dark:border-stone-800/80">
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-[#7D562D] dark:text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                        {t.header.systemNotifications}
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#7D562D] hover:underline dark:text-amber-400 font-bold cursor-pointer"
                      >
                        {t.header.markAllRead}
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-stone-200/50 dark:divide-stone-800/50">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-stone-500">
                        {t.header.noNotifications}
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => onMarkNotificationRead(notif.id)}
                          className={`p-3.5 text-xs cursor-pointer hover:bg-stone-100/60 dark:hover:bg-stone-800/60 transition-colors flex items-start gap-3 ${!notif.isRead ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                            }`}
                        >
                          <div className="mt-0.5">{getNotifIcon(notif.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-stone-900 dark:text-stone-100 truncate">
                              {notif.title}
                            </div>
                            <p className="text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed text-[11px]">
                              {notif.message}
                            </p>
                            <span className="text-[9px] text-stone-400 mt-1 block font-mono">
                              {notif.createdAt}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Capsule & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 p-1 sm:pl-2.5 sm:pr-3 rounded-full border border-stone-200/80 dark:border-stone-700/80 bg-white/80 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-800 transition-all text-left cursor-pointer shadow-xs"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-1 ring-stone-300 dark:ring-stone-600"
                />
              ) : (
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] flex items-center justify-center font-bold text-xs">
                  {currentUser.name.substring(0, 1)}
                </div>
              )}
              <div className="hidden sm:block leading-tight">
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate max-w-[110px]">
                  {currentUser.name}
                </div>
                <div className="text-[9px] text-stone-500 dark:text-stone-400 flex items-center gap-1">
                  <span>{currentUser.role}</span>
                  {currentUser.twoFactorEnabled && (
                    <span title={t.header.active2FA} className="inline-flex items-center">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown Popover */}
            {showRoleDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRoleDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#FBF9F4]/98 dark:bg-stone-900/98 backdrop-blur-2xl rounded-3xl shadow-2xl border border-stone-200/90 dark:border-stone-700/90 py-3 z-50 animate-scaleUp divide-y divide-stone-200/60 dark:divide-stone-800/60 text-xs">
                  {/* User Profile Header */}
                  <div className="p-3.5 bg-stone-100/50 dark:bg-stone-950/40 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      {currentUser.avatarUrl ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt={currentUser.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-2xl object-cover ring-1 ring-stone-300"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] flex items-center justify-center font-bold text-sm shadow-md">
                          {currentUser.name.substring(0, 1)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-stone-900 dark:text-stone-100 truncate">
                          {currentUser.name}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                          {currentUser.email}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold border uppercase ${getRoleBadgeClass(
                              currentUser.role
                            )}`}
                          >
                            {currentUser.role}
                          </span>
                          {currentUser.twoFactorEnabled ? (
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-semibold">
                              <ShieldCheck className="w-3 h-3" />
                              {t.header.active2FA}
                            </span>
                          ) : (
                            <span className="text-[9px] text-stone-400">{t.header.disabled2FA}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="p-2 space-y-1">
                    {onNavigateToSettings && (
                      <button
                        onClick={() => {
                          onNavigateToSettings();
                          setShowRoleDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors font-medium cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                        <span>{t.header.accountSettings}</span>
                      </button>
                    )}
                  </div>

                  {/* RBAC Role Switcher (Testing Mode) */}
                  {StorageService.isDemoMode() && availableUsers.length > 1 && (
                    <div className="p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between px-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        <span>{t.header.testRbac}</span>
                        <button
                          type="button"
                          onClick={() => setShowDemoSwitcher(!showDemoSwitcher)}
                          className="text-[#7D562D] dark:text-amber-400 hover:underline lowercase font-normal cursor-pointer"
                        >
                          {showDemoSwitcher ? t.header.hide : t.header.show}
                        </button>
                      </div>

                      {showDemoSwitcher && (
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {availableUsers.map((usr) => {
                            const isSelected = usr.id === currentUser.id;
                            return (
                              <button
                                key={usr.id}
                                onClick={() => {
                                  handleSwitchUser(usr);
                                  setShowRoleDropdown(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${isSelected
                                    ? 'bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] font-bold shadow-xs'
                                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                                  }`}
                              >
                                <div className="flex flex-col min-w-0 pr-2">
                                  <span className="truncate">{usr.name}</span>
                                  <span className={`text-[10px] truncate ${isSelected ? 'text-stone-300 dark:text-stone-600' : 'text-stone-400'}`}>
                                    {usr.department}
                                  </span>
                                </div>
                                <span
                                  className={`shrink-0 px-1.5 py-0.2 rounded-md text-[8px] font-bold border ${isSelected
                                      ? 'border-white/30 text-white dark:text-[#181F19]'
                                      : getRoleBadgeClass(usr.role)
                                    }`}
                                >
                                  {usr.role}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Logout Button */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowRoleDropdown(false);
                        if (onLogout) {
                          onLogout();
                        }
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-semibold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t.header.logout}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
