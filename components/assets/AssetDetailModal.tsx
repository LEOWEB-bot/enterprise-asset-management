import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingDown,
  Building,
  User as UserIcon,
  Shield,
  Tag,
  Wrench,
  ArrowLeftRight,
  Trash2,
  ExternalLink,
  History,
  FileText,
  Clock,
  Radio,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sparkles,
  MapPin,
  UserCheck,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Edit,
  Box,
  Truck,
  FileCheck,
} from 'lucide-react';
import { Asset, MovementRecord, MaintenanceRecord, User as UserType } from '../../types';
import { calculateStraightLineDepreciation, formatRupiah } from '../../services/depreciationService';
import { generateQrDataUrl, generateAssetQrPayload } from '../../services/qrService';
import { getStatusBadgeClass, hasPermission } from '../../services/authService';
import { StorageService } from '../../services/storageService';
import { getI18n, AppLanguage } from '../../utils/i18n';

interface AssetDetailModalProps {
  asset: Asset | null;
  currentUser: UserType;
  movements: MovementRecord[];
  maintenance: MaintenanceRecord[];
  onClose: () => void;
  onOpenMovement: (asset: Asset) => void;
  onOpenMaintenance: (asset: Asset) => void;
  onOpenDisposal: (asset: Asset) => void;
  onOpenPublicView: (asset: Asset) => void;
  isReadOnlyMode: boolean;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  currentUser,
  movements,
  maintenance,
  onClose,
  onOpenMovement,
  onOpenMaintenance,
  onOpenDisposal,
  onOpenPublicView,
  isReadOnlyMode,
}) => {
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'specs' | 'financials' | 'lifecycle'>('all');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const currentLang: AppLanguage = currentUser?.language || StorageService.getLanguage() || 'id';
  const t = getI18n(currentLang);
  const isEn = currentLang === 'en';

  useEffect(() => {
    if (asset) {
      const payload = generateAssetQrPayload(asset.assetCode, asset.id, 'PUBLIC_URL');
      generateQrDataUrl(payload, 360).then((url) => setQrDataUrl(url));
    }
  }, [asset]);

  if (!asset) return null;

  const canManage = hasPermission(currentUser, 'assets.manage') && !isReadOnlyMode;

  // Filter movements & maintenance for this asset
  const assetMovements = movements.filter((m) => m.assetId === asset.id);
  const assetMaintenances = maintenance.filter((m) => m.assetId === asset.id);

  // Depreciation calculation
  const depResult = calculateStraightLineDepreciation(
    asset.purchaseCost,
    asset.residualValue,
    asset.usefulLifeYears,
    asset.purchaseDate
  );

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${asset.assetCode}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-md p-3 sm:p-6 md:p-8 flex justify-center animate-fadeIn">
      {/* Outer Spatial Canvas Window */}
      <div className="spatial-canvas w-full max-w-7xl my-auto rounded-[36px] sm:rounded-[44px] p-6 sm:p-10 border border-white/60 dark:border-stone-700/60 shadow-2xl space-y-8 relative overflow-hidden">
        
        {/* Subtle decorative spatial lighting blurs */}
        <div className="absolute -right-24 -top-24 w-80 h-80 bg-[#5E7A68]/15 dark:bg-emerald-950/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-[#D4A373]/15 dark:bg-amber-950/20 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Spatial Hero Command Header */}
        <div className="glass-panel squircle p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs uppercase tracking-widest text-stone-500 font-bold px-3 py-1 rounded-full bg-stone-200/70 dark:bg-stone-800">
                Asset Dossier: {asset.assetCode}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusBadgeClass(
                  asset.status
                )}`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <span>{asset.status} ({isEn ? 'Ready' : 'Siap Operasi'})</span>
              </span>
            </div>

            <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight break-words">
              {asset.name}
            </h1>

            <div className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-medium flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1">
              <span className="shrink-0">{asset.categoryName}</span>
              <span className="text-stone-300 dark:text-stone-600">•</span>
              <span className="flex items-center gap-1.5 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#5E7A68]" />
                <span>{asset.locationName}</span>
              </span>
              <span className="text-stone-300 dark:text-stone-600">•</span>
              <span className="flex items-center gap-1.5 shrink-0">
                <UserCheck className="w-3.5 h-3.5 text-[#7D562D]" />
                <span>{asset.picName} ({asset.department})</span>
              </span>
            </div>
          </div>

          {/* Header Action Buttons Bar */}
          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center flex-nowrap">
            {/* Download QR */}
            <button
              onClick={handleDownloadQr}
              className="w-11 h-11 rounded-full bg-white/80 dark:bg-stone-800/80 border border-stone-300/80 dark:border-stone-700/80 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 transition-all cursor-pointer shadow-xs hover:scale-105 flex items-center justify-center shrink-0"
              title={isEn ? 'Download QR Tag PNG' : 'Unduh Gambar QR PNG'}
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Relocate / Mutate */}
            <button
              onClick={() => onOpenMovement(asset)}
              disabled={asset.status === 'DISPOSED'}
              className="w-11 h-11 rounded-full bg-white/80 dark:bg-stone-800/80 border border-stone-300/80 dark:border-stone-700/80 text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-stone-800 transition-all cursor-pointer shadow-xs disabled:opacity-30 hover:scale-105 flex items-center justify-center shrink-0"
              title={isEn ? 'Relocate / Mutate Asset' : 'Ajukan Mutasi Lokasi'}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            {/* Schedule Service / Maintenance */}
            <button
              onClick={() => onOpenMaintenance(asset)}
              disabled={asset.status === 'DISPOSED'}
              className="w-11 h-11 rounded-full bg-white/80 dark:bg-stone-800/80 border border-stone-300/80 dark:border-stone-700/80 text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-stone-800 transition-all cursor-pointer shadow-xs disabled:opacity-30 hover:scale-105 flex items-center justify-center shrink-0"
              title={isEn ? 'Schedule Service / Maintenance' : 'Jadwalkan Servis'}
            >
              <Wrench className="w-4 h-4" />
            </button>

            {/* Public Scan View */}
            <button
              onClick={() => onOpenPublicView(asset)}
              className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4D6656] text-white px-5 py-2.5 h-11 rounded-full text-xs font-bold shadow-lg shadow-[#5E7A68]/20 transition-all cursor-pointer hover:scale-105 shrink-0"
            >
              <QrCode className="w-4 h-4" />
              <span className="whitespace-nowrap">{isEn ? 'Scan Tag View' : 'Scan Tag View'}</span>
            </button>

            {/* Close Window */}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-stone-200/80 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors cursor-pointer flex items-center justify-center shrink-0 ml-1"
              title={isEn ? 'Close Window' : 'Tutup Jendela'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Bento Grid Layout (Physical Identity + PSAK 16 Financials + Lifecycle Log) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Column (8 Cols): Physical Identity & Financial Valuation */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* Bento Card 1: Physical Identity & Specifications */}
            <section className="glass-panel squircle p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
                <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#181F19] dark:text-stone-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#5E7A68]" />
                  <span>{isEn ? 'Physical Identity & Digital Twin' : 'Identitas Fisik & Digital Twin'}</span>
                </h2>
                <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">
                  SN: {asset.serialNumber || '-'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Equipment Hero Image / Gallery */}
                <div className="space-y-3">
                  <div className="w-full h-64 rounded-3xl overflow-hidden bg-stone-200/60 dark:bg-stone-800 border border-stone-300/60 dark:border-stone-700/60 shadow-xs relative group">
                    {asset.imageUrl ? (
                      <img
                        src={asset.imageUrl}
                        alt={asset.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 gap-2">
                        <Box className="w-12 h-12 stroke-[1.5]" />
                        <span className="text-xs">{isEn ? 'Unit Photo' : 'Foto Fisik Unit'}</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold bg-[#181F19]/80 text-white backdrop-blur-md">
                      {asset.condition} ({isEn ? 'Condition' : 'Kondisi'})
                    </div>
                  </div>

                  {/* Warranty Tracker Box */}
                  <div className="p-4 rounded-2xl bg-white/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-[#5E7A68]" />
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">
                          {isEn ? 'Warranty Status' : 'Status Garansi'}
                        </span>
                        <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                          {asset.warrantyExpiryDate ? `${isEn ? 'Valid until' : 'Berlaku s.d'} ${asset.warrantyExpiryDate}` : isEn ? 'Standard Warranty' : 'Garansi Standar'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {asset.warrantyExpiryDate ? (isEn ? 'Active' : 'Aktif') : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Digital Twin Tag & Technical Grid */}
                <div className="flex flex-col gap-4">
                  {/* QR Digital Twin Card */}
                  <div className="p-4 rounded-2xl bg-white/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-white p-1.5 border border-stone-200 dark:border-stone-800 shadow-xs shrink-0 flex items-center justify-center">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                      ) : (
                        <QrCode className="w-12 h-12 text-stone-300" />
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Digital Twin Tag</span>
                      <span className="font-mono font-bold text-xs text-[#181F19] dark:text-stone-100 mt-0.5">
                        {asset.assetCode}
                      </span>
                      <button
                        onClick={() => onOpenPublicView(asset)}
                        className="text-xs font-bold text-[#5E7A68] hover:underline flex items-center gap-1 mt-1.5 cursor-pointer"
                      >
                        <span>{isEn ? 'Verify Authenticity' : 'Verifikasi Keaslian'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 4 Technical Parameter Boxes */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800">
                      <span className="text-stone-400 block text-[10px] uppercase tracking-wider">{isEn ? 'Category' : 'Kategori'}</span>
                      <span className="font-bold text-[#181F19] dark:text-stone-100">{asset.categoryName}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800">
                      <span className="text-stone-400 block text-[10px] uppercase tracking-wider">{isEn ? 'Useful Life' : 'Masa Manfaat'}</span>
                      <span className="font-bold text-[#181F19] dark:text-stone-100">{asset.usefulLifeYears} {isEn ? 'Years' : 'Tahun'}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800">
                      <span className="text-stone-400 block text-[10px] uppercase tracking-wider">RFID EPC Tag</span>
                      <span className="font-mono font-semibold text-stone-800 dark:text-stone-200 truncate block">
                        {asset.rfidTag || '-'}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800">
                      <span className="text-stone-400 block text-[10px] uppercase tracking-wider">NFC UID</span>
                      <span className="font-mono font-semibold text-stone-800 dark:text-stone-200 truncate block">
                        {asset.nfcTag || '-'}
                      </span>
                    </div>
                  </div>

                  {/* PIC & Acquisition Notes */}
                  <div className="p-4 rounded-2xl bg-stone-100/70 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500 font-medium">{isEn ? 'Assigned PIC:' : 'Penanggung Jawab:'}</span>
                      <span className="font-bold text-stone-900 dark:text-stone-100">{asset.picName} ({asset.department})</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-400 text-[11px]">
                      <span>{isEn ? 'Purchase Date:' : 'Tanggal Perolehan:'}</span>
                      <span className="font-mono">{asset.purchaseDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {asset.notes && (
                <div className="p-4 rounded-2xl bg-stone-100/60 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60 text-xs">
                  <span className="font-bold text-[#181F19] dark:text-stone-100 block mb-1">
                    {isEn ? 'Dossier Notes:' : 'Catatan Khusus Dossier:'}
                  </span>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed">{asset.notes}</p>
                </div>
              )}
            </section>

            {/* Bento Card 2: Financial Valuation & PSAK 16 Depreciation */}
            <section className="glass-panel squircle p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 dark:border-stone-800 pb-4">
                <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#181F19] dark:text-stone-100 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-[#7D562D] dark:text-amber-400" />
                  <span>{isEn ? 'Financial Valuation & Depreciation' : 'Valuasi Finansial & Depresiasi'}</span>
                </h2>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 self-start sm:self-auto">
                  PSAK 16 • Straight-Line Method
                </span>
              </div>

              {/* 3 Prominent KPI Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Acquisition Cost */}
                <div className="p-6 rounded-[28px] bg-white/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 shadow-xs">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    <DollarSign className="w-4 h-4 text-stone-400" />
                    <span>{isEn ? 'Acquisition Cost' : 'Biaya Perolehan Awal'}</span>
                  </span>
                  <span className="font-serif-display text-2xl font-bold text-[#181F19] dark:text-stone-100 block">
                    {formatRupiah(asset.purchaseCost)}
                  </span>
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    {isEn ? 'Capitalized entry value' : 'Nilai kapitalisasi awal'}
                  </span>
                </div>

                {/* Accumulated Depreciation */}
                <div className="p-6 rounded-[28px] bg-white/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 shadow-xs">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                    <span>{isEn ? 'Accumulated Depr.' : 'Akumulasi Penyusutan'}</span>
                  </span>
                  <span className="font-serif-display text-2xl font-bold text-rose-600 dark:text-rose-400 block">
                    -{formatRupiah(depResult.accumulatedDepreciation)}
                  </span>
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    {isEn ? 'Annual rate' : 'Beban/tahun'}: {formatRupiah(depResult.annualDepreciation)}
                  </span>
                </div>

                {/* Net Book Value (NBV) */}
                <div className="p-6 rounded-[28px] bg-[#5E7A68]/10 border border-[#5E7A68]/25 shadow-xs">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[#3B4D3F] dark:text-emerald-300 uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-4 h-4 text-[#5E7A68]" />
                    <span>{isEn ? 'Net Book Value' : 'Nilai Buku Bersih (NBV)'}</span>
                  </span>
                  <span className="font-serif-display text-2xl font-bold text-[#181F19] dark:text-stone-100 block">
                    {formatRupiah(depResult.currentBookValue)}
                  </span>
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    {isEn ? 'Salvage' : 'Nilai Residu'}: {formatRupiah(asset.residualValue)}
                  </span>
                </div>
              </div>

              {/* Year-by-Year Depreciation Schedule Table */}
              <div className="space-y-3">
                <h3 className="font-serif-display text-sm font-bold text-stone-800 dark:text-stone-200">
                  {isEn ? 'Annual Straight-Line Depreciation Schedule' : 'Jadwal Amortisasi Depresiasi Garis Lurus'}
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-stone-200/80 dark:border-stone-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100/70 dark:bg-stone-800/80 text-stone-500 uppercase text-[10px] font-bold tracking-wider border-b border-stone-200/80 dark:border-stone-800">
                      <tr>
                        <th className="p-3.5 px-4">{isEn ? 'Fiscal Year' : 'Tahun Periode'}</th>
                        <th className="p-3.5 text-right">{isEn ? 'Opening NBV' : 'Nilai Buku Awal'}</th>
                        <th className="p-3.5 text-right">{isEn ? 'Annual Depreciation' : 'Beban Depresiasi'}</th>
                        <th className="p-3.5 text-right">{isEn ? 'Accumulated Depr.' : 'Akumulasi Penyusutan'}</th>
                        <th className="p-3.5 text-right px-4">{isEn ? 'Closing NBV' : 'Nilai Buku Akhir'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/60 font-medium">
                      {depResult.schedule.map((item) => (
                        <tr key={item.yearNumber} className="hover:bg-stone-100/50 dark:hover:bg-stone-800/40">
                          <td className="p-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">{item.yearLabel}</td>
                          <td className="p-3.5 text-right font-mono">{formatRupiah(item.beginningValue)}</td>
                          <td className="p-3.5 text-right font-mono text-rose-600 dark:text-rose-400">
                            -{formatRupiah(item.depreciationAmount)}
                          </td>
                          <td className="p-3.5 text-right font-mono text-stone-500">
                            {formatRupiah(item.accumulatedDepreciation)}
                          </td>
                          <td className="p-3.5 text-right px-4 font-mono font-bold text-[#181F19] dark:text-stone-100">
                            {formatRupiah(item.endingBookValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column (4 Cols): Lifecycle Log Timeline (Sticky Panel) */}
          <div className="lg:col-span-4">
            <section className="glass-panel squircle p-6 sm:p-8 space-y-6 sticky top-6">
              <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
                <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#5E7A68]" />
                  <span>{isEn ? 'Lifecycle Log' : 'Riwayat Hidup Aset'}</span>
                </h2>
                <span className="text-[11px] font-bold text-[#5E7A68]">
                  {assetMovements.length + assetMaintenances.length + 1} {isEn ? 'Events' : 'Peristiwa'}
                </span>
              </div>

              {/* Connected Vertical Timeline */}
              <div className="relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-[#5E7A68] before:via-stone-300 dark:before:via-stone-700 before:to-stone-200 space-y-6 text-xs">
                
                {/* Movement events */}
                {assetMovements.map((mov) => (
                  <div key={mov.id} className="relative group">
                    <div className="absolute -left-[27px] top-0.5 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-2 border-white dark:border-stone-900 flex items-center justify-center shadow-xs">
                      <ArrowLeftRight className="w-2.5 h-2.5" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          {isEn ? 'Relocation' : 'Mutasi Lokasi'}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">{mov.movementDate}</span>
                      </div>
                      <p className="text-stone-600 dark:text-stone-400 text-[11px]">
                        {mov.fromLocationName} &rarr; <strong>{mov.toLocationName}</strong>
                      </p>
                      <span className="text-[10px] text-stone-400 block">
                        PIC: {mov.fromPic} &rarr; {mov.toPic}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Maintenance events */}
                {assetMaintenances.map((mnt) => (
                  <div key={mnt.id} className="relative group">
                    <div className="absolute -left-[27px] top-0.5 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border-2 border-white dark:border-stone-900 flex items-center justify-center shadow-xs">
                      <Wrench className="w-2.5 h-2.5" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          {mnt.description}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">{mnt.scheduledDate}</span>
                      </div>
                      <p className="text-stone-600 dark:text-stone-400 text-[11px]">
                        {mnt.maintenanceType} • {isEn ? 'Cost' : 'Biaya'}: {formatRupiah(mnt.cost)}
                      </p>
                      <span className="text-[10px] text-stone-400 block">
                        {isEn ? 'Tech' : 'Teknisi'}: {mnt.technicianName} ({mnt.status})
                      </span>
                    </div>
                  </div>
                ))}

                {/* Acquisition / Registration event */}
                <div className="relative group">
                  <div className="absolute -left-[27px] top-0.5 w-5 h-5 rounded-full bg-[#181F19] text-white border-2 border-white dark:border-stone-900 flex items-center justify-center shadow-xs">
                    <FileCheck className="w-2.5 h-2.5" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {isEn ? 'Asset Registered' : 'Registrasi Masuk Aset'}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">{asset.purchaseDate}</span>
                    </div>
                    <p className="text-stone-600 dark:text-stone-400 text-[11px]">
                      {isEn ? 'Initial capitalized purchase' : 'Perolehan awal unit tercatat'}: {formatRupiah(asset.purchaseCost)}
                    </p>
                    <span className="text-[10px] text-stone-400 block">
                      {asset.locationName}
                    </span>
                  </div>
                </div>

              </div>

              {/* Fast Transaction Footer in Sidebar */}
              <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800 space-y-2">
                <button
                  onClick={() => onOpenMovement(asset)}
                  disabled={asset.status === 'DISPOSED'}
                  className="w-full py-2.5 bg-[#5E7A68] hover:bg-[#4D6656] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>{isEn ? 'Relocate Asset' : 'Ajukan Mutasi Lokasi'}</span>
                </button>

                <button
                  onClick={() => onOpenMaintenance(asset)}
                  disabled={asset.status === 'DISPOSED'}
                  className="w-full py-2.5 bg-[#7D562D] hover:bg-[#684624] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Wrench className="w-4 h-4" />
                  <span>{isEn ? 'Schedule Maintenance' : 'Jadwalkan Servis'}</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
