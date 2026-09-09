import React, { useState } from 'react';
import {
  Trash2,
  Gavel,
  FileCheck2,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  DollarSign,
  TrendingDown,
  Scale,
  Receipt,
  Download,
  Printer,
  ChevronRight,
  Sparkles,
  QrCode,
  UserCheck,
  Send,
  X,
} from 'lucide-react';
import { Asset, User, ApprovalRequest } from '../../types';
import { StorageService } from '../../services/storageService';
import { logActivity } from '../../services/activityLogger';
import { formatRupiah } from '../../services/depreciationService';
import { NotificationService } from '../../services/notificationService';
import { AppLanguage, getI18n } from '../../utils/i18n';

interface DisposalCenterProps {
  currentUser: User;
  onRefreshData?: () => void;
  isReadOnlyMode?: boolean;
}

interface AuctionBid {
  id: string;
  bidderName: string;
  bidderCompany: string;
  bidAmount: number;
  submittedAt: string;
  isWinning?: boolean;
}

export const DisposalCenter: React.FC<DisposalCenterProps> = ({
  currentUser,
  onRefreshData,
  isReadOnlyMode = false,
}) => {
  const currentLang: AppLanguage = currentUser?.language || StorageService.getLanguage() || 'en';
  const isEn = currentLang === 'en';

  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'auctions' | 'archive'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [showNewDisposalModal, setShowNewDisposalModal] = useState(false);
  const [selectedAssetForAuction, setSelectedAssetForAuction] = useState<ApprovalRequest | null>(null);
  const [selectedRequestForCertificate, setSelectedRequestForCertificate] = useState<ApprovalRequest | null>(null);

  // Form state for New Disposal
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [disposalMethod, setDisposalMethod] = useState<'SCRAPPED' | 'SOLD' | 'DONATED' | 'LOST' | 'RECYCLED'>('SCRAPPED');
  const [disposalReason, setDisposalReason] = useState('Kerusakan fisik berat / masa ekonomis telah habis.');
  const [estimatedScrapValue, setEstimatedScrapValue] = useState<number>(0);
  const [recipientVendor, setRecipientVendor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auction State (Local demo bidding engine)
  const [bids, setBids] = useState<Record<string, AuctionBid[]>>({
    'dsp-demo-1': [
      { id: 'b1', bidderName: 'Hendra Gunawan', bidderCompany: 'PT Logam Daur Ulang Nusantara', bidAmount: 18500000, submittedAt: '2026-08-25 10:30', isWinning: true },
      { id: 'b2', bidderName: 'Surya Pratama', bidderCompany: 'CV Rongsok Elektronik Jaya', bidAmount: 16000000, submittedAt: '2026-08-25 09:15' },
    ],
  });
  const [newBidderName, setNewBidderName] = useState('');
  const [newBidderCompany, setNewBidderCompany] = useState('');
  const [newBidAmount, setNewBidAmount] = useState<number>(0);

  // Fetch live assets and approval records from StorageService
  const allAssets = StorageService.getAssets();
  const allApprovals = StorageService.getApprovals();
  const disposalRequests = allApprovals.filter((a) => a.type === 'DISPOSAL');

  // KPI Calculations
  const pendingRequests = disposalRequests.filter((r) => r.status === 'PENDING');
  const approvedRequests = disposalRequests.filter((r) => r.status === 'APPROVED');
  const auctionRequests = disposalRequests.filter((r) => r.details.disposalMethod === 'SOLD');

  const totalLiquidatedNBV = disposalRequests.reduce((sum, req) => {
    const targetAsset = allAssets.find((a) => a.id === req.assetId);
    return sum + (targetAsset?.currentBookValue || 0);
  }, 0);

  const totalSalvageRecovered = approvedRequests.reduce((sum, req) => {
    return sum + (req.details.saleAmount || req.details.estimatedCost || 0);
  }, 0);

  const salvageRecoveryRate = totalLiquidatedNBV > 0
    ? Math.round((totalSalvageRecovered / totalLiquidatedNBV) * 100)
    : 0;

  // Filtered requests for table view
  const filteredRequests = disposalRequests.filter((req) => {
    const matchesSearch =
      req.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.details.reason && req.details.reason.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMethod =
      methodFilter === 'ALL' || req.details.disposalMethod === methodFilter;

    const matchesStatus =
      statusFilter === 'ALL' || req.status === statusFilter;

    if (activeSubTab === 'queue') {
      return matchesSearch && matchesMethod && matchesStatus && req.status === 'PENDING';
    }
    if (activeSubTab === 'auctions') {
      return matchesSearch && matchesMethod && matchesStatus && req.details.disposalMethod === 'SOLD';
    }
    if (activeSubTab === 'archive') {
      return matchesSearch && matchesMethod && matchesStatus && req.status !== 'PENDING';
    }
    return matchesSearch && matchesMethod && matchesStatus;
  });

  // Action: Handle Submit New Disposal
  const handleCreateDisposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnlyMode) {
      alert('Sistem dalam mode Read-Only. Tindakan dinonaktifkan.');
      return;
    }
    if (!selectedAssetId) {
      alert('Silakan pilih unit aset yang akan dihapuskan.');
      return;
    }

    const targetAsset = allAssets.find((a) => a.id === selectedAssetId);
    if (!targetAsset) return;

    setIsSubmitting(true);
    const newRequestId = `dsp-${Date.now()}`;
    const autoApprove = StorageService.getSettingValue('asset.workflow.auto_approve_disposal', 'false') === 'true';

    const newRequest: ApprovalRequest = {
      id: newRequestId,
      type: 'DISPOSAL',
      assetId: targetAsset.id,
      assetCode: targetAsset.assetCode,
      assetName: targetAsset.name,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterRole: currentUser.role,
      status: autoApprove ? 'APPROVED' : 'PENDING',
      details: {
        reason: disposalReason,
        disposalMethod: disposalMethod,
        estimatedCost: estimatedScrapValue,
        saleAmount: disposalMethod === 'SOLD' ? estimatedScrapValue : 0,
        maintenanceVendor: recipientVendor,
        previousState: {
          status: targetAsset.status,
          condition: targetAsset.condition,
        },
        targetState: {
          status: 'DISPOSED',
          condition: 'DAMAGED',
        },
      },
      requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...(autoApprove
        ? {
            approverId: currentUser.id,
            approverName: currentUser.name,
            decidedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          }
        : {}),
    };

    // Update Asset Status if auto-approved
    if (autoApprove) {
      const updatedAssets = allAssets.map((a) => {
        if (a.id === targetAsset.id) {
          return {
            ...a,
            status: 'DISPOSED' as const,
            condition: 'DAMAGED' as const,
            notes: `${a.notes || ''} [DISPOSED: ${disposalMethod} pada ${new Date().toISOString().substring(0, 10)}]`,
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          };
        }
        return a;
      });
      StorageService.saveAssets(updatedAssets);
    }

    const updatedApprovals = [newRequest, ...allApprovals];
    StorageService.saveApprovals(updatedApprovals);

    logActivity(
      autoApprove ? 'ASSET_DISPOSED' : 'DISPOSAL_REQUESTED',
      'ASSET',
      `Pengajuan pelepasan aset ${targetAsset.assetCode} (${targetAsset.name}) metode: ${disposalMethod}`,
      targetAsset.id
    );

    StorageService.addNotification({
      title: 'Pengajuan Pelepasan Aset Baru',
      message: `${currentUser.name} mengajukan pelepasan ${targetAsset.assetCode} dengan metode ${disposalMethod}.`,
      type: 'WARNING',
    });

    setIsSubmitting(false);
    setShowNewDisposalModal(false);
    setSelectedAssetId('');
    setDisposalReason('Kerusakan fisik berat / masa ekonomis telah habis.');
    setEstimatedScrapValue(0);
    setRecipientVendor('');

    if (onRefreshData) onRefreshData();
  };

  // Action: Approve Disposal Request
  const handleApprove = (req: ApprovalRequest) => {
    if (isReadOnlyMode) {
      alert('Sistem dalam mode Read-Only.');
      return;
    }

    const updatedApprovals = allApprovals.map((a) => {
      if (a.id === req.id) {
        return {
          ...a,
          status: 'APPROVED' as const,
          approverId: currentUser.id,
          approverName: currentUser.name,
          decidedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          approverNotes: 'Disetujui berdasarkan verifikasi fisik dan regulasi PSAK 16.',
        };
      }
      return a;
    });
    StorageService.saveApprovals(updatedApprovals);

    // Update asset status to DISPOSED
    const updatedAssets = allAssets.map((asset) => {
      if (asset.id === req.assetId) {
        return {
          ...asset,
          status: 'DISPOSED' as const,
          condition: 'DAMAGED' as const,
          notes: `${asset.notes || ''} [DISPOSAL APPROVED: ${req.details.disposalMethod}]`,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        };
      }
      return asset;
    });
    logActivity(
      'APPROVAL_DECIDED',
      'APPROVAL',
      `Menyetujui penghapusan aset ${req.assetCode} (${req.assetName})`,
      req.assetId
    );

    if (onRefreshData) onRefreshData();
  };

  // Action: Reject Disposal Request
  const handleReject = (req: ApprovalRequest) => {
    if (isReadOnlyMode) {
      alert('Sistem dalam mode Read-Only.');
      return;
    }

    const reasonPrompt = prompt('Alasan penolakan pengajuan pelepasan aset:', 'Unit masih memiliki nilai fungsi / perbaikan dapat dilakukan');
    if (reasonPrompt === null) return;

    const updatedApprovals = allApprovals.map((a) => {
      if (a.id === req.id) {
        return {
          ...a,
          status: 'REJECTED' as const,
          approverId: currentUser.id,
          approverName: currentUser.name,
          decidedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          rejectionReason: reasonPrompt,
        };
      }
      return a;
    });
    StorageService.saveApprovals(updatedApprovals);

    logActivity(
      'APPROVAL_DECIDED',
      'APPROVAL',
      `Menolak penghapusan aset ${req.assetCode}. Alasan: ${reasonPrompt}`,
      req.assetId
    );

    if (onRefreshData) onRefreshData();
  };

  // Action: Add Bid to Auction
  const handleAddBid = (requestId: string) => {
    if (!newBidderName || !newBidAmount) {
      alert('Lengkapi nama penawar dan nominal penawaran lelang.');
      return;
    }

    const newBid: AuctionBid = {
      id: `bid-${Date.now()}`,
      bidderName: newBidderName,
      bidderCompany: newBidderCompany || 'Individu / Rekanan Mandiri',
      bidAmount: newBidAmount,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isWinning: false,
    };

    const currentBids = bids[requestId] || [];
    const updated = [newBid, ...currentBids].sort((a, b) => b.bidAmount - a.bidAmount);
    // Mark highest as winning
    const finalized = updated.map((b, idx) => ({ ...b, isWinning: idx === 0 }));

    setBids({ ...bids, [requestId]: finalized });
    setNewBidderName('');
    setNewBidderCompany('');
    setNewBidAmount(0);

    logActivity(
      'ASSET_UPDATED',
      'ASSET',
      `Mencatat penawaran lelang ${formatRupiah(newBidAmount)} oleh ${newBidderName} untuk pengajuan ${requestId}`,
      requestId
    );
  };

  const getMethodBadgeClass = (method?: string) => {
    switch (method) {
      case 'SOLD':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'SCRAPPED':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'DONATED':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'RECYCLED':
        return 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'LOST':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-7 animate-fadeIn">
      {/* â•â•â• 1. Spatial Header Banner â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="glass-panel squircle p-6 sm:p-8 relative overflow-hidden transition-all">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-200/20 dark:bg-emerald-950/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-200/20 dark:bg-amber-950/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#181F19]/5 dark:bg-white/10 text-[#181F19] dark:text-stone-200 border border-[#181F19]/10 dark:border-white/10">
                Pusat Pelepasan & Likuidasi Aset
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                ISO 27001 Certified â€¢ PSAK 16 De-recognition
              </span>
            </div>
            <h1 className="font-serif-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181F19] dark:text-stone-100">
              Pusat Pelepasan, Lelang & Penghapusan Aset
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              Tata kelola de-recognisi aset fisik, validasi berita acara penghapusan (BAP), bilik tender lelang terbuka, dan pemulihan nilai ekonomis sisa (*scrap recovery*).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <button
              onClick={() => setShowNewDisposalModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#181F19] hover:bg-[#2D342E] dark:bg-stone-100 dark:hover:bg-white text-white dark:text-[#181F19] text-xs font-semibold rounded-2xl shadow-lg shadow-black/10 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Ajukan Pelepasan / Lelang Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* â•â•â• 2. Bento Telemetry KPI Grid (4 Cards) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Unit Dalam Antrean Pelepasan */}
        <div className="glass-panel squircle p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              {pendingRequests.length} Menunggu Tindakan
            </span>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Antrean Pelepasan Aset
            </div>
            <div className="text-2xl font-bold font-serif-display text-stone-900 dark:text-stone-100 mt-1">
              {pendingRequests.length} <span className="text-xs font-normal font-sans text-stone-500">Unit</span>
            </div>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 border-t border-stone-200/60 dark:border-stone-800/60 pt-2.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Memerlukan inspeksi fisik & otorisasi</span>
          </div>
        </div>

        {/* KPI 2: Nilai Buku Bersih (NBV) Terlikuidasi */}
        <div className="glass-panel squircle p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              PSAK 16
            </span>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Nilai Buku Bersih (NBV)
            </div>
            <div className="text-xl font-bold font-serif-display text-stone-900 dark:text-stone-100 mt-1 truncate">
              {formatRupiah(totalLiquidatedNBV)}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 border-t border-stone-200/60 dark:border-stone-800/60 pt-2.5">
            <Scale className="w-3.5 h-3.5 text-blue-500" />
            <span>Akumulasi saldo aset de-recognisi</span>
          </div>
        </div>

        {/* KPI 3: Realisasi Pemulihan Dana (Salvage / Auction) */}
        <div className="glass-panel squircle p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              {salvageRecoveryRate}% Recovery
            </span>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Pemulihan Dana Sisa
            </div>
            <div className="text-xl font-bold font-serif-display text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              {formatRupiah(totalSalvageRecovered)}
            </div>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 border-t border-stone-200/60 dark:border-stone-800/60 pt-2.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Realisasi tender lelang & scrap sale</span>
          </div>
        </div>

        {/* KPI 4: Berita Acara & Sertifikat Selesai */}
        <div className="glass-panel squircle p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-400/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              Terverifikasi
            </span>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Berita Acara Sah (BAP)
            </div>
            <div className="text-2xl font-bold font-serif-display text-stone-900 dark:text-stone-100 mt-1">
              {approvedRequests.length} <span className="text-xs font-normal font-sans text-stone-500">Dokumen</span>
            </div>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 border-t border-stone-200/60 dark:border-stone-800/60 pt-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
            <span>Sertifikat penghapusan terarsip</span>
          </div>
        </div>
      </div>

      {/* â•â•â• 3. Sub-Navigation Tabs (Organic Capsule Tabs) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="glass-panel squircle p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'queue'
                ? 'bg-[#181F19] text-white dark:bg-stone-100 dark:text-[#181F19] shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Antrean Validasi & Inspeksi Fisik</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('auctions')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'auctions'
                ? 'bg-[#181F19] text-white dark:bg-stone-100 dark:text-[#181F19] shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60'
            }`}
          >
            <Gavel className="w-3.5 h-3.5" />
            <span>Bilik Lelang & Tender Pihak Ketiga</span>
            {auctionRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                {auctionRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('archive')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'archive'
                ? 'bg-[#181F19] text-white dark:bg-stone-100 dark:text-[#181F19] shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Buku Besar Berita Acara & Sertifikat</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Cari aset, BAP, pemohon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white/70 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700/80 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-white/70 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700/80 text-stone-800 dark:text-stone-200 focus:outline-hidden"
          >
            <option value="ALL">Semua Metode</option>
            <option value="SCRAPPED">Pemusnahan (Scrap)</option>
            <option value="SOLD">Lelang / Dijual</option>
            <option value="DONATED">Donasi Sosial</option>
            <option value="RECYCLED">Daur Ulang (E-Waste)</option>
            <option value="LOST">Hilang / Force Majeure</option>
          </select>
        </div>
      </div>

      {/* â•â•â• 4. High-Density Asset Disposal Table â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="glass-panel squircle overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#7D562D] dark:text-amber-400" />
            <h2 className="font-serif-display text-base font-bold text-stone-900 dark:text-stone-100">
              {activeSubTab === 'queue' && 'Daftar Pengajuan Menunggu Inspeksi & Otorisasi'}
              {activeSubTab === 'auctions' && 'Daftar Unit dalam Bilik Tender & Lelang Terbuka'}
              {activeSubTab === 'archive' && 'Arsip Berita Acara Penghapusan (BAP) Resmi'}
            </h2>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            {filteredRequests.length} data ditemukan
          </span>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Trash2 className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
            <div className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              Tidak ada data pelepasan aset pada kriteria ini.
            </div>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Semua permohonan telah selesai diproses atau belum ada pengajuan baru yang dibuat.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/60 dark:bg-stone-800/40 text-stone-600 dark:text-stone-300 border-b border-stone-200/60 dark:border-stone-700/60 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Identitas Aset & Kode BAP</th>
                  <th className="py-3 px-4">Metode & Alasan Pelepasan</th>
                  <th className="py-3 px-4">Nilai Buku vs Scrap</th>
                  <th className="py-3 px-4">Pemohon & Tanggal</th>
                  <th className="py-3 px-4">Status Otorisasi</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800/60 text-stone-800 dark:text-stone-200">
                {filteredRequests.map((req) => {
                  const targetAsset = allAssets.find((a) => a.id === req.assetId);
                  const isAuction = req.details.disposalMethod === 'SOLD';
                  const reqBids = bids[req.id] || [];
                  const highestBid = reqBids.length > 0 ? reqBids[0].bidAmount : 0;

                  return (
                    <tr key={req.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/30 transition-colors">
                      {/* Asset & Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#181F19]/5 dark:bg-white/5 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0 font-mono text-[10px] font-bold">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                              <span>{req.assetName}</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                                {req.assetCode}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-500 mt-0.5">
                              ID Dokumen: <span className="font-mono">{req.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Method & Reason */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getMethodBadgeClass(req.details.disposalMethod)}`}>
                            {req.details.disposalMethod === 'SOLD' && 'Lelang / Dijual'}
                            {req.details.disposalMethod === 'SCRAPPED' && 'Pemusnahan (Scrap)'}
                            {req.details.disposalMethod === 'DONATED' && 'Donasi Sosial'}
                            {req.details.disposalMethod === 'RECYCLED' && 'Daur Ulang E-Waste'}
                            {req.details.disposalMethod === 'LOST' && 'Hilang / Force Majeure'}
                          </span>
                          <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-1 max-w-xs">
                            {req.details.reason}
                          </p>
                        </div>
                      </td>

                      {/* Financials: NBV vs Scrap */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="text-stone-900 dark:text-stone-100 font-semibold">
                            NBV: {formatRupiah(targetAsset?.currentBookValue || 0)}
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {isAuction
                              ? `Tawaran: ${formatRupiah(highestBid || req.details.estimatedCost || 0)}`
                              : `Est. Scrap: ${formatRupiah(req.details.estimatedCost || 0)}`}
                          </div>
                        </div>
                      </td>

                      {/* Requester & Date */}
                      <td className="py-3.5 px-4">
                        <div className="text-stone-900 dark:text-stone-100 font-medium">
                          {req.requesterName}
                        </div>
                        <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{req.requestedAt}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {req.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3 animate-spin" />
                            Menunggu Otorisasi
                          </span>
                        )}
                        {req.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Disetujui & Dihapus
                          </span>
                        )}
                        {req.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3 h-3" />
                            Ditolak
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Auction Bidding Button */}
                          {isAuction && (
                            <button
                              onClick={() => setSelectedAssetForAuction(req)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Bilik Tender & Penawaran Lelang"
                            >
                              <Gavel className="w-3.5 h-3.5" />
                              <span>Bilik Lelang</span>
                            </button>
                          )}

                          {/* View Certificate (BAP) Button */}
                          <button
                            onClick={() => setSelectedRequestForCertificate(req)}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                            title="Tinjau Berita Acara Resmi (BAP)"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Approve / Reject buttons for PENDING */}
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(req)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-all cursor-pointer shadow-xs"
                                title="Setujui Penghapusan Aset"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleReject(req)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition-all cursor-pointer shadow-xs"
                                title="Tolak Pengajuan"
                              >
                                Tolak
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
        )}
      </div>

      {/* â•â•â• MODAL 1: Ajukan Pelepasan / Lelang Baru â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {showNewDisposalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-serif-display text-lg font-bold text-stone-900 dark:text-stone-100">
                  Ajukan Pelepasan & De-recognisi Aset
                </h3>
              </div>
              <button
                onClick={() => setShowNewDisposalModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDisposal} className="space-y-4 text-xs">
              {/* Select Asset */}
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 dark:text-stone-300">
                  Pilih Unit Aset Fisik <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">-- Pilih Aset yang Akan Dihapuskan --</option>
                  {allAssets
                    .filter((a) => a.status !== 'DISPOSED')
                    .map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.assetCode} - {asset.name} (NBV: {formatRupiah(asset.currentBookValue)})
                      </option>
                    ))}
                </select>
              </div>

              {/* Disposal Method */}
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 dark:text-stone-300">
                  Metode Pelepasan / Likuidasi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={disposalMethod}
                  onChange={(e) => setDisposalMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="SCRAPPED">Pemusnahan Fisik (Scrap / Dihancurkan)</option>
                  <option value="SOLD">Lelang Terbuka / Dijual ke Pihak Ketiga</option>
                  <option value="RECYCLED">Daur Ulang Bersertifikat (E-Waste Green Disposal)</option>
                  <option value="DONATED">Donasi Sosial / Hibah Lembaga</option>
                  <option value="LOST">Hilang / Kehilangan Fisik (Force Majeure)</option>
                </select>
              </div>

              {/* Estimated Scrap / Auction Reserve Value */}
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 dark:text-stone-300">
                  {disposalMethod === 'SOLD' ? 'Nilai Dasar / Reservasi Lelang (Rp)' : 'Estimasi Nilai Sisa Scrap (Rp)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={estimatedScrapValue}
                  onChange={(e) => setEstimatedScrapValue(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Recipient / Vendor */}
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 dark:text-stone-300">
                  Pihak Penerima / Vendor Pengolah Limbah / Pembeli
                </label>
                <input
                  type="text"
                  value={recipientVendor}
                  onChange={(e) => setRecipientVendor(e.target.value)}
                  placeholder="Contoh: PT Daur Ulang Mandiri / Yayasan Peduli"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 dark:text-stone-300">
                  Alasan Forensik Pelepasan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={disposalReason}
                  onChange={(e) => setDisposalReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowNewDisposalModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold cursor-pointer hover:bg-stone-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] font-bold cursor-pointer hover:scale-105 transition-all shadow-md"
                >
                  Kirim Pengajuan BAP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* â•â•â• MODAL 2: Bilik Tender Lelang Terbuka â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {selectedAssetForAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-serif-display text-lg font-bold text-stone-900 dark:text-stone-100">
                  Bilik Tender Lelang: {selectedAssetForAuction.assetCode}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAssetForAuction(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Asset Info Card */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    {selectedAssetForAuction.assetName}
                  </div>
                  <div className="text-stone-500 text-[11px] mt-0.5">
                    Dasar Reservasi: {formatRupiah(selectedAssetForAuction.details.estimatedCost || 0)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Lelang Aktif
                  </span>
                </div>
              </div>

              {/* Log Penawaran */}
              <div className="space-y-2">
                <div className="font-bold uppercase tracking-wider text-[10px] text-stone-500">
                  Papan Riwayat Penawaran (Bidding Log)
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(bids[selectedAssetForAuction.id] || []).length === 0 ? (
                    <div className="p-4 text-center text-stone-400 bg-stone-50 dark:bg-stone-800/30 rounded-xl">
                      Belum ada penawaran lelang yang dicatat.
                    </div>
                  ) : (
                    (bids[selectedAssetForAuction.id] || []).map((bid) => (
                      <div
                        key={bid.id}
                        className={`p-3 rounded-xl flex items-center justify-between border ${
                          bid.isWinning
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                            : 'bg-stone-50/50 dark:bg-stone-800/30 border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                            <span>{bid.bidderName}</span>
                            {bid.isWinning && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white">
                                Tertinggi
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-500">
                            {bid.bidderCompany} â€¢ {bid.submittedAt}
                          </div>
                        </div>
                        <div className="text-right font-bold text-sm font-serif-display text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(bid.bidAmount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Form Input Penawaran Baru */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                <div className="font-bold text-stone-800 dark:text-stone-200">
                  Tambah Penawaran Rekanan Baru
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nama Rekanan / Penawar"
                    value={newBidderName}
                    onChange={(e) => setNewBidderName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                  <input
                    type="text"
                    placeholder="Instansi / Perusahaan"
                    value={newBidderCompany}
                    onChange={(e) => setNewBidderCompany(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Nominal Penawaran (Rp)"
                    value={newBidAmount || ''}
                    onChange={(e) => setNewBidAmount(Number(e.target.value))}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddBid(selectedAssetForAuction.id)}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                  >
                    Kirim Tawaran
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â•â•â• MODAL 3: Berita Acara Penghapusan (BAP) Sah â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {selectedRequestForCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-6 animate-scaleUp max-h-[90vh] overflow-y-auto">
            {/* Header Sertifikat */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#181F19] text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-stone-900 dark:text-stone-100">
                    Berita Acara Penghapusan Aset (BAP)
                  </h3>
                  <div className="text-[11px] text-stone-500 font-mono">
                    Nomor Dokumen: BAP/{new Date().getFullYear()}/{selectedRequestForCertificate.id.toUpperCase()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequestForCertificate(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Badan Dokumen Berita Acara */}
            <div className="space-y-4 text-xs leading-relaxed text-stone-700 dark:text-stone-300">
              <p>
                Pada hari ini, tanggal <span className="font-bold text-stone-900 dark:text-stone-100">{selectedRequestForCertificate.decidedAt || selectedRequestForCertificate.requestedAt}</span>, bertempat di Kantor Manajemen Aset Enterprise, telah dilakukan verifikasi dan pemeriksaan fisik terhadap aset berikut:
              </p>

              {/* Detail Tabel Aset */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Kode & Nama Aset</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{selectedRequestForCertificate.assetCode} - {selectedRequestForCertificate.assetName}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Metode Pelepasan</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{selectedRequestForCertificate.details.disposalMethod}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Nilai Pemulihan (Scrap/Lelang)</span>
                    <span className="font-bold text-emerald-600">{formatRupiah(selectedRequestForCertificate.details.saleAmount || selectedRequestForCertificate.details.estimatedCost || 0)}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Status Otorisasi</span>
                    <span className="font-bold text-purple-600">{selectedRequestForCertificate.status}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Alasan Pelepasan</span>
                  <span>{selectedRequestForCertificate.details.reason}</span>
                </div>
              </div>

              {/* Matriks Tanda Tangan Multi-Level */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-200 dark:border-stone-800 text-center">
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
                  <div className="text-[10px] text-stone-400 font-bold uppercase">Pemohon / Tim Teknis</div>
                  <div className="my-3 font-mono text-[10px] text-emerald-600 font-bold">[TERVERIFIKASI]</div>
                  <div className="font-bold text-stone-900 dark:text-stone-100">{selectedRequestForCertificate.requesterName}</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
                  <div className="text-[10px] text-stone-400 font-bold uppercase">Tim Audit Internal</div>
                  <div className="my-3 font-mono text-[10px] text-emerald-600 font-bold">[ISO 27001 PASSED]</div>
                  <div className="font-bold text-stone-900 dark:text-stone-100">Tim Kepatuhan</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
                  <div className="text-[10px] text-stone-400 font-bold uppercase">Otoritas Finansial / Direksi</div>
                  <div className="my-3 font-mono text-[10px] text-emerald-600 font-bold">[DISETUJUI]</div>
                  <div className="font-bold text-stone-900 dark:text-stone-100">{selectedRequestForCertificate.approverName || 'Direksi Operasional'}</div>
                </div>
              </div>
            </div>

            {/* Tombol Cetak / Unduh */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-xs hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Dokumen BAP</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRequestForCertificate(null)}
                className="px-4 py-2 rounded-xl bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};