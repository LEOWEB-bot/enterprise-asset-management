import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeftRight,
  Building,
  User as UserIcon,
  FileText,
  CheckCircle2,
  AlertCircle,
  Calendar,
  UploadCloud,
  Send,
  ShieldCheck,
  Clock,
  Layers,
  MapPin,
  UserCheck,
  FileCheck,
  Check,
} from 'lucide-react';
import { Asset, AssetLocation, User as UserType } from '../../types';
import { StorageService } from '../../services/storageService';
import { logActivity } from '../../services/activityLogger';
import { NotificationService } from '../../services/notificationService';
import { getStatusBadgeClass } from '../../services/authService';
import { getI18n, AppLanguage } from '../../utils/i18n';

interface MovementModalProps {
  asset: Asset | null;
  locations: AssetLocation[];
  currentUser: UserType;
  onClose: () => void;
  onSuccess: () => void;
  isReadOnlyMode: boolean;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  asset: initialAsset,
  locations,
  currentUser,
  onClose,
  onSuccess,
  isReadOnlyMode,
}) => {
  const allAssets = StorageService.getAssets().filter((a) => a.status !== 'DISPOSED');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    initialAsset?.id || (allAssets.length > 0 ? allAssets[0].id : '')
  );

  const asset = initialAsset || allAssets.find((a) => a.id === selectedAssetId) || allAssets[0] || null;

  const currentLang: AppLanguage = currentUser?.language || StorageService.getLanguage() || 'id';
  const t = getI18n(currentLang);
  const isEn = currentLang === 'en';

  const [toLocationId, setToLocationId] = useState<string>(
    locations[0]?.id || asset?.locationId || ''
  );
  const [toDepartment, setToDepartment] = useState<string>(asset?.department || '');
  const [toPic, setToPic] = useState<string>(asset?.picName || '');
  const [movementDate, setMovementDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [reasonCategory, setReasonCategory] = useState<string>('Rotasi Karyawan & Penugasan Unit');
  const [reason, setReason] = useState<string>('Relokasi operasional / peminjaman antar unit kerja');
  const [bastFileName, setBastFileName] = useState<string>('');

  if (!asset) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md">
        <div className="glass-panel squircle p-8 text-center max-w-sm w-full space-y-4">
          <p className="text-base font-bold text-[#181F19] dark:text-stone-100">
            {isEn ? 'No Assets Available' : 'Tidak Ada Aset yang Tersedia'}
          </p>
          <p className="text-xs text-stone-500">
            {isEn ? 'Please register assets first in Master Data.' : 'Silakan daftarkan aset terlebih dahulu di Master Data.'}
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {isEn ? 'Close' : 'Tutup'}
          </button>
        </div>
      </div>
    );
  }

  const autoApprove = StorageService.getSettingValue('asset.workflow.auto_approve_movement', 'false') === 'true';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBastFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnlyMode) {
      alert(isEn ? 'System is in Read-Only Mode. Changes disabled.' : 'Sistem sedang dalam Mode Read-Only. Perubahan data dinonaktifkan.');
      return;
    }

    const targetLoc = locations.find((l) => l.id === toLocationId);
    const targetLocName = targetLoc?.name || (isEn ? 'New Location' : 'Lokasi Baru');

    const movementId = `mov-${Date.now()}`;
    const approvalId = `appr-${Date.now()}`;
    const fullReasonText = `${reasonCategory}: ${reason}${bastFileName ? ` (Lampiran BAST: ${bastFileName})` : ''}`;

    if (autoApprove) {
      // Auto approved: update asset directly
      const assets = StorageService.getAssets();
      const updatedAssets = assets.map((a) => {
        if (a.id === asset.id) {
          return {
            ...a,
            locationId: toLocationId,
            locationName: targetLocName,
            department: toDepartment,
            picName: toPic,
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          };
        }
        return a;
      });
      StorageService.saveAssets(updatedAssets);

      // Record movement
      const movements = StorageService.getMovements();
      movements.unshift({
        id: movementId,
        assetId: asset.id,
        assetCode: asset.assetCode,
        assetName: asset.name,
        fromLocationId: asset.locationId,
        fromLocationName: asset.locationName,
        toLocationId,
        toLocationName: targetLocName,
        fromDepartment: asset.department,
        toDepartment,
        fromPic: asset.picName,
        toPic,
        movementDate: movementDate || new Date().toISOString().replace('T', ' ').substring(0, 19),
        reason: fullReasonText,
        performedBy: currentUser.name,
        status: 'COMPLETED',
      });
      StorageService.saveMovements(movements);

      logActivity(
        'ASSET_MOVEMENT_AUTO_APPROVED',
        'MOVEMENT',
        `Mutasi langsung aset ${asset.assetCode} ke ${targetLocName} oleh ${currentUser.name}`,
        asset.id
      );

      NotificationService.dispatchNotification(
        'asset.movement',
        {
          assetCode: asset.assetCode,
          name: asset.name,
          fromLocation: asset.locationName,
          toLocation: targetLocName,
          pic: toPic,
          department: toDepartment,
          reason: fullReasonText,
          movedBy: currentUser.name,
        },
        `Mutasi Aset Berhasil: ${asset.assetCode}`,
        `Aset ${asset.name} telah dipindahkan dari ${asset.locationName} ke ${targetLocName} (PIC: ${toPic}).`
      );
    } else {
      // Workflow requires approval: create Approval Request
      const approvals = StorageService.getApprovals();
      approvals.unshift({
        id: approvalId,
        type: 'MOVEMENT',
        assetId: asset.id,
        assetCode: asset.assetCode,
        assetName: asset.name,
        requesterId: currentUser.id,
        requesterName: currentUser.name,
        requesterRole: currentUser.role,
        status: 'PENDING',
        details: {
          previousState: {
            locationId: asset.locationId,
            locationName: asset.locationName,
            department: asset.department,
            picName: asset.picName,
          },
          targetState: {
            locationId: toLocationId,
            locationName: targetLocName,
            department: toDepartment,
            picName: toPic,
          },
          reason: fullReasonText,
        },
        requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
      StorageService.saveApprovals(approvals);

      // Record pending movement
      const movements = StorageService.getMovements();
      movements.unshift({
        id: movementId,
        assetId: asset.id,
        assetCode: asset.assetCode,
        assetName: asset.name,
        fromLocationId: asset.locationId,
        fromLocationName: asset.locationName,
        toLocationId,
        toLocationName: targetLocName,
        fromDepartment: asset.department,
        toDepartment,
        fromPic: asset.picName,
        toPic,
        movementDate: movementDate || new Date().toISOString().replace('T', ' ').substring(0, 19),
        reason: fullReasonText,
        performedBy: currentUser.name,
        approvalRequestId: approvalId,
        status: 'PENDING',
      });
      StorageService.saveMovements(movements);

      logActivity(
        'APPROVAL_REQUEST_SUBMITTED',
        'APPROVAL',
        `Pengajuan mutasi aset ${asset.assetCode} menunggu persetujuan (Requester: ${currentUser.name})`,
        approvalId
      );

      NotificationService.dispatchNotification(
        'approval.requested',
        {
          approvalId,
          type: 'MUTASI_ASET',
          assetCode: asset.assetCode,
          name: asset.name,
          toLocation: targetLocName,
          requester: currentUser.name,
          reason: fullReasonText,
        },
        `Permohonan Approval Mutasi: ${asset.assetCode}`,
        `${currentUser.name} mengajukan pemindahan aset ${asset.name} ke ${targetLocName}. Menunggu persetujuan.`
      );
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-md p-3 sm:p-6 md:p-8 flex justify-center animate-fadeIn">
      {/* Outer Spatial Canvas Window */}
      <div className="spatial-canvas w-full max-w-5xl my-auto rounded-[36px] sm:rounded-[44px] p-6 sm:p-10 border border-white/60 dark:border-stone-700/60 shadow-2xl space-y-8 relative overflow-hidden">
        
        {/* Subtle decorative lighting */}
        <div className="absolute -right-24 -top-24 w-80 h-80 bg-[#5E7A68]/15 dark:bg-emerald-950/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-[#D4A373]/15 dark:bg-amber-950/20 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Spatial Hero Command Header */}
        <div className="glass-panel squircle p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs uppercase tracking-widest text-stone-500 font-bold px-3 py-1 rounded-full bg-stone-200/70 dark:bg-stone-800">
                {isEn ? 'Relocation Order' : 'Surat Perintah Mutasi'}: {asset.assetCode}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusBadgeClass(
                  asset.status
                )}`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <span>{asset.status} ({isEn ? 'Active' : 'Aktif'})</span>
              </span>
            </div>

            <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight break-words">
              {isEn ? 'Asset Movement & Relocation Order' : 'Ajukan Mutasi & Relokasi Aset'}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-medium flex items-center gap-2">
              <span className="font-bold text-stone-900 dark:text-stone-100">{asset.name}</span>
              <span>•</span>
              <span>{asset.categoryName}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center flex-nowrap">
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-full hover:bg-stone-200/80 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors cursor-pointer flex items-center justify-center shrink-0 border border-stone-300/80 dark:border-stone-700/80 bg-white/70 dark:bg-stone-800/70"
              title={isEn ? 'Close Form' : 'Tutup Formulir'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Main Form Formats (Bento Grid) */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Asset Selector (if not pre-selected) */}
          {!initialAsset && (
            <div className="glass-panel squircle p-6 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                {isEn ? 'Select Asset to Relocate *' : 'Pilih Unit Aset yang Mau Dimutasi *'}
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  const selected = allAssets.find((a) => a.id === e.target.value);
                  if (selected) {
                    setToDepartment(selected.department || '');
                    setToPic(selected.picName || '');
                  }
                }}
                className="w-full p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-[#181F19] dark:text-stone-100 focus:ring-2 focus:ring-[#5E7A68] outline-hidden"
              >
                {allAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.assetCode} - {a.name} ({a.locationName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bento Card 1: Origin vs Destination Flow Bridge */}
          <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#181F19] dark:text-stone-100 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-[#5E7A68]" />
                <span>{isEn ? 'Allocation Transfer Flow' : 'Alur Perpindahan Alokasi & Penugasan'}</span>
              </h2>
              <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">
                {isEn ? 'Dual-Node Handover' : 'Serah Terima Antar-Lokasi'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Origin Node (Read-only) */}
              <div className="lg:col-span-5 p-6 rounded-3xl bg-white/60 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800 space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                    {isEn ? 'Current Origin (Asal)' : 'Lokasi & PIC Asal (Tercatat)'}
                  </span>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-300 shrink-0">
                        <MapPin className="w-4 h-4 text-[#5E7A68]" />
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">{isEn ? 'Current Location' : 'Lokasi Fisik Asal'}</span>
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{asset.locationName}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-300 shrink-0">
                        <UserCheck className="w-4 h-4 text-[#7D562D]" />
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">{isEn ? 'Current PIC' : 'Penanggung Jawab (PIC)'}</span>
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{asset.picName || '-'}</span>
                        <span className="text-[10px] text-stone-400 block">{asset.department || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-stone-100/80 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 text-[11px] text-stone-500 font-medium">
                  {isEn ? 'Current entry will be logged into immutable audit history upon approval.' : 'Data asal akan otomatis terarsip dalam log riwayat forensik.'}
                </div>
              </div>

              {/* Center Dynamic Arrow Bridge */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center py-2">
                <div className="w-14 h-14 rounded-full bg-[#5E7A68]/15 border border-[#5E7A68]/30 text-[#5E7A68] flex items-center justify-center shadow-lg shadow-[#5E7A68]/10 hover:scale-110 transition-transform">
                  <ArrowRight className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-[#5E7A68] mt-2 uppercase tracking-wider">
                  {isEn ? 'Transfer' : 'Mutasi'}
                </span>
              </div>

              {/* Destination Node (Interactive Fields) */}
              <div className="lg:col-span-5 p-6 rounded-3xl bg-[#5E7A68]/5 dark:bg-[#5E7A68]/10 border border-[#5E7A68]/30 space-y-4">
                <span className="text-[10px] font-bold text-[#5E7A68] uppercase tracking-wider block">
                  {isEn ? 'New Destination (Tujuan Baru) *' : 'Alokasi Penugasan Baru *'}
                </span>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1.5 uppercase">
                      {isEn ? 'Target Campus / Room *' : 'Lokasi Gedung / Ruangan Tujuan *'}
                    </label>
                    <div className="relative">
                      <select
                        value={toLocationId || ''}
                        onChange={(e) => setToLocationId(e.target.value)}
                        className="w-full p-3 pl-10 rounded-2xl bg-white/90 dark:bg-stone-900/90 border border-stone-300 dark:border-stone-700 font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#5E7A68] outline-hidden appearance-none"
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} ({loc.city})
                          </option>
                        ))}
                      </select>
                      <MapPin className="w-4 h-4 text-[#5E7A68] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1.5 uppercase">
                        {isEn ? 'New PIC Name *' : 'PIC Penerima Baru *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={toPic || ''}
                        onChange={(e) => setToPic(e.target.value)}
                        placeholder="e.g. Hendra Pratama"
                        className="w-full p-3 rounded-2xl bg-white/90 dark:bg-stone-900/90 border border-stone-300 dark:border-stone-700 font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#5E7A68] outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1.5 uppercase">
                        {isEn ? 'Department *' : 'Departemen Baru *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={toDepartment || ''}
                        onChange={(e) => setToDepartment(e.target.value)}
                        placeholder="e.g. Logistik / GA"
                        className="w-full p-3 rounded-2xl bg-white/90 dark:bg-stone-900/90 border border-stone-300 dark:border-stone-700 font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#5E7A68] outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Grid Row 2: Operational Schedule & Approval Routing */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Bento Card 2: Operational Parameters & BAST (8 Cols) */}
            <div className="lg:col-span-8 glass-panel squircle p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
                <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#181F19] dark:text-stone-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#7D562D]" />
                  <span>{isEn ? 'Operational Details & Handover Document' : 'Rincian Operasional & Dokumen Serah Terima'}</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1.5 uppercase">
                    {isEn ? 'Effective Relocation Date *' : 'Tanggal Efektif Relokasi *'}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={movementDate}
                      onChange={(e) => setMovementDate(e.target.value)}
                      className="w-full p-3 pl-10 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#5E7A68] outline-hidden"
                    />
                    <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1.5 uppercase">
                    {isEn ? 'Reason Category *' : 'Kategori Alasan Mutasi *'}
                  </label>
                  <select
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#5E7A68] outline-hidden"
                  >
                    <option value="Rotasi Karyawan & Penugasan Unit">{isEn ? 'Employee Rotation & Assignment' : 'Rotasi Karyawan & Penugasan Unit'}</option>
                    <option value="Pembukaan Cabang / Kantor Baru">{isEn ? 'Branch Office Expansion' : 'Pembukaan Cabang / Kantor Baru'}</option>
                    <option value="Penugasan Proyek Lapangan">{isEn ? 'Field Project Deployment' : 'Penugasan Proyek Lapangan'}</option>
                    <option value="Peremajaan Fasilitas">{isEn ? 'Facility Upgrade' : 'Peremajaan Fasilitas'}</option>
                    <option value="Lainnya">{isEn ? 'Other Business Purpose' : 'Lainnya'}</option>
                  </select>
                </div>
              </div>

              {/* Handover Instruction Notes */}
              <div className="space-y-1.5 text-xs">
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                  {isEn ? 'Operational Notes & Handover Instructions *' : 'Catatan Instruksi Serah Terima & Alasan Rinci *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={isEn ? 'Describe logistics requirements, accessories included, packaging...' : 'Jelaskan kelengkapan unit, instruksi pengiriman logistik, atau alasan perpindahan...'}
                  className="w-full p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#5E7A68] outline-hidden resize-none leading-relaxed"
                />
              </div>

              {/* BAST File Attachment Slot */}
              <div className="space-y-2 text-xs">
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                  {isEn ? 'BAST Handover Document (PDF / Scan)' : 'Lampiran Dokumen Berita Acara Serah Terima (BAST)'}
                </label>
                <label className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-3xl p-6 flex flex-col items-center justify-center text-center bg-white/40 dark:bg-stone-900/40 hover:bg-white/80 dark:hover:bg-stone-900/80 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <UploadCloud className="w-8 h-8 text-stone-400 group-hover:text-[#5E7A68] transition-colors mb-2" />
                  <p className="font-bold text-xs text-[#181F19] dark:text-stone-100">
                    {bastFileName ? (
                      <span className="text-[#5E7A68] font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" /> {bastFileName}
                      </span>
                    ) : (
                      isEn ? 'Click or drag BAST document here' : 'Klik atau seret file dokumen BAST ke sini'
                    )}
                  </p>
                  <span className="text-[11px] text-stone-400 mt-0.5">
                    PDF, JPG, PNG (Max 10MB)
                  </span>
                </label>
              </div>
            </div>

            {/* Bento Card 3: Approval Chain Tier (4 Cols) */}
            <div className="lg:col-span-4 glass-panel squircle p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
                <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#5E7A68]" />
                  <span>{isEn ? 'Approval Governance' : 'Tata Kelola Otorisasi'}</span>
                </h2>
              </div>

              {/* Vertical Routing Timeline */}
              <div className="relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-[#5E7A68] before:via-stone-300 dark:before:via-stone-700 before:to-stone-200 space-y-6 text-xs">
                
                {/* Step 1: Requester */}
                <div className="relative">
                  <div className="absolute -left-[27px] top-0.5 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-2 border-white dark:border-stone-900 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Tahap 1: Pengaju</span>
                    <p className="font-bold text-stone-900 dark:text-stone-100">{currentUser.name} ({currentUser.role})</p>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{isEn ? 'Ready to submit' : 'Siap dikirimkan'}</span>
                  </div>
                </div>

                {/* Step 2: Department Head / Asset Custodian */}
                <div className="relative">
                  <div className="absolute -left-[27px] top-0.5 w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-2 border-white dark:border-stone-900 flex items-center justify-center">
                    <Clock className="w-2.5 h-2.5" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Tahap 2: Validasi Divisi</span>
                    <p className="font-bold text-stone-900 dark:text-stone-100">Asset Manager / Kadiv</p>
                    <span className="text-[10px] text-stone-400">{isEn ? 'Awaiting submission' : 'Menunggu persetujuan'}</span>
                  </div>
                </div>

                {/* Step 3: Logistics Execution */}
                <div className="relative">
                  <div className="absolute -left-[27px] top-0.5 w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-2 border-white dark:border-stone-900 flex items-center justify-center">
                    <FileCheck className="w-2.5 h-2.5" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Tahap 3: Eksekusi Fisik</span>
                    <p className="font-bold text-stone-900 dark:text-stone-100">Tim Logistik & General Affairs</p>
                    <span className="text-[10px] text-stone-400">{isEn ? 'Physical relocation & handover' : 'Pemindahan fisik & tanda tangan'}</span>
                  </div>
                </div>
              </div>

              {/* Mode Alert Box */}
              <div className="p-4 rounded-2xl bg-stone-100/80 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 text-[11px] text-stone-600 dark:text-stone-300 space-y-1">
                <div className="font-bold text-[#181F19] dark:text-stone-100 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#5E7A68]" />
                  <span>{autoApprove ? (isEn ? 'Direct Auto-Approval' : 'Otorisasi Langsung') : (isEn ? 'Multi-Tier Approval Workflow' : 'Alur Persetujuan Bertingkat')}</span>
                </div>
                <p className="leading-relaxed">
                  {autoApprove
                    ? (isEn ? 'Relocation will immediately update master asset location in real-time.' : 'Mutasi langsung mengupdate lokasi aset di Master Data secara instan.')
                    : (isEn ? 'Request will be forwarded to the Approval Center for review before location moves.' : 'Permohonan akan diarahkan ke Approval Center sebelum lokasi resmi berpindah.')}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Bottom Action Command Footer */}
          <div className="glass-panel squircle p-4 px-6 sm:px-8 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Batalkan'}
            </button>

            <button
              type="submit"
              disabled={isReadOnlyMode}
              className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4D6656] text-white px-8 py-3.5 rounded-full text-xs font-bold shadow-lg shadow-[#5E7A68]/25 transition-all cursor-pointer hover:scale-105 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span>{isEn ? 'Submit Movement Order' : 'Kirim Pengajuan Mutasi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
