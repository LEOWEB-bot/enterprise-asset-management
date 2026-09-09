import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  User as UserIcon,
  Calendar,
  RefreshCw,
  Layers,
  History,
  Send,
  ShieldCheck,
  Navigation,
  FileText,
  Printer,
  ChevronRight,
  Download,
  Filter,
  Check,
} from 'lucide-react';
import { Asset, MovementRecord, User as UserType } from '../../types';
import { StorageService } from '../../services/storageService';
import { getI18n, AppLanguage } from '../../utils/i18n';
import { getStatusBadgeClass } from '../../services/authService';

interface MovementListViewProps {
  assets: Asset[];
  movements: MovementRecord[];
  currentUser: UserType;
  onOpenNewMovement: (asset?: Asset) => void;
  onRefresh: () => void;
  isReadOnlyMode: boolean;
}

export const MovementListView: React.FC<MovementListViewProps> = ({
  assets,
  movements,
  currentUser,
  onOpenNewMovement,
  onRefresh,
  isReadOnlyMode,
}) => {
  const currentLang: AppLanguage = currentUser?.language || StorageService.getLanguage() || 'en';
  const t = getI18n(currentLang);
  const isEn = currentLang === 'en';

  // Sub-Tab State: 'ASSETS' | 'HISTORY'
  const [activeSubTab, setActiveSubTab] = useState<'ASSETS' | 'HISTORY'>('ASSETS');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');

  const uniqueLocations = useMemo(() => {
    const locSet = new Set<string>();
    assets.forEach((a) => {
      if (a.locationName) locSet.add(a.locationName);
    });
    return Array.from(locSet);
  }, [assets]);

  // KPI Analytics
  const stats = useMemo(() => {
    const totalAssets = assets.filter((a) => a.status !== 'DISPOSED').length;
    const totalMovements = movements.length;
    const completedMovements = movements.filter((m) => m.status === 'COMPLETED').length;
    const pendingMovements = movements.filter((m) => m.status === 'PENDING').length;
    const onTimeRate = totalMovements > 0 ? ((completedMovements / totalMovements) * 100).toFixed(1) : '100.0';

    // Calculate most frequent route
    const routeCounts: Record<string, number> = {};
    movements.forEach((m) => {
      const key = `${m.fromLocationName || 'HQ'} -> ${m.toLocationName}`;
      routeCounts[key] = (routeCounts[key] || 0) + 1;
    });
    let topRoute = isEn ? 'No transfer routes yet' : 'Belum ada rute perpindahan';
    let maxCount = 0;
    Object.entries(routeCounts).forEach(([rt, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        topRoute = rt;
      }
    });

    return { totalAssets, totalMovements, completedMovements, pendingMovements, onTimeRate, topRoute };
  }, [assets, movements]);

  // Filter Assets ready to relocate
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (asset.status === 'DISPOSED') return false;

      const matchSearch =
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.locationName && asset.locationName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.picName && asset.picName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.department && asset.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.categoryName && asset.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchLocation = locationFilter === 'ALL' || asset.locationName === locationFilter;

      return matchSearch && matchLocation;
    });
  }, [assets, searchTerm, locationFilter]);

  // Filter Movement records
  const filteredMovements = useMemo(() => {
    return movements.filter((item) => {
      const matchSearch =
        item.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fromLocationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.toLocationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.toPic && item.toPic.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.fromPic && item.fromPic.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.reason && item.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.performedBy && item.performedBy.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [movements, searchTerm, statusFilter]);

  const handlePrintBAST = (m: MovementRecord) => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* 1. Spatial Control & Command Header */}
      <div className="glass-panel squircle p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs uppercase tracking-widest text-[#5E7A68] dark:text-emerald-400 font-bold px-3 py-1 rounded-full bg-[#5E7A68]/10 dark:bg-emerald-950/40 border border-[#5E7A68]/20">
              {isEn ? 'Asset Logistics Hub' : 'Pusat Logistik & Mutasi'}
            </span>
            <div className="px-3.5 py-1 rounded-full bg-white/70 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5E7A68] animate-pulse" />
              <span>{stats.totalMovements} {isEn ? 'Total Relocations' : 'Total Mutasi'} • {stats.pendingMovements} {isEn ? 'Pending' : 'Dalam Proses'}</span>
            </div>
          </div>

          <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
            {isEn ? 'Asset Movement & Relocation Center' : 'Pusat Manajemen Mutasi & Relokasi Aset'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            {isEn
              ? 'Multi-site custody transfer orchestration, department redeployments, BAST handover verification, and real-time physical telemetry.'
              : 'Otorisasi perpindahan fisik aset antar-gedung, mutasi tanggung jawab PIC, penerbitan Berita Acara Serah Terima (BAST), dan rekam jejak rantai penguasaan unit.'}
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
            onClick={() => onOpenNewMovement()}
            disabled={isReadOnlyMode}
            className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-6 sm:px-7 py-3 rounded-full text-xs font-bold shadow-lg shadow-[#5E7A68]/25 transition-all cursor-pointer hover:scale-105 disabled:opacity-50"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>{isEn ? 'New Movement Order' : 'Ajukan Mutasi Baru'}</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Squircle Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Relocations */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Total Movements' : 'Total Riwayat Mutasi'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#181F19] dark:text-stone-100">{stats.totalMovements}</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Recorded asset transfers' : 'Perpindahan fisik tercatat'}
            </span>
          </div>
        </div>

        {/* Card 2: Pending Approvals */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Pending Approvals' : 'Menunggu Otorisasi'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#D4A373]/20 text-[#7D562D] dark:text-amber-300 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#7D562D] dark:text-amber-300">{stats.pendingMovements}</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Orders in verification chain' : 'Tiket dalam verifikasi atasan'}
            </span>
          </div>
        </div>

        {/* Card 3: SLA On-Time Completion */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Handover SLA Rate' : 'Kepatuhan SLA Serah Terima'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#5E7A68] dark:text-emerald-400">{stats.onTimeRate}%</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'On-time custody fulfillment' : 'Tepat waktu tanpa kendala'}
            </span>
          </div>
        </div>

        {/* Card 4: Top Route */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Top Transfer Route' : 'Rute Perpindahan Terbanyak'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-xs text-[#181F19] dark:text-stone-100 truncate" title={stats.topRoute}>
              {stats.topRoute}
            </p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Highest inter-facility flow' : 'Jalur logistik tersibuk'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Switcher & Filter Bar */}
      <div className="glass-panel squircle p-3 sm:p-4 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="flex items-center p-1 rounded-2xl bg-stone-200/60 dark:bg-stone-800/60 border border-stone-300/50 dark:border-stone-700/50">
          <button
            onClick={() => setActiveSubTab('ASSETS')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'ASSETS'
                ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Layers className="w-4 h-4 text-[#5E7A68]" />
            <span>{isEn ? 'Asset Catalog (Ready to Relocate)' : 'Katalog Aset (Siap Dimutasi)'}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-400 text-[10px] font-mono font-bold">
              {filteredAssets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('HISTORY')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'HISTORY'
                ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <History className="w-4 h-4 text-[#7D562D]" />
            <span>{isEn ? 'Movement Registry & Logs' : 'Riwayat & Log Mutasi'}</span>
            <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-mono font-bold">
              {filteredMovements.length}
            </span>
          </button>
        </div>

        {/* Search & Location Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              placeholder={
                activeSubTab === 'ASSETS'
                  ? (isEn ? 'Search asset, code, PIC, building...' : 'Cari nama aset, kode, PIC, lokasi...')
                  : (isEn ? 'Search history, origin, destination...' : 'Cari riwayat, lokasi asal, tujuan, alasan...')
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#5E7A68] outline-hidden shadow-2xs"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {activeSubTab === 'ASSETS' ? (
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-hidden"
            >
              <option value="ALL">{isEn ? 'All Facilities' : 'Semua Fasilitas Gedung'}</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-hidden"
            >
              <option value="ALL">{isEn ? 'All Statuses' : 'Semua Status Mutasi'}</option>
              <option value="COMPLETED">{isEn ? 'Completed' : 'Selesai'}</option>
              <option value="PENDING">{isEn ? 'Pending Approval' : 'Menunggu Approval'}</option>
              <option value="REJECTED">{isEn ? 'Rejected' : 'Ditolak'}</option>
            </select>
          )}
        </div>
      </div>

      {/* 4. High-Density Tactile Data Tables */}

      {/* TAB 1: ASSET CATALOG READY TO MOVE */}
      {activeSubTab === 'ASSETS' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Physical Asset Inventory (Eligible for Relocation)' : 'Inventaris Fisik Siap Dimutasi'}
              </h2>
              <p className="text-xs text-stone-500">
                {isEn ? 'Select any active asset to initiate a custody or facility transfer request.' : 'Pilih unit aset untuk membuka formulir pemindahan lokasi dan serah terima penguasaan.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-500 px-3 py-1 rounded-full bg-stone-200/60 dark:bg-stone-800">
              {filteredAssets.length} {isEn ? 'Units' : 'Unit'}
            </span>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-[#5E7A68]/15 text-[#5E7A68] flex items-center justify-center mx-auto">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="font-serif-display text-base font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'No Assets Found' : 'Tidak Ada Unit Aset yang Cocok'}
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {isEn ? 'No active assets match your search keywords or location filter.' : 'Tidak ada unit aset yang sesuai dengan kata kunci atau filter lokasi yang dipilih.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-stone-800 text-stone-500 uppercase font-bold text-[11px] tracking-wider">
                    <th className="py-4 px-4">{isEn ? 'Asset Identification' : 'Identifikasi Unit Aset'}</th>
                    <th className="py-4 px-4">{isEn ? 'Category & Dept' : 'Kategori & Departemen'}</th>
                    <th className="py-4 px-4">{isEn ? 'Current Location' : 'Gedung / Lokasi Saat Ini'}</th>
                    <th className="py-4 px-4">{isEn ? 'Current PIC' : 'Penanggung Jawab (PIC)'}</th>
                    <th className="py-4 px-4">{isEn ? 'Operational Status' : 'Status Unit'}</th>
                    <th className="py-4 px-4 text-right">{isEn ? 'Relocation Action' : 'Aksi Mutasi'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/60">
                  {filteredAssets.map((ast) => (
                    <tr key={ast.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#5E7A68] transition-colors">
                          {ast.name}
                        </div>
                        <div className="font-mono text-[11px] text-[#5E7A68] dark:text-emerald-400 font-semibold">
                          {ast.assetCode}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-semibold text-stone-800 dark:text-stone-200 block">{ast.categoryName}</span>
                        <span className="text-[11px] text-stone-500 font-medium">{ast.department || 'General Facility'}</span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200">
                          <MapPin className="w-4 h-4 text-[#5E7A68] shrink-0" />
                          <span className="font-semibold">{ast.locationName || 'Kantor Pusat'}</span>
                        </div>
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
                          onClick={() => onOpenNewMovement(ast)}
                          disabled={isReadOnlyMode}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5E7A68]/15 hover:bg-[#5E7A68] text-[#5E7A68] hover:text-white dark:text-emerald-400 dark:hover:text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-105"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isEn ? 'Relocate' : 'Mutasikan'}</span>
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

      {/* TAB 2: MOVEMENT REGISTRY & LOGS */}
      {activeSubTab === 'HISTORY' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Official Asset Transfer Registry' : 'Buku Besar & Logistik Mutasi Aset'}
              </h2>
              <p className="text-xs text-stone-500">
                {isEn ? 'Chronological custody chain, handover documentation, and approval audits.' : 'Rekapitulasi perpindahan rute logistik, serah terima PIC, dan otorisasi Berita Acara.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-500 px-3 py-1 rounded-full bg-stone-200/60 dark:bg-stone-800">
              {filteredMovements.length} {isEn ? 'Records' : 'Catatan'}
            </span>
          </div>

          {filteredMovements.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-[#7D562D]/15 text-[#7D562D] flex items-center justify-center mx-auto">
                <History className="w-8 h-8" />
              </div>
              <h3 className="font-serif-display text-base font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'No Movement Records' : 'Belum Ada Riwayat Mutasi'}
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {isEn ? 'No physical asset transfers have been executed matching the filter criteria.' : 'Belum ada transaksi perpindahan aset yang sesuai dengan filter pencarian.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-stone-800 text-stone-500 uppercase font-bold text-[11px] tracking-wider">
                    <th className="py-4 px-4">{isEn ? 'Ticket & Asset' : 'Tiket & Unit Aset'}</th>
                    <th className="py-4 px-4">{isEn ? 'Transfer Route (Origin -> Destination)' : 'Rute Perpindahan (Asal -> Tujuan)'}</th>
                    <th className="py-4 px-4">{isEn ? 'PIC Handover' : 'Serah Terima PIC'}</th>
                    <th className="py-4 px-4">{isEn ? 'Effective Date' : 'Tanggal & Alasan'}</th>
                    <th className="py-4 px-4">{isEn ? 'Governance Status' : 'Status Otorisasi'}</th>
                    <th className="py-4 px-4 text-right">{isEn ? 'Actions' : 'Aksi Dokumen'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/60">
                  {filteredMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="font-bold text-stone-900 dark:text-stone-100">{m.assetName}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-[#5E7A68] font-bold">{m.assetCode}</span>
                          <span className="font-mono text-[10px] text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">{m.id.substring(0, 14)}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 max-w-sm">
                          <span className="font-medium text-stone-600 dark:text-stone-400 truncate">{m.fromLocationName || 'HQ Jakarta'}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#5E7A68] shrink-0" />
                          <span className="font-bold text-stone-900 dark:text-stone-100 truncate">{m.toLocationName}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-semibold text-stone-800 dark:text-stone-200">
                            <span className="text-stone-500 font-normal">{m.fromPic || 'Custodian'}</span>
                            <ChevronRight className="w-3 h-3 text-stone-400" />
                            <span className="text-[#5E7A68] font-bold">{m.toPic}</span>
                          </div>
                          <div className="text-[10px] text-stone-500">
                            Dept: {m.fromDepartment || '-'} &rarr; {m.toDepartment || '-'}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{m.movementDate}</span>
                        </div>
                        <p className="text-[11px] text-stone-500 truncate max-w-xs mt-0.5" title={m.reason}>
                          {m.reason}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        {m.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 border border-[#5E7A68]/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isEn ? 'COMPLETED' : 'SELESAI'}</span>
                          </span>
                        ) : m.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D4A373]/20 text-[#7D562D] dark:text-amber-300 border border-[#D4A373]/40">
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                            <span>{isEn ? 'PENDING APPROVAL' : 'MENUNGGU APPROVAL'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isEn ? 'REJECTED' : 'DITOLAK'}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handlePrintBAST(m)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-800/70 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all cursor-pointer"
                          title={isEn ? 'Print BAST Document' : 'Cetak Surat BAST'}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{isEn ? 'BAST' : 'Cetak BAST'}</span>
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
