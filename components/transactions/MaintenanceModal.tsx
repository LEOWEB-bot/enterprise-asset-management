import React, { useState, useMemo } from 'react';
import {
  X,
  Wrench,
  Calendar,
  DollarSign,
  User as UserIcon,
  CheckCircle2,
  Clock,
  Search,
  Layers,
  AlertCircle,
  Ban,
  Building,
  UploadCloud,
  Check,
  Tag,
  ShieldCheck,
  Cpu,
  Plus,
  Send,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { Asset, MaintenanceRecord, MaintenanceStatus, MaintenanceType, User as UserType } from '../../types';
import { StorageService } from '../../services/storageService';
import { logActivity } from '../../services/activityLogger';
import { NotificationService } from '../../services/notificationService';
import { hasPermission, getStatusBadgeClass } from '../../services/authService';
import { formatRupiah } from '../../services/depreciationService';
import { getI18n, AppLanguage } from '../../utils/i18n';

interface MaintenanceModalProps {
  asset: Asset | null;
  existingRecord?: MaintenanceRecord | null;
  currentUser: UserType;
  onClose: () => void;
  onSuccess: () => void;
  isReadOnlyMode: boolean;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  asset,
  existingRecord,
  currentUser,
  onClose,
  onSuccess,
  isReadOnlyMode,
}) => {
  const allAssets = useMemo(() => StorageService.getAssets().filter((a) => a.status !== 'DISPOSED'), []);

  const currentLang: AppLanguage = currentUser?.language || StorageService.getLanguage() || 'id';
  const t = getI18n(currentLang);
  const isEn = currentLang === 'en';

  // Selected asset state
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    asset?.id || existingRecord?.assetId || (allAssets.length > 0 ? allAssets[0].id : '')
  );
  const [assetSearchQuery, setAssetSearchQuery] = useState('');

  const targetAsset = useMemo(() => {
    if (asset) return asset;
    if (selectedAssetId) return allAssets.find((a) => a.id === selectedAssetId) || null;
    if (existingRecord) return allAssets.find((a) => a.id === existingRecord.assetId) || null;
    return allAssets.length > 0 ? allAssets[0] : null;
  }, [asset, selectedAssetId, existingRecord, allAssets]);

  const filteredSelectableAssets = useMemo(() => {
    if (!assetSearchQuery) return allAssets;
    const q = assetSearchQuery.toLowerCase();
    return allAssets.filter(
      (a) =>
        a.assetCode.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.categoryName.toLowerCase().includes(q) ||
        a.locationName.toLowerCase().includes(q)
    );
  }, [allAssets, assetSearchQuery]);

  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>(
    existingRecord?.maintenanceType || 'CORRECTIVE'
  );
  const [priorityLevel, setPriorityLevel] = useState<'NORMAL' | 'URGENT' | 'CRITICAL'>('NORMAL');
  const [status, setStatus] = useState<MaintenanceStatus>(existingRecord?.status || 'IN_PROGRESS');
  const [scheduledDate, setScheduledDate] = useState(
    existingRecord?.scheduledDate || new Date().toISOString().substring(0, 10)
  );
  const [completionDate, setCompletionDate] = useState(existingRecord?.completionDate || '');
  const [description, setDescription] = useState(existingRecord?.description || '');
  const [isExternalVendor, setIsExternalVendor] = useState(Boolean(existingRecord?.vendorName));
  const [technicianName, setTechnicianName] = useState(
    existingRecord?.technicianName || currentUser.name || 'Hendra Pratama'
  );
  const [vendorName, setVendorName] = useState(existingRecord?.vendorName || '');
  const [cost, setCost] = useState<number>(existingRecord?.cost || 0);
  const [partsReplaced, setPartsReplaced] = useState(existingRecord?.partsReplaced || '');
  const [downtimeHours, setDowntimeHours] = useState<number>(existingRecord?.downtimeHours || 4);
  const [notes, setNotes] = useState(existingRecord?.notes || '');
  const [autoSetMaintenanceStatus, setAutoSetMaintenanceStatus] = useState<boolean>(true);
  const [attachedReceiptName, setAttachedReceiptName] = useState<string>('');

  // Cancellation mode
  const [showCancelReasonInput, setShowCancelReasonInput] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const canDirectCancel = currentUser.role === 'super-admin' || hasPermission(currentUser, 'maintenance.manage');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedReceiptName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnlyMode) {
      alert(isEn ? 'System is in Read-Only Mode. Changes disabled.' : 'Sistem sedang dalam Mode Read-Only. Perubahan data dinonaktifkan.');
      return;
    }

    if (!targetAsset) {
      alert(isEn ? 'Please select an asset first.' : 'Silakan pilih unit aset terlebih dahulu.');
      return;
    }

    if (!description.trim()) {
      alert(isEn ? 'Please provide scope of work / issue description!' : 'Uraian pekerjaan / gejala kerusakan wajib diisi!');
      return;
    }

    const records = StorageService.getMaintenance();
    const recordId = existingRecord?.id || `mnt-${Date.now()}`;

    const newRecord: MaintenanceRecord = {
      id: recordId,
      assetId: targetAsset.id,
      assetCode: targetAsset.assetCode,
      assetName: targetAsset.name,
      maintenanceType,
      status,
      scheduledDate,
      completionDate: status === 'COMPLETED' ? completionDate || new Date().toISOString().substring(0, 10) : undefined,
      description: `${description}${attachedReceiptName ? ` [Lampiran: ${attachedReceiptName}]` : ''}`,
      technicianName,
      vendorName: isExternalVendor ? (vendorName || 'Vendor Eksternal Resmi') : undefined,
      cost,
      partsReplaced: partsReplaced || undefined,
      downtimeHours,
      notes: notes || undefined,
    };

    if (existingRecord) {
      const idx = records.findIndex((r) => r.id === existingRecord.id);
      if (idx >= 0) records[idx] = newRecord;
    } else {
      records.unshift(newRecord);
    }
    StorageService.saveMaintenance(records);

    // Update asset status if autoSetMaintenanceStatus is enabled
    if (autoSetMaintenanceStatus) {
      const assets = StorageService.getAssets();
      const updated = assets.map((a) => {
        if (a.id === targetAsset.id) {
          let newStatus = a.status;
          if (status === 'IN_PROGRESS' || status === 'PLANNED') {
            newStatus = 'MAINTENANCE';
          } else if (status === 'COMPLETED' || status === 'CANCELLED') {
            newStatus = 'ACTIVE';
          }
          return {
            ...a,
            status: newStatus,
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          };
        }
        return a;
      });
      StorageService.saveAssets(updated);
    }

    logActivity(
      'MAINTENANCE_RECORD_SAVED',
      'MAINTENANCE',
      `Order perbaikan aset ${targetAsset.assetCode} (${maintenanceType} - Status: ${status}) oleh ${currentUser.name}`,
      recordId
    );

    NotificationService.dispatchNotification(
      status === 'COMPLETED' ? 'maintenance.completed' : 'maintenance.due',
      {
        recordId,
        assetCode: targetAsset.assetCode,
        name: targetAsset.name,
        type: maintenanceType,
        status,
        scheduledDate,
        completionDate: status === 'COMPLETED' ? completionDate : undefined,
        technician: technicianName,
        cost,
        description,
      },
      status === 'COMPLETED'
        ? `Perbaikan Aset Selesai: ${targetAsset.assetCode}`
        : `Jadwal Pemeliharaan Aset: ${targetAsset.assetCode}`,
      `Aktivitas pemeliharaan (${maintenanceType}) untuk ${targetAsset.name} berstatus ${status}. Teknisi: ${technicianName}.`
    );

    onSuccess();
    onClose();
  };

  const handleCancelTicket = () => {
    if (!existingRecord || !targetAsset) return;
    if (!cancelReason.trim()) {
      alert(isEn ? 'Please provide ticket cancellation reason.' : 'Silakan isi alasan pembatalan tiket servis.');
      return;
    }

    if (canDirectCancel) {
      const records = StorageService.getMaintenance();
      const updatedRecords = records.map((r) => {
        if (r.id === existingRecord.id) {
          return {
            ...r,
            status: 'CANCELLED' as MaintenanceStatus,
            notes: `${r.notes ? r.notes + ' | ' : ''}Dibatalkan langsung oleh ${currentUser.name}: ${cancelReason}`,
          };
        }
        return r;
      });
      StorageService.saveMaintenance(updatedRecords);

      // Revert asset status back to ACTIVE
      const assets = StorageService.getAssets();
      const updatedAssets = assets.map((a) => {
        if (a.id === targetAsset.id && a.status === 'MAINTENANCE') {
          return {
            ...a,
            status: 'ACTIVE' as const,
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          };
        }
        return a;
      });
      StorageService.saveAssets(updatedAssets);

      logActivity(
        'MAINTENANCE_CANCELLED',
        'MAINTENANCE',
        `Pembatalan tiket servis ${targetAsset.assetCode} (${existingRecord.id}) oleh ${currentUser.name}. Alasan: ${cancelReason}`,
        existingRecord.id
      );

      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-md p-3 sm:p-6 md:p-8 flex justify-center animate-fadeIn">
      {/* Outer Spatial Canvas Window */}
      <div className="spatial-canvas w-full max-w-5xl my-auto rounded-[36px] sm:rounded-[44px] p-6 sm:p-10 border border-white/60 dark:border-stone-700/60 shadow-2xl space-y-8 relative overflow-hidden">
        
        {/* Subtle decorative lighting */}
        <div className="absolute -right-24 -top-24 w-80 h-80 bg-[#7D562D]/15 dark:bg-amber-950/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-[#5E7A68]/15 dark:bg-emerald-950/30 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Spatial Command Header */}
        <div className="glass-panel squircle p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs uppercase tracking-widest text-stone-500 font-bold px-3 py-1 rounded-full bg-stone-200/70 dark:bg-stone-800">
                {isEn ? 'Work Order' : 'Perintah Kerja Servis'}: {targetAsset ? targetAsset.assetCode : 'NEW-WO'}
              </span>
              {targetAsset && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusBadgeClass(
                    targetAsset.status
                  )}`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  <span>{targetAsset.status}</span>
                </span>
              )}
            </div>

            <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight break-words">
              {existingRecord
                ? (isEn ? 'Update Maintenance Work Order' : 'Pembaruan Perintah Kerja Servis')
                : (isEn ? 'Issue Maintenance Work Order' : 'Buat Perintah Kerja Servis & Pemeliharaan')}
            </h1>

            {targetAsset && (
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-medium flex items-center gap-2">
                <span className="font-bold text-stone-900 dark:text-stone-100">{targetAsset.name}</span>
                <span>•</span>
                <span>{targetAsset.categoryName}</span>
                <span>•</span>
                <span>{targetAsset.locationName}</span>
              </p>
            )}
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

        {/* Cancellation Sub-view (if triggered) */}
        {showCancelReasonInput ? (
          <div className="glass-panel squircle p-8 space-y-6">
            <div className="p-5 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-3xl space-y-2">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                <Ban className="w-5 h-5 text-rose-600" />
                <span>{isEn ? 'Confirm Work Order Cancellation' : 'Konfirmasi Pembatalan Tiket Servis'}</span>
              </div>
              <p className="text-rose-700 dark:text-rose-300 text-xs leading-relaxed">
                {isEn
                  ? 'Cancelling this work order will immediately revert the asset back to ACTIVE status and record the cancellation reason in the forensic audit stream.'
                  : 'Pembatalan tiket ini akan mengembalikan status aset menjadi AKTIF dan mencatat alasan pembatalan dalam jejak audit forensik.'}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-stone-800 dark:text-stone-200 uppercase">
                {isEn ? 'Cancellation Reason *' : 'Alasan Pembatalan Tiket *'}
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={isEn ? 'e.g. Unit tested normal after cleaning, schedule entry error...' : 'Jelaskan alasan pembatalan perintah kerja ini...'}
                className="w-full p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#7D562D] outline-hidden resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200/80 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setShowCancelReasonInput(false)}
                className="px-6 py-3 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-800 cursor-pointer"
              >
                {isEn ? 'Back to Form' : 'Kembali ke Formulir'}
              </button>
              <button
                type="button"
                onClick={handleCancelTicket}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-xs font-bold shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
              >
                {isEn ? 'Confirm Cancellation' : 'Batalkan Tiket Sekarang'}
              </button>
            </div>
          </div>
        ) : (
          /* Main Bento Grid Form */
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Asset Selector (if creating a new ticket without preselected asset) */}
            {!asset && !existingRecord && (
              <div className="glass-panel squircle p-6 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                  {isEn ? 'Select Asset for Service *' : 'Pilih Unit Aset yang Akan Diservis *'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={isEn ? 'Type to search asset by code, name, location...' : 'Ketik untuk mencari aset berdasarkan kode, nama, lokasi...'}
                    value={assetSearchQuery}
                    onChange={(e) => setAssetSearchQuery(e.target.value)}
                    className="w-full p-3.5 pl-10 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-[#181F19] dark:text-stone-100 focus:ring-2 focus:ring-[#7D562D] outline-hidden mb-2"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-[#181F19] dark:text-stone-100 focus:ring-2 focus:ring-[#7D562D] outline-hidden"
                >
                  {filteredSelectableAssets.map((ast) => (
                    <option key={ast.id} value={ast.id}>
                      [{ast.assetCode}] {ast.name} — Lokasi: {ast.locationName} (Status: {ast.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 3-Column Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Bento Card 1: Service Classification & Schedule (4 Cols) */}
              <div className="lg:col-span-4 glass-panel squircle p-6 sm:p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="border-b border-stone-200/80 dark:border-stone-800 pb-3">
                    <h2 className="font-serif-display text-base font-bold text-[#181F19] dark:text-stone-100 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#7D562D]" />
                      <span>{isEn ? 'Service Classification' : 'Klasifikasi & Jadwal'}</span>
                    </h2>
                  </div>

                  {/* Maintenance Type Radio Cards */}
                  <div className="space-y-2 text-xs">
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      {isEn ? 'Maintenance Type *' : 'Jenis Pemeliharaan *'}
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: 'PREVENTIVE', label: isEn ? 'Preventive Maintenance' : 'Servis Berkala (Preventive)' },
                        { id: 'CORRECTIVE', label: isEn ? 'Corrective Repair' : 'Perbaikan Kerusakan (Corrective)' },
                        { id: 'CALIBRATION', label: isEn ? 'Calibration & Test' : 'Kalibrasi & Uji Akurasi' },
                        { id: 'UPGRADE', label: isEn ? 'Parts Upgrade' : 'Penggantian Suku Cadang' },
                      ].map((item) => (
                        <label
                          key={item.id}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                            maintenanceType === item.id
                              ? 'bg-[#7D562D]/10 border-[#7D562D] text-[#7D562D] dark:text-amber-300 font-bold'
                              : 'bg-white/60 dark:bg-stone-900/50 border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          <span className="text-xs">{item.label}</span>
                          <input
                            type="radio"
                            name="maintenanceType"
                            value={item.id}
                            checked={maintenanceType === item.id}
                            onChange={() => setMaintenanceType(item.id as MaintenanceType)}
                            className="sr-only"
                          />
                          {maintenanceType === item.id && <Check className="w-4 h-4 text-[#7D562D] dark:text-amber-400" />}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Priority Level Chips */}
                  <div className="space-y-2 text-xs">
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      {isEn ? 'Priority Level *' : 'Tingkat Urgensi *'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['NORMAL', 'URGENT', 'CRITICAL'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriorityLevel(p)}
                          className={`py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            priorityLevel === p
                              ? p === 'CRITICAL'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : p === 'URGENT'
                                ? 'bg-[#5E7A68] text-white shadow-xs'
                                : 'bg-[#7D562D] text-white shadow-xs'
                              : 'bg-white/60 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-800'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Schedule Dates */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                        {isEn ? 'Scheduled Date' : 'Tanggal Mulai'}
                      </label>
                      <input
                        type="date"
                        required
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                        {isEn ? 'Target Selesai' : 'Target Selesai'}
                      </label>
                      <input
                        type="date"
                        value={completionDate}
                        onChange={(e) => setCompletionDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Card 2: Technician, Vendor & Cost Allocation (4 Cols) */}
              <div className="lg:col-span-4 glass-panel squircle p-6 sm:p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="border-b border-stone-200/80 dark:border-stone-800 pb-3">
                    <h2 className="font-serif-display text-base font-bold text-[#181F19] dark:text-stone-100 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-[#7D562D]" />
                      <span>{isEn ? 'Technician & Vendor Assignment' : 'Pelaksana & Estimasi Biaya'}</span>
                    </h2>
                  </div>

                  {/* Provider Toggle */}
                  <div className="space-y-2 text-xs">
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      {isEn ? 'Execution Assignment' : 'Pelaksana Pengerjaan *'}
                    </label>
                    <div className="grid grid-cols-2 p-1 rounded-2xl bg-stone-200/60 dark:bg-stone-800/60 border border-stone-300/50 dark:border-stone-700/50">
                      <button
                        type="button"
                        onClick={() => setIsExternalVendor(false)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          !isExternalVendor
                            ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        {isEn ? 'Internal Tech' : 'Teknisi Internal'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsExternalVendor(true)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isExternalVendor
                            ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        {isEn ? 'External Vendor' : 'Vendor Resmi'}
                      </button>
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1 uppercase">
                        {isExternalVendor ? (isEn ? 'Vendor / Workshop Name *' : 'Nama Perusahaan Vendor / Bengkel *') : (isEn ? 'Lead Technician Name *' : 'Nama Teknisi Penanggung Jawab *')}
                      </label>
                      <input
                        type="text"
                        required
                        value={isExternalVendor ? vendorName : technicianName}
                        onChange={(e) => isExternalVendor ? setVendorName(e.target.value) : setTechnicianName(e.target.value)}
                        placeholder={isExternalVendor ? 'e.g. PT United Tractors Service Division' : 'e.g. Hendra Pratama'}
                        className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#7D562D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1 uppercase">
                        {isEn ? 'Estimated Cost (IDR)' : 'Estimasi Total Biaya (Rp)'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={cost}
                          onChange={(e) => setCost(Number(e.target.value))}
                          className="w-full p-3 pl-10 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-bold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#7D562D]"
                        />
                        <span className="text-[11px] font-bold text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2">Rp</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1 uppercase">
                        {isEn ? 'Replaced Spare Parts (BOM)' : 'Suku Cadang yang Diganti'}
                      </label>
                      <input
                        type="text"
                        value={partsReplaced}
                        onChange={(e) => setPartsReplaced(e.target.value)}
                        placeholder="e.g. Hydraulic Pump, Filter Assy, Seal Kit"
                        className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#7D562D]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Card 3: Diagnosis & Impact (4 Cols) */}
              <div className="lg:col-span-4 glass-panel squircle p-6 sm:p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="border-b border-stone-200/80 dark:border-stone-800 pb-3">
                    <h2 className="font-serif-display text-base font-bold text-[#181F19] dark:text-stone-100 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#7D562D]" />
                      <span>{isEn ? 'Diagnosis & Asset Status' : 'Diagnosis & Status Unit'}</span>
                    </h2>
                  </div>

                  {/* Scope of Work */}
                  <div className="space-y-1.5 text-xs">
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                      {isEn ? 'Scope of Work & Diagnosis *' : 'Uraian Pekerjaan & Gejala Kerusakan *'}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={isEn ? 'Describe required maintenance actions...' : 'Jelaskan tindakan perbaikan dan instruksi teknis...'}
                      className="w-full p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#7D562D] outline-hidden resize-none leading-relaxed"
                    />
                  </div>

                  {/* Status Toggle Switch */}
                  <label className="p-3.5 rounded-2xl bg-white/60 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between cursor-pointer">
                    <div className="pr-2">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                        {isEn ? 'Lock Asset to MAINTENANCE' : 'Kunci Status ke MAINTENANCE'}
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        {isEn ? 'Unit marked out of service during repair' : 'Unit dinonaktifkan sementara'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoSetMaintenanceStatus}
                      onChange={(e) => setAutoSetMaintenanceStatus(e.target.checked)}
                      className="w-4 h-4 accent-[#7D562D] rounded-md cursor-pointer"
                    />
                  </label>

                  {/* Upload Dropzone */}
                  <div className="space-y-1 text-xs">
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                      {isEn ? 'Upload Invoice / Photo' : 'Unggah Faktur / Foto Bukti'}
                    </label>
                    <label className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-white/40 dark:bg-stone-900/40 hover:bg-white/80 dark:hover:bg-stone-900/80 transition-colors cursor-pointer group">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <UploadCloud className="w-6 h-6 text-stone-400 group-hover:text-[#7D562D] transition-colors mb-1" />
                      <p className="font-bold text-[11px] text-[#181F19] dark:text-stone-100">
                        {attachedReceiptName ? (
                          <span className="text-[#7D562D] font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> {attachedReceiptName}
                          </span>
                        ) : (
                          isEn ? 'Drag & drop or browse files' : 'Pilih file faktur / foto'
                        )}
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Bottom Action Command Footer */}
            <div className="glass-panel squircle p-4 px-6 sm:px-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Batalkan'}
                </button>

                {existingRecord && existingRecord.status !== 'CANCELLED' && existingRecord.status !== 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => setShowCancelReasonInput(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Ban className="w-4 h-4" />
                    <span>{isEn ? 'Cancel Work Order' : 'Batalkan Tiket Servis'}</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isReadOnlyMode}
                className="flex items-center gap-2 bg-[#7D562D] hover:bg-[#684624] text-white px-8 py-3.5 rounded-full text-xs font-bold shadow-lg shadow-[#7D562D]/25 transition-all cursor-pointer hover:scale-105 disabled:opacity-40"
              >
                <Wrench className="w-4 h-4" />
                <span>{existingRecord ? (isEn ? 'Update Work Order' : 'Simpan Pembaruan Servis') : (isEn ? 'Issue Work Order' : 'Terbitkan Perintah Kerja')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
