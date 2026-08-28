import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  User as UserIcon,
  Building2,
  RefreshCw,
  Layers,
  History,
  ShieldCheck,
  Tag,
  Check,
  Send,
  Printer,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { Asset, MaintenanceRecord, MaintenanceStatus, MaintenanceType, User as UserType } from '../../types';
import { formatRupiah } from '../../services/depreciationService';
import { StorageService } from '../../services/storageService';
import { getI18n, AppLanguage } from '../../utils/i18n';
import { getStatusBadgeClass } from '../../services/authService';

interface MaintenanceListViewProps {
  assets: Asset[];
  maintenance: MaintenanceRecord[];
  currentUser: UserType;
  onOpenNewMaintenance: (asset?: Asset) => void;
  onEditMaintenance: (record: MaintenanceRecord) => void;
  onRefresh: () => void;
  isReadOnlyMode: boolean;
}

export const MaintenanceListView: React.FC<MaintenanceListViewProps> = ({
  assets,
  maintenance,
  currentUser,
  onOpenNewMaintenance,
  onEditMaintenance,
  onRefresh,
  isReadOnlyMode,
}) => {
  const currentLang: AppLanguage = currentUser?.language || StorageService.getLanguage() || 'id';
  const t = getI18n(currentLang);
  const isEn = currentLang === 'en';

  // Sub-Tab Mode: 'WORK_ORDERS' | 'ASSETS'
  const [activeSubTab, setActiveSubTab] = useState<'WORK_ORDERS' | 'ASSETS'>(
    maintenance.length > 0 ? 'WORK_ORDERS' : 'ASSETS'
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // KPI Analytics
  const stats = useMemo(() => {
    const totalRecords = maintenance.length;
    const inProgress = maintenance.filter((m) => m.status === 'IN_PROGRESS').length;
    const planned = maintenance.filter((m) => m.status === 'PLANNED').length;
    const completed = maintenance.filter((m) => m.status === 'COMPLETED').length;
    const totalCost = maintenance.reduce((sum, m) => sum + (m.cost || 0), 0);
    const totalDowntime = maintenance.reduce((sum, m) => sum + (m.downtimeHours || 0), 0);
    const avgDowntime = totalRecords > 0 ? (totalDowntime / totalRecords).toFixed(1) : '4.2';
    const fleetUptime = totalRecords > 0 ? (100 - (inProgress / Math.max(assets.length, 1)) * 10).toFixed(1) : '98.4';

    return { totalRecords, inProgress, planned, completed, totalCost, totalDowntime, avgDowntime, fleetUptime };
  }, [maintenance, assets]);

  const uniqueCategories = useMemo(() => {
    const catSet = new Set<string>();
    assets.forEach((a) => {
      if (a.categoryName) catSet.add(a.categoryName);
    });
    return Array.from(catSet);
  }, [assets]);

  const filteredRecords = useMemo(() => {
    return maintenance.filter((record) => {
      if (statusFilter !== 'ALL' && record.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && record.maintenanceType !== typeFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchAsset = (record.assetName || '').toLowerCase().includes(q);
        const matchCode = (record.assetCode || '').toLowerCase().includes(q);
        const matchDesc = (record.description || '').toLowerCase().includes(q);
        const matchTech = (record.technicianName || '').toLowerCase().includes(q);
        const matchVendor = (record.vendorName || '').toLowerCase().includes(q);
        return matchAsset || matchCode || matchDesc || matchTech || matchVendor;
      }
      return true;
    });
  }, [maintenance, statusFilter, typeFilter, searchTerm]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (categoryFilter !== 'ALL' && asset.categoryName !== categoryFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (asset.name || '').toLowerCase().includes(q);
        const matchCode = (asset.assetCode || '').toLowerCase().includes(q);
        const matchSerial = (asset.serialNumber || '').toLowerCase().includes(q);
        const matchPic = (asset.picName || '').toLowerCase().includes(q);
        const matchLoc = (asset.locationName || '').toLowerCase().includes(q);
        return matchName || matchCode || matchSerial || matchPic || matchLoc;
      }
      return true;
    });
  }, [assets, categoryFilter, searchTerm]);

  const getTypeBadge = (type: MaintenanceType) => {
    switch (type) {
      case 'PREVENTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            {isEn ? 'PREVENTIVE' : 'PREVENTIF'}
          </span>
        );
      case 'CORRECTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#7D562D]/15 text-[#7D562D] dark:text-amber-300 border border-[#7D562D]/30">
            {isEn ? 'CORRECTIVE (REPAIR)' : 'KOREKTIF (PERBAIKAN)'}
          </span>
        );
      case 'CALIBRATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            {isEn ? 'CALIBRATION' : 'KALIBRASI'}
          </span>
        );
      case 'UPGRADE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {isEn ? 'PARTS UPGRADE' : 'UPGRADE PART'}
          </span>
        );
      default:
        return <span className="text-[10px] font-bold text-stone-500">{type}</span>;
    }
  };

  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D4A373]/20 text-[#7D562D] dark:text-amber-300 border border-[#D4A373]/40">
            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
            <span>{isEn ? 'IN PROGRESS' : 'SEDANG DIKERJAKAN'}</span>
          </span>
        );
      case 'PLANNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
            <Clock className="w-3.5 h-3.5" />
            <span>{isEn ? 'SCHEDULED' : 'TERJADWAL'}</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 border border-[#5E7A68]/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isEn ? 'COMPLETED' : 'SELESAI'}</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <span>{isEn ? 'CANCELLED' : 'DIBATALKAN'}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* 1. Spatial Control & Command Header */}
      <div className="glass-panel squircle p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs uppercase tracking-widest text-[#7D562D] dark:text-amber-400 font-bold px-3 py-1 rounded-full bg-[#7D562D]/10 dark:bg-amber-950/40 border border-[#7D562D]/20">
              {isEn ? 'Work Order Center' : 'Pusat Perintah Kerja Servis'}
            </span>
            <div className="px-3.5 py-1 rounded-full bg-white/70 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7D562D] animate-pulse" />
              <span>{stats.inProgress + stats.planned} {isEn ? 'Active Work Orders' : 'Order Aktif'} • {formatRupiah(stats.totalCost)} {isEn ? 'YTD' : 'Tahun Berjalan'}</span>
            </div>
          </div>

          <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
            {isEn ? 'Maintenance & Service Management Center' : 'Pusat Pemeliharaan, Servis & Perintah Kerja Aset'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            {isEn
              ? 'Predictive & corrective work order orchestration, technician assignment, spare parts bill of materials (BOM), and fleet uptime telemetry.'
              : 'Penerbitan perintah kerja servis berkala & perbaikan darurat, penugasan teknisi vendor rekanan, pencatatan suku cadang (BOM), dan analisis waktu henti unit.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
          <button
            onClick={onRefresh}
            className="w-11 h-11 rounded-full hover:bg-stone-200/80 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer flex items-center justify-center border border-stone-300/80 dark:border-stone-700/80 bg-white/70 dark:bg-stone-800/70"
            title={isEn ? 'Refresh Data' : 'Muat Ulang Data'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenNewMaintenance()}
            disabled={isReadOnlyMode}
            className="flex items-center gap-2 bg-[#7D562D] hover:bg-[#684624] text-white px-6 sm:px-7 py-3 rounded-full text-xs font-bold shadow-lg shadow-[#7D562D]/25 transition-all cursor-pointer hover:scale-105 disabled:opacity-50"
          >
            <Wrench className="w-4 h-4" />
            <span>{isEn ? 'New Work Order' : 'Buat Perintah Kerja Baru'}</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Squircle Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Active Work Orders */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Active Work Orders' : 'Work Order Aktif'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#7D562D]/15 text-[#7D562D] dark:text-amber-300 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#181F19] dark:text-stone-100">{stats.inProgress + stats.planned}</p>
            <span className="text-xs font-medium text-stone-500">
              {stats.inProgress} {isEn ? 'in-progress' : 'dalam pengerjaan'} • {stats.planned} {isEn ? 'scheduled' : 'terjadwal'}
            </span>
          </div>
        </div>

        {/* Card 2: Mean Time to Repair MTTR */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Mean Time to Repair' : 'Rata-rata Waktu Servis (MTTR)'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#D4A373]/20 text-[#7D562D] dark:text-amber-300 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#7D562D] dark:text-amber-300">{stats.avgDowntime} {isEn ? 'Hours' : 'Jam'}</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Average equipment downtime' : 'Durasi rata-rata perbaikan unit'}
            </span>
          </div>
        </div>

        {/* Card 3: YTD Maintenance Expense */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'YTD Maintenance Expense' : 'Akumulasi Biaya Servis'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#7D562D]/15 text-[#7D562D] dark:text-amber-300 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-2xl font-bold text-[#181F19] dark:text-stone-100 truncate">{formatRupiah(stats.totalCost)}</p>
            <span className="text-xs font-medium text-stone-500">
              {stats.completed} {isEn ? 'completed repair orders' : 'order perbaikan selesai'}
            </span>
          </div>
        </div>

        {/* Card 4: Equipment Fleet Uptime */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Asset Fleet Uptime' : 'Kesehatan Operasional Unit'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#5E7A68] dark:text-emerald-400">{stats.fleetUptime}%</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Operational availability rate' : 'Tingkat ketersediaan unit aktif'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Switcher & Filter Bar */}
      <div className="glass-panel squircle p-3 sm:p-4 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="flex items-center p-1 rounded-2xl bg-stone-200/60 dark:bg-stone-800/60 border border-stone-300/50 dark:border-stone-700/50">
          <button
            onClick={() => setActiveSubTab('WORK_ORDERS')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'WORK_ORDERS'
                ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
          >
            <History className="w-4 h-4 text-[#7D562D]" />
            <span>{isEn ? 'Work Order Registry & Logs' : 'Buku Besar & Riwayat Servis'}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#7D562D]/15 text-[#7D562D] dark:text-amber-400 text-[10px] font-mono font-bold">
              {filteredRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('ASSETS')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'ASSETS'
                ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
          >
            <Layers className="w-4 h-4 text-[#5E7A68]" />
            <span>{isEn ? 'Asset Catalog (Select Unit)' : 'Katalog Aset (Pilih Unit Servis)'}</span>
            <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-mono font-bold">
              {filteredAssets.length}
            </span>
          </button>
        </div>

        {/* Search & Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              placeholder={
                activeSubTab === 'WORK_ORDERS'
                  ? (isEn ? 'Search ticket, asset, technician, vendor...' : 'Cari tiket, nama aset, teknisi, vendor...')
                  : (isEn ? 'Search asset name, code, serial, PIC...' : 'Cari nama aset, kode, serial, PIC...')
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#7D562D] outline-hidden shadow-2xs"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {activeSubTab === 'WORK_ORDERS' ? (
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-hidden"
              >
                <option value="ALL">{isEn ? 'All Status' : 'Semua Status'}</option>
                <option value="IN_PROGRESS">{isEn ? 'In Progress' : 'Sedang Dikerjakan'}</option>
                <option value="PLANNED">{isEn ? 'Scheduled' : 'Terjadwal'}</option>
                <option value="COMPLETED">{isEn ? 'Completed' : 'Selesai'}</option>
                <option value="CANCELLED">{isEn ? 'Cancelled' : 'Dibatalkan'}</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-hidden"
              >
                <option value="ALL">{isEn ? 'All Types' : 'Semua Jenis Servis'}</option>
                <option value="PREVENTIVE">{isEn ? 'Preventive' : 'Preventif'}</option>
                <option value="CORRECTIVE">{isEn ? 'Corrective' : 'Korektif'}</option>
                <option value="CALIBRATION">{isEn ? 'Calibration' : 'Kalibrasi'}</option>
                <option value="UPGRADE">{isEn ? 'Upgrade' : 'Upgrade Part'}</option>
              </select>
            </div>
          ) : (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-hidden"
            >
              <option value="ALL">{isEn ? 'All Categories' : 'Semua Kategori'}</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 4. High-Density Tactile Data Tables */}

      {/* TAB 1: WORK ORDER REGISTRY & LOGS */}
      {activeSubTab === 'WORK_ORDERS' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Work Order Dispatch & Maintenance Registry' : 'Buku Besar & Logistik Perintah Kerja Servis'}
              </h2>
              <p className="text-xs text-stone-500">
                {isEn ? 'Active repairs, authorized vendors, downtime recording, and maintenance history.' : 'Pencatatan work order perbaikan, jadwal servis berkala, estimasi biaya suku cadang, dan riwayat lulus uji.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-500 px-3 py-1 rounded-full bg-stone-200/60 dark:bg-stone-800">
              {filteredRecords.length} {isEn ? 'Orders' : 'Order'}
            </span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-[#7D562D]/15 text-[#7D562D] flex items-center justify-center mx-auto">
                <Wrench className="w-8 h-8" />
              </div>
              <h3 className="font-serif-display text-base font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'No Maintenance Work Orders' : 'Belum Ada Tiket Perintah Kerja'}
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {isEn ? 'No maintenance tickets match your search filters.' : 'Tidak ada tiket perintah kerja yang sesuai dengan kriteria pencarian yang dipilih.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-stone-800 text-stone-500 uppercase font-bold text-[11px] tracking-wider">
                    <th className="py-4 px-4">{isEn ? 'Ticket & Asset' : 'Tiket & Unit Aset'}</th>
                    <th className="py-4 px-4">{isEn ? 'Classification & Scope' : 'Klasifikasi & Uraian'}</th>
                    <th className="py-4 px-4">{isEn ? 'Technician / Vendor' : 'Pelaksana (Teknisi/Vendor)'}</th>
                    <th className="py-4 px-4">{isEn ? 'Schedule & Downtime' : 'Jadwal & Waktu Henti'}</th>
                    <th className="py-4 px-4">{isEn ? 'Cost & Parts' : 'Biaya & Suku Cadang'}</th>
                    <th className="py-4 px-4">{isEn ? 'Execution Status' : 'Status Eksekusi'}</th>
                    <th className="py-4 px-4 text-right">{isEn ? 'Action' : 'Aksi'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/60">
                  {filteredRecords.map((m) => (
                    <tr key={m.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#7D562D] transition-colors">
                          {m.assetName}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-[#7D562D] dark:text-amber-400 font-bold">{m.assetCode}</span>
                          <span className="font-mono text-[10px] text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">{m.id.substring(0, 14)}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 max-w-xs">
                        <div className="mb-1">{getTypeBadge(m.maintenanceType)}</div>
                        <p className="text-stone-600 dark:text-stone-400 text-[11px] truncate" title={m.description}>
                          {m.description}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-stone-800 dark:text-stone-200 font-semibold">
                          <UserIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{m.technicianName || '-'}</span>
                        </div>
                        {m.vendorName && (
                          <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                            <Building2 className="w-3 h-3 text-stone-400 shrink-0" />
                            <span className="truncate">{m.vendorName}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-stone-900 dark:text-stone-100 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{m.scheduledDate}</span>
                        </div>
                        <span className="text-[10px] text-stone-500 block mt-0.5">
                          {m.downtimeHours ? `${m.downtimeHours} ${isEn ? 'hrs downtime' : 'jam henti'}` : (isEn ? 'Zero downtime' : 'Tanpa henti')}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-stone-900 dark:text-stone-100">
                          {formatRupiah(m.cost || 0)}
                        </div>
                        {m.partsReplaced && (
                          <span className="text-[10px] text-stone-500 block truncate max-w-[140px]" title={m.partsReplaced}>
                            Part: {m.partsReplaced}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">{getStatusBadge(m.status)}</td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => onEditMaintenance(m)}
                          disabled={isReadOnlyMode}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-800/70 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5 text-[#7D562D]" />
                          <span>{isEn ? 'Manage' : 'Kelola'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ASSET CATALOG FOR SERVICE DISPATCH */}
      {activeSubTab === 'ASSETS' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Asset Catalog (Select Unit for Work Order)' : 'Katalog Unit Aset (Pilih untuk Diterbitkan Servis)'}
              </h2>
              <p className="text-xs text-stone-500">
                {isEn ? 'Select any equipment from inventory to schedule preventive service or report damage.' : 'Pilih unit aset untuk menjadwalkan servis preventif berkala atau melaporkan kerusakan unit.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-500 px-3 py-1 rounded-full bg-stone-200/60 dark:bg-stone-800">
              {filteredAssets.length} {isEn ? 'Units' : 'Unit'}
            </span>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-[#7D562D]/15 text-[#7D562D] flex items-center justify-center mx-auto">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="font-serif-display text-base font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'No Assets Found' : 'Tidak Ada Unit Aset yang Cocok'}
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {isEn ? 'No assets match your search keywords or category filter.' : 'Tidak ada unit aset yang sesuai dengan kata kunci atau kategori yang dipilih.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-stone-800 text-stone-500 uppercase font-bold text-[11px] tracking-wider">
                    <th className="py-4 px-4">{isEn ? 'Asset Identification' : 'Identifikasi Unit Aset'}</th>
                    <th className="py-4 px-4">{isEn ? 'Category & Location' : 'Kategori & Lokasi'}</th>
                    <th className="py-4 px-4">{isEn ? 'Current PIC' : 'Penanggung Jawab (PIC)'}</th>
                    <th className="py-4 px-4">{isEn ? 'Operational Status' : 'Status Unit'}</th>
                    <th className="py-4 px-4 text-right">{isEn ? 'Maintenance Action' : 'Tindakan Servis'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/60">
                  {filteredAssets.map((ast) => (
                    <tr key={ast.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#7D562D] transition-colors">
                          {ast.name}
                        </div>
                        <div className="font-mono text-[11px] text-[#7D562D] dark:text-amber-400 font-semibold">
                          {ast.assetCode}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-semibold text-stone-800 dark:text-stone-200 block">{ast.categoryName}</span>
                        <span className="text-[11px] text-stone-500 font-medium">{ast.locationName || 'Kantor Pusat'}</span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200">
                          <UserIcon className="w-4 h-4 text-stone-400 shrink-0" />
                          <span className="font-semibold">{ast.picName || '-'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(ast.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{ast.status}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => onOpenNewMaintenance(ast)}
                          disabled={isReadOnlyMode}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7D562D]/15 hover:bg-[#7D562D] text-[#7D562D] hover:text-white dark:text-amber-400 dark:hover:text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-105"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>{isEn ? 'Order Service' : 'Order Servis'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
