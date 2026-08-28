import React, { useState } from 'react';
import {
  Box,
  TrendingUp,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  ArrowRight,
  QrCode,
  Clock,
  Plus,
  ShieldCheck,
  Building2,
  Radio,
  Share2,
  Layers,
  MapPin,
  FileSpreadsheet,
  Activity,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { Asset, ApprovalRequest, MaintenanceRecord, ActivityLog, User } from '../../types';
import { formatRupiah } from '../../services/depreciationService';
import { StorageService } from '../../services/storageService';
import { getI18n, AppLanguage } from '../../utils/i18n';

interface DashboardOverviewProps {
  assets?: Asset[];
  approvals?: ApprovalRequest[];
  maintenance?: MaintenanceRecord[];
  activityLogs?: ActivityLog[];
  onNavigateTab?: (tab: any) => void;
  onNavigate?: (tab: any) => void;
  onOpenScanner?: () => void;
  onSelectAsset?: (asset: Asset) => void;
  categories?: any[];
  locations?: any[];
  movements?: any[];
  currentUser?: User;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  assets = [],
  approvals = [],
  maintenance = [],
  activityLogs = [],
  onNavigateTab,
  onNavigate,
  onOpenScanner = () => {},
  locations = [],
  currentUser,
}) => {
  const handleNavigate = onNavigateTab || onNavigate || (() => {});
  const currentLang: AppLanguage = currentUser?.language || StorageService.getLanguage() || 'id';
  const t = getI18n(currentLang);
  const isEn = currentLang === 'en';

  // Safe Metric calculations
  const safeAssets = assets || [];
  const safeApprovals = approvals || [];
  const safeMaintenance = maintenance || [];
  const safeLogs = activityLogs || [];

  const totalAssets = safeAssets.length;
  const activeAssets = safeAssets.filter((a) => a.status === 'ACTIVE' || a.status === 'IN_USE');
  const inMaintenanceAssets = safeAssets.filter((a) => a.status === 'MAINTENANCE');
  const missingAssets = safeAssets.filter((a) => a.status === 'MISSING');

  const totalPurchaseValue = safeAssets.reduce((acc, curr) => acc + (curr?.purchaseCost || 0), 0);
  const totalBookValue = safeAssets.reduce((acc, curr) => acc + (curr?.currentBookValue || 0), 0);
  const totalDepreciation = Math.max(0, totalPurchaseValue - totalBookValue);

  const pendingApprovals = safeApprovals.filter((a) => a.status === 'PENDING');
  const activeMaintenance = safeMaintenance.filter((m) => m.status === 'IN_PROGRESS' || m.status === 'PLANNED');

  // Warranty Expiring in 60 days
  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const expiringWarranties = safeAssets.filter((a) => {
    if (!a?.warrantyExpiryDate) return false;
    const expiry = new Date(a.warrantyExpiryDate);
    return expiry > now && expiry <= sixtyDaysFromNow;
  });

  // Group by category for visual bars
  const categorySummary: Record<string, { count: number; value: number }> = {};
  safeAssets.forEach((a) => {
    const cat = a?.categoryName || (isEn ? 'Others' : 'Lainnya');
    if (!categorySummary[cat]) {
      categorySummary[cat] = { count: 0, value: 0 };
    }
    categorySummary[cat].count += 1;
    categorySummary[cat].value += a?.currentBookValue || 0;
  });

  // Group by status
  const statusCounts = {
    ACTIVE: safeAssets.filter((a) => a.status === 'ACTIVE').length,
    IN_USE: safeAssets.filter((a) => a.status === 'IN_USE').length,
    MAINTENANCE: inMaintenanceAssets.length,
    DISPOSED: safeAssets.filter((a) => a.status === 'DISPOSED').length,
    MISSING: missingAssets.length,
  };

  // Color palette sequence for categories
  const organicBarGradients = [
    'from-[#181F19] to-[#2D342E] dark:from-stone-300 dark:to-stone-400',
    'from-[#7D562D] to-[#D4A373] dark:from-amber-600 dark:to-amber-500',
    'from-[#3B4D3F] to-[#8C917F] dark:from-emerald-600 dark:to-emerald-500',
    'from-[#475569] to-[#94A3B8] dark:from-slate-400 dark:to-slate-300',
  ];

  return (
    <div className="space-y-7 pb-24 animate-fadeIn">
      {/* 1. Spatial App Header & Window Banner */}
      <div className="glass-panel squircle p-6 sm:p-8 relative overflow-hidden transition-all">
        {/* Subtle decorative organic glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-200/20 dark:bg-emerald-950/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-200/20 dark:bg-amber-950/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#181F19]/5 dark:bg-white/10 text-[#181F19] dark:text-stone-200 border border-[#181F19]/10 dark:border-white/10">
                {isEn ? 'Enterprise Asset OS' : 'Sistem Spasial Aset Enterprise'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {isEn ? 'Live Telemetry' : 'Telemetri Aktif'}
              </span>
            </div>
            <h1 className="font-serif-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181F19] dark:text-stone-100">
              {isEn ? 'Executive Asset Spatial Command' : 'Pusat Komando Spasial Aset'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              {isEn
                ? 'High-density physical asset intelligence, lifecycle amortization, approval orchestrations, and ISO 27001 audit integrity.'
                : 'Pusat kendali fisik aset, amortisasi depresiasi garis lurus, orkestrasi approval persetujuan, dan kepatuhan audit ISO 27001.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#181F19] hover:bg-[#2D342E] dark:bg-stone-100 dark:hover:bg-white text-white dark:text-[#181F19] text-xs font-semibold rounded-2xl shadow-lg shadow-black/10 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <QrCode className="w-4 h-4" />
              <span>{isEn ? 'Scan Field QR' : 'Pindai QR Lapangan'}</span>
            </button>
            <button
              onClick={() => handleNavigate('assets')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/70 dark:bg-stone-800/70 hover:bg-white dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-2xl border border-stone-300/60 dark:border-stone-700/60 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Box className="w-4 h-4 text-[#7D562D] dark:text-amber-400" />
              <span>{isEn ? 'Asset Catalog' : 'Katalog Master Aset'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Four Squircle Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Registered Assets */}
        <div className="glass-panel squircle p-6 flex flex-col justify-between min-h-[210px] hover:shadow-2xl hover:shadow-black/5 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="w-11 h-11 rounded-2xl bg-[#181F19] text-stone-100 dark:bg-stone-800 dark:text-stone-100 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Box className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {isEn ? 'Live Inventory' : 'Inventaris Aktif'}
            </span>
          </div>
          <div className="my-3">
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              {t.dashboard.totalRegisteredAssets}
            </h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-serif-display text-2xl sm:text-3xl font-bold text-[#181F19] dark:text-stone-100">
                {totalAssets.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {isEn ? 'Units' : 'Unit'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">
              {activeAssets.length} {isEn ? 'In Active Operation' : 'Beroperasi Aktif'}
            </p>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between border-t border-stone-200/60 dark:border-stone-700/60 pt-2.5">
            <span>{isEn ? 'Acquisition Cost:' : 'Biaya Perolehan:'}</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">{formatRupiah(totalPurchaseValue)}</span>
          </div>
        </div>

        {/* KPI 2: Net Book Value (NBV) */}
        <div className="glass-panel squircle p-6 flex flex-col justify-between min-h-[210px] hover:shadow-2xl hover:shadow-black/5 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="w-11 h-11 rounded-2xl bg-[#7D562D]/15 text-[#7D562D] dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-stone-200/70 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-300 dark:border-stone-700 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-rose-500" />
              <span>{isEn ? 'PSAK 16' : 'PSAK 16'}</span>
            </span>
          </div>
          <div className="my-3">
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              {isEn ? 'Net Book Value (NBV)' : 'Nilai Buku Bersih (NBV)'}
            </h3>
            <div className="mt-1">
              <span className="font-serif-display text-xl sm:text-2xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
                {formatRupiah(totalBookValue)}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              {isEn ? 'Current amortized balance' : 'Saldo nilai teramortisasi saat ini'}
            </p>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between border-t border-stone-200/60 dark:border-stone-700/60 pt-2.5">
            <span>{isEn ? 'Accumulated Depr:' : 'Akumulasi Depr:'}</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatRupiah(totalDepreciation)}</span>
          </div>
        </div>

        {/* KPI 3: Pending Approvals */}
        <div
          onClick={() => handleNavigate('approvals')}
          className="glass-panel squircle p-6 flex flex-col justify-between min-h-[210px] hover:shadow-2xl hover:shadow-black/5 transition-all duration-300 cursor-pointer group hover:border-amber-500/40"
        >
          <div className="flex justify-between items-start">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
              {isEn ? 'Action Required' : 'Perlu Tindakan'}
            </span>
          </div>
          <div className="my-3">
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              {t.dashboard.pendingApprovals}
            </h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-serif-display text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-400">
                {pendingApprovals.length}
              </span>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {isEn ? 'Requests' : 'Permohonan'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              {isEn ? 'Movements & Disposals' : 'Mutasi & Pelepasan Aset'}
            </p>
          </div>
          <div className="text-[11px] text-[#7D562D] dark:text-amber-400 font-semibold flex items-center justify-between border-t border-stone-200/60 dark:border-stone-700/60 pt-2.5 group-hover:translate-x-0.5 transition-transform">
            <span>{isEn ? 'Open Approval Center' : 'Buka Menu Approval'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 4: Maintenance & Service Health */}
        <div
          onClick={() => handleNavigate('maintenance')}
          className="glass-panel squircle p-6 flex flex-col justify-between min-h-[210px] hover:shadow-2xl hover:shadow-black/5 transition-all duration-300 cursor-pointer group hover:border-emerald-500/40"
        >
          <div className="flex justify-between items-start">
            <div className="w-11 h-11 rounded-2xl bg-[#3B4D3F]/15 text-[#3B4D3F] dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#3B4D3F]/10 text-[#3B4D3F] dark:bg-emerald-950/40 dark:text-emerald-300 border border-[#3B4D3F]/20 dark:border-emerald-800">
              {isEn ? 'Service Health' : 'Kesehatan Unit'}
            </span>
          </div>
          <div className="my-3">
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              {isEn ? 'In Service / Repair' : 'Dalam Pemeliharaan'}
            </h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-serif-display text-2xl sm:text-3xl font-bold text-[#181F19] dark:text-stone-100">
                {activeMaintenance.length}
              </span>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {isEn ? 'Work Orders' : 'Perintah Kerja'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              {expiringWarranties.length} {isEn ? 'Expiring Warranties' : 'Garansi Segera Berakhir'}
            </p>
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-between border-t border-stone-200/60 dark:border-stone-700/60 pt-2.5 group-hover:translate-x-0.5 transition-transform">
            <span>{isEn ? 'Manage Work Orders' : 'Kelola Tiket Servis'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Category Value Breakdown & Spatial Campus Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 Cols): Category Value Allocation */}
        <div className="lg:col-span-7 xl:col-span-8 glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Asset Distribution by Category' : 'Alokasi Nilai Aset per Kategori'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {isEn
                  ? 'Book value composition across primary inventory classifications'
                  : 'Komposisi nilai buku bersih pada klasifikasi inventaris utama'}
              </p>
            </div>
            <button
              onClick={() => handleNavigate('depreciation')}
              className="text-xs font-semibold text-[#7D562D] dark:text-amber-400 hover:underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>{isEn ? 'Detailed Financials' : 'Laporan Rinci'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {Object.keys(categorySummary).length === 0 ? (
            <div className="p-8 text-center bg-stone-100/50 dark:bg-stone-800/40 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700">
              <Box className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="text-xs text-stone-500">
                {isEn ? 'No assets registered yet.' : 'Belum ada aset terdaftar dalam basis data.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(categorySummary).map(([catName, data], index) => {
                const pct = totalBookValue > 0 ? (data.value / totalBookValue) * 100 : 0;
                const gradientClass = organicBarGradients[index % organicBarGradients.length];

                return (
                  <div key={catName} className="space-y-1.5 group">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-stone-400" />
                        <span>{catName}</span>
                        <span className="text-stone-400 font-normal text-[11px]">
                          ({data.count} {isEn ? 'units' : 'unit'})
                        </span>
                      </span>
                      <span className="font-bold text-[#181F19] dark:text-stone-100 font-mono">
                        {formatRupiah(data.value)}{' '}
                        <span className="text-stone-400 font-normal text-[10px]">({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-stone-200/70 dark:bg-stone-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-700`}
                        style={{ width: `${Math.max(3, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Spatial Campus Summary Card */}
          <div className="p-5 rounded-2xl bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#181F19] text-white dark:bg-stone-700">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                  {isEn ? 'Spatial Campus & Branch Coverage' : 'Cakupan Lokasi Gedung & Cabang'}
                </h4>
                <p className="text-[11px] text-stone-500">
                  {locations.length > 0
                    ? `${locations.length} ${isEn ? 'registered physical sites' : 'titik lokasi fisik terdaftar'}`
                    : isEn ? 'Multiple deployment zones' : 'Berbagai zona penugasan'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleNavigate('settings')}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer text-stone-800 dark:text-stone-200 shrink-0"
            >
              {isEn ? 'Manage Sites' : 'Kelola Lokasi'}
            </button>
          </div>
        </div>

        {/* Right Column (4 Cols): Lifecycle Status & Health */}
        <div className="lg:col-span-5 xl:col-span-4 glass-panel squircle p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Lifecycle Status' : 'Status Siklus Hidup'}
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                {totalAssets} Total
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              {isEn ? 'Real-time operational readiness' : 'Kesiapan operasional unit secara real-time'}
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60">
                <span className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {isEn ? 'Active (Ready)' : 'Aktif (Siap Pakai)'}
                </span>
                <span className="font-bold text-stone-900 dark:text-white font-mono">{statusCounts.ACTIVE}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60">
                <span className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  {isEn ? 'In Use' : 'Sedang Digunakan'}
                </span>
                <span className="font-bold text-stone-900 dark:text-white font-mono">{statusCounts.IN_USE}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60">
                <span className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  {isEn ? 'In Maintenance' : 'Dalam Pemeliharaan'}
                </span>
                <span className="font-bold text-amber-600 font-mono">{statusCounts.MAINTENANCE}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60">
                <span className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                  {isEn ? 'Disposed' : 'Dihapuskan (Disposed)'}
                </span>
                <span className="font-bold text-stone-500 font-mono">{statusCounts.DISPOSED}</span>
              </div>
              {statusCounts.MISSING > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                  <span className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                    {isEn ? 'Missing / Discrepancy' : 'Hilang / Selisih Audit'}
                  </span>
                  <span className="font-bold text-rose-600 font-mono">{statusCounts.MISSING}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => handleNavigate('audits')}
            className="w-full py-2.5 bg-[#181F19] hover:bg-[#2D342E] dark:bg-stone-800 dark:hover:bg-stone-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isEn ? 'Launch Stocktake Audit' : 'Jalankan Stocktake Fisik'}</span>
          </button>
        </div>
      </div>

      {/* 4. Bottom Grid: Pending Approvals & Forensic Audit Trail Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals Widget */}
        <div className="glass-panel squircle p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="font-serif-display text-base sm:text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Approvals Awaiting Decision' : 'Persetujuan Menunggu Keputusan'}
              </h2>
            </div>
            <button
              onClick={() => handleNavigate('approvals')}
              className="text-xs font-semibold text-[#7D562D] dark:text-amber-400 hover:underline cursor-pointer"
            >
              {isEn ? `View All (${pendingApprovals.length})` : `Lihat Semua (${pendingApprovals.length})`}
            </button>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="p-8 text-center bg-stone-100/50 dark:bg-stone-800/40 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-stone-500">
                {isEn ? 'No pending approval requests.' : 'Tidak ada permohonan approval yang tertunda.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(pendingApprovals || []).slice(0, 3).map((appr) => (
                <div
                  key={appr.id}
                  className="p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/70 dark:bg-stone-800/50 flex items-start justify-between gap-3 text-xs shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 dark:text-white font-mono">{appr.assetCode}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {appr.type}
                      </span>
                    </div>
                    <p className="text-stone-700 dark:text-stone-300 font-medium line-clamp-1">{appr.assetName}</p>
                    <p className="text-[11px] text-stone-400">
                      {isEn ? 'Requested by:' : 'Diajukan oleh:'}{' '}
                      <span className="font-medium text-stone-600 dark:text-stone-300">{appr.requesterName}</span> ({appr.requestedAt})
                    </p>
                  </div>
                  <button
                    onClick={() => handleNavigate('approvals')}
                    className="px-3 py-1.5 bg-[#181F19] hover:bg-[#2D342E] text-white dark:bg-stone-700 dark:hover:bg-stone-600 rounded-xl text-xs font-semibold shrink-0 cursor-pointer shadow-xs"
                  >
                    {isEn ? 'Review' : 'Tinjau'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Trail & Security Forensic Stream */}
        <div className="glass-panel squircle p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#7D562D] dark:text-amber-400" />
              <h2 className="font-serif-display text-base sm:text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Audit Trail & Telemetry Stream' : 'Audit Trail & Rekaman Forensik'}
              </h2>
            </div>
            <button
              onClick={() => handleNavigate('logs')}
              className="text-xs font-semibold text-[#7D562D] dark:text-amber-400 hover:underline cursor-pointer"
            >
              {isEn ? 'Full Log' : 'Semua Log'}
            </button>
          </div>

          {(!safeLogs || safeLogs.length === 0) ? (
            <div className="p-8 text-center bg-stone-100/50 dark:bg-stone-800/40 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700">
              <Clock className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="text-xs text-stone-500">
                {isEn ? 'No activity logs recorded yet.' : 'Belum ada rekaman audit trail sistem.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {(safeLogs || []).slice(0, 4).map((log) => (
                <div key={log.id} className="relative pl-6 before:content-[''] before:absolute before:left-2 before:top-3 before:bottom-[-16px] before:w-px before:bg-stone-300 dark:before:bg-stone-700 last:before:hidden text-xs">
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-[#181F19] dark:bg-stone-700 border-2 border-stone-200 dark:border-stone-800" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-900 dark:text-stone-100 font-mono text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-stone-400">{log.timestamp}</span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-400 text-[11px] mt-0.5 leading-relaxed">
                    {log.details}
                  </p>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    {isEn ? 'By:' : 'Oleh:'} {log.userName} ({log.userRole})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
