import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import {
  Asset,
  User,
  AssetCategory,
  AssetLocation,
  MovementRecord,
  MaintenanceRecord,
  ApprovalRequest,
  SystemNotification,
} from './types';
import { SetupWizard } from './components/setup/SetupWizard';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { AssetList } from './components/assets/AssetList';
import { AssetDetailModal } from './components/assets/AssetDetailModal';
import { AssetFormModal } from './components/assets/AssetFormModal';
import { AssetQrSheetModal } from './components/assets/AssetQrSheetModal';
import { AssetImportModal } from './components/assets/AssetImportModal';
import { QrNfcScannerModal } from './components/scanner/QrNfcScannerModal';
import { MovementModal } from './components/transactions/MovementModal';
import { DisposalModal } from './components/transactions/DisposalModal';
import { DisposalCenter } from './components/disposal/DisposalCenter';
import { MaintenanceModal } from './components/transactions/MaintenanceModal';
import { MaintenanceListView } from './components/transactions/MaintenanceListView';
import { MovementListView } from './components/transactions/MovementListView';
import { AuditCampaignView } from './components/transactions/AuditCampaignView';
import { ApprovalCenter } from './components/approvals/ApprovalCenter';
import { DepreciationFinancials } from './components/analytics/DepreciationFinancials';
import { ReportsCenter } from './components/analytics/ReportsCenter';
import { AuditTrailViewer } from './components/audit/AuditTrailViewer';
import { SettingsMasterData } from './components/settings/SettingsMasterData';
import { SystemSettings } from './components/settings/SystemSettings';
import { RBACManager } from './components/rbac/RBACManager';
import { IntegrationsCenter } from './components/integrations/IntegrationsCenter';
import { AssetPublicView } from './components/public/AssetPublicView';
import { LoginView } from './components/auth/LoginView';
import { Lock } from 'lucide-react';
import { logActivity } from './services/activityLogger';
import { NotificationService } from './services/notificationService';
import { completeLogout } from './services/authService';
import { AppLanguage, getI18n } from './utils/i18n';

export default function App() {
  // 1. Initial State from StorageService
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean>(StorageService.isSetupCompleted());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(StorageService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState<User>(StorageService.getCurrentUser());
  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  const [assets, setAssets] = useState<Asset[]>(StorageService.getAssets());
  const [categories, setCategories] = useState<AssetCategory[]>(StorageService.getCategories());
  const [locations, setLocations] = useState<AssetLocation[]>(StorageService.getLocations());
  const [movements, setMovements] = useState<MovementRecord[]>(StorageService.getMovements());
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(StorageService.getMaintenance());
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(StorageService.getApprovals());
  const [notifications, setNotifications] = useState<SystemNotification[]>(StorageService.getNotifications());
  const [language, setLanguage] = useState<AppLanguage>(StorageService.getLanguage());

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals & Action State
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<Asset | null>(null);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
  const [showAssetFormModal, setShowAssetFormModal] = useState<boolean>(false);
  const [showQrSheetModal, setShowQrSheetModal] = useState<boolean>(false);
  const [assetsForQrSheet, setAssetsForQrSheet] = useState<Asset[]>([]);
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [assetForMovement, setAssetForMovement] = useState<Asset | null>(null);
  const [showMovementModal, setShowMovementModal] = useState<boolean>(false);
  const [assetForDisposal, setAssetForDisposal] = useState<Asset | null>(null);
  const [assetForMaintenance, setAssetForMaintenance] = useState<Asset | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState<boolean>(false);
  const [existingMaintenanceToEdit, setExistingMaintenanceToEdit] = useState<MaintenanceRecord | null>(null);
  const [assetForPublicView, setAssetForPublicView] = useState<Asset | null>(null);
  const [showImportCsvModal, setShowImportCsvModal] = useState<boolean>(false);

  // Read-only system lock check
  const isReadOnlyMode = StorageService.getSettingValue('system.read_only_mode', 'false') === 'true';

  // Apply User Theme Effect
  useEffect(() => {
    const applyTheme = () => {
      const userTheme = currentUser.theme || 'light';
      if (userTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (userTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else if (userTheme === 'system') {
        const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    applyTheme();

    if (currentUser.theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [currentUser.theme]);

  // Sync document title with application name
  useEffect(() => {
    const appName = StorageService.getAppName();
    document.title = `${appName} - EAM`;
  }, []);

  // Apply User Language Effect
  useEffect(() => {
    const activeLang = currentUser.language || StorageService.getLanguage() || 'id';
    setLanguage(activeLang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = activeLang;
    }
  }, [currentUser.language]);

  const handleLanguageChange = (newLang: AppLanguage) => {
    setLanguage(newLang);
    StorageService.setLanguage(newLang);
    const updatedUser: User = { ...currentUser, language: newLang };
    setCurrentUser(updatedUser);
    StorageService.setCurrentUser(updatedUser);
  };


  // Sync data refresh helper
  const reloadData = () => {
    setAssets(StorageService.getAssets());
    setCategories(StorageService.getCategories());
    setLocations(StorageService.getLocations());
    setMovements(StorageService.getMovements());
    setMaintenance(StorageService.getMaintenance());
    setApprovals(StorageService.getApprovals());
    setNotifications(StorageService.getNotifications());
    setUsers(StorageService.getUsers());
  };

  // Switch User Profile
  const handleUserChange = (newUser: User) => {
    setCurrentUser(newUser);
    StorageService.setCurrentUser(newUser);
    logActivity('USER_SWITCH_PROFILE', 'AUTH', `Pengguna beralih ke profil: ${newUser.name} (${newUser.role})`);
    reloadData();
  };

  // Logout Handler
  const handleLogout = () => {
    completeLogout();
    setIsAuthenticated(false);
    logActivity('AUTH_LOGOUT', 'AUTH', `Pengguna ${currentUser.name} keluar dari sistem.`);
  };

  // Mark all notifications read
  const handleMarkNotificationsAsRead = () => {
    StorageService.markAllNotificationsRead();
    setNotifications(StorageService.getNotifications());
  };

  // Save or Update Asset
  const handleSaveAsset = (assetData: Partial<Asset>) => {
    if (isReadOnlyMode) {
      alert('Sistem sedang dalam mode Read-Only.');
      return;
    }

    const currentAssets = StorageService.getAssets();
    const existingIdx = currentAssets.findIndex((a) => a.id === assetData.id);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (existingIdx >= 0) {
      // Update
      const updatedAsset: Asset = {
        ...currentAssets[existingIdx],
        ...assetData,
        updatedAt: now,
      } as Asset;
      currentAssets[existingIdx] = updatedAsset;
      logActivity(
        'ASSET_UPDATED',
        'ASSET',
        `Memperbarui informasi aset ${updatedAsset.assetCode} (${updatedAsset.name})`,
        updatedAsset.id
      );

      // Dispatch Webhooks & Multi-Channel Notifications
      NotificationService.dispatchNotification(
        'asset.updated',
        {
          assetCode: updatedAsset.assetCode,
          name: updatedAsset.name,
          category: updatedAsset.categoryName,
          location: updatedAsset.locationName,
          status: updatedAsset.status,
          pic: updatedAsset.picName,
          updatedBy: currentUser.name,
        },
        `Pembaruan Data Aset: ${updatedAsset.assetCode}`,
        `Informasi aset ${updatedAsset.name} telah diperbarui oleh ${currentUser.name}.`
      );
    } else {
      // Create new
      const newAsset: Asset = {
        createdAt: now,
        updatedAt: now,
        ...assetData,
      } as Asset;
      currentAssets.unshift(newAsset);
      logActivity(
        'ASSET_CREATED',
        'ASSET',
        `Menambahkan aset baru ${newAsset.assetCode} (${newAsset.name}) ke inventaris`,
        newAsset.id
      );

      // Dispatch Webhooks & Multi-Channel Notifications
      NotificationService.dispatchNotification(
        'asset.created',
        {
          assetCode: newAsset.assetCode,
          name: newAsset.name,
          category: newAsset.categoryName,
          location: newAsset.locationName,
          pic: newAsset.picName,
          purchaseCost: newAsset.purchaseCost,
          createdBy: currentUser.name,
        },
        `Aset Baru Ditambahkan: ${newAsset.assetCode}`,
        `Aset baru ${newAsset.name} (${newAsset.categoryName}) telah didaftarkan ke lokasi ${newAsset.locationName}.`
      );
    }

    StorageService.saveAssets(currentAssets);
    setShowAssetFormModal(false);
    setAssetToEdit(null);
    reloadData();
  };

  // Bulk Import Assets from CSV
  const handleImportAssets = (importedAssets: Asset[], mode: 'skip' | 'overwrite') => {
    let currentAssets = [...StorageService.getAssets()];
    if (mode === 'overwrite') {
      importedAssets.forEach((imported) => {
        const existingIdx = currentAssets.findIndex(
          (a) =>
            a.assetCode.toLowerCase() === imported.assetCode.toLowerCase() ||
            (imported.serialNumber && a.serialNumber && a.serialNumber.toLowerCase() === imported.serialNumber.toLowerCase())
        );
        if (existingIdx !== -1) {
          currentAssets[existingIdx] = { ...currentAssets[existingIdx], ...imported, updatedAt: new Date().toISOString() };
        } else {
          currentAssets.unshift(imported);
        }
      });
    } else {
      const existingCodes = new Set(currentAssets.map((a) => a.assetCode.toLowerCase()));
      const uniqueNew = importedAssets.filter((a) => !existingCodes.has(a.assetCode.toLowerCase()));
      currentAssets = [...uniqueNew, ...currentAssets];
    }

    StorageService.saveAssets(currentAssets);
    logActivity(
      'ASSET_IMPORT_CSV',
      'ASSET',
      `Berhasil mengimpor massal ${importedAssets.length} aset dari file CSV (${mode === 'overwrite' ? 'Mode Timpa' : 'Mode Lewati Duplikat'})`
    );
    reloadData();
  };

  // Delete Asset
  const handleDeleteAsset = (asset: Asset) => {
    if (isReadOnlyMode) {
      alert('Sistem sedang dalam mode Read-Only.');
      return;
    }

    if (confirm(`Hapus aset "${asset.name}" (${asset.assetCode}) secara permanen dari basis data?`)) {
      const currentAssets = StorageService.getAssets();
      const updated = currentAssets.filter((a) => a.id !== asset.id);
      StorageService.saveAssets(updated);
      logActivity('ASSET_DELETED', 'ASSET', `Menghapus aset ${asset.assetCode} (${asset.name}) dari sistem`);
      reloadData();
      if (selectedAssetForDetail?.id === asset.id) {
        setSelectedAssetForDetail(null);
      }
    }
  };

  // If user opens public view, render full screen certificate page
  if (assetForPublicView) {
    return (
      <AssetPublicView
        asset={assetForPublicView}
        movements={movements}
        maintenance={maintenance}
        onBack={() => setAssetForPublicView(null)}
        onRequestMaintenance={(a) => {
          setAssetForPublicView(null);
          setAssetForMaintenance(a);
        }}
      />
    );
  }

  // If setup wizard is not completed, display setup wizard
  if (!isSetupCompleted) {
    return (
      <SetupWizard
        onComplete={() => {
          setIsSetupCompleted(true);
          setIsAuthenticated(true);
          StorageService.setAuthenticated(true);
          reloadData();
          setCurrentUser(StorageService.getCurrentUser());
        }}
      />
    );
  }

  // If user is not authenticated, render Login Screen
  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={(loggedInUser) => {
          setCurrentUser(loggedInUser);
          setIsAuthenticated(true);
          reloadData();
        }}
      />
    );
  }

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING').length;

  const handleTabSelect = (tab: string) => {
    if (tab === 'setup') {
      setIsSetupCompleted(false);
      return;
    }
    if (tab === 'stocktake') setActiveTab('audits');
    else if (tab === 'disposal') setActiveTab('disposals');
    else if (tab === 'depreciation') setActiveTab('reports');
    else if (tab === 'audittrail') setActiveTab('logs');
    else if (tab === 'api-docs') setActiveTab('integrations');
    else if (tab === 'settings') setActiveTab('system-settings');
    else setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-200">
      {/* Read-Only Mode Banner */}
      {isReadOnlyMode && (
        <div className="bg-rose-600 text-white text-xs font-bold py-1.5 px-4 text-center tracking-wide shadow-xs flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>SISTEM DALAM MODE READ-ONLY (AUDIT FREEZE) - Penambahan & perubahan data dinonaktifkan.</span>
        </div>
      )}

      {/* Header Bar — Permanen di Atas (sticky, di luar area scroll) */}
      <Header
        currentUser={currentUser}
        users={users}
        language={language}
        onLanguageChange={handleLanguageChange}
        onSwitchUser={handleUserChange}
        onUserChange={handleUserChange}
        onLogout={handleLogout}
        onOpenScanner={() => setShowScannerModal(true)}
        onNavigateToSettings={() => setActiveTab('system-settings')}
        notifications={notifications}
        onMarkNotificationRead={(id) => {
          StorageService.markNotificationAsRead(id);
          setNotifications(StorageService.getNotifications());
        }}
        onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
        onMarkAllNotificationsRead={handleMarkNotificationsAsRead}
        isReadOnlyMode={isReadOnlyMode}
      />

      {/* Main Content View Area — area scroll konten bersih */}
      <div className="flex-1 min-w-0 overflow-y-auto">
          {/* Konten Utama Full-Width Spatial Fluid */}
          <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 sm:py-6 lg:py-8 pb-28">
            {activeTab === 'dashboard' && (
              <DashboardOverview
                assets={assets}
                categories={categories}
                locations={locations}
                movements={movements}
                maintenance={maintenance}
                approvals={approvals}
                activityLogs={StorageService.getActivityLogs()}
                currentUser={currentUser}
                onNavigate={(tab) => setActiveTab(tab)}
                onSelectAsset={(asset) => setSelectedAssetForDetail(asset)}
                onOpenScanner={() => setShowScannerModal(true)}
              />
            )}

            {activeTab === 'assets' && (
              <AssetList
                assets={assets}
                categories={categories}
                locations={locations}
                currentUser={currentUser}
                onSelectAsset={(asset) => setSelectedAssetForDetail(asset)}
                onEditAsset={(asset) => {
                  setAssetToEdit(asset);
                  setShowAssetFormModal(true);
                }}
                onDeleteAsset={handleDeleteAsset}
                onAddNewAsset={() => {
                  setAssetToEdit(null);
                  setShowAssetFormModal(true);
                }}
                onAddNew={() => {
                  setAssetToEdit(null);
                  setShowAssetFormModal(true);
                }}
                onOpenMovement={(asset) => setAssetForMovement(asset)}
                onOpenMaintenance={(asset) => setAssetForMaintenance(asset)}
                onOpenDisposal={(asset) => setAssetForDisposal(asset)}
                onOpenQrSheet={(selectedAssets) => {
                  setAssetsForQrSheet(selectedAssets && selectedAssets.length > 0 ? selectedAssets : assets);
                  setShowQrSheetModal(true);
                }}
                onPrintQrSheet={(selectedAssets) => {
                  setAssetsForQrSheet(selectedAssets && selectedAssets.length > 0 ? selectedAssets : assets);
                  setShowQrSheetModal(true);
                }}
                onOpenImportCsv={() => setShowImportCsvModal(true)}
                onOpenScanner={() => setShowScannerModal(true)}
                isReadOnlyMode={isReadOnlyMode}
              />
            )}

            {activeTab === 'movements' && (
              <MovementListView
                assets={assets}
                movements={movements}
                currentUser={currentUser}
                onOpenNewMovement={(asset) => {
                  setAssetForMovement(asset || null);
                  setShowMovementModal(true);
                }}
                onRefresh={reloadData}
                isReadOnlyMode={isReadOnlyMode}
              />
            )}

            {activeTab === 'maintenance' && (
              <MaintenanceListView
                assets={assets}
                maintenance={maintenance}
                currentUser={currentUser}
                onOpenNewMaintenance={(asset) => {
                  setExistingMaintenanceToEdit(null);
                  setAssetForMaintenance(asset || null);
                  setShowMaintenanceModal(true);
                }}
                onEditMaintenance={(record) => {
                  setExistingMaintenanceToEdit(record);
                  const targetAsset = assets.find((a) => a.id === record.assetId) || null;
                  setAssetForMaintenance(targetAsset);
                  setShowMaintenanceModal(true);
                }}
                onRefresh={reloadData}
                isReadOnlyMode={isReadOnlyMode}
              />
            )}

            {activeTab === 'approvals' && (
              <ApprovalCenter currentUser={currentUser} onRefresh={reloadData} isReadOnlyMode={isReadOnlyMode} />
            )}

            {(activeTab === 'stocktake' || activeTab === 'audits') && (
              <AuditCampaignView
                assets={assets}
                locations={locations}
                currentUser={currentUser}
                onOpenScanner={() => setShowScannerModal(true)}
                isReadOnlyMode={isReadOnlyMode}
              />
            )}

            {(activeTab === 'disposals' || activeTab === 'disposal') && (
              <DisposalCenter
                currentUser={currentUser}
                onRefreshData={reloadData}
                isReadOnlyMode={isReadOnlyMode}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsCenter
                assets={assets}
                categories={categories}
                currentUser={currentUser}
                isReadOnlyMode={isReadOnlyMode}
              />
            )}

            {activeTab === 'depreciation' && (
              <DepreciationFinancials assets={assets} categories={categories} />
            )}

            {(activeTab === 'logs' || activeTab === 'audittrail') && (
              <AuditTrailViewer currentUser={currentUser} language={language} isReadOnlyMode={isReadOnlyMode} />
            )}

            {activeTab === 'rbac' && (
              <RBACManager
                currentUser={currentUser}
                onRefreshData={reloadData}
                isReadOnlyMode={isReadOnlyMode}
              />
            )}

            {activeTab === 'system-settings' && (
              <SystemSettings
                currentUser={currentUser}
                language={language}
                onLanguageChange={handleLanguageChange}
                onUpdateCurrentUser={(updated) => {
                  setCurrentUser(updated);
                  reloadData();
                }}
                onLogout={handleLogout}
                onLaunchSetupWizard={() => {
                  StorageService.resetToSetupWizard();
                  setIsSetupCompleted(false);
                  reloadData();
                }}
                isReadOnlyMode={isReadOnlyMode}
              />
            )}

            {(activeTab === 'master-data' || activeTab === 'settings') && (
              <SettingsMasterData
                currentUser={currentUser}
                language={language}
                categories={categories}
                locations={locations}
                onRefreshData={reloadData}
                isReadOnlyMode={isReadOnlyMode}
              />
            )}

            {activeTab === 'integrations' && (
              <IntegrationsCenter
                currentUser={currentUser}
                isReadOnlyMode={isReadOnlyMode}
              />
            )}
          </main>
        </div>

      {/* Bottom Navigation Bar Permanen — Desktop, Tablet, dan Mobile */}
      <BottomNav
        currentTab={activeTab}
        language={language}
        onSelectTab={handleTabSelect}
        onTabChange={handleTabSelect}
        onOpenScanner={() => setShowScannerModal(true)}
        pendingApprovalCount={pendingApprovalsCount}
        pendingApprovalsCount={pendingApprovalsCount}
        maintenanceCount={maintenance.filter(m => m.status === 'PLANNED' || m.status === 'IN_PROGRESS').length}
        currentUser={currentUser}
      />

      {/* ALL INTERACTIVE MODALS */}

      {/* 1. Asset Detail Modal */}
      {selectedAssetForDetail && (
        <AssetDetailModal
          asset={selectedAssetForDetail}
          currentUser={currentUser}
          movements={movements}
          maintenance={maintenance}
          onClose={() => setSelectedAssetForDetail(null)}
          onOpenMovement={(asset) => setAssetForMovement(asset)}
          onOpenMaintenance={(asset) => setAssetForMaintenance(asset)}
          onOpenDisposal={(asset) => setAssetForDisposal(asset)}
          onOpenPublicView={(asset) => setAssetForPublicView(asset)}
          isReadOnlyMode={isReadOnlyMode}
        />
      )}

      {/* 2. Asset Form Modal (Add / Edit) */}
      {showAssetFormModal && (
        <AssetFormModal
          assetToEdit={assetToEdit}
          categories={categories}
          locations={locations}
          onSave={handleSaveAsset}
          onClose={() => {
            setShowAssetFormModal(false);
            setAssetToEdit(null);
          }}
          codePrefix={StorageService.getAssetCodePrefix()}
        />
      )}

      {/* 3. Batch Printable QR Tag Sheet */}
      {showQrSheetModal && (
        <AssetQrSheetModal
          assets={assetsForQrSheet.length > 0 ? assetsForQrSheet : assets}
          onClose={() => {
            setShowQrSheetModal(false);
            setAssetsForQrSheet([]);
          }}
        />
      )}

      {/* 4. Camera & RFID/NFC Scanner Modal */}
      {showScannerModal && (
        <QrNfcScannerModal
          assets={assets}
          onClose={() => setShowScannerModal(false)}
          onSelectAsset={(asset) => setSelectedAssetForDetail(asset)}
          onOpenMovement={(asset) => setAssetForMovement(asset)}
          onOpenMaintenance={(asset) => setAssetForMaintenance(asset)}
        />
      )}

      {/* 5. Movement Modal */}
      {(assetForMovement || showMovementModal) && (
        <MovementModal
          asset={assetForMovement}
          locations={locations}
          currentUser={currentUser}
          onClose={() => {
            setAssetForMovement(null);
            setShowMovementModal(false);
          }}
          onSuccess={reloadData}
          isReadOnlyMode={isReadOnlyMode}
        />
      )}

      {/* 6. Disposal Modal */}
      {assetForDisposal && (
        <DisposalModal
          asset={assetForDisposal}
          currentUser={currentUser}
          onClose={() => setAssetForDisposal(null)}
          onSuccess={reloadData}
          isReadOnlyMode={isReadOnlyMode}
        />
      )}

      {/* 7. Maintenance Work Order Modal */}
      {(assetForMaintenance || showMaintenanceModal || existingMaintenanceToEdit) && (
        <MaintenanceModal
          asset={assetForMaintenance}
          existingRecord={existingMaintenanceToEdit}
          currentUser={currentUser}
          onClose={() => {
            setAssetForMaintenance(null);
            setShowMaintenanceModal(false);
            setExistingMaintenanceToEdit(null);
          }}
          onSuccess={reloadData}
          isReadOnlyMode={isReadOnlyMode}
        />
      )}

      {/* 8. Bulk CSV Import Modal */}
      {showImportCsvModal && (
        <AssetImportModal
          existingAssets={assets}
          categories={categories}
          locations={locations}
          onClose={() => setShowImportCsvModal(false)}
          onImportComplete={handleImportAssets}
        />
      )}
    </div>
  );
}
