import React, { useState, useMemo } from 'react';
import {
  Box,
  Plus,
  Search,
  Download,
  Upload,
  Printer,
  ArrowLeftRight,
  Wrench,
  Trash2,
  Eye,
  Edit,
  LayoutGrid,
  List,
  AlertCircle,
  Tag,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  Calendar,
  Building,
  UserCheck,
  TrendingDown,
  X,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Asset, AssetCategory, AssetLocation, User } from '../../types';
import { formatRupiah } from '../../services/depreciationService';
import { getStatusBadgeClass, hasPermission, canViewAsset } from '../../services/authService';
import { StorageService } from '../../services/storageService';
import { getI18n, AppLanguage } from '../../utils/i18n';
import { generateQrDataUrl } from '../../services/qrService';

interface AssetListProps {
  assets: Asset[];
  categories: AssetCategory[];
  locations: AssetLocation[];
  currentUser: User;
  onSelectAsset: (asset: Asset) => void;
  onAddNewAsset?: () => void;
  onAddNew?: () => void;
  onEditAsset: (asset: Asset) => void;
  onDeleteAsset?: (asset: Asset) => void;
  onOpenMovement?: (asset: Asset) => void;
  onOpenMaintenance?: (asset: Asset) => void;
  onOpenDisposal?: (asset: Asset) => void;
  onOpenQrSheet?: (selectedAssets: Asset[]) => void;
  onPrintQrSheet?: (selectedAssets?: Asset[]) => void;
  onOpenImportCsv?: () => void;
  onExportCsv?: (assetsToExport: Asset[]) => void;
  onOpenScanner?: () => void;
  isReadOnlyMode: boolean;
}

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  categories,
  locations,
  currentUser,
  onSelectAsset,
  onAddNewAsset,
  onAddNew,
  onEditAsset,
  onDeleteAsset = (_asset: Asset) => {},
  onOpenMovement = (_asset: Asset) => {},
  onOpenMaintenance = (_asset: Asset) => {},
  onOpenDisposal = (_asset: Asset) => {},
  onOpenQrSheet,
  onPrintQrSheet,
  onOpenImportCsv,
  onExportCsv,
  isReadOnlyMode,
}) => {
  const currentLang: AppLanguage = currentUser?.language || StorageService.getLanguage() || 'en';
  const t = getI18n(currentLang);
  const isEn = currentLang === 'en';

  const handleAddNew = onAddNewAsset || onAddNew || (() => {});
  const handleOpenQrSheet = onOpenQrSheet || onPrintQrSheet || ((_assets?: Asset[]) => {});

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  
  // Quick Preview Side Drawer State
  const [quickDrawerAsset, setQuickDrawerAsset] = useState<Asset | null>(null);
  const [drawerQrCodeUrl, setDrawerQrCodeUrl] = useState<string>('');

  const canManageAssets = hasPermission(currentUser, 'assets.manage') && !isReadOnlyMode;
  const isScopedViewer = !hasPermission(currentUser, 'assets.view_all');

  const handleExportCsv = (assetsToExport: Asset[]) => {
    if (onExportCsv) {
      onExportCsv(assetsToExport);
      return;
    }
    const headers = [
      isEn ? 'Asset Code' : 'Kode Aset',
      isEn ? 'Asset Name' : 'Nama Aset',
      isEn ? 'Category' : 'Kategori',
      isEn ? 'Location' : 'Lokasi',
      'Status',
      'PIC',
      isEn ? 'Acquisition Cost' : 'Nilai Beli',
      isEn ? 'Book Value' : 'Nilai Buku',
    ];
    const rows = assetsToExport.map((a) => [
      `"${(a.assetCode || '').replace(/"/g, '""')}"`,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      `"${(a.categoryName || '').replace(/"/g, '""')}"`,
      `"${(a.locationName || '').replace(/"/g, '""')}"`,
      `"${a.status || ''}"`,
      `"${(a.picName || '').replace(/"/g, '""')}"`,
      a.purchaseCost || 0,
      a.currentBookValue || 0,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AssetCorp_Master_Aset_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter scoped data
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // 1. RBAC Scoping
      if (!canViewAsset(currentUser, asset)) {
        return false;
      }

      // 2. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = asset.assetCode.toLowerCase().includes(q);
        const matchSerial = asset.serialNumber.toLowerCase().includes(q);
        const matchName = asset.name.toLowerCase().includes(q);
        const matchPic = asset.picName.toLowerCase().includes(q);
        const matchLoc = asset.locationName.toLowerCase().includes(q);
        const matchRfid = (asset.rfidTag || '').toLowerCase().includes(q);
        if (!matchCode && !matchSerial && !matchName && !matchPic && !matchLoc && !matchRfid) {
          return false;
        }
      }

      // 3. Category Filter
      if (selectedCategory !== 'ALL' && asset.categoryId !== selectedCategory) {
        return false;
      }

      // 4. Location Filter
      if (selectedLocation !== 'ALL' && asset.locationId !== selectedLocation) {
        return false;
      }

      // 5. Status Filter
      if (selectedStatus !== 'ALL' && asset.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [assets, currentUser, searchQuery, selectedCategory, selectedLocation, selectedStatus]);

  // Bulk Select Handlers
  const handleToggleSelectAll = () => {
    if (selectedAssetIds.length === filteredAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(filteredAssets.map((a) => a.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedAssetIds.includes(id)) {
      setSelectedAssetIds(selectedAssetIds.filter((item) => item !== id));
    } else {
      setSelectedAssetIds([...selectedAssetIds, id]);
    }
  };

  const selectedAssets = assets.filter((a) => selectedAssetIds.includes(a.id));

  const handleOpenDrawer = async (asset: Asset) => {
    setQuickDrawerAsset(asset);
    try {
      const qrPayload = JSON.stringify({
        id: asset.id,
        code: asset.assetCode,
        name: asset.name,
        loc: asset.locationName,
        status: asset.status,
      });
      const qrDataUrl = await generateQrDataUrl(qrPayload);
      setDrawerQrCodeUrl(qrDataUrl);
    } catch {
      setDrawerQrCodeUrl('');
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* 1. Spatial Control & Command Header */}
      <div className="glass-panel squircle p-6 sm:p-8 space-y-5 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#5E7A68]/15 text-[#3B4D3F] dark:bg-emerald-950/60 dark:text-emerald-300 border border-[#5E7A68]/20">
                {isEn ? 'Asset Catalog' : 'Katalog Master Aset'}
              </span>
              <span className="text-[11px] text-stone-500 font-mono">
                {filteredAssets.length} / {assets.length} {isEn ? 'Units Listed' : 'Unit Terdata'}
              </span>
            </div>
            <h1 className="font-serif-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181F19] dark:text-stone-100">
              {isEn ? 'Master Asset Inventory Catalog' : 'Katalog Inventaris Master Aset'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl">
              {isEn
                ? 'Centralized asset registry, technical specifications, RFID telemetry, and lifecycle valuation.'
                : 'Pencatatan registri aset fisik, spesifikasi teknis, telemetri RFID, dan amortisasi nilai buku.'}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Export CSV */}
            <button
              onClick={() => handleExportCsv(selectedAssets.length > 0 ? selectedAssets : filteredAssets)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-200 border border-stone-300/70 dark:border-stone-700/70 rounded-2xl hover:bg-white dark:hover:bg-stone-800 transition-all cursor-pointer shadow-xs hover:scale-105"
              title={isEn ? 'Export CSV Asset Data' : 'Ekspor CSV Data Aset'}
            >
              <Download className="w-4 h-4" />
              <span>{isEn ? 'Export CSV' : 'Ekspor CSV'}</span>
            </button>

            {/* Import CSV */}
            {canManageAssets && onOpenImportCsv && (
              <button
                onClick={onOpenImportCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-200 border border-stone-300/70 dark:border-stone-700/70 rounded-2xl hover:bg-white dark:hover:bg-stone-800 transition-all cursor-pointer shadow-xs hover:scale-105"
                title={isEn ? 'Import CSV File' : 'Impor Massal CSV'}
              >
                <Upload className="w-4 h-4" />
                <span>{t.assets.importCsv}</span>
              </button>
            )}

            {/* Print QR Tag Sheet */}
            <button
              onClick={() => handleOpenQrSheet(selectedAssets.length > 0 ? selectedAssets : filteredAssets)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-white rounded-2xl transition-all cursor-pointer shadow-xs hover:scale-105"
              title={isEn ? 'Print QR Sticker Sheets' : 'Cetak Label Stiker QR Code'}
            >
              <Printer className="w-4 h-4" />
              <span>
                {isEn ? 'Print QR' : 'Cetak QR'} ({selectedAssetIds.length > 0 ? selectedAssetIds.length : (isEn ? 'All' : 'Semua')})
              </span>
            </button>

            {/* Add New Asset Button */}
            {canManageAssets && (
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-4 py-2 bg-[#5E7A68] hover:bg-[#4D6656] text-white rounded-2xl text-xs font-bold shadow-lg shadow-[#5E7A68]/20 transition-all cursor-pointer hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>{t.assets.addNew}</span>
              </button>
            )}
          </div>
        </div>

        {/* Scoped Role Warning Badge */}
        {isScopedViewer && (
          <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 rounded-2xl text-xs flex items-center justify-between text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>{isEn ? 'Scoped Viewer Role:' : 'Peran Terbatas (Scoped Viewer):'}</strong>{' '}
                {isEn
                  ? `Displaying assets assigned to department ${currentUser.department} or location ${currentUser.location}.`
                  : `Menampilkan aset dalam lingkup departemen ${currentUser.department} atau lokasi ${currentUser.location}.`}
              </span>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="space-y-3 pt-3 border-t border-stone-200/60 dark:border-stone-700/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder={isEn ? 'Search code, serial, name, PIC, RFID...' : 'Cari kode, serial, nama, PIC, RFID...'}
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-white/70 dark:bg-stone-800/70 border border-stone-300/70 dark:border-stone-700/70 rounded-full text-[#181F19] dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#5E7A68]/20 focus:border-[#5E7A68]"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory || 'ALL'}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white/70 dark:bg-stone-800/70 border border-stone-300/70 dark:border-stone-700/70 rounded-full text-[#181F19] dark:text-stone-100 focus:outline-hidden"
              >
                <option value="ALL">{t.assets.filterCategory}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={selectedLocation || 'ALL'}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white/70 dark:bg-stone-800/70 border border-stone-300/70 dark:border-stone-700/70 rounded-full text-[#181F19] dark:text-stone-100 focus:outline-hidden truncate"
              >
                <option value="ALL">{t.assets.filterLocation}</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus || 'ALL'}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white/70 dark:bg-stone-800/70 border border-stone-300/70 dark:border-stone-700/70 rounded-full text-[#181F19] dark:text-stone-100 focus:outline-hidden"
              >
                <option value="ALL">{t.assets.filterStatus}</option>
                <option value="ACTIVE">{isEn ? 'ACTIVE (Ready)' : 'ACTIVE (Aktif)'}</option>
                <option value="IN_USE">{isEn ? 'IN_USE (In Use)' : 'IN_USE (Dipakai)'}</option>
                <option value="MAINTENANCE">{isEn ? 'MAINTENANCE (In Service)' : 'MAINTENANCE (Servis)'}</option>
                <option value="DISPOSED">{isEn ? 'DISPOSED (Decommissioned)' : 'DISPOSED (Dihapuskan)'}</option>
                <option value="MISSING">{isEn ? 'MISSING (Discrepancy)' : 'MISSING (Hilang/Selisih)'}</option>
              </select>
            </div>
          </div>

          {/* Bottom Filter Controls & View Toggle */}
          <div className="flex items-center justify-between pt-2 text-xs text-stone-500">
            <div className="flex items-center gap-3">
              <span>
                {isEn ? 'Showing' : 'Menampilkan'} <strong>{filteredAssets.length}</strong> {isEn ? 'of' : 'dari'} <strong>{assets.length}</strong> {isEn ? 'assets' : 'aset'}
              </span>
              {selectedAssetIds.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#5E7A68]/15 text-[#3B4D3F] dark:text-emerald-300 font-semibold">
                  {selectedAssetIds.length} {isEn ? 'selected' : 'dipilih'}
                </span>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-stone-800 p-0.5 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white dark:bg-stone-700 text-[#181F19] dark:text-stone-100 shadow-xs' : 'text-stone-400'
                }`}
                title={isEn ? 'Table View' : 'Tampilan Tabel'}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white dark:bg-stone-700 text-[#181F19] dark:text-stone-100 shadow-xs' : 'text-stone-400'
                }`}
                title={isEn ? 'Card Grid View' : 'Tampilan Grid Kartu'}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content: High-Density Table or Spatial Grid */}
      {filteredAssets.length === 0 ? (
        <div className="glass-panel squircle p-12 text-center">
          <AlertCircle className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">{t.assets.noAssetsFound}</h3>
          <p className="text-xs text-stone-500 mt-1">
            {isEn ? 'Try adjusting your search filters or add a new asset.' : 'Coba sesuaikan kata kunci pencarian atau reset filter.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="glass-panel squircle p-6 sm:p-8 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
              <thead className="text-stone-500 uppercase text-[10px] font-bold tracking-wider border-b border-stone-200/80 dark:border-stone-700/80">
                <tr>
                  <th className="pb-3.5 pr-2 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedAssetIds.length === filteredAssets.length && filteredAssets.length > 0}
                      onChange={handleToggleSelectAll}
                      className="rounded-sm text-[#5E7A68] focus:ring-[#5E7A68]"
                    />
                  </th>
                  <th className="pb-3.5 px-3 font-semibold">{isEn ? 'Asset ID / Tag' : 'ID & Tag QR'}</th>
                  <th className="pb-3.5 px-3 font-semibold">{isEn ? 'Asset Details & Specs' : 'Nama & Spesifikasi Unit'}</th>
                  <th className="pb-3.5 px-3 font-semibold">{isEn ? 'Category & Location' : 'Kategori & Lokasi'}</th>
                  <th className="pb-3.5 px-3 font-semibold">{isEn ? 'Ownership & PIC' : 'Penanggung Jawab (PIC)'}</th>
                  <th className="pb-3.5 px-3 font-semibold">{isEn ? 'Lifecycle Status' : 'Status Siklus Hidup'}</th>
                  <th className="pb-3.5 px-3 text-right font-semibold">{isEn ? 'Financials (NBV)' : 'Nilai Buku (NBV)'}</th>
                  <th className="pb-3.5 pl-3 text-center font-semibold">{isEn ? 'Actions' : 'Aksi'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/40 dark:divide-stone-800/60 font-medium">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAssetIds.includes(asset.id);
                  return (
                    <tr
                      key={asset.id}
                      className={`group hover:bg-stone-100/60 dark:hover:bg-stone-800/40 transition-colors ${
                        isSelected ? 'bg-[#5E7A68]/10 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pr-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(asset.id)}
                          className="rounded-sm text-[#5E7A68] focus:ring-[#5E7A68]"
                        />
                      </td>

                      {/* Code & Mini QR */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(asset)}
                            className="w-7 h-7 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center hover:bg-[#181F19] hover:text-white transition-colors cursor-pointer"
                            title={isEn ? 'View Quick Drawer' : 'Buka Laci Rincian Cepat'}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <div>
                            <div
                              onClick={() => handleOpenDrawer(asset)}
                              className="font-bold text-[#181F19] dark:text-stone-100 hover:text-[#5E7A68] dark:hover:text-emerald-400 cursor-pointer font-mono text-xs"
                            >
                              {asset.assetCode}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono">SN: {asset.serialNumber || '-'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Name & Specs */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="flex items-center gap-3">
                          {asset.imageUrl ? (
                            <img
                              src={asset.imageUrl}
                              alt={asset.name}
                              className="w-9 h-9 rounded-xl object-cover ring-1 ring-stone-300/50 dark:ring-stone-700/50 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0">
                              <Box className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div
                              onClick={() => onSelectAsset(asset)}
                              className="font-bold text-stone-900 dark:text-stone-100 hover:underline cursor-pointer line-clamp-1"
                            >
                              {asset.name}
                            </div>
                            <div className="text-[10px] text-stone-500 line-clamp-1">{asset.categoryName} • {asset.condition}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Location */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="text-stone-800 dark:text-stone-200 font-semibold">{asset.categoryName}</div>
                        <div className="text-[10px] text-stone-500">{asset.locationName}</div>
                      </td>

                      {/* Ownership / PIC */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-stone-800 dark:text-stone-200">{asset.picName}</div>
                        <div className="text-[10px] text-stone-400">{asset.department}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                            asset.status
                          )}`}
                        >
                          {asset.status}
                        </span>
                      </td>

                      {/* Financials (NBV) */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-bold text-[#181F19] dark:text-stone-100 font-mono">
                          {formatRupiah(asset.currentBookValue)}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {isEn ? 'Cost:' : 'Beli:'} {formatRupiah(asset.purchaseCost)}
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3.5 pl-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Quick Drawer */}
                          <button
                            onClick={() => handleOpenDrawer(asset)}
                            className="p-1.5 text-stone-600 hover:text-[#5E7A68] dark:text-stone-400 dark:hover:text-emerald-400 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                            title={isEn ? 'Quick Drawer' : 'Laci Cepat'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Movement */}
                          <button
                            onClick={() => onOpenMovement(asset)}
                            disabled={asset.status === 'DISPOSED'}
                            className="p-1.5 text-stone-600 hover:text-emerald-600 dark:text-stone-400 dark:hover:text-emerald-400 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors disabled:opacity-30 cursor-pointer"
                            title={isEn ? 'Relocation' : 'Mutasi'}
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                          </button>

                          {/* Maintenance */}
                          <button
                            onClick={() => onOpenMaintenance(asset)}
                            disabled={asset.status === 'DISPOSED'}
                            className="p-1.5 text-stone-600 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors disabled:opacity-30 cursor-pointer"
                            title={isEn ? 'Maintenance Order' : 'Order Pemeliharaan'}
                          >
                            <Wrench className="w-4 h-4" />
                          </button>

                          {/* Edit / Disposal for manager */}
                          {canManageAssets && (
                            <>
                              <button
                                onClick={() => onEditAsset(asset)}
                                className="p-1.5 text-stone-600 hover:text-indigo-600 dark:text-stone-400 dark:hover:text-indigo-400 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                                title={isEn ? 'Edit Asset Data' : 'Edit Data Aset'}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onOpenDisposal(asset)}
                                disabled={asset.status === 'DISPOSED'}
                                className="p-1.5 text-stone-600 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors disabled:opacity-30 cursor-pointer"
                                title={isEn ? 'Disposal' : 'Disposal / Hapus'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
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
      ) : (
        /* Spatial Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredAssets.map((asset) => {
            const isSelected = selectedAssetIds.includes(asset.id);
            return (
              <div
                key={asset.id}
                className={`glass-panel squircle p-5 flex flex-col justify-between transition-all hover:shadow-xl ${
                  isSelected ? 'ring-2 ring-[#5E7A68] bg-[#5E7A68]/10' : ''
                }`}
              >
                <div>
                  {/* Top: Code & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(asset.id)}
                        className="rounded-sm text-[#5E7A68]"
                      />
                      <span className="font-mono font-bold text-xs text-[#181F19] dark:text-stone-100">
                        {asset.assetCode}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                        asset.status
                      )}`}
                    >
                      {asset.status}
                    </span>
                  </div>

                  {/* Image */}
                  {asset.imageUrl ? (
                    <div className="w-full h-36 rounded-2xl overflow-hidden mb-3 bg-stone-200/60 dark:bg-stone-800">
                      <img
                        src={asset.imageUrl}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 rounded-2xl bg-stone-200/60 dark:bg-stone-800 flex items-center justify-center text-stone-400 mb-3">
                      <Box className="w-8 h-8" />
                    </div>
                  )}

                  <h3
                    onClick={() => handleOpenDrawer(asset)}
                    className="font-bold text-sm text-[#181F19] dark:text-stone-100 hover:text-[#5E7A68] cursor-pointer line-clamp-1"
                  >
                    {asset.name}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">{asset.categoryName}</p>

                  <div className="mt-3 space-y-1.5 text-xs text-stone-600 dark:text-stone-400 border-t border-stone-200/60 dark:border-stone-700/60 pt-2.5">
                    <div className="truncate">
                      <strong>{isEn ? 'Location:' : 'Lokasi:'}</strong> {asset.locationName}
                    </div>
                    <div className="truncate">
                      <strong>PIC:</strong> {asset.picName}
                    </div>
                    <div>
                      <strong>{isEn ? 'Book Value:' : 'Nilai Buku:'}</strong>{' '}
                      <span className="font-bold text-[#181F19] dark:text-stone-100 font-mono">
                        {formatRupiah(asset.currentBookValue)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleOpenDrawer(asset)}
                    className="flex-1 py-1.5 text-xs font-semibold bg-stone-200/80 hover:bg-stone-300/80 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                  >
                    {isEn ? 'Preview' : 'Rincian'}
                  </button>
                  <button
                    onClick={() => onOpenMovement(asset)}
                    disabled={asset.status === 'DISPOSED'}
                    className="p-2 text-stone-600 hover:text-emerald-600 dark:text-stone-400 rounded-xl hover:bg-stone-200/60 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
                    title={isEn ? 'Relocation' : 'Mutasi'}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenMaintenance(asset)}
                    disabled={asset.status === 'DISPOSED'}
                    className="p-2 text-stone-600 hover:text-amber-600 dark:text-stone-400 rounded-xl hover:bg-stone-200/60 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
                    title={isEn ? 'Service' : 'Servis'}
                  >
                    <Wrench className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Floating Quick Detail Side Drawer (Overlay) */}
      {quickDrawerAsset && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-md bg-stone-50/95 dark:bg-stone-900/95 backdrop-blur-2xl border-l border-stone-300/60 dark:border-stone-700/60 h-full p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl space-y-6">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5E7A68]/15 text-[#3B4D3F] dark:text-emerald-300 border border-[#5E7A68]/20">
                    {quickDrawerAsset.categoryName}
                  </span>
                  <h3 className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100 mt-1">
                    {quickDrawerAsset.name}
                  </h3>
                  <p className="font-mono text-xs text-stone-500">{quickDrawerAsset.assetCode}</p>
                </div>
                <button
                  onClick={() => setQuickDrawerAsset(null)}
                  className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* QR Code Tag Card */}
              <div className="p-6 rounded-[28px] bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex flex-col items-center text-center shadow-xs">
                {drawerQrCodeUrl ? (
                  <img src={drawerQrCodeUrl} alt="QR Code" className="w-40 h-40 object-contain" />
                ) : (
                  <QrCode className="w-36 h-36 text-stone-300" />
                )}
                <div className="mt-3 font-mono font-bold text-xs text-[#181F19] dark:text-stone-100">
                  {quickDrawerAsset.assetCode}
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {isEn ? 'Scan with mobile camera to verify physical unit' : 'Pindai kamera untuk verifikasi fisik lapangan'}
                </p>
              </div>

              {/* Warranty & Depreciation Tracker */}
              <div className="p-5 rounded-[24px] bg-white/70 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#5E7A68]" />
                  <span>{isEn ? 'Warranty & Valuation' : 'Garansi & Nilai Buku'}</span>
                </h4>
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-stone-200/60 dark:border-stone-700/60">
                  <span className="text-stone-500">{isEn ? 'Net Book Value (NBV)' : 'Nilai Buku Bersih'}</span>
                  <span className="font-bold text-[#181F19] dark:text-stone-100 font-mono">
                    {formatRupiah(quickDrawerAsset.currentBookValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-stone-200/60 dark:border-stone-700/60">
                  <span className="text-stone-500">{isEn ? 'Warranty Expiration' : 'Kedaluwarsa Garansi'}</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200 font-mono">
                    {quickDrawerAsset.warrantyExpiryDate || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-1">
                  <span className="text-stone-500">{isEn ? 'Operational Status' : 'Status Operasi'}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusBadgeClass(
                      quickDrawerAsset.status
                    )}`}
                  >
                    {quickDrawerAsset.status}
                  </span>
                </div>
              </div>

              {/* Assigned Location & Ownership */}
              <div className="p-5 rounded-[24px] bg-white/70 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                  <Building className="w-4 h-4 text-stone-400" />
                  <span><strong>{isEn ? 'Site:' : 'Lokasi:'}</strong> {quickDrawerAsset.locationName}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                  <UserCheck className="w-4 h-4 text-stone-400" />
                  <span><strong>PIC:</strong> {quickDrawerAsset.picName} ({quickDrawerAsset.department})</span>
                </div>
              </div>
            </div>

            {/* Drawer Action Bar */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-2">
              <button
                onClick={() => {
                  onSelectAsset(quickDrawerAsset);
                  setQuickDrawerAsset(null);
                }}
                className="w-full py-3 bg-[#181F19] hover:bg-[#2D342E] text-white text-xs font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isEn ? 'Open Full Asset Dossier' : 'Buka Dossier Lengkap'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
