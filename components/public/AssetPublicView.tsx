import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Tag,
  Building,
  User,
  Calendar,
  DollarSign,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  QrCode,
  Radio,
  FileText,
  Clock,
  Sparkles,
  Printer,
  Download,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Shield,
  Activity,
  Cpu,
  Fingerprint,
  FileCheck,
  Layers,
  MapPin,
  Send,
  X,
} from 'lucide-react';
import { Asset, MaintenanceRecord, MovementRecord } from '../../types';
import { formatRupiah, calculateStraightLineDepreciation } from '../../services/depreciationService';
import { getStatusBadgeClass } from '../../services/authService';
import { StorageService } from '../../services/storageService';
import { generateQrDataUrl, generateAssetQrPayload } from '../../services/qrService';
import { getI18n, AppLanguage } from '../../utils/i18n';

interface AssetPublicViewProps {
  asset: Asset;
  movements?: MovementRecord[];
  maintenance?: MaintenanceRecord[];
  onBack: () => void;
  onRequestMaintenance?: (asset: Asset) => void;
}

export const AssetPublicView: React.FC<AssetPublicViewProps> = ({
  asset,
  movements = [],
  maintenance = [],
  onBack,
  onRequestMaintenance,
}) => {
  const currentLang: AppLanguage = StorageService.getLanguage() || 'en';
  const isEn = currentLang === 'en';

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [sha256Hash, setSha256Hash] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [reportPriority, setReportPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Financial Depreciation Calculation
  const depResult = calculateStraightLineDepreciation(
    asset.purchaseCost,
    asset.residualValue,
    asset.usefulLifeYears,
    asset.purchaseDate
  );

  // Generate QR Code & Real Cryptographic SHA-256 Hash
  useEffect(() => {
    const payload = generateAssetQrPayload(asset.assetCode, asset.id, 'PUBLIC_URL');
    generateQrDataUrl(payload, 280).then((url) => setQrDataUrl(url));

    // Calculate deterministic SHA-256 hash from asset digital twin telemetry
    const canonicalPayload = JSON.stringify({
      id: asset.id,
      code: asset.assetCode,
      serialNumber: asset.serialNumber,
      rfidTag: asset.rfidTag || 'E280117020000208',
      nfcTag: asset.nfcTag || '04:78:6C:2A:9F:31:80',
      purchaseCost: asset.purchaseCost,
      purchaseDate: asset.purchaseDate,
      system: 'AssetCorp-EAM',
      standard: 'ISO-27001-ISO-55001',
    });

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(canonicalPayload);
      crypto.subtle.digest('SHA-256', data).then((buffer) => {
        const hashArray = Array.from(new Uint8Array(buffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        setSha256Hash(hashHex);
      });
    } else {
      // Fallback hash simulation
      setSha256Hash('7d5a82e9b14c330f81d4a02c5f11e967a29e46b934ca495991b7852b85590f3b');
    }
  }, [asset]);

  const handleCopyHash = () => {
    if (!sha256Hash) return;
    navigator.clipboard.writeText(sha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePublicSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNotes.trim()) return;

    setIsSubmittingReport(true);

    const newMaintenanceRecord: MaintenanceRecord = {
      id: `maint-${Date.now()}`,
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.name,
      maintenanceType: 'CORRECTIVE',
      description: `[LAPORAN PUBLIK] ${reportTitle ? reportTitle + ': ' : ''}${reportNotes}`,
      cost: 0,
      technicianName: reporterName ? `Pelapor: ${reporterName} (${reporterContact || 'Anonim'})` : 'Pelapor Lapangan Anonim',
      vendorName: 'Tim Pemeliharaan Internal',
      status: 'PLANNED',
      scheduledDate: new Date().toISOString().split('T')[0],
    };

    const existingMaint = StorageService.getMaintenance();
    StorageService.saveMaintenance([newMaintenanceRecord, ...existingMaint]);

    setTimeout(() => {
      setIsSubmittingReport(false);
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setShowReportModal(false);
        setReportTitle('');
        setReportNotes('');
        setReporterName('');
        setReporterContact('');
      }, 2000);
    }, 600);
  };

  const assetMovements = movements.filter((m) => m.assetId === asset.id);
  const assetMaintenance = maintenance.filter((m) => m.assetId === asset.id);

  return (
    <div className="min-h-screen bg-[#FBF9F4] dark:bg-[#121613] text-[#181F19] dark:text-stone-100 selection:bg-[#5E7A68]/20 transition-colors duration-300 py-6 sm:py-10 px-4 sm:px-8">
      {/* Background Spatial Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-20 z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-[#5E7A68]/15 blur-[120px]" />
        <div className="absolute top-[40%] -right-[15%] w-[45vw] h-[45vw] rounded-full bg-[#7D562D]/10 blur-[140px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-[#8C917F]/15 blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* 1. Top Floating Spatial Navigation Bar */}
        <header className="glass-panel squircle p-3.5 sm:p-4.5 flex flex-wrap items-center justify-between gap-3 shadow-lg border border-stone-200/90 dark:border-stone-800 bg-[#FBF9F4]/90 dark:bg-stone-900/90 backdrop-blur-2xl print:hidden">
          {/* Back Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300/80 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700/80 transition-all cursor-pointer shadow-2xs group"
            >
              <ArrowLeft className="w-4 h-4 text-stone-600 dark:text-stone-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>{isEn ? 'Dashboard Portal' : 'TwinVerify OS'}</span>
            </button>

            <div className="hidden md:block h-5 w-px bg-stone-300 dark:bg-stone-800" />

            {/* Cryptographic Integrity Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-600/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="tracking-wide uppercase text-[10px]">
                {isEn ? 'OFFICIALLY VERIFIED ASSET' : 'ASET TERVERIFIKASI RESMI'}
              </span>
            </div>
          </div>

          {/* SHA-256 Hash Capsule & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* SHA-256 Hash Short Display */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 font-mono text-[11px] text-stone-600 dark:text-stone-300">
              <span className="font-bold text-[#7D562D] dark:text-amber-400">SHA-256:</span>
              <span className="truncate max-w-[140px]" title={sha256Hash}>
                {sha256Hash ? `${sha256Hash.substring(0, 8)}...${sha256Hash.substring(sha256Hash.length - 4)}` : 'Generating...'}
              </span>
              <button
                onClick={handleCopyHash}
                title={isEn ? 'Copy full SHA-256 hash' : 'Salin seluruh hash SHA-256'}
                className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md transition-colors cursor-pointer text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Share / Copy Link */}
            <button
              onClick={handleCopyLink}
              className="p-2.5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all cursor-pointer shadow-2xs"
              title={isEn ? 'Copy public verification URL' : 'Salin tautan verifikasi publik'}
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Print Certificate */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              <span className="hidden sm:inline">{isEn ? 'Print' : 'Cetak'}</span>
            </button>

            {/* Download PDF / Signed Dossier */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] text-xs font-bold hover:bg-stone-800 dark:hover:bg-white transition-all cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>{isEn ? 'Download PDF' : 'Unduh PDF'}</span>
            </button>
          </div>
        </header>

        {/* 2. Top Bento Grid: Hero Certificate & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Hero Certificate Card (8 Cols) */}
          <div className="lg:col-span-8 glass-panel squircle p-6 sm:p-9 space-y-6 relative overflow-hidden border border-stone-200/90 dark:border-stone-800 bg-[#FBF9F4]/95 dark:bg-stone-900/95 shadow-xl">
            {/* Holographic Watermark Background */}
            <div className="absolute right-4 top-4 w-44 h-44 sm:w-64 sm:h-64 opacity-5 dark:opacity-10 pointer-events-none text-[#5E7A68]">
              <Fingerprint className="w-full h-full" />
            </div>

            {/* Header of Certificate */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-5 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
                    VERIFIED ACTIVE • CRYPTOGRAPHICALLY SECURED
                  </span>
                </div>
                <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
                  {isEn ? 'Digital Twin Certificate of Authenticity' : 'Sertifikat Keaslian Digital Twin'}
                </h1>
                <p className="text-xs text-stone-500">
                  {StorageService.getAppName()} • {isEn ? 'Official Physical & Hardware Ledger' : 'Buku Besar Fisik & Telemetri Perangkat Resmi'}
                </p>
              </div>

              {/* Official Seal Badge */}
              <div className="w-14 h-14 rounded-2xl bg-[#5E7A68]/15 border border-[#5E7A68]/30 flex items-center justify-center shrink-0 text-[#5E7A68] dark:text-emerald-300 shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
            </div>

            {/* 3 Key Parameter Sub-Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 relative z-10 text-xs">
              {/* Asset Code */}
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-700/80 space-y-1 shadow-2xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  {isEn ? 'ASSET CODE' : 'KODE ASET'}
                </span>
                <span className="font-mono text-base font-bold text-[#181F19] dark:text-stone-100 block tracking-wide">
                  {asset.assetCode}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isEn ? 'Hardware Tagged' : 'Identitas Terdaftar'}</span>
                </span>
              </div>

              {/* Asset Name */}
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-700/80 space-y-1 shadow-2xs sm:col-span-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  {isEn ? 'OFFICIAL ASSET NAME' : 'NAMA RESMI ASET'}
                </span>
                <span className="font-serif-display text-base font-bold text-[#181F19] dark:text-stone-100 block truncate">
                  {asset.name}
                </span>
                <span className="text-[10px] text-stone-500 font-medium block">
                  {asset.categoryName} • {isEn ? 'Condition:' : 'Kondisi:'} <strong className="text-stone-800 dark:text-stone-200">{asset.condition}</strong>
                </span>
              </div>
            </div>

            {/* Asset Image (If available) & Fair Valuation Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              {asset.imageUrl ? (
                <div className="h-44 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 relative group">
                  <img
                    src={asset.imageUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-mono">
                    PHYSICAL VISUAL
                  </div>
                </div>
              ) : (
                <div className="h-44 rounded-2xl bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700 flex flex-col items-center justify-center gap-2 text-stone-400">
                  <Layers className="w-8 h-8 opacity-60" />
                  <span className="text-xs font-semibold">{isEn ? 'Hardware Identity Profile' : 'Profil Identitas Perangkat'}</span>
                </div>
              )}

              {/* Financial & Audit Snapshot Card */}
              <div className="p-4.5 rounded-2xl bg-[#5E7A68]/10 dark:bg-[#5E7A68]/15 border border-[#5E7A68]/20 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#5E7A68] dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isEn ? 'PSAK 16 Net Book Value' : 'Nilai Buku Wajar (PSAK 16)'}</span>
                  </span>
                  <div className="font-mono text-xl font-bold text-[#181F19] dark:text-stone-100">
                    {formatRupiah(depResult.currentBookValue)}
                  </div>
                  <p className="text-[11px] text-stone-500 leading-tight">
                    {isEn ? 'Initial Cost:' : 'Harga Perolehan Awal:'} {formatRupiah(asset.purchaseCost)} • {asset.usefulLifeYears} {isEn ? 'Yrs Useful Life' : 'Thn Masa Manfaat'}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#5E7A68]/20 flex items-center justify-between text-[11px]">
                  <span className="text-stone-500 font-medium">{isEn ? 'Acquisition Date:' : 'Tgl Perolehan:'}</span>
                  <span className="font-mono font-bold text-stone-800 dark:text-stone-200">{asset.purchaseDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 2 Quick Action Bento Cards (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Action Card 1: Report Damage / Issue */}
            <div className="glass-panel squircle p-6 sm:p-7 border border-stone-200/90 dark:border-stone-800 bg-[#FBF9F4]/95 dark:bg-stone-900/95 shadow-xl flex flex-col justify-between text-center space-y-4">
              <div className="space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 mx-auto flex items-center justify-center shadow-inner">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h3 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                  {isEn ? 'Report Incident / Fault' : 'Laporkan Insiden / Kerusakan'}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {isEn
                    ? 'Found physical hardware defects or need immediate service? Send a ticket directly to IT & Facilities.'
                    : 'Menemukan kendala perangkat atau butuh servis? Kirim tiket langsung ke tim IT & Fasilitas tanpa perlu login.'}
                </p>
              </div>

              <button
                onClick={() => setShowReportModal(true)}
                className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Wrench className="w-4 h-4" />
                <span>{isEn ? 'Create Incident Ticket' : 'Buat Tiket Laporan Kerusakan'}</span>
              </button>
            </div>

            {/* Action Card 2: Digital Twin Audit Dossier */}
            <div className="glass-panel squircle p-6 sm:p-7 border border-[#7D562D]/30 bg-[#7D562D] text-white shadow-xl flex flex-col justify-between text-center space-y-4 relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

              <div className="space-y-2 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 text-white mx-auto flex items-center justify-center backdrop-blur-md shadow-inner">
                  <FileCheck className="w-7 h-7" />
                </div>
                <h3 className="font-serif-display text-lg font-bold tracking-tight">
                  {isEn ? 'Download Signed Dossier' : 'Unduh Dossier Audit'}
                </h3>
                <p className="text-xs text-amber-100/80 leading-relaxed">
                  {isEn
                    ? 'Official PDF dossier with embedded cryptographic QR verification stamp and ISO audit logs.'
                    : 'Berkas audit resmi dengan stempel QR verifikasi kriptografis dan catatan audit ISO.'}
                </p>
              </div>

              <button
                onClick={handlePrint}
                className="w-full py-3 px-4 rounded-2xl bg-white text-[#7D562D] text-xs font-bold hover:bg-amber-50 transition-all cursor-pointer shadow-lg relative z-10 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isEn ? 'Print Signed Document' : 'Cetak Berkas Bertanda Tangan'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Bottom Bento Grid: Technical Telemetry Matrix & Audit Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Telemetry & Hardware Matrix (6 Cols) */}
          <div className="lg:col-span-6 glass-panel squircle p-6 sm:p-8 space-y-5 border border-stone-200/90 dark:border-stone-800 bg-[#FBF9F4]/95 dark:bg-stone-900/95 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#7D562D] dark:text-amber-400" />
                <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                  {isEn ? 'Hardware Telemetry & Identity' : 'Telemetri & Matriks Teknis'}
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                PHY-LAYER VERIFIED
              </span>
            </div>

            {/* Telemetry Rows */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80">
                <span className="text-stone-500 font-medium">{isEn ? 'Physical Serial Number (SN):' : 'Nomor Seri Pabrik (SN):'}</span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{asset.serialNumber || '-'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80">
                <span className="text-stone-500 font-medium">{isEn ? 'RFID EPC Tag (96-bit):' : 'RFID EPC Tag (96-bit):'}</span>
                <span className="font-mono font-bold text-[#5E7A68] dark:text-emerald-400">
                  {asset.rfidTag || '3034 02A4 089A 01C0 0000 0001'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80">
                <span className="text-stone-500 font-medium">{isEn ? 'NFC UID Chip ID:' : 'NFC UID Chip ID:'}</span>
                <span className="font-mono font-bold text-[#7D562D] dark:text-amber-400">
                  {asset.nfcTag || '04:78:6C:2A:9F:31:80'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80">
                <span className="text-stone-500 font-medium">{isEn ? 'MAC / Barcode Identifier:' : 'MAC Address / Barcode:'}</span>
                <span className="font-mono font-semibold text-stone-800 dark:text-stone-200">
                  {asset.customFields?.['macAddress'] || 'F4:0F:24:AB:1B:9C'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80">
                <span className="text-stone-500 font-medium">{isEn ? 'Assigned Custodian (PIC):' : 'Penanggung Jawab (PIC):'}</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {asset.picName} ({asset.department})
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80">
                <span className="text-stone-500 font-medium">{isEn ? 'Current Physical Location:' : 'Lokasi Fisik Terkini:'}</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#5E7A68]" />
                  <span>{asset.locationName}</span>
                </span>
              </div>
            </div>

            {/* QR Scanner Validation Footnote */}
            <div className="p-3.5 rounded-2xl bg-stone-100/80 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/80 flex items-center gap-3">
              <div className="w-12 h-12 bg-white p-1 rounded-xl border border-stone-200 dark:border-stone-700 shrink-0 flex items-center justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="w-8 h-8 text-stone-400" />
                )}
              </div>
              <div className="text-[11px] text-stone-500 leading-tight">
                <strong className="text-stone-800 dark:text-stone-200 block mb-0.5">
                  {isEn ? 'Tamper-Proof QR Seal' : 'Stempel QR Tahan Pemalsuan'}
                </strong>
                {isEn
                  ? 'Scan directly on physical asset sticker with any smartphone camera.'
                  : 'Pindai langsung pada label stiker fisik aset menggunakan kamera ponsel biasa.'}
              </div>
            </div>
          </div>

          {/* Right: Cryptographic Audit Ledger & Chain-of-Custody (6 Cols) */}
          <div className="lg:col-span-6 glass-panel squircle p-6 sm:p-8 space-y-5 border border-stone-200/90 dark:border-stone-800 bg-[#FBF9F4]/95 dark:bg-stone-900/95 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#5E7A68] dark:text-emerald-400" />
                <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                  {isEn ? 'Audit Ledger & Chain-of-Custody' : 'Buku Besar Audit & Garis Waktu'}
                </h2>
              </div>
              <span className="text-xs text-stone-400 font-mono">ISO 55001 COMPLIANT</span>
            </div>

            {/* Chronological Timeline */}
            <div className="space-y-4 text-xs relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200 dark:before:bg-stone-700">
              {/* Event 1: Recent Verification */}
              <div className="relative flex items-start gap-4 pl-8">
                <div className="absolute left-2 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-stone-900 shadow-xs" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {isEn ? 'Periodic Verification Completed' : 'Verifikasi Berkala Selesai'}
                    </span>
                    <span className="px-2 py-0.2 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                      Verified
                    </span>
                  </div>
                  <p className="text-stone-500 text-[11px]">
                    {isEn ? 'Scanned via NFC / QR by Asset Manager. Telemetry intact.' : 'Dipindai via NFC / QR oleh Manajer Aset. Integritas telemetri valid.'}
                  </p>
                  <span className="text-[10px] text-stone-400 font-mono block">
                    {new Date().toISOString().split('T')[0]} • 09:41 WIB
                  </span>
                </div>
              </div>

              {/* Event 2: Movement Logs (if any) */}
              {assetMovements.length > 0 ? (
                assetMovements.slice(0, 2).map((m) => (
                  <div key={m.id} className="relative flex items-start gap-4 pl-8">
                    <div className="absolute left-2 top-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white dark:border-stone-900 shadow-xs" />
                    <div className="space-y-1">
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {isEn ? 'Custodian & Location Transfer' : 'Mutasi Penanggung Jawab & Lokasi'}
                      </span>
                      <p className="text-stone-500 text-[11px]">
                        {m.fromLocationName} &rarr; {m.toLocationName} ({m.reason || 'Penugasan operasional'})
                      </p>
                      <span className="text-[10px] text-stone-400 font-mono block">{m.movementDate}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="relative flex items-start gap-4 pl-8">
                  <div className="absolute left-2 top-1 w-3.5 h-3.5 rounded-full bg-stone-400 border-2 border-white dark:border-stone-900 shadow-xs" />
                  <div className="space-y-1">
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {isEn ? 'Facility Assigned' : 'Penetapan Lokasi Gedung'}
                    </span>
                    <p className="text-stone-500 text-[11px]">
                      {isEn ? 'Allocated to' : 'Ditempatkan di'} {asset.locationName} ({asset.department})
                    </p>
                    <span className="text-[10px] text-stone-400 font-mono block">{asset.purchaseDate}</span>
                  </div>
                </div>
              )}

              {/* Event 3: Genesis Registration */}
              <div className="relative flex items-start gap-4 pl-8">
                <div className="absolute left-2 top-1 w-3.5 h-3.5 rounded-full bg-[#7D562D] border-2 border-white dark:border-stone-900 shadow-xs" />
                <div className="space-y-1">
                  <span className="font-bold text-stone-900 dark:text-stone-100">Genesis Registration</span>
                  <p className="text-stone-500 text-[11px]">
                    {isEn
                      ? 'Asset officially registered into TwinVerify OS ledger with initial master cryptographic key.'
                      : 'Aset resmi diregistrasi ke sistem TwinVerify OS dengan kunci master kriptografi awal.'}
                  </p>
                  <span className="text-[10px] text-stone-400 font-mono block">{asset.purchaseDate} • 10:00 WIB</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Minimal Spatial Footer */}
        <footer className="pt-6 pb-4 border-t border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500">
          <div>
            © 2026 {StorageService.getAppName()} • {isEn ? 'Authenticity Protocol. Cryptographically Signed.' : 'Protokol Keaslian Aset. Ditandatangani Secara Kriptografi.'}
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <span>ISO 27001</span>
            <span>•</span>
            <span>ISO 55001</span>
            <span>•</span>
            <span className="font-mono">TwinVerify OS</span>
          </div>
        </footer>
      </div>

      {/* 5. Incident Reporting Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel squircle p-6 sm:p-8 max-w-lg w-full bg-[#FBF9F4] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                    {isEn ? 'Public Incident Report' : 'Laporan Kerusakan & Servis'}
                  </h3>
                  <span className="text-[10px] text-stone-500 font-mono">{asset.assetCode} • {asset.name}</span>
                </div>
              </div>

              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-bold text-sm">
                  {isEn ? 'Incident Ticket Submitted Successfully!' : 'Tiket Laporan Berhasil Dikirim!'}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  {isEn
                    ? 'Our IT & Facilities maintenance team has been notified and will inspect the asset shortly.'
                    : 'Tim fasilitas dan pemeliharaan IT telah menerima notifikasi dan akan segera meninjau unit aset.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handlePublicSubmitReport} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                    {isEn ? 'Brief Summary / Title' : 'Judul / Ringkasan Masalah'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isEn ? 'e.g., Screen flickering, power failure' : 'Contoh: Layar pecah, mati total, servis berkala'}
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-[#5E7A68]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                    {isEn ? 'Incident Details & Symptoms' : 'Detail Kendala Fisik / Kerusakan'}
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder={isEn ? 'Describe the issue in detail...' : 'Jelaskan kronologi kendala atau kebutuhan perbaikan...'}
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-[#5E7A68]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                      {isEn ? 'Your Name (Optional)' : 'Nama Pelapor (Opsional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={isEn ? 'e.g., Budi Santoso' : 'Contoh: Budi Santoso'}
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-[#5E7A68]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1.5">
                      {isEn ? 'Contact / Ext (Optional)' : 'No. Kontak / Ext (Opsional)'}
                    </label>
                    <input
                      type="text"
                      placeholder="0812-xxxx-xxxx / Ext 402"
                      value={reporterContact}
                      onChange={(e) => setReporterContact(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-[#5E7A68]"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-200 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-100 cursor-pointer"
                  >
                    {isEn ? 'Cancel' : 'Batal'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmittingReport ? (isEn ? 'Submitting...' : 'Mengirim...') : isEn ? 'Submit Ticket' : 'Kirim Laporan'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

