import {
  User,
  RoleDefinition,
  Asset,
  AssetCategory,
  AssetLocation,
  AssetClass,
  SystemSetting,
  ApprovalRequest,
  MovementRecord,
  DisposalRecord,
  MaintenanceRecord,
  AuditCampaign,
  AuditItemRecord,
  ActivityLog,
  AppNotification,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_ROLES,
  INITIAL_CATEGORIES,
  INITIAL_LOCATIONS,
  INITIAL_CLASSES,
  INITIAL_SETTINGS,
  INITIAL_ASSETS,
  INITIAL_APPROVALS,
  INITIAL_MOVEMENTS,
  INITIAL_MAINTENANCE,
  INITIAL_AUDIT_CAMPAIGNS,
  INITIAL_AUDIT_ITEMS,
  INITIAL_ACTIVITY_LOGS,
} from '../data/enterprise-asset-management';

const STORAGE_KEYS = {
  SETUP_DONE: 'assetcorp_setup_done',
  USERS: 'assetcorp_users',
  CURRENT_USER: 'assetcorp_current_user',
  AUTHENTICATED: 'assetcorp_authenticated',
  DEMO_SWITCHER_ENABLED: 'assetcorp_demo_switcher_enabled',
  ASSETS: 'assetcorp_assets',
  CATEGORIES: 'assetcorp_categories',
  LOCATIONS: 'assetcorp_locations',
  CLASSES: 'assetcorp_classes',
  SETTINGS: 'assetcorp_settings',
  APPROVALS: 'assetcorp_approvals',
  MOVEMENTS: 'assetcorp_movements',
  DISPOSALS: 'assetcorp_disposals',
  MAINTENANCE: 'assetcorp_maintenance',
  AUDIT_CAMPAIGNS: 'assetcorp_audit_campaigns',
  AUDIT_ITEMS: 'assetcorp_audit_items',
  LOGS: 'assetcorp_logs',
  NOTIFICATIONS: 'assetcorp_notifications',
  ROLES: 'assetcorp_roles',
  SEED_MODE: 'assetcorp_seed_mode',
  INTEGRATIONS: 'assetcorp_notification_integrations_v1',
  WEBHOOK_LOGS: 'assetcorp_webhook_dispatch_logs_v1',
  LANGUAGE: 'assetcorp_language',
};

// Memory fallback jika localStorage tidak tersedia
const memoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    console.warn('localStorage read failed, using memory store fallback', e);
  }
  return memoryStore[key] || null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn('localStorage write failed, using memory store fallback', e);
  }
  memoryStore[key] = value;
}

export const StorageService = {
  // Status Setup
  isSetupCompleted(): boolean {
    const val = safeGetItem(STORAGE_KEYS.SETUP_DONE);
    return val === 'true';
  },

  setSetupCompleted(status: boolean): void {
    safeSetItem(STORAGE_KEYS.SETUP_DONE, status ? 'true' : 'false');
  },

  // Auth Session State
  isAuthenticated(): boolean {
    const val = safeGetItem(STORAGE_KEYS.AUTHENTICATED);
    // If not set yet but setup is done, default to true or check session
    if (val === null) {
      return this.isSetupCompleted();
    }
    return val === 'true';
  },

  setAuthenticated(status: boolean): void {
    safeSetItem(STORAGE_KEYS.AUTHENTICATED, status ? 'true' : 'false');
  },

  // Demo Role Switcher Policy (can be toggled in settings/header)
  isDemoSwitcherEnabled(): boolean {
    if (!this.isDemoMode()) return false;
    const val = safeGetItem(STORAGE_KEYS.DEMO_SWITCHER_ENABLED);
    return val !== 'false';
  },

  setDemoSwitcherEnabled(enabled: boolean): void {
    safeSetItem(STORAGE_KEYS.DEMO_SWITCHER_ENABLED, enabled ? 'true' : 'false');
  },

  // Seed / Production Mode (full = Demo, minimal/clean = Full Real)
  getSeedMode(): 'full' | 'minimal' {
    const direct = safeGetItem(STORAGE_KEYS.SEED_MODE);
    if (direct === 'minimal' || direct === 'clean') return 'minimal';
    if (direct === 'full') return 'full';

    // Check system setting fallback
    const settings = this.getSettings();
    const modeSetting = settings.find((s) => s.key === 'system.seed_mode');
    if (modeSetting && (modeSetting.value === 'minimal' || modeSetting.value === 'clean')) {
      return 'minimal';
    }
    return 'full';
  },

  isDemoMode(): boolean {
    return this.getSeedMode() === 'full';
  },

  setSeedMode(mode: 'full' | 'minimal'): void {
    safeSetItem(STORAGE_KEYS.SEED_MODE, mode);
    this.updateSetting('system.seed_mode', mode);
    if (mode === 'minimal') {
      // In minimal mode, ensure no dummy seeder accounts linger in USERS
      const allUsers = this.getUsers();
      const nonDummyUsers = allUsers.filter((u) => !['usr-mgr-02', 'usr-aud-03', 'usr-maint-04', 'usr-viewer-05'].includes(u.id));
      if (nonDummyUsers.length > 0) {
        this.saveUsers(nonDummyUsers);
      }
    }
  },

  // Users
  getUsers(): User[] {
    const isCleanMode = this.getSeedMode() === 'minimal';
    const raw = safeGetItem(STORAGE_KEYS.USERS);
    if (!raw) {
      return isCleanMode ? [INITIAL_USERS[0]] : INITIAL_USERS;
    }
    try {
      const parsed: User[] = JSON.parse(raw);
      if (isCleanMode) {
        // Strict isolation: filter out pre-seeded dummy accounts in full real mode
        const filtered = parsed.filter((u) => !['usr-mgr-02', 'usr-aud-03', 'usr-maint-04', 'usr-viewer-05'].includes(u.id));
        return filtered.length > 0 ? filtered : [INITIAL_USERS[0]];
      }
      return parsed;
    } catch {
      return isCleanMode ? [INITIAL_USERS[0]] : INITIAL_USERS;
    }
  },

  saveUsers(users: User[]): void {
    safeSetItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  // Roles & Permissions (RBAC)
  getRoles(): RoleDefinition[] {
    const raw = safeGetItem(STORAGE_KEYS.ROLES);
    if (!raw) return INITIAL_ROLES;
    try {
      const parsed: RoleDefinition[] = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_ROLES;
      return parsed.map((role) => {
        if (role.id === 'super-admin') {
          const superAdminInit = INITIAL_ROLES.find((r) => r.id === 'super-admin');
          if (superAdminInit) {
            const allPerms = Array.from(new Set([...role.permissions, ...superAdminInit.permissions]));
            return { ...role, permissions: allPerms };
          }
        }
        return role;
      });
    } catch {
      return INITIAL_ROLES;
    }
  },

  saveRoles(roles: RoleDefinition[]): void {
    safeSetItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
  },

  // Current Logged In User
  getCurrentUser(): User {
    const raw = safeGetItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return INITIAL_USERS[0];
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS[0];
    }
  },

  setCurrentUser(user: User): void {
    safeSetItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  // Language & Localization
  getLanguage(): 'id' | 'en' {
    const raw = safeGetItem(STORAGE_KEYS.LANGUAGE);
    if (raw === 'en' || raw === 'id') return raw;
    const user = this.getCurrentUser();
    if (user && (user.language === 'en' || user.language === 'id')) {
      return user.language;
    }
    return 'id';
  },

  setLanguage(lang: 'id' | 'en'): void {
    safeSetItem(STORAGE_KEYS.LANGUAGE, lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    const user = this.getCurrentUser();
    if (user && user.language !== lang) {
      user.language = lang;
      this.setCurrentUser(user);
    }
  },

  // Assets
  getAssets(): Asset[] {
    const raw = safeGetItem(STORAGE_KEYS.ASSETS);
    if (!raw) return this.isSetupCompleted() ? [] : INITIAL_ASSETS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.isSetupCompleted() ? [] : INITIAL_ASSETS;
    }
  },

  saveAssets(assets: Asset[]): void {
    safeSetItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
  },

  // Categories
  getCategories(): AssetCategory[] {
    const raw = safeGetItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) return this.isSetupCompleted() ? [] : INITIAL_CATEGORIES;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.isSetupCompleted() ? [] : INITIAL_CATEGORIES;
    }
  },

  saveCategories(categories: AssetCategory[]): void {
    safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  // Locations
  getLocations(): AssetLocation[] {
    const raw = safeGetItem(STORAGE_KEYS.LOCATIONS);
    if (!raw) return this.isSetupCompleted() ? [] : INITIAL_LOCATIONS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.isSetupCompleted() ? [] : INITIAL_LOCATIONS;
    }
  },

  saveLocations(locations: AssetLocation[]): void {
    safeSetItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
  },

  // Classes
  getClasses(): AssetClass[] {
    const raw = safeGetItem(STORAGE_KEYS.CLASSES);
    if (!raw) return this.isSetupCompleted() ? [] : INITIAL_CLASSES;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.isSetupCompleted() ? [] : INITIAL_CLASSES;
    }
  },

  saveClasses(classes: AssetClass[]): void {
    safeSetItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  },

  // Settings
  getSettings(): SystemSetting[] {
    const raw = safeGetItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return INITIAL_SETTINGS;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: SystemSetting[]): void {
    safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getSettingValue(key: string, defaultValue: string): string {
    const settings = this.getSettings();
    const found = settings.find((s) => s.key === key);
    return found ? found.value : defaultValue;
  },

  updateSetting(key: string, value: string): void {
    const settings = this.getSettings();
    const idx = settings.findIndex((s) => s.key === key);
    if (idx >= 0) {
      settings[idx].value = value;
    } else {
      settings.push({
        key,
        value,
        group: 'APPLICATION',
        label: key,
        description: '',
        type: 'STRING',
      });
    }
    this.saveSettings(settings);
  },

  setSettingValue(key: string, value: string): void {
    this.updateSetting(key, value);
  },

  // Unified Application / Company Name Resolver
  getAppName(): string {
    const appName =
      this.getSettingValue('application.name', '') ||
      this.getSettingValue('company.name', '') ||
      this.getSettingValue('app.name', '');
    return appName || 'AssetCorp Enterprise Asset Management';
  },

  setAppName(name: string): void {
    const cleanName = name.trim() || 'AssetCorp Enterprise Asset Management';
    this.updateSetting('application.name', cleanName);
    this.updateSetting('company.name', cleanName);
    this.updateSetting('app.name', cleanName);
  },

  // Unified Asset Code Prefix Resolver
  getAssetCodePrefix(): string {
    const prefix =
      this.getSettingValue('asset.code_prefix', '') ||
      this.getSettingValue('asset.code.prefix', '');
    if (!prefix) return 'AST-';
    return prefix.trim().toUpperCase().endsWith('-') ? prefix.trim().toUpperCase() : `${prefix.trim().toUpperCase()}-`;
  },

  setAssetCodePrefix(prefix: string): void {
    let clean = prefix.trim().toUpperCase();
    if (!clean) clean = 'AST-';
    if (!clean.endsWith('-')) clean = `${clean}-`;
    this.updateSetting('asset.code_prefix', clean);
    this.updateSetting('asset.code.prefix', clean);
  },

  // Approvals
  getApprovals(): ApprovalRequest[] {
    const raw = safeGetItem(STORAGE_KEYS.APPROVALS);
    if (!raw) return this.isSetupCompleted() ? [] : INITIAL_APPROVALS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.isSetupCompleted() ? [] : INITIAL_APPROVALS;
    }
  },

  saveApprovals(approvals: ApprovalRequest[]): void {
    safeSetItem(STORAGE_KEYS.APPROVALS, JSON.stringify(approvals));
  },

  // Movements
  getMovements(): MovementRecord[] {
    const raw = safeGetItem(STORAGE_KEYS.MOVEMENTS);
    if (!raw) return this.isSetupCompleted() ? [] : INITIAL_MOVEMENTS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.isSetupCompleted() ? [] : INITIAL_MOVEMENTS;
    }
  },

  saveMovements(movements: MovementRecord[]): void {
    safeSetItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  },

  // Disposals
  getDisposals(): DisposalRecord[] {
    const raw = safeGetItem(STORAGE_KEYS.DISPOSALS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveDisposals(disposals: DisposalRecord[]): void {
    safeSetItem(STORAGE_KEYS.DISPOSALS, JSON.stringify(disposals));
  },

  // Maintenance
  getMaintenance(): MaintenanceRecord[] {
    const raw = safeGetItem(STORAGE_KEYS.MAINTENANCE);
    if (!raw) return this.isSetupCompleted() ? [] : INITIAL_MAINTENANCE;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.isSetupCompleted() ? [] : INITIAL_MAINTENANCE;
    }
  },

  saveMaintenance(records: MaintenanceRecord[]): void {
    safeSetItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(records));
  },

  // Audit Campaigns
  getAuditCampaigns(): AuditCampaign[] {
    const raw = safeGetItem(STORAGE_KEYS.AUDIT_CAMPAIGNS);
    if (!raw) return this.isSetupCompleted() ? [] : INITIAL_AUDIT_CAMPAIGNS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.isSetupCompleted() ? [] : INITIAL_AUDIT_CAMPAIGNS;
    }
  },

  saveAuditCampaigns(campaigns: AuditCampaign[]): void {
    safeSetItem(STORAGE_KEYS.AUDIT_CAMPAIGNS, JSON.stringify(campaigns));
  },

  // Audit Items
  getAuditItems(): AuditItemRecord[] {
    const raw = safeGetItem(STORAGE_KEYS.AUDIT_ITEMS);
    if (!raw) return this.isSetupCompleted() ? [] : INITIAL_AUDIT_ITEMS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.isSetupCompleted() ? [] : INITIAL_AUDIT_ITEMS;
    }
  },

  saveAuditItems(items: AuditItemRecord[]): void {
    safeSetItem(STORAGE_KEYS.AUDIT_ITEMS, JSON.stringify(items));
  },

  // Activity Logs
  getActivityLogs(): ActivityLog[] {
    const raw = safeGetItem(STORAGE_KEYS.LOGS);
    if (!raw) return INITIAL_ACTIVITY_LOGS;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ACTIVITY_LOGS;
    }
  },

  saveActivityLogs(logs: ActivityLog[]): void {
    safeSetItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    const isLogEnabled = this.getSettingValue('security.audit_log', 'true') === 'true';
    if (!isLogEnabled) return;

    const currentLogs = this.getActivityLogs();
    const newEntry: ActivityLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    const updated = [newEntry, ...currentLogs].slice(0, 1000); // Batasi 1000 log terbaru
    this.saveActivityLogs(updated);
  },

  // In-App Notifications
  getNotifications(): AppNotification[] {
    const raw = safeGetItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      if (this.isSetupCompleted()) {
        return [];
      }
      return [
        {
          id: 'notif-1',
          title: 'Approval Tertunda',
          message: 'Ada 2 pengajuan mutasi dan disposal yang memerlukan persetujuan Anda.',
          type: 'WARNING',
          createdAt: '2026-08-16 11:30:00',
          isRead: false,
        },
        {
          id: 'notif-2',
          title: 'Jadwal Pemeliharaan',
          message: 'Toyota Forklift AST-2021-089 sedang dalam pengerjaan teknisi.',
          type: 'INFO',
          createdAt: '2026-08-15 15:45:00',
          isRead: false,
        },
      ];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveNotifications(notifs: AppNotification[]): void {
    safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  addNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): void {
    const list = this.getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      isRead: false,
    };
    this.saveNotifications([newNotif, ...list]);
  },

  markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.saveNotifications(updated);
  },

  markAllNotificationsAsRead(): void {
    const list = this.getNotifications();
    const updated = list.map((n) => ({ ...n, isRead: true }));
    this.saveNotifications(updated);
  },

  markAllNotificationsRead(): void {
    this.markAllNotificationsAsRead();
  },

  // Export & Import Database Backup
  exportDatabase(): string {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      users: this.getUsers(),
      roles: this.getRoles(),
      assets: this.getAssets(),
      categories: this.getCategories(),
      locations: this.getLocations(),
      classes: this.getClasses(),
      settings: this.getSettings(),
      approvals: this.getApprovals(),
      movements: this.getMovements(),
      disposals: this.getDisposals(),
      maintenance: this.getMaintenance(),
      auditCampaigns: this.getAuditCampaigns(),
      auditItems: this.getAuditItems(),
      activityLogs: this.getActivityLogs(),
      notifications: this.getNotifications(),
    };
    return JSON.stringify(data, null, 2);
  },

  importDatabase(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') return false;

      if (Array.isArray(data.users)) this.saveUsers(data.users);
      if (Array.isArray(data.roles)) this.saveRoles(data.roles);
      if (Array.isArray(data.assets)) this.saveAssets(data.assets);
      if (Array.isArray(data.categories)) this.saveCategories(data.categories);
      if (Array.isArray(data.locations)) this.saveLocations(data.locations);
      if (Array.isArray(data.classes)) this.saveClasses(data.classes);
      if (Array.isArray(data.settings)) this.saveSettings(data.settings);
      if (Array.isArray(data.approvals)) this.saveApprovals(data.approvals);
      if (Array.isArray(data.movements)) this.saveMovements(data.movements);
      if (Array.isArray(data.disposals)) this.saveDisposals(data.disposals);
      if (Array.isArray(data.maintenance)) this.saveMaintenance(data.maintenance);
      if (Array.isArray(data.auditCampaigns)) this.saveAuditCampaigns(data.auditCampaigns);
      if (Array.isArray(data.auditItems)) this.saveAuditItems(data.auditItems);
      if (Array.isArray(data.activityLogs)) this.saveActivityLogs(data.activityLogs);
      if (Array.isArray(data.notifications)) this.saveNotifications(data.notifications);

      return true;
    } catch (e) {
      console.error('Import database failed:', e);
      return false;
    }
  },

  // Reset Data ke Awal
  resetToDefaults(): void {
    this.setSetupCompleted(true);
    this.saveUsers(INITIAL_USERS);
    this.saveRoles(INITIAL_ROLES);
    this.setCurrentUser(INITIAL_USERS[0]);
    this.saveCategories(INITIAL_CATEGORIES);
    this.saveLocations(INITIAL_LOCATIONS);
    this.saveClasses(INITIAL_CLASSES);
    this.saveSettings(INITIAL_SETTINGS);
    this.saveAssets(INITIAL_ASSETS);
    this.saveApprovals(INITIAL_APPROVALS);
    this.saveMovements(INITIAL_MOVEMENTS);
    this.saveDisposals([]);
    this.saveMaintenance(INITIAL_MAINTENANCE);
    this.saveAuditCampaigns(INITIAL_AUDIT_CAMPAIGNS);
    this.saveAuditItems(INITIAL_AUDIT_ITEMS);
    this.saveActivityLogs(INITIAL_ACTIVITY_LOGS);
  },

  resetToSeed(): void {
    this.resetToDefaults();
  },

  // Kosongkan Data Transaksi Aset Saja (Akun, Master Kategori & Pengaturan Perusahaan Tetap Aman)
  clearAssetsOnly(): void {
    this.saveAssets([]);
    this.saveApprovals([]);
    this.saveMovements([]);
    this.saveDisposals([]);
    this.saveMaintenance([]);
    this.saveAuditCampaigns([]);
    this.saveAuditItems([]);
    this.saveNotifications([]);
  },

  // Reset Total dan Kembali ke Setup Wizard
  resetToSetupWizard(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.values(STORAGE_KEYS).forEach((k) => window.localStorage.removeItem(k));
      }
    } catch (e) {
      console.warn('localStorage clear failed', e);
    }
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
    this.setSetupCompleted(false);
  },
};
