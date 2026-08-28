import React, { useState } from 'react';
import { X, Trash2, DollarSign, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { Asset, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { logActivity } from '../../services/activityLogger';
import { formatRupiah } from '../../services/depreciationService';
import { NotificationService } from '../../services/notificationService';

interface DisposalModalProps {
  asset: Asset | null;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
  isReadOnlyMode: boolean;
}

export const DisposalModal: React.FC<DisposalModalProps> = ({
  asset,
  currentUser,
  onClose,
  onSuccess,
  isReadOnlyMode,
}) => {
  if (!asset) return null;

  const [method, setMethod] = useState<'SOLD' | 'SCRAPPED' | 'DONATED' | 'LOST' | 'RECYCLED'>('SCRAPPED');
  const [salePrice, setSalePrice] = useState<number>(0);
  const [recipient, setRecipient] = useState('');
  const [reason, setReason] = useState('Kerusakan fisik berat / masa ekonomis telah habis.');

  const autoApprove = StorageService.getSettingValue('asset.workflow.auto_approve_disposal', 'false') === 'true';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnlyMode) {
      alert('Sistem sedang dalam Mode Read-Only. Perubahan data dinonaktifkan.');
      return;
    }

    const disposalId = `dsp-${Date.now()}`;
    const approvalId = `appr-${Date.now()}`;

    if (autoApprove) {
      // 1. Update Asset status to DISPOSED
      const assets = StorageService.getAssets();
      const updated = assets.map((a) => {
        if (a.id === asset.id) {
          return {
            ...a,
            status: 'DISPOSED' as const,
            condition: 'DAMAGED' as const,
            notes: `${a.notes || ''} [DISPOSED: ${method} pada ${new Date().toISOString().substring(0, 10)}]`,
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          };
        }
        return a;
      });
      StorageService.saveAssets(updated);

      // 2. Add Disposal Record
      const disposals = StorageService.getDisposals();
      disposals.unshift({
        id: disposalId,
        assetId: asset.id,
        assetCode: asset.assetCode,
        assetName: asset.name,
        disposalDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        method,
        salePrice: method === 'SOLD' ? salePrice : undefined,
        disposalReason: reason,
        recipientOrVendor: recipient || undefined,
        approvedBy: currentUser.name,
      });
      StorageService.saveDisposals(disposals);

      logActivity(
        'ASSET_DISPOSED',
        'DISPOSAL',
        `Aset ${asset.assetCode} dihapuskan (${method}) oleh ${currentUser.name}`,
        asset.id
      );

      NotificationService.dispatchNotification(
        'asset.disposed',
        {
          assetCode: asset.assetCode,
          name: asset.name,
          method,
          salePrice: method === 'SOLD' ? salePrice : undefined,
          reason,
          disposedBy: currentUser.name,
        },
        `Penghapusan Aset: ${asset.assetCode}`,
        `Aset ${asset.name} telah resmi dihapus dari sistem dengan metode ${method}.`
      );
    } else {
      // Create Approval Request
      const approvals = StorageService.getApprovals();
      approvals.unshift({
        id: approvalId,
        type: 'DISPOSAL',
        assetId: asset.id,
        assetCode: asset.assetCode,
        assetName: asset.name,
        requesterId: currentUser.id,
        requesterName: currentUser.name,
        requesterRole: currentUser.role,
        status: 'PENDING',
        details: {
          disposalMethod: method,
          saleAmount: salePrice,
          reason,
          maintenanceVendor: recipient,
        },
        requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
      StorageService.saveApprovals(approvals);

      logActivity(
        'APPROVAL_REQUEST_SUBMITTED',
        'APPROVAL',
        `Pengajuan penghapusan (Disposal) aset ${asset.assetCode} diajukan oleh ${currentUser.name}`,
        approvalId
      );

      NotificationService.dispatchNotification(
        'approval.requested',
        {
          approvalId,
          type: 'PENGHAPUSAN_ASET',
          assetCode: asset.assetCode,
          name: asset.name,
          method,
          requester: currentUser.name,
          reason,
        },
        `Permohonan Approval Disposal: ${asset.assetCode}`,
        `${currentUser.name} mengajukan penghapusan aset ${asset.name} (${method}). Menunggu persetujuan.`
      );
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50 dark:bg-rose-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Formulir Penghapusan / Disposal Aset
              </h2>
              <span className="font-mono text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                {asset.assetCode} - {asset.name}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Nilai Perolehan:</span>
              <span className="font-semibold">{formatRupiah(asset.purchaseCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nilai Buku Saat Ini:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {formatRupiah(asset.currentBookValue)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Metode Penghapusan (Disposal) *
              </label>
              <select
                value={method || 'SCRAPPED'}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="SCRAPPED">SCRAPPED (Dimusnahkan / Dibuang karena Rusak)</option>
                <option value="SOLD">SOLD (Dijual / Dilelang ke Pihak Ketiga)</option>
                <option value="DONATED">DONATED (Dihibahkan / Disumbangkan)</option>
                <option value="RECYCLED">RECYCLED (Didaur Ulang Komponen)</option>
                <option value="LOST">LOST (Hilang / Dikeluarkan dari Buku)</option>
              </select>
            </div>

            {method === 'SOLD' && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nilai Penjualan / Lelang (Rp) *
                </label>
                <input
                  type="number"
                  required
                  value={salePrice ?? 0}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Penerima / Vendor Pengepul / Pembeli
              </label>
              <input
                type="text"
                placeholder="Contoh: PT Daur Ulang Logam / CV Lelang Jaya"
                value={recipient || ''}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alasan Lengkap Penghapusan *
              </label>
              <textarea
                rows={3}
                required
                value={reason || ''}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-slate-800">
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer"
            >
              {autoApprove ? 'Hapuskan Aset Sekarang' : 'Kirim Pengajuan Disposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
