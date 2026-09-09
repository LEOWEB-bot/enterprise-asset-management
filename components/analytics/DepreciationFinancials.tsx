import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Download,
  Printer,
  FileSpreadsheet,
  Search,
  PieChart,
  Layers,
  Wrench,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Building2,
  Clock,
  ChevronRight,
  Sliders,
  Filter,
} from 'lucide-react';
import { Asset, AssetCategory, MaintenanceRecord } from '../../types';
import { calculateStraightLineDepreciation, formatRupiah } from '../../services/depreciationService';
import { StorageService } from '../../services/storageService';
import { getI18n, AppLanguage } from '../../utils/i18n';

interface DepreciationFinancialsProps {
  assets: Asset[];
  categories: AssetCategory[];
}

export const DepreciationFinancials: React.FC<DepreciationFinancialsProps> = ({ assets, categories }) => {
  const currentLang: AppLanguage = StorageService.getLanguage() || 'en';
  const isEn = currentLang === 'en';

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'LEDGER' | 'CATEGORIES' | 'OPEX'>('LEDGER');

  const maintenanceLogs: MaintenanceRecord[] = useMemo(() => {
    return StorageService.getMaintenance();
  }, []);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (selectedCategory !== 'ALL' && a.categoryId !== selectedCategory) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = (a.assetCode || '').toLowerCase().includes(q);
        const matchName = (a.name || '').toLowerCase().includes(q);
        const matchCat = (a.categoryName || '').toLowerCase().includes(q);
        const matchLoc = (a.locationName || '').toLowerCase().includes(q);
        const matchSerial = (a.serialNumber || '').toLowerCase().includes(q);
        return matchCode || matchName || matchCat || matchLoc || matchSerial;
      }
      return true;
    });
  }, [assets, selectedCategory, searchTerm]);

  // Overall Financial Totals
  const financials = useMemo(() => {
    const totalCost = filteredAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
    const totalBookValue = filteredAssets.reduce((sum, a) => {
      const calc = calculateStraightLineDepreciation(a.purchaseCost, a.residualValue, a.usefulLifeYears, a.purchaseDate);
      return sum + calc.currentBookValue;
    }, 0);
    const totalAccumulatedDepreciation = totalCost - totalBookValue;
    const annualDepreciationRunRate = filteredAssets.reduce((sum, a) => {
      const calc = calculateStraightLineDepreciation(a.purchaseCost, a.residualValue, a.usefulLifeYears, a.purchaseDate);
      return sum + calc.annualDepreciation;
    }, 0);
    const nbvRatio = totalCost > 0 ? ((totalBookValue / totalCost) * 100).toFixed(1) : '0';

    return { totalCost, totalBookValue, totalAccumulatedDepreciation, annualDepreciationRunRate, nbvRatio };
  }, [filteredAssets]);

  // Category Breakdown Aggregation
  const categoryBreakdown = useMemo(() => {
    const totalAllCost = assets.reduce((s, a) => s + (a.purchaseCost || 0), 0) || 1;

    return categories.map((cat) => {
      const catAssets = assets.filter((a) => a.categoryId === cat.id);
      const catCost = catAssets.reduce((s, a) => s + (a.purchaseCost || 0), 0);
      const catNbv = catAssets.reduce((s, a) => {
        const calc = calculateStraightLineDepreciation(a.purchaseCost, a.residualValue, a.usefulLifeYears, a.purchaseDate);
        return s + calc.currentBookValue;
      }, 0);
      const catDep = catCost - catNbv;
      const catAnnualDep = catAssets.reduce((s, a) => {
        const calc = calculateStraightLineDepreciation(a.purchaseCost, a.residualValue, a.usefulLifeYears, a.purchaseDate);
        return s + calc.annualDepreciation;
      }, 0);
      const sharePercentage = ((catCost / totalAllCost) * 100).toFixed(1);

      return {
        id: cat.id,
        name: cat.name,
        count: catAssets.length,
        usefulLife: cat.depreciationPeriodYears,
        totalCost: catCost,
        totalNbv: catNbv,
        totalDep: catDep,
        totalAnnualDep: catAnnualDep,
        sharePercentage,
      };
    });
  }, [categories, assets]);

  // OpEx Maintenance Digest per Asset
  const opexBreakdown = useMemo(() => {
    return filteredAssets.map((asset) => {
      const assetLogs = maintenanceLogs.filter((m) => m.assetId === asset.id);
      const totalMaintenanceCost = assetLogs.reduce((sum, m) => sum + (m.cost || 0), 0);
      const maintenanceCount = assetLogs.length;
      const opexToCostRatio = asset.purchaseCost > 0 ? ((totalMaintenanceCost / asset.purchaseCost) * 100).toFixed(1) : '0';

      return {
        asset,
        maintenanceCount,
        totalMaintenanceCost,
        opexToCostRatio,
      };
    });
  }, [filteredAssets, maintenanceLogs]);

  // Total OpEx Cost
  const totalOpEx = useMemo(() => {
    return opexBreakdown.reduce((sum, item) => sum + item.totalMaintenanceCost, 0);
  }, [opexBreakdown]);

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      isEn ? 'Asset Code' : 'Kode Aset',
      isEn ? 'Asset Name' : 'Nama Aset',
      isEn ? 'Category' : 'Kategori',
      isEn ? 'Location' : 'Lokasi',
      isEn ? 'Purchase Date' : 'Tanggal Pembelian',
      isEn ? 'Acquisition Cost (IDR)' : 'Harga Perolehan (Rp)',
      isEn ? 'Residual Value (IDR)' : 'Nilai Residu (Rp)',
      isEn ? 'Useful Life (Years)' : 'Masa Manfaat (Tahun)',
      isEn ? 'Annual Depreciation (IDR)' : 'Beban Penyusutan Tahunan (Rp)',
      isEn ? 'Accumulated Depreciation (IDR)' : 'Akumulasi Depresiasi (Rp)',
      isEn ? 'Net Book Value NBV (IDR)' : 'Nilai Buku Bersih NBV (Rp)',
    ];

    const rows = filteredAssets.map((a) => {
      const calc = calculateStraightLineDepreciation(a.purchaseCost, a.residualValue, a.usefulLifeYears, a.purchaseDate);
      return [
        `"${a.assetCode || ''}"`,
        `"${(a.name || '').replace(/"/g, '""')}"`,
        `"${a.categoryName || ''}"`,
        `"${a.locationName || ''}"`,
        `"${a.purchaseDate || ''}"`,
        a.purchaseCost || 0,
        a.residualValue || 0,
        a.usefulLifeYears || 0,
        calc.annualDepreciation || 0,
        calc.accumulatedDepreciation || 0,
        calc.currentBookValue || 0,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekapitulasi_Depresiasi_PSAK16_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* 1. Spatial Command Header */}
      <div className="glass-panel squircle p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs uppercase tracking-widest text-[#5E7A68] dark:text-emerald-400 font-bold px-3 py-1 rounded-full bg-[#5E7A68]/10 dark:bg-emerald-950/40 border border-[#5E7A68]/20">
              {isEn ? 'PSAK 16 / IFRS Compliance' : 'Standar PSAK 16 / IFRS'}
            </span>
            <div className="px-3.5 py-1 rounded-full bg-white/70 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5E7A68] animate-pulse" />
              <span>{isEn ? 'Straight-Line Depreciation Method' : 'Metode Penyusutan Garis Lurus'} • {isEn ? 'FY 2026' : 'Tahun Fiskal 2026'}</span>
            </div>
          </div>

          <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
            {isEn ? 'Financial Analytics & Asset Depreciation Ledger' : 'Pusat Laporan, Rekapitulasi Keuangan & Amortisasi Aset'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            {isEn
              ? 'Straight-Line asset depreciation schedules, net book value (NBV) capitalization tracking, fiscal amortization run rates, and operational maintenance cost digests.'
              : 'Jadwal kalkulasi depresiasi garis lurus, pelacakan nilai buku bersih (NBV) terkapitalisasi, amortisasi beban fiskal tahunan, serta rekapitulasi biaya pemeliharaan operasional.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-5 py-3 rounded-full border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title={isEn ? 'Export CSV / Excel' : 'Ekspor Format CSV / Excel'}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#5E7A68]" />
            <span>{isEn ? 'Export CSV / Excel' : 'Ekspor CSV / Excel'}</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-6 sm:px-7 py-3 rounded-full text-xs font-bold shadow-lg shadow-[#5E7A68]/25 transition-all cursor-pointer hover:scale-105"
          >
            <Printer className="w-4 h-4" />
            <span>{isEn ? 'Print PDF Report' : 'Cetak Laporan Resmi'}</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Squircle Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Gross Cost Basis */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Gross Asset Cost' : 'Total Harga Perolehan'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-2xl sm:text-3xl font-bold text-[#181F19] dark:text-stone-100">
              {formatRupiah(financials.totalCost)}
            </p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Gross historical cost basis' : 'Nilai bruto awal aset terdaftar'}
            </span>
          </div>
        </div>

        {/* Card 2: Net Book Value (NBV) */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5E7A68] dark:text-emerald-400 uppercase tracking-wider">
              {isEn ? 'Net Book Value (NBV)' : 'Nilai Buku Bersih (NBV)'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-2xl sm:text-3xl font-bold text-[#5E7A68] dark:text-emerald-400">
              {formatRupiah(financials.totalBookValue)}
            </p>
            <span className="text-xs font-medium text-stone-500">
              {financials.nbvRatio}% {isEn ? 'of total gross acquisition cost' : 'terkapitalisasi dari harga perolehan'}
            </span>
          </div>
        </div>

        {/* Card 3: Accumulated Depreciation */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              {isEn ? 'Accumulated Depr.' : 'Akumulasi Penyusutan'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400">
              -{formatRupiah(financials.totalAccumulatedDepreciation)}
            </p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Cumulative amortization to date' : 'Penyusutan kumulatif hingga hari ini'}
            </span>
          </div>
        </div>

        {/* Card 4: Annual Run Rate */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7D562D] dark:text-amber-400 uppercase tracking-wider">
              {isEn ? 'Annual Depr. Expense' : 'Beban Susut Tahunan'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#D4A373]/20 text-[#7D562D] dark:text-amber-300 flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-2xl sm:text-3xl font-bold text-[#7D562D] dark:text-amber-300">
              {formatRupiah(financials.annualDepreciationRunRate)}
            </p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Operational run rate / current fiscal year' : 'Amortisasi tahun buku berjalan'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Switcher & Filter Capsule */}
      <div className="glass-panel squircle p-3 sm:p-4 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="flex items-center p-1 rounded-2xl bg-stone-200/60 dark:bg-stone-800/60 border border-stone-300/50 dark:border-stone-700/50 flex-wrap">
          <button
            onClick={() => setActiveSubTab('LEDGER')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'LEDGER'
                ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#5E7A68]" />
            <span>{isEn ? 'Asset NBV Schedule' : 'Buku Besar Penyusutan per Unit'}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-400 text-[10px] font-mono font-bold">
              {filteredAssets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('CATEGORIES')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'CATEGORIES'
                ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Layers className="w-4 h-4 text-[#7D562D]" />
            <span>{isEn ? 'Category Breakdown' : 'Ringkasan per Kategori Aset'}</span>
            <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-mono font-bold">
              {categories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('OPEX')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'OPEX'
                ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Wrench className="w-4 h-4 text-[#5E7A68]" />
            <span>{isEn ? 'OpEx Maintenance Digest' : 'Rekapitulasi Biaya Operasional & Servis'}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-400 text-[10px] font-mono font-bold">
              {formatRupiah(totalOpEx)}
            </span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              placeholder={isEn ? 'Search tag, asset, serial...' : 'Cari kode aset, nama, serial...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#5E7A68] outline-hidden shadow-2xs"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-hidden cursor-pointer"
          >
            <option value="ALL">{isEn ? 'All Asset Categories' : 'Semua Kategori Aset'}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. High-Density Tactile Data Tables */}

      {/* TAB 1: ASSET NBV SCHEDULE (BUKU BESAR PENYUSUTAN) */}
      {activeSubTab === 'LEDGER' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Straight-Line Depreciation & Net Book Value Schedule' : 'Buku Besar Penyusutan Garis Lurus & Nilai Buku Bersih (NBV)'}
              </h2>
              <p className="text-xs text-stone-500">
                {isEn ? 'Unit-by-unit asset capitalization schedule according to PSAK 16 standards.' : 'Jadwal kalkulasi penyusutan unit aset terkapitalisasi berdasarkan standar PSAK 16.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-500 px-3 py-1 rounded-full bg-stone-200/60 dark:bg-stone-800">
              {filteredAssets.length} {isEn ? 'Registered Assets' : 'Unit Terdaftar'}
            </span>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-[#5E7A68]/15 text-[#5E7A68] flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h3 className="font-serif-display text-base font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'No Assets Match Filter Criteria' : 'Tidak Ada Aset yang Sesuai dengan Filter'}
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {isEn ? 'Try adjusting your search keyword or asset category filter.' : 'Silakan sesuaikan kata kunci pencarian atau filter kategori aset.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-stone-800 text-stone-500 uppercase font-bold text-[11px] tracking-wider">
                    <th className="py-4 px-4">{isEn ? 'Code & Asset Identity' : 'Kode & Identitas Unit'}</th>
                    <th className="py-4 px-4">{isEn ? 'Acq. Date' : 'Tgl Beli'}</th>
                    <th className="py-4 px-4 text-center">{isEn ? 'Useful Life' : 'Masa Manfaat'}</th>
                    <th className="py-4 px-4 text-right">{isEn ? 'Gross Cost' : 'Harga Perolehan'}</th>
                    <th className="py-4 px-4 text-right">{isEn ? 'Residual Value' : 'Nilai Residu'}</th>
                    <th className="py-4 px-4 text-right">{isEn ? 'Expense/Yr' : 'Beban Susut/Thn'}</th>
                    <th className="py-4 px-4 text-right">{isEn ? 'Accum. Depr.' : 'Akumulasi Susut'}</th>
                    <th className="py-4 px-4 text-right font-bold text-[#5E7A68] dark:text-emerald-400">
                      {isEn ? 'Net Book Value (NBV)' : 'Nilai Buku (NBV)'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/60">
                  {filteredAssets.map((asset) => {
                    const calc = calculateStraightLineDepreciation(
                      asset.purchaseCost,
                      asset.residualValue,
                      asset.usefulLifeYears,
                      asset.purchaseDate
                    );

                    // Calculate remaining life percentage
                    const depreciableBase = asset.purchaseCost - asset.residualValue;
                    const remainingPercent = depreciableBase > 0 
                      ? Math.max(0, Math.min(100, Math.round((calc.currentBookValue - asset.residualValue) / depreciableBase * 100)))
                      : 0;

                    return (
                      <tr key={asset.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors group">
                        <td className="py-4 px-4">
                          <div className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#5E7A68] transition-colors">
                            {asset.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] text-[#5E7A68] font-bold">{asset.assetCode}</span>
                            <span className="text-[10px] text-stone-500 px-2 py-0.2 rounded-full bg-stone-100 dark:bg-stone-800">
                              {asset.categoryName}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 font-mono text-stone-700 dark:text-stone-300">
                          {asset.purchaseDate}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <div className="font-bold text-stone-800 dark:text-stone-200">
                            {asset.usefulLifeYears} {isEn ? 'Yrs' : 'Thn'}
                          </div>
                          <div className="w-16 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full mx-auto mt-1 overflow-hidden">
                            <div
                              className="h-full bg-[#5E7A68] rounded-full"
                              style={{ width: `${remainingPercent}%` }}
                              title={`${remainingPercent}% sisa masa manfaat`}
                            />
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right font-mono font-semibold text-stone-900 dark:text-stone-100">
                          {formatRupiah(asset.purchaseCost)}
                        </td>

                        <td className="py-4 px-4 text-right font-mono text-stone-500">
                          {formatRupiah(asset.residualValue)}
                        </td>

                        <td className="py-4 px-4 text-right font-mono text-[#7D562D] dark:text-amber-400">
                          -{formatRupiah(calc.annualDepreciation)}
                        </td>

                        <td className="py-4 px-4 text-right font-mono text-rose-600 dark:text-rose-400 font-medium">
                          -{formatRupiah(calc.accumulatedDepreciation)}
                        </td>

                        <td className="py-4 px-4 text-right font-mono font-bold text-base text-[#5E7A68] dark:text-emerald-400">
                          {formatRupiah(calc.currentBookValue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATEGORY BREAKDOWN */}
      {activeSubTab === 'CATEGORIES' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Financial Allocation by Fixed Asset Category' : 'Ringkasan & Alokasi Keuangan per Kategori Aset Tetap'}
              </h2>
              <p className="text-xs text-stone-500">
                {isEn ? 'Capitalization share, standard useful life, and cumulative depreciation across asset groups.' : 'Porsi kapitalisasi, masa manfaat standar, dan beban akumulasi susut per kelompok aset.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-500 px-3 py-1 rounded-full bg-stone-200/60 dark:bg-stone-800">
              {categoryBreakdown.length} {isEn ? 'Categories' : 'Kategori'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.id}
                className="p-6 rounded-3xl bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-4 shadow-2xs hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-[#181F19] dark:text-stone-100">{cat.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-400">
                    {cat.sharePercentage}% {isEn ? 'Share' : 'Porsi'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-stone-500">
                  <div className="flex justify-between">
                    <span>{isEn ? 'Asset Count:' : 'Jumlah Unit:'}</span>
                    <strong className="text-stone-800 dark:text-stone-200">{cat.count} Unit</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{isEn ? 'Useful Life:' : 'Masa Manfaat:'}</span>
                    <strong className="text-stone-800 dark:text-stone-200">{cat.usefulLife} {isEn ? 'Years' : 'Tahun'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{isEn ? 'Gross Cost:' : 'Harga Perolehan:'}</span>
                    <strong className="text-stone-900 dark:text-stone-100 font-mono">{formatRupiah(cat.totalCost)}</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500">{isEn ? 'Current NBV:' : 'Nilai Buku (NBV):'}</span>
                    <span className="font-bold font-mono text-[#5E7A68] dark:text-emerald-400">{formatRupiah(cat.totalNbv)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400 text-[11px]">{isEn ? 'Accum. Depr:' : 'Akumulasi Susut:'}</span>
                    <span className="font-mono text-rose-500 text-[11px]">-{formatRupiah(cat.totalDep)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto pt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200/80 dark:border-stone-800 text-stone-500 uppercase font-bold text-[11px] tracking-wider">
                  <th className="py-4 px-4">{isEn ? 'Category Name' : 'Nama Kategori'}</th>
                  <th className="py-4 px-4 text-center">{isEn ? 'Total Units' : 'Jumlah Unit'}</th>
                  <th className="py-4 px-4 text-center">{isEn ? 'Useful Life' : 'Masa Manfaat'}</th>
                  <th className="py-4 px-4 text-right">{isEn ? 'Gross Cost Basis' : 'Total Harga Perolehan'}</th>
                  <th className="py-4 px-4 text-right">{isEn ? 'Annual Depr.' : 'Susut/Tahun'}</th>
                  <th className="py-4 px-4 text-right">{isEn ? 'Accum. Depr.' : 'Akumulasi Susut'}</th>
                  <th className="py-4 px-4 text-right font-bold text-[#5E7A68] dark:text-emerald-400">{isEn ? 'Total NBV' : 'Total Nilai Buku'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/60">
                {categoryBreakdown.map((cat) => (
                  <tr key={cat.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-stone-900 dark:text-stone-100">{cat.name}</td>
                    <td className="py-4 px-4 text-center font-mono">{cat.count} {isEn ? 'units' : 'unit'}</td>
                    <td className="py-4 px-4 text-center">{cat.usefulLife} {isEn ? 'Years' : 'Tahun'}</td>
                    <td className="py-4 px-4 text-right font-mono font-semibold text-stone-900 dark:text-stone-100">{formatRupiah(cat.totalCost)}</td>
                    <td className="py-4 px-4 text-right font-mono text-[#7D562D]">-{formatRupiah(cat.totalAnnualDep)}</td>
                    <td className="py-4 px-4 text-right font-mono text-rose-500">-{formatRupiah(cat.totalDep)}</td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-base text-[#5E7A68] dark:text-emerald-400">{formatRupiah(cat.totalNbv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OPEX MAINTENANCE DIGEST */}
      {activeSubTab === 'OPEX' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Operational Maintenance Expense (OpEx) Digest' : 'Rekapitulasi Biaya Operasional & Servis Pemeliharaan (OpEx)'}
              </h2>
              <p className="text-xs text-stone-500">
                {isEn ? 'Cumulative service and spare part expenses compared against gross asset acquisition cost.' : 'Akumulasi biaya servis, suku cadang, dan vendor pemeliharaan dibandingkan terhadap harga perolehan unit.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#5E7A68] px-4 py-1.5 rounded-full bg-[#5E7A68]/15">
              {isEn ? 'Total OpEx:' : 'Total Biaya Servis:'} {formatRupiah(totalOpEx)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200/80 dark:border-stone-800 text-stone-500 uppercase font-bold text-[11px] tracking-wider">
                  <th className="py-4 px-4">{isEn ? 'Code & Asset Name' : 'Kode & Nama Unit'}</th>
                  <th className="py-4 px-4">{isEn ? 'Category & Location' : 'Kategori & Gedung'}</th>
                  <th className="py-4 px-4 text-right">{isEn ? 'Acquisition Cost' : 'Harga Perolehan'}</th>
                  <th className="py-4 px-4 text-center">{isEn ? 'Service Count' : 'Frekuensi Servis'}</th>
                  <th className="py-4 px-4 text-right">{isEn ? 'Total Maintenance OpEx' : 'Total Biaya Servis'}</th>
                  <th className="py-4 px-4 text-right">{isEn ? 'OpEx / Cost Ratio' : 'Rasio Beban/Harga Beli'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/60">
                {opexBreakdown.map((item) => (
                  <tr key={item.asset.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-stone-900 dark:text-stone-100">{item.asset.name}</div>
                      <span className="font-mono text-[11px] text-[#5E7A68] font-bold">{item.asset.assetCode}</span>
                    </td>

                    <td className="py-4 px-4 text-stone-600 dark:text-stone-400">
                      <div>{item.asset.categoryName}</div>
                      <div className="text-[11px] text-stone-400">{item.asset.locationName}</div>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-medium text-stone-800 dark:text-stone-200">
                      {formatRupiah(item.asset.purchaseCost)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-mono">
                        {item.maintenanceCount} {isEn ? 'orders' : 'kali'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-stone-900 dark:text-stone-100">
                      {formatRupiah(item.totalMaintenanceCost)}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                        Number(item.opexToCostRatio) > 20
                          ? 'bg-rose-100 text-rose-800'
                          : Number(item.opexToCostRatio) > 5
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#5E7A68]/15 text-[#5E7A68]'
                      }`}>
                        {item.opexToCostRatio}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
