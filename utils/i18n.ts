export type AppLanguage = 'id' | 'en';

export interface TranslationDictionary {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    add: string;
    back: string;
    close: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    loading: string;
    success: string;
    error: string;
    confirm: string;
    actions: string;
    yes: string;
    no: string;
    reset: string;
    status: string;
    date: string;
    all: string;
    details: string;
    active: string;
    inactive: string;
    pending: string;
    completed: string;
    inProgress: string;
    rejected: string;
    locked: string;
    unlocked: string;
    readOnly: string;
    none: string;
    selectOption: string;
  };
  nav: {
    dashboard: string;
    assets: string;
    movements: string;
    maintenance: string;
    audits: string;
    approvals: string;
    reports: string;
    rbac: string;
    systemSettings: string;
    backup: string;
    masterData: string;
    logs: string;
    apiDocs: string;
    setupWizard: string;
  };
  header: {
    toggleSidebar: string;
    searchPlaceholder: string;
    scanQrRfid: string;
    notifications: string;
    markAllRead: string;
    noNotifications: string;
    systemNotifications: string;
    accountSettings: string;
    testRbac: string;
    hide: string;
    show: string;
    logout: string;
    active2FA: string;
    disabled2FA: string;
    readOnlyBanner: string;
    language: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    totalAssetBookValue: string;
    totalRegisteredAssets: string;
    pendingApprovals: string;
    maintenanceNeeded: string;
    physicalConditionStats: string;
    recentActivity: string;
    depreciationFinancials: string;
    viewAll: string;
    good: string;
    fair: string;
    minorDamage: string;
    heavyDamage: string;
    lost: string;
    fastActions: string;
    addNewAsset: string;
    startAudit: string;
    requestMovement: string;
    createWorkOrder: string;
  };
  assets: {
    title: string;
    subtitle: string;
    addNew: string;
    printMassQr: string;
    importCsv: string;
    exportJson: string;
    searchPlaceholder: string;
    filterCategory: string;
    filterLocation: string;
    filterStatus: string;
    filterCondition: string;
    code: string;
    name: string;
    category: string;
    location: string;
    pic: string;
    condition: string;
    status: string;
    acquisitionCost: string;
    bookValue: string;
    noAssetsFound: string;
    assetDetails: string;
    assetForm: string;
  };
  settings: {
    title: string;
    subtitle: string;
    profileTab: string;
    systemTab: string;
    brandingTab: string;
    securityTab: string;
    backupTab: string;
    vpsTab: string;
    fullName: string;
    email: string;
    userId: string;
    idCard: string;
    birthDate: string;
    department: string;
    location: string;
    appearance: string;
    theme: string;
    language: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    langIndonesian: string;
    langEnglish: string;
    saveProfile: string;
    saveSuccess: string;
    security2FA: string;
    setup2FA: string;
    disable2FA: string;
    backupDatabase: string;
    restoreDatabase: string;
    factoryReset: string;
    companyIdentity: string;
    companyName: string;
    codePrefix: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    userIdOrEmail: string;
    password: string;
    loginButton: string;
    twoFactorTitle: string;
    twoFactorSubtitle: string;
    verifyCode: string;
    verifyButton: string;
    invalidCredentials: string;
    quickDemoUsers: string;
  };
}

export const translations: Record<AppLanguage, TranslationDictionary> = {
  id: {
    common: {
      save: 'Simpan',
      cancel: 'Batal',
      delete: 'Hapus',
      edit: 'Ubah',
      create: 'Buat Baru',
      add: 'Tambah',
      back: 'Kembali',
      close: 'Tutup',
      search: 'Cari',
      filter: 'Filter',
      export: 'Ekspor',
      import: 'Impor',
      loading: 'Memuat...',
      success: 'Berhasil',
      error: 'Terjadi Kesalahan',
      confirm: 'Konfirmasi',
      actions: 'Aksi',
      yes: 'Ya',
      no: 'Tidak',
      reset: 'Reset',
      status: 'Status',
      date: 'Tanggal',
      all: 'Semua',
      details: 'Detail',
      active: 'Aktif',
      inactive: 'Non-Aktif',
      pending: 'Menunggu',
      completed: 'Selesai',
      inProgress: 'Dalam Proses',
      rejected: 'Ditolak',
      locked: 'Terkunci',
      unlocked: 'Terbuka',
      readOnly: 'Hanya Baca',
      none: 'Tidak Ada',
      selectOption: 'Pilih Opsi...',
    },
    nav: {
      dashboard: 'Dashboard',
      assets: 'Master Aset',
      movements: 'Mutasi & Relokasi',
      maintenance: 'Pemeliharaan',
      audits: 'Stocktake & Audit',
      approvals: 'Pusat Persetujuan',
      reports: 'Laporan & Rekap',
      rbac: 'Hak Akses (RBAC)',
      systemSettings: 'Pengaturan Sistem',
      backup: 'Cadangan & Pemulihan',
      masterData: 'Master Data & Kebijakan',
      logs: 'Audit Trail & Log',
      apiDocs: 'API & Webhook Docs',
      setupWizard: 'Setup Wizard',
    },
    header: {
      toggleSidebar: 'Buka / Tutup Menu Samping',
      searchPlaceholder: 'Cari aset (Kode, Serial, Nama, PIC, Lokasi)...',
      scanQrRfid: 'Scan QR / RFID',
      notifications: 'Notifikasi',
      markAllRead: 'Tandai Semua Dibaca',
      noNotifications: 'Tidak ada notifikasi saat ini.',
      systemNotifications: 'Notifikasi Sistem',
      accountSettings: 'Pengaturan Akun, Profil & Sistem',
      testRbac: 'Uji Batasan Peran (RBAC)',
      hide: 'sembunyikan',
      show: 'tampilkan',
      logout: 'Keluar dari Akun (Logout)',
      active2FA: '2FA Aktif',
      disabled2FA: '2FA Non-aktif',
      readOnlyBanner: 'MAINTENANCE / READ-ONLY MODE AKTIF: Seluruh operasi penulisan data dikunci sementara untuk pemeliharaan sistem.',
      language: 'Bahasa',
    },
    dashboard: {
      title: 'Dashboard Ringkasan Aset',
      subtitle: 'Pantau status kepemilikan, pergerakan, dan nilai depresiasi aset secara real-time.',
      totalAssetBookValue: 'Total Nilai Buku Aset',
      totalRegisteredAssets: 'Total Aset Terdaftar',
      pendingApprovals: 'Menunggu Persetujuan',
      maintenanceNeeded: 'Perlu Servis / Rusak',
      physicalConditionStats: 'Statistik Kondisi Fisik',
      recentActivity: 'Aktivitas Terkini',
      depreciationFinancials: 'Ringkasan Finansial & Depresiasi',
      viewAll: 'Lihat Semua',
      good: 'Baik / Prima',
      fair: 'Cukup / Berfungsi',
      minorDamage: 'Rusak Ringan',
      heavyDamage: 'Rusak Berat',
      lost: 'Hilang / Hilang Catatan',
      fastActions: 'Aksi Cepat',
      addNewAsset: 'Registrasi Aset Baru',
      startAudit: 'Mulai Audit Stocktake',
      requestMovement: 'Pengajuan Mutasi Lokasi',
      createWorkOrder: 'Buat Tiket Perbaikan',
    },
    assets: {
      title: 'Master Aset & Inventaris',
      subtitle: 'Kelola seluruh data inventaris fisik, pelabelan pintar QR/NFC, dan riwayat aset.',
      addNew: 'Tambah Aset',
      printMassQr: 'Cetak Lembar QR',
      importCsv: 'Impor CSV',
      exportJson: 'Ekspor Data',
      searchPlaceholder: 'Cari berdasarkan nama, kode aset, atau nomor seri...',
      filterCategory: 'Semua Kategori',
      filterLocation: 'Semua Lokasi',
      filterStatus: 'Semua Status',
      filterCondition: 'Semua Kondisi',
      code: 'Kode Aset',
      name: 'Nama Aset',
      category: 'Kategori',
      location: 'Lokasi',
      pic: 'Penanggung Jawab',
      condition: 'Kondisi',
      status: 'Status',
      acquisitionCost: 'Harga Beli',
      bookValue: 'Nilai Buku',
      noAssetsFound: 'Tidak ada aset yang sesuai dengan kriteria pencarian.',
      assetDetails: 'Rincian Lengkap Aset',
      assetForm: 'Formulir Data Aset',
    },
    settings: {
      title: 'Pengaturan & Profil Pengguna',
      subtitle: 'Konfigurasi profil akun, identitas instansi, keamanan, dan preferensi tampilan.',
      profileTab: 'Profil Saya',
      systemTab: 'Sistem & Format',
      brandingTab: 'Identitas Instansi',
      securityTab: 'Keamanan & 2FA',
      backupTab: 'Cadangan & Pemulihan',
      vpsTab: 'Akses Online & VPS',
      fullName: 'Nama Lengkap',
      email: 'Alamat Email',
      userId: 'ID Pengguna (Login)',
      idCard: 'Nomor ID Card / NIK',
      birthDate: 'Tanggal Lahir',
      department: 'Divisi / Departemen',
      location: 'Lokasi Penugasan',
      appearance: 'Tema & Tampilan',
      theme: 'Mode Tampilan',
      language: 'Bahasa Antarmuka',
      themeLight: 'Terang (Light)',
      themeDark: 'Gelap (Dark)',
      themeSystem: 'Sistem (Auto)',
      langIndonesian: 'Bahasa Indonesia',
      langEnglish: 'English (US)',
      saveProfile: 'Simpan Perubahan Profil',
      saveSuccess: 'Pengaturan profil berhasil disimpan.',
      security2FA: 'Autentikasi Dua Faktor (2FA TOTP)',
      setup2FA: 'Aktifkan 2FA',
      disable2FA: 'Nonaktifkan 2FA',
      backupDatabase: 'Unduh Cadangan JSON',
      restoreDatabase: 'Pulihkan dari File Cadangan',
      factoryReset: 'Reset Data Pabrik',
      companyIdentity: 'Identitas Perusahaan / Organisasi',
      companyName: 'Nama Instansi Resmi',
      codePrefix: 'Prefix Format Kode Aset',
    },
    auth: {
      loginTitle: 'Portal Enterprise Asset Management',
      loginSubtitle: 'Masuk dengan kredensial akun Anda yang terdaftar.',
      userIdOrEmail: 'ID Pengguna atau Email',
      password: 'Kata Sandi',
      loginButton: 'Masuk ke Sistem',
      twoFactorTitle: 'Verifikasi Keamanan 2FA',
      twoFactorSubtitle: 'Masukkan 6-digit kode OTP dari aplikasi autentikator Anda.',
      verifyCode: 'Kode OTP 6-Digit',
      verifyButton: 'Verifikasi & Lanjutkan',
      invalidCredentials: 'ID Pengguna atau Kata Sandi tidak valid.',
      quickDemoUsers: 'Pilih Akun Uji Coba Cepat (Demo Role)',
    },
  },
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create New',
      add: 'Add',
      back: 'Back',
      close: 'Close',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      loading: 'Loading...',
      success: 'Success',
      error: 'An error occurred',
      confirm: 'Confirm',
      actions: 'Actions',
      yes: 'Yes',
      no: 'No',
      reset: 'Reset',
      status: 'Status',
      date: 'Date',
      all: 'All',
      details: 'Details',
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      completed: 'Completed',
      inProgress: 'In Progress',
      rejected: 'Rejected',
      locked: 'Locked',
      unlocked: 'Unlocked',
      readOnly: 'Read-Only',
      none: 'None',
      selectOption: 'Select an option...',
    },
    nav: {
      dashboard: 'Dashboard',
      assets: 'Master Assets',
      movements: 'Movements & Relocations',
      maintenance: 'Maintenance & Work Orders',
      audits: 'Stocktake & Audits',
      approvals: 'Approval Center',
      reports: 'Reports & Analytics',
      rbac: 'Access Control (RBAC)',
      systemSettings: 'System Settings',
      backup: 'Backup & Recovery',
      masterData: 'Master Data & Policies',
      logs: 'Audit Trail & Logs',
      apiDocs: 'API & Webhook Docs',
      setupWizard: 'Setup Wizard',
    },
    header: {
      toggleSidebar: 'Toggle Sidebar Menu',
      searchPlaceholder: 'Search assets (Code, Serial, Name, PIC, Location)...',
      scanQrRfid: 'Scan QR / RFID',
      notifications: 'Notifications',
      markAllRead: 'Mark All as Read',
      noNotifications: 'No notifications at this time.',
      systemNotifications: 'System Notifications',
      accountSettings: 'Account, Profile & System Settings',
      testRbac: 'Test Role Boundaries (RBAC)',
      hide: 'hide',
      show: 'show',
      logout: 'Sign Out (Logout)',
      active2FA: '2FA Active',
      disabled2FA: '2FA Disabled',
      readOnlyBanner: 'MAINTENANCE / READ-ONLY MODE ACTIVE: All write operations are temporarily locked for system maintenance.',
      language: 'Language',
    },
    dashboard: {
      title: 'Asset Overview Dashboard',
      subtitle: 'Monitor ownership status, movements, and real-time asset depreciation values.',
      totalAssetBookValue: 'Total Asset Book Value',
      totalRegisteredAssets: 'Total Registered Assets',
      pendingApprovals: 'Pending Approvals',
      maintenanceNeeded: 'Needs Service / Damaged',
      physicalConditionStats: 'Physical Condition Overview',
      recentActivity: 'Recent Activities',
      depreciationFinancials: 'Financials & Depreciation',
      viewAll: 'View All',
      good: 'Good / Prime',
      fair: 'Fair / Functional',
      minorDamage: 'Minor Damage',
      heavyDamage: 'Heavy Damage',
      lost: 'Lost / Missing',
      fastActions: 'Quick Actions',
      addNewAsset: 'Register New Asset',
      startAudit: 'Start Stocktake Audit',
      requestMovement: 'Request Relocation',
      createWorkOrder: 'Create Work Order',
    },
    assets: {
      title: 'Master Assets & Inventory',
      subtitle: 'Manage all physical inventory data, smart QR/NFC labeling, and asset lifecycle.',
      addNew: 'Add Asset',
      printMassQr: 'Print QR Sheet',
      importCsv: 'Import CSV',
      exportJson: 'Export Data',
      searchPlaceholder: 'Search by name, asset code, or serial number...',
      filterCategory: 'All Categories',
      filterLocation: 'All Locations',
      filterStatus: 'All Statuses',
      filterCondition: 'All Conditions',
      code: 'Asset Code',
      name: 'Asset Name',
      category: 'Category',
      location: 'Location',
      pic: 'Assigned PIC',
      condition: 'Condition',
      status: 'Status',
      acquisitionCost: 'Acquisition Cost',
      bookValue: 'Net Book Value',
      noAssetsFound: 'No assets matched the current search criteria.',
      assetDetails: 'Asset Details & History',
      assetForm: 'Asset Registration Form',
    },
    settings: {
      title: 'Settings & User Profile',
      subtitle: 'Configure account profile, organizational identity, security, and appearance preferences.',
      profileTab: 'My Profile',
      systemTab: 'System & Formats',
      brandingTab: 'Organization Identity',
      securityTab: 'Security & 2FA',
      backupTab: 'Backup & Recovery',
      vpsTab: 'Online Access & VPS',
      fullName: 'Full Name',
      email: 'Email Address',
      userId: 'User ID (Login)',
      idCard: 'ID Card / National ID',
      birthDate: 'Birth Date',
      department: 'Division / Department',
      location: 'Assigned Location',
      appearance: 'Theme & Appearance',
      theme: 'Display Mode',
      language: 'Interface Language',
      themeLight: 'Light Mode',
      themeDark: 'Dark Mode',
      themeSystem: 'System Default',
      langIndonesian: 'Bahasa Indonesia',
      langEnglish: 'English (US)',
      saveProfile: 'Save Profile Changes',
      saveSuccess: 'Profile settings saved successfully.',
      security2FA: 'Two-Factor Authentication (2FA TOTP)',
      setup2FA: 'Enable 2FA',
      disable2FA: 'Disable 2FA',
      backupDatabase: 'Download JSON Backup',
      restoreDatabase: 'Restore from Backup File',
      factoryReset: 'Factory Reset',
      companyIdentity: 'Organization / Company Identity',
      companyName: 'Official Organization Name',
      codePrefix: 'Asset Code Prefix Formula',
    },
    auth: {
      loginTitle: 'Enterprise Asset Management Portal',
      loginSubtitle: 'Sign in with your registered enterprise credentials.',
      userIdOrEmail: 'User ID or Email',
      password: 'Password',
      loginButton: 'Sign In to System',
      twoFactorTitle: '2FA Security Verification',
      twoFactorSubtitle: 'Enter the 6-digit OTP code from your authenticator app.',
      verifyCode: '6-Digit OTP Code',
      verifyButton: 'Verify & Proceed',
      invalidCredentials: 'Invalid User ID or Password.',
      quickDemoUsers: 'Quick Test Demo Users',
    },
  },
};

/**
 * Helper to get a translation dictionary by language
 */
export function getI18n(lang: AppLanguage = 'id'): TranslationDictionary {
  return translations[lang] || translations.id;
}
