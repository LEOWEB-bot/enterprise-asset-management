import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Key,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Check,
  X,
  UserCheck,
  Lock,
  UserPlus,
  RefreshCw,
  Info,
  Shield,
  Filter,
  Copy,
  Eye,
  EyeOff,
  Share2,
  Building2,
  MapPin,
  Mail,
  Fingerprint,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { User, RoleDefinition, Permission, UserRole } from '../../types';
import { StorageService } from '../../services/storageService';
import { logActivity } from '../../services/activityLogger';
import { getRoleBadgeClass } from '../../services/authService';
import { getI18n, AppLanguage } from '../../utils/i18n';

interface RBACManagerProps {
  currentUser: User;
  onRefreshData?: () => void;
  isReadOnlyMode?: boolean;
}

// Master Available Permissions with Friendly Labels and Categorization
const ALL_PERMISSIONS: { key: Permission; label: string; category: string; description: string }[] = [
  // Assets
  { key: 'assets.view', label: 'Lihat Aset Tertentu', category: 'Manajemen Master Aset', description: 'Melihat aset sesuai departemen/lokasi penugasan' },
  { key: 'assets.view_all', label: 'Lihat Semua Aset', category: 'Manajemen Master Aset', description: 'Melihat seluruh daftar aset di seluruh cabang perusahaan' },
  { key: 'assets.manage', label: 'Kelola Master Aset', category: 'Manajemen Master Aset', description: 'Menambah, mengedit, dan menghapus data aset' },
  
  // Operasional
  { key: 'movements.manage', label: 'Kelola Mutasi & Relokasi', category: 'Alur Kerja Operasional', description: 'Membuat dan memproses pemindahan lokasi atau penanggung jawab aset' },
  { key: 'maintenance.manage', label: 'Kelola Pemeliharaan', category: 'Alur Kerja Operasional', description: 'Membuat jadwal servis, perbaikan (WO), dan status log pemeliharaan' },
  { key: 'disposals.manage', label: 'Kelola Disposal / Penghapusan', category: 'Alur Kerja Operasional', description: 'Mengajukan dan mengeksekusi penghapusan atau lelang aset' },
  { key: 'audits.manage', label: 'Kelola Stocktake & Audit', category: 'Alur Kerja Operasional', description: 'Melakukan stocktake fisik dan verifikasi scan barcode/RFID' },
  
  // Approval & Laporan
  { key: 'approvals.manage', label: 'Akses Menu Approval Center', category: 'Otorisasi & Laporan Keuangan', description: 'Melihat antrean daftar persetujuan mutasi, pemeliharaan, dan pelepasan aset' },
  { key: 'approvals.process', label: 'Proses & Putuskan Approval', category: 'Otorisasi & Laporan Keuangan', description: 'Menyetujui (Approve) atau menolak (Reject) permohonan mutasi, perbaikan, dan disposal' },
  { key: 'reports.view', label: 'Akses Laporan & Analitik', category: 'Otorisasi & Laporan Keuangan', description: 'Melihat depresiasi, neraca nilai buku, dan ekspor laporan' },
  
  // Sistem & Keamanan
  { key: 'settings.manage', label: 'Pengaturan Sistem & Master', category: 'Tata Kelola Sistem & Keamanan', description: 'Mengelola kategori, lokasi fisik, kebijakan, dan backup' },
  { key: 'settings.company_identity', label: 'Identitas Instansi & Aplikasi', category: 'Tata Kelola Sistem & Keamanan', description: 'Mengubah nama resmi instansi/perusahaan, branding portal, dan label stiker QR aset' },
  { key: 'settings.asset_format', label: 'Format & Prefix Kode Aset', category: 'Tata Kelola Sistem & Keamanan', description: 'Mengubah format formula prefix penomoran otomatis seluruh aset (misal: AST-, PLN-, DINKES-)' },
  { key: 'system.wizard_setup', label: 'Setup Wizard & Factory Reset', category: 'Tata Kelola Sistem & Keamanan', description: 'Menjalankan ulang instalasi sistem dan mereset basis data ke awal' },
  { key: 'users.manage', label: 'Kelola Data Pengguna', category: 'Tata Kelola Sistem & Keamanan', description: 'Menambah, mengubah data akun, dan status pengguna' },
  { key: 'roles.manage', label: 'Kelola Peran & Hak Akses (RBAC)', category: 'Tata Kelola Sistem & Keamanan', description: 'Mengubah matriks izin peran (RBAC matrix)' },
];

export const RBACManager: React.FC<RBACManagerProps> = ({
  currentUser,
  onRefreshData,
  isReadOnlyMode = false,
}) => {
  const currentLang: AppLanguage = currentUser?.language || StorageService.getLanguage() || 'id';
  const isEn = currentLang === 'en';

  const [activeTab, setActiveTab] = useState<'users' | 'roles-matrix'>('users');
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [roles, setRoles] = useState<RoleDefinition[]>(() => StorageService.getRoles());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal User Create/Edit
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    userId: '',
    idCard: '',
    password: '',
    department: 'IT & Infrastructure',
    location: 'Kantor Pusat Jakarta',
    role: 'viewer' as UserRole,
    isActive: true,
    twoFactorEnabled: false,
  });

  // Invitation Modal State
  const [inviteModalData, setInviteModalData] = useState<{
    name: string;
    email: string;
    userId: string;
    role: string;
    password?: string;
  } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Modal Role Edit
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissions: [] as Permission[],
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper to generate a random secure password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserFormData((prev) => ({ ...prev, password: res }));
  };

  // KPI calculations
  const stats = useMemo(() => {
    const activeUsers = users.filter((u) => u.isActive).length;
    const configuredRoles = roles.length;
    const totalPermissions = ALL_PERMISSIONS.length;
    const mfaUsers = users.filter((u) => u.twoFactorEnabled).length;
    const mfaRate = users.length > 0 ? ((mfaUsers / users.length) * 100).toFixed(1) : '100.0';

    return { activeUsers, configuredRoles, totalPermissions, mfaRate };
  }, [users, roles]);

  // Group permissions by category domain
  const permissionCategories = useMemo(() => {
    const map = new Map<string, typeof ALL_PERMISSIONS>();
    ALL_PERMISSIONS.forEach((p) => {
      if (!map.has(p.category)) {
        map.set(p.category, []);
      }
      map.get(p.category)!.push(p);
    });
    return Array.from(map.entries());
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.userId && u.userId.toLowerCase().includes(q)) ||
        (u.idCard && u.idCard.toLowerCase().includes(q)) ||
        u.department.toLowerCase().includes(q) ||
        u.location.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Open Create User Modal
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      email: '',
      userId: '',
      idCard: `EMP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      password: 'Pass@' + Math.floor(1000 + Math.random() * 9000),
      department: 'General Affairs',
      location: 'Kantor Pusat Jakarta',
      role: 'viewer',
      isActive: true,
      twoFactorEnabled: false,
    });
    setShowPasswordInModal(false);
    setShowUserModal(true);
  };

  // Open Edit User Modal
  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      userId: user.userId || user.email.split('@')[0],
      idCard: user.idCard || '',
      password: user.password || '',
      department: user.department,
      location: user.location,
      role: user.role,
      isActive: user.isActive,
      twoFactorEnabled: user.twoFactorEnabled,
    });
    setShowPasswordInModal(false);
    setShowUserModal(true);
  };

  // Save User
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnlyMode) {
      showToast(isEn ? 'System in Read-Only mode.' : 'Mode baca saja aktif. Tidak dapat mengubah data pengguna.', 'error');
      return;
    }

    if (!userFormData.name.trim() || !userFormData.email.trim()) {
      showToast(isEn ? 'Name and Email are required.' : 'Nama dan Email wajib diisi.', 'error');
      return;
    }

    let updatedUsersList: User[];
    const assignedPassword = userFormData.password.trim() || 'Pass@1234';

    if (editingUser) {
      updatedUsersList = users.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              name: userFormData.name.trim(),
              email: userFormData.email.trim().toLowerCase(),
              userId: userFormData.userId.trim().toLowerCase(),
              idCard: userFormData.idCard.trim(),
              password: assignedPassword,
              department: userFormData.department,
              location: userFormData.location,
              role: userFormData.role,
              isActive: userFormData.isActive,
              twoFactorEnabled: userFormData.twoFactorEnabled,
            }
          : u
      );
      logActivity(
        'USER_UPDATED',
        'AUTH',
        `Mengubah akun & hak peran pengguna: ${userFormData.name} (${userFormData.role})`
      );
      showToast(isEn ? `User ${userFormData.name} updated.` : `Data pengguna ${userFormData.name} berhasil diperbarui.`);
    } else {
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: userFormData.name.trim(),
        email: userFormData.email.trim().toLowerCase(),
        userId: userFormData.userId.trim().toLowerCase() || userFormData.email.split('@')[0],
        idCard: userFormData.idCard.trim(),
        password: assignedPassword,
        department: userFormData.department,
        location: userFormData.location,
        role: userFormData.role,
        isActive: userFormData.isActive,
        twoFactorEnabled: userFormData.twoFactorEnabled,
        lastLoginAt: isEn ? 'Never logged in' : 'Belum pernah login',
        theme: 'light',
        language: 'id',
      };
      updatedUsersList = [newUser, ...users];
      logActivity(
        'USER_CREATED',
        'AUTH',
        `Menambahkan pengguna baru: ${newUser.name} dengan peran ${newUser.role}`
      );
      showToast(isEn ? `User ${newUser.name} created.` : `Pengguna baru ${newUser.name} berhasil dibuat.`);

      // Prompt Invitation Modal with Credentials
      setInviteModalData({
        name: newUser.name,
        email: newUser.email,
        userId: newUser.userId || newUser.email,
        role: newUser.role,
        password: assignedPassword,
      });
    }

    setUsers(updatedUsersList);
    StorageService.saveUsers(updatedUsersList);
    setShowUserModal(false);
    if (onRefreshData) onRefreshData();
  };

  // Toggle User Active Status
  const handleToggleUserStatus = (user: User) => {
    if (isReadOnlyMode) {
      showToast(isEn ? 'System in Read-Only mode.' : 'Mode baca saja aktif.', 'error');
      return;
    }
    if (user.id === currentUser.id) {
      showToast(isEn ? 'You cannot deactivate your own active session.' : 'Anda tidak dapat menonaktifkan akun yang sedang Anda gunakan saat ini.', 'error');
      return;
    }

    const updatedUsersList = users.map((u) =>
      u.id === user.id ? { ...u, isActive: !u.isActive } : u
    );
    setUsers(updatedUsersList);
    StorageService.saveUsers(updatedUsersList);
    logActivity(
      'USER_STATUS_TOGGLED',
      'AUTH',
      `Mengubah status aktif akun ${user.name} menjadi ${!user.isActive ? 'Aktif' : 'Non-Aktif'}`
    );
    showToast(isEn ? `Status of ${user.name} updated.` : `Status akun ${user.name} berhasil diubah.`);
  };

  // Delete User
  const handleDeleteUser = (user: User) => {
    if (isReadOnlyMode) {
      showToast(isEn ? 'System in Read-Only mode.' : 'Mode baca saja aktif.', 'error');
      return;
    }
    if (user.id === currentUser.id) {
      showToast(isEn ? 'You cannot delete your own active session.' : 'Anda tidak dapat menghapus akun Anda sendiri.', 'error');
      return;
    }
    if (!window.confirm(isEn ? `Are you sure you want to delete user "${user.name}"?` : `Apakah Anda yakin ingin menghapus akun pengguna "${user.name}"?`)) {
      return;
    }

    const updatedUsersList = users.filter((u) => u.id !== user.id);
    setUsers(updatedUsersList);
    StorageService.saveUsers(updatedUsersList);
    logActivity('USER_DELETED', 'AUTH', `Menghapus pengguna ${user.name} (${user.email})`);
    showToast(isEn ? `User ${user.name} deleted.` : `Pengguna ${user.name} berhasil dihapus.`);
  };

  // Toggle Matrix Permission Directly
  const handleToggleMatrixPermission = (roleId: UserRole, permissionKey: Permission) => {
    if (isReadOnlyMode) {
      showToast(isEn ? 'System in Read-Only mode.' : 'Mode baca saja aktif.', 'error');
      return;
    }
    if (roleId === 'super-admin') {
      showToast(isEn ? 'Super Admin role must retain all system permissions.' : 'Peran Super Admin wajib memiliki semua hak akses sistem.', 'error');
      return;
    }

    const updatedRoles = roles.map((r) => {
      if (r.id === roleId) {
        const hasPerm = r.permissions.includes(permissionKey);
        const newPermissions = hasPerm
          ? r.permissions.filter((p) => p !== permissionKey)
          : [...r.permissions, permissionKey];
        return { ...r, permissions: newPermissions };
      }
      return r;
    });

    setRoles(updatedRoles);
    StorageService.saveRoles(updatedRoles);
    logActivity(
      'RBAC_MATRIX_UPDATED',
      'AUTH',
      `Memperbarui hak akses matriks izin peran: ${roleId}`
    );
    showToast(isEn ? `Permissions for ${roleId} updated.` : `Izin peran ${roleId} berhasil diperbarui.`);
  };

  const getRoleDisplayName = (roleKey: UserRole | string) => {
    switch (roleKey) {
      case 'super-admin':
        return 'Super Admin';
      case 'asset-manager':
        return 'Asset Manager';
      case 'auditor':
        return 'Auditor';
      case 'maintenance':
        return 'Staff Operasional / Teknisi';
      case 'viewer':
        return 'Viewer / Tamu';
      default:
        return roleKey;
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
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
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
              {isEn ? 'Zero-Trust Security' : 'Arsitektur Zero-Trust'}
            </span>
            <div className="px-3.5 py-1 rounded-full bg-white/70 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5E7A68] animate-pulse" />
              <span>{roles.length} {isEn ? 'Roles' : 'Peran Standar'} • {ALL_PERMISSIONS.length} {isEn ? 'Granular Permissions' : 'Izin Granular'} • 2FA Enforced</span>
            </div>
          </div>

          <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
            {isEn ? 'Enterprise RBAC & Identity Governance' : 'Pusat Pengguna, Peran & Matriks Otorisasi (RBAC)'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            {isEn
              ? 'Multi-tiered access control, granular permission matrices, security role assignments, and organizational identity governance.'
              : 'Manajemen wewenang berbasis peran (RBAC), matriks izin fungsional berjenjang, penugasan hak akses pengguna, dan tata kelola akun personel.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
          <button
            onClick={handleOpenCreateUser}
            disabled={isReadOnlyMode}
            className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-6 sm:px-7 py-3 rounded-full text-xs font-bold shadow-lg shadow-[#5E7A68]/25 transition-all cursor-pointer hover:scale-105 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isEn ? 'Add New User' : 'Tambah Pengguna Baru'}</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Squircle Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Active Accounts */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Active Accounts' : 'Pengguna Terverifikasi'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#181F19] dark:text-stone-100">{stats.activeUsers}</p>
            <span className="text-xs font-medium text-stone-500">
              {users.length} {isEn ? 'total registered accounts' : 'total akun dalam sistem'}
            </span>
          </div>
        </div>

        {/* Card 2: Configured Roles */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Configured Roles' : 'Profil Peran Wewenang'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#5E7A68] dark:text-emerald-400">{stats.configuredRoles}</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'System authorization profiles' : 'Tingkat profil akses aktif'}
            </span>
          </div>
        </div>

        {/* Card 3: Granular Permissions */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Granular Matrix' : 'Izin Kontrol Granular'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#D4A373]/20 text-[#7D562D] dark:text-amber-300 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#7D562D] dark:text-amber-300">{stats.totalPermissions}</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Across 4 functional domains' : 'Tersebar di 4 domain fungsi'}
            </span>
          </div>
        </div>

        {/* Card 4: 2FA Enforcement */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? '2FA Compliance' : 'Kepatuhan Keamanan 2FA'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#181F19] dark:text-stone-100">{stats.mfaRate}%</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Two-Factor authentication rate' : 'Akun terlindungi autentikasi ganda'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Switcher & Filter Bar */}
      <div className="glass-panel squircle p-3 sm:p-4 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="flex items-center p-1 rounded-2xl bg-stone-200/60 dark:bg-stone-800/60 border border-stone-300/50 dark:border-stone-700/50">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Users className="w-4 h-4 text-[#5E7A68]" />
            <span>{isEn ? 'User Accounts Directory' : 'Direktori Akun Pengguna'}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-400 text-[10px] font-mono font-bold">
              {filteredUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('roles-matrix')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'roles-matrix'
                ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#7D562D]" />
            <span>{isEn ? 'Interactive Permissions Matrix' : 'Matriks Hak Akses Granular'}</span>
            <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-mono font-bold">
              {roles.length} {isEn ? 'Roles' : 'Peran'}
            </span>
          </button>
        </div>

        {/* Search & Filters */}
        {activeTab === 'users' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <input
                type="text"
                placeholder={isEn ? 'Search name, NIK, email, dept...' : 'Cari nama, NIK, email, departemen...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#5E7A68] outline-hidden shadow-2xs"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-hidden cursor-pointer"
            >
              <option value="ALL">{isEn ? 'All Roles' : 'Semua Peran'}</option>
              <option value="super-admin">Super Admin</option>
              <option value="asset-manager">Asset Manager</option>
              <option value="auditor">Auditor</option>
              <option value="maintenance">Staff Operasional / Teknisi</option>
              <option value="viewer">Viewer / Tamu</option>
            </select>
          </div>
        )}
      </div>

      {/* 4. Content Tabs */}

      {/* TAB 1: USER ACCOUNTS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Corporate Identity & User Directory' : 'Direktori Identitas & Akun Personel'}
              </h2>
              <p className="text-xs text-stone-500">
                {isEn ? 'User accounts, role assignments, departmental allocations, and security status.' : 'Data akun pegawai, penugasan wewenang sistem, alokasi gedung kerja, dan status aktif akun.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-500 px-3 py-1 rounded-full bg-stone-200/60 dark:bg-stone-800">
              {filteredUsers.length} {isEn ? 'Accounts' : 'Personel'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200/80 dark:border-stone-800 text-stone-500 uppercase font-bold text-[11px] tracking-wider">
                  <th className="py-4 px-4">{isEn ? 'User Identity & ID' : 'Identitas Personel & NIK'}</th>
                  <th className="py-4 px-4">{isEn ? 'Email & Contact' : 'Email & Akses'}</th>
                  <th className="py-4 px-4">{isEn ? 'Department & Location' : 'Departemen & Gedung'}</th>
                  <th className="py-4 px-4">{isEn ? 'Assigned Role' : 'Peran Otorisasi'}</th>
                  <th className="py-4 px-4 text-center">{isEn ? 'Status' : 'Status Akun'}</th>
                  <th className="py-4 px-4 text-right">{isEn ? 'Actions' : 'Tindakan'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/60">
                {filteredUsers.map((user) => {
                  const initials = user.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={user.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#5E7A68] transition-colors">
                              {user.name}
                            </div>
                            <span className="font-mono text-[11px] text-stone-500">
                              {user.idCard || user.userId || `EMP-${user.id.substring(0, 6)}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-stone-800 dark:text-stone-200 font-medium">
                          <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{user.email}</span>
                        </div>
                        {user.twoFactorEnabled && (
                          <div className="flex items-center gap-1 text-[10px] text-[#5E7A68] font-bold mt-0.5">
                            <ShieldCheck className="w-3 h-3" />
                            <span>2FA Enforced</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-stone-800 dark:text-stone-200">
                          {user.department}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{user.location}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          user.role === 'super-admin'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
                            : user.role === 'asset-manager'
                            ? 'bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 border border-[#5E7A68]/30'
                            : user.role === 'auditor'
                            ? 'bg-[#D4A373]/20 text-[#7D562D] dark:text-amber-300 border border-[#D4A373]/40'
                            : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                        }`}>
                          <span>{getRoleDisplayName(user.role)}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          disabled={isReadOnlyMode || user.id === currentUser.id}
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-40 ${
                            user.isActive ? 'bg-[#5E7A68]' : 'bg-stone-300 dark:bg-stone-700'
                          }`}
                          title={user.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                              user.isActive ? 'right-1' : 'left-1'
                            }`}
                          />
                        </button>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditUser(user)}
                            disabled={isReadOnlyMode}
                            className="p-2 rounded-xl text-stone-500 hover:text-[#5E7A68] hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                            title={isEn ? 'Edit User' : 'Ubah Profil Pengguna'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={isReadOnlyMode}
                              className="p-2 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title={isEn ? 'Delete User' : 'Hapus Akun'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE PERMISSIONS MATRIX */}
      {activeTab === 'roles-matrix' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Granular Role-Based Permissions Matrix' : 'Matriks Hak Akses & Wewenang Sistem Granular'}
              </h2>
              <p className="text-xs text-stone-500">
                {isEn ? 'Configure functional access across asset lifecycle, operations, approvals, and security.' : 'Konfigurasi izin akses berdasarkan peran fungsional sistem secara taktil dan instan.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-500 px-3 py-1 rounded-full bg-stone-200/60 dark:bg-stone-800">
              {ALL_PERMISSIONS.length} {isEn ? 'Rules' : 'Aturan Akses'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200/80 dark:border-stone-800 text-stone-500 uppercase font-bold text-[11px] tracking-wider">
                  <th className="py-4 px-4 w-2/5">{isEn ? 'Functional Permission / Rule' : 'Fitur / Aturan Izin Akses'}</th>
                  {roles.map((role) => (
                    <th key={role.id} className="py-4 px-3 text-center">
                      <span className="font-bold text-stone-800 dark:text-stone-200">{role.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/60">
                {permissionCategories.map(([categoryName, perms]) => (
                  <React.Fragment key={categoryName}>
                    {/* Category Domain Banner */}
                    <tr className="bg-stone-100/70 dark:bg-stone-800/50">
                      <td colSpan={roles.length + 1} className="py-3 px-4 font-mono font-bold text-xs uppercase tracking-wider text-[#5E7A68] dark:text-emerald-400">
                        {categoryName}
                      </td>
                    </tr>

                    {/* Permissions rows under domain */}
                    {perms.map((p) => (
                      <tr key={p.key} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-stone-900 dark:text-stone-100">{p.label}</div>
                          <div className="text-[11px] text-stone-500 mt-0.5">{p.description}</div>
                        </td>

                        {roles.map((role) => {
                          const hasPermission = role.permissions.includes(p.key);
                          const isSuperAdmin = role.id === 'super-admin';

                          return (
                            <td key={role.id} className="py-3.5 px-3 text-center">
                              <button
                                type="button"
                                disabled={isReadOnlyMode || isSuperAdmin}
                                onClick={() => handleToggleMatrixPermission(role.id, p.key)}
                                className={`w-8 h-8 rounded-xl inline-flex items-center justify-center transition-all cursor-pointer ${
                                  hasPermission
                                    ? 'bg-[#5E7A68]/15 text-[#5E7A68] hover:scale-110'
                                    : 'bg-stone-200/50 dark:bg-stone-800 text-stone-400 hover:text-stone-600'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={
                                  isSuperAdmin
                                    ? 'Super Admin memiliki izin permanen'
                                    : hasPermission
                                    ? 'Klik untuk cabut izin'
                                    : 'Klik untuk berikan izin'
                                }
                              >
                                {hasPermission ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <X className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Create/Edit Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
          <div className="spatial-canvas w-full max-w-lg p-8 rounded-[36px] border border-white/60 dark:border-stone-700/60 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <h3 className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100">
                {editingUser ? (isEn ? 'Edit User Profile' : 'Ubah Profil Pengguna') : (isEn ? 'Register New User' : 'Tambah Pengguna Baru')}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-200/80 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  {isEn ? 'Full Name *' : 'Nama Lengkap *'}
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  placeholder="Contoh: Hendra Pratama"
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                    {isEn ? 'Email Address *' : 'Alamat Email *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder="hendra@perusahaan.com"
                    className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                    {isEn ? 'Employee ID (NIK)' : 'ID Pegawai (NIK)'}
                  </label>
                  <input
                    type="text"
                    value={userFormData.idCard}
                    onChange={(e) => setUserFormData({ ...userFormData, idCard: e.target.value })}
                    placeholder="EMP-2026-0091"
                    className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                    {isEn ? 'Department' : 'Departemen'}
                  </label>
                  <input
                    type="text"
                    value={userFormData.department}
                    onChange={(e) => setUserFormData({ ...userFormData, department: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                    {isEn ? 'Work Location' : 'Gedung / Lokasi Kerja'}
                  </label>
                  <input
                    type="text"
                    value={userFormData.location}
                    onChange={(e) => setUserFormData({ ...userFormData, location: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  {isEn ? 'System Role *' : 'Peran Otorisasi Sistem *'}
                </label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68] cursor-pointer"
                >
                  <option value="super-admin">Super Admin (Akses Penuh Seluruh Modul)</option>
                  <option value="asset-manager">Asset Manager (Pengelola Inventaris & Mutasi)</option>
                  <option value="auditor">Auditor (Pemeriksa Stocktake & Laporan)</option>
                  <option value="maintenance">Staff Operasional / Teknisi (Pemeliharaan & Servis)</option>
                  <option value="viewer">Viewer / Tamu (Hanya Lihat)</option>
                </select>
              </div>

              {/* Password Generator */}
              <div className="p-4 rounded-2xl bg-stone-100/80 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                    {isEn ? 'Temporary Password' : 'Kata Sandi Sementara'}
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-bold text-[#5E7A68] dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isEn ? 'Generate Random' : 'Buat Acak Aman'}</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPasswordInModal ? 'text' : 'password'}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full p-2.5 pr-10 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-mono text-stone-900 dark:text-stone-100 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPasswordInModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="user-mfa-toggle"
                  checked={userFormData.twoFactorEnabled}
                  onChange={(e) => setUserFormData({ ...userFormData, twoFactorEnabled: e.target.checked })}
                  className="rounded border-stone-300 text-[#5E7A68] focus:ring-[#5E7A68]"
                />
                <label htmlFor="user-mfa-toggle" className="text-xs font-medium text-stone-700 dark:text-stone-300 cursor-pointer">
                  {isEn ? 'Enforce Two-Factor Authentication (2FA)' : 'Wajibkan Autentikasi Ganda (2FA) saat login'}
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200/80 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#5E7A68] hover:bg-[#4E6857] text-white shadow-md shadow-[#5E7A68]/20 transition-all cursor-pointer"
                >
                  {isEn ? 'Save User Account' : 'Simpan Akun Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invitation Modal */}
      {inviteModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
          <div className="spatial-canvas w-full max-w-md p-8 rounded-[36px] border border-white/60 dark:border-stone-700/60 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-[#5E7A68]">
              <div className="p-3 bg-[#5E7A68]/15 rounded-2xl">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif-display text-base font-bold text-stone-900 dark:text-stone-100">
                  {isEn ? 'User Invitation Created' : 'Akun Pengguna Berhasil Dibuat'}
                </h3>
                <p className="text-xs text-stone-500">Salin kredensial untuk diberikan kepada pengguna.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-2 text-xs font-mono">
              <div><span className="text-stone-400">Nama:</span> <strong className="text-stone-900 dark:text-stone-100">{inviteModalData.name}</strong></div>
              <div><span className="text-stone-400">Email:</span> <strong className="text-stone-900 dark:text-stone-100">{inviteModalData.email}</strong></div>
              <div><span className="text-stone-400">Peran:</span> <strong className="text-[#5E7A68]">{inviteModalData.role}</strong></div>
              <div><span className="text-stone-400">Password Sementara:</span> <strong className="text-stone-900 dark:text-stone-100 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">{inviteModalData.password}</strong></div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-stone-200/80 dark:border-stone-800 pt-3">
              <button
                type="button"
                onClick={() => {
                  const text = `Selamat datang di EAM System!\n\nEmail: ${inviteModalData.email}\nPassword Sementara: ${inviteModalData.password}\nPeran: ${inviteModalData.role}\n\nSilakan segera ganti kata sandi setelah login pertama kali.`;
                  navigator.clipboard.writeText(text);
                  setCopiedInvite(true);
                  setTimeout(() => setCopiedInvite(false), 3000);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold bg-[#5E7A68] text-white cursor-pointer"
              >
                {copiedInvite ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedInvite ? (isEn ? 'Copied!' : 'Tersalin!') : (isEn ? 'Copy Credentials' : 'Salin Kredensial')}</span>
              </button>
              <button
                type="button"
                onClick={() => setInviteModalData(null)}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 cursor-pointer"
              >
                {isEn ? 'Close' : 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
