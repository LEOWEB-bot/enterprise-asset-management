import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  ArrowLeftRight,
  Trash2,
  Wrench,
  Search,
  XCircle,
  ChevronRight,
  User as UserIcon,
  MapPin,
  FileText,
  ShieldCheck,
  RefreshCw,
  Building2,
  AlertTriangle,
  History,
  Check,
  Ban,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { ApprovalRequest, User as UserType } from '../../types';
import { StorageService } from '../../services/storageService';
import { logActivity } from '../../services/activityLogger';
import { hasPermission } from '../../services/authService';
import { formatRupiah } from '../../services/depreciationService';
import { NotificationService } from '../../services/notificationService';
import { getI18n, AppLanguage } from '../../utils/i18n';

interface ApprovalCenterProps {
  currentUser: UserType;
  onRefresh: () => void;
  isReadOnlyMode: boolean;
}

export const ApprovalCenter: React.FC<ApprovalCenterProps> = ({
  currentUser,
  onRefresh,
  isReadOnlyMode,
}) => {
  const currentLang: AppLanguage = currentUser?.language || StorageService.getLanguage() || 'en';
  const t = getI18n(currentLang);
  const isEn = currentLang === 'en';

  const [approvals, setApprovals] = useState<ApprovalRequest[]>(StorageService.getApprovals());
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'QUEUE' | 'LOGS'>('QUEUE');

  const [rejectionModalAppr, setRejectionModalAppr] = useState<ApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const canApprove =
    (hasPermission(currentUser, 'approvals.process') || hasPermission(currentUser, 'approvals.manage')) &&
    !isReadOnlyMode;

  // KPI Analytics
  const stats = useMemo(() => {
    const totalRequests = approvals.length;
    const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;
    const approvedCount = approvals.filter((a) => a.status === 'APPROVED').length;
    const rejectedCount = approvals.filter((a) => a.status === 'REJECTED').length;
    const decisionRate = totalRequests > 0 ? (((approvedCount + rejectedCount) / totalRequests) * 100).toFixed(1) : '98.4';

    return { totalRequests, pendingCount, approvedCount, rejectedCount, decisionRate };
  }, [approvals]);

  const filteredApprovals = useMemo(() => {
    return approvals.filter((appr) => {
      if (activeSubTab === 'QUEUE') {
        if (appr.status !== 'PENDING') return false;
      } else {
        if (appr.status === 'PENDING') return false;
        if (filterStatus !== 'ALL' && filterStatus !== 'PENDING' && appr.status !== filterStatus) return false;
      }

      if (filterType !== 'ALL' && appr.type !== filterType) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchAsset = (appr.assetName || '').toLowerCase().includes(q);
        const matchCode = (appr.assetCode || '').toLowerCase().includes(q);
        const matchReq = (appr.requesterName || '').toLowerCase().includes(q);
        const matchReason = (appr.details?.reason || '').toLowerCase().includes(q);
        return matchAsset || matchCode || matchReq || matchReason;
      }
      return true;
    });
  }, [approvals, activeSubTab, filterStatus, filterType, searchTerm]);

  const handleApprove = (appr: ApprovalRequest) => {
    if (!canApprove) {
      alert(isEn ? 'You do not have permission to process approvals.' : 'Anda tidak memiliki izin memproses persetujuan (Role tidak memadai).');
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Process according to type
    if (appr.type === 'MOVEMENT' && appr.details.targetState) {
      const assets = StorageService.getAssets();
      const updated = assets.map((a) => {
        if (a.id === appr.assetId) {
          return {
            ...a,
            locationId: appr.details.targetState!.locationId || a.locationId,
            locationName: appr.details.targetState!.locationName || a.locationName,
            department: appr.details.targetState!.department || a.department,
            picName: appr.details.targetState!.picName || a.picName,
            updatedAt: now,
          };
        }
        return a;
      });
      StorageService.saveAssets(updated);

      // Update movement record
      const movements = StorageService.getMovements();
      const updatedMovs = movements.map((m) => {
        if (m.approvalRequestId === appr.id || m.assetId === appr.assetId) {
          return { ...m, status: 'COMPLETED' as const };
        }
        return m;
      });
      StorageService.saveMovements(updatedMovs);
    }

    if (appr.type === 'DISPOSAL') {
      const assets = StorageService.getAssets();
      const updated = assets.map((a) => {
        if (a.id === appr.assetId) {
          return {
            ...a,
            status: 'DISPOSED' as const,
            currentBookValue: 0,
            updatedAt: now,
          };
        }
        return a;
      });
      StorageService.saveAssets(updated);

      // Update disposal record
      const disposals = StorageService.getDisposals();
      const updatedDisposals = disposals.map((d) => {
        if (d.assetId === appr.assetId) {
          return { ...d, approvedBy: currentUser.name };
        }
        return d;
      });
      StorageService.saveDisposals(updatedDisposals);
    }

    // 2. Update approval request status
    const updatedApprovals = approvals.map((item) => {
      if (item.id === appr.id) {
        return {
          ...item,
          status: 'APPROVED' as const,
          approverId: currentUser.id,
          approverName: currentUser.name,
          approvedAt: now,
        };
      }
      return item;
    });

    setApprovals(updatedApprovals);
    StorageService.saveApprovals(updatedApprovals);

    logActivity(
      'APPROVAL_ACCEPTED',
      'APPROVAL',
      `Menyetujui permohonan ${appr.type} untuk aset ${appr.assetCode} (${appr.assetName})`,
      appr.id
    );

    NotificationService.dispatchNotification(
      'approval.approved',
      {
        approvalId: appr.id,
        type: appr.type,
        assetCode: appr.assetCode,
        assetName: appr.assetName,
        requester: appr.requesterName,
        approver: currentUser.name,
      },
      `Persetujuan Diterima: ${appr.assetCode}`,
      `Permohonan ${appr.type} untuk aset ${appr.assetName} telah disetujui oleh ${currentUser.name}.`
    );

    onRefresh();
  };

  const handleReject = () => {
    if (!rejectionModalAppr) return;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const updatedApprovals = approvals.map((item) => {
      if (item.id === rejectionModalAppr.id) {
        return {
          ...item,
          status: 'REJECTED' as const,
          approverId: currentUser.id,
          approverName: currentUser.name,
          approvedAt: now,
          rejectionReason: rejectionReason || (isEn ? 'Does not meet operational criteria.' : 'Tidak memenuhi syarat kelayakan operasional.'),
        };
      }
      return item;
    });

    setApprovals(updatedApprovals);
    StorageService.saveApprovals(updatedApprovals);

    logActivity(
      'APPROVAL_REJECTED',
      'APPROVAL',
      `Menolak permohonan ${rejectionModalAppr.type} aset ${rejectionModalAppr.assetCode} (Alasan: ${rejectionReason})`,
      rejectionModalAppr.id
    );

    NotificationService.dispatchNotification(
      'approval.rejected',
      {
        approvalId: rejectionModalAppr.id,
        type: rejectionModalAppr.type,
        assetCode: rejectionModalAppr.assetCode,
        assetName: rejectionModalAppr.assetName,
        requester: rejectionModalAppr.requesterName,
        rejectedBy: currentUser.name,
        reason: rejectionReason || (isEn ? 'Does not meet operational criteria.' : 'Tidak memenuhi syarat kelayakan operasional.'),
      },
      `Permohonan Ditolak: ${rejectionModalAppr.assetCode}`,
      `Permohonan ${rejectionModalAppr.type} untuk aset ${rejectionModalAppr.assetName} telah ditolak oleh ${currentUser.name}. Alasan: ${rejectionReason}`
    );

    setRejectionModalAppr(null);
    setRejectionReason('');
    onRefresh();
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'MOVEMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 border border-[#5E7A68]/30">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{isEn ? 'RELOCATION' : 'MUTASI ASET'}</span>
          </span>
        );
      case 'DISPOSAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isEn ? 'DISPOSAL' : 'PENGHAPUSAN ASET'}</span>
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#7D562D]/15 text-[#7D562D] dark:text-amber-300 border border-[#7D562D]/30">
            <Wrench className="w-3.5 h-3.5" />
            <span>{isEn ? 'WORK ORDER' : 'TIKET SERVIS'}</span>
          </span>
        );
      default:
        return <span className="text-xs font-bold text-stone-500">{type}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* 1. Spatial Control & Command Header */}
      <div className="glass-panel squircle p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs uppercase tracking-widest text-[#7D562D] dark:text-amber-400 font-bold px-3 py-1 rounded-full bg-[#7D562D]/10 dark:bg-amber-950/40 border border-[#7D562D]/20">
              {isEn ? 'Governance & Sign-off' : 'Tata Kelola & Otorisasi'}
            </span>
            <div className="px-3.5 py-1 rounded-full bg-white/70 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7D562D] animate-pulse" />
              <span>{stats.pendingCount} {isEn ? 'Pending Requests' : 'Permohonan Menunggu'} • {stats.decisionRate}% {isEn ? 'Decision SLA' : 'SLA Keputusan'}</span>
            </div>
          </div>

          <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
            {isEn ? 'Enterprise Approval & Governance Center' : 'Pusat Persetujuan & Tata Kelola Otorisasi'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            {isEn
              ? 'Multi-tiered authorization pipeline for asset relocations, write-off disposals, maintenance order cancellations, and custodial sign-offs.'
              : 'Pipa otorisasi berjenjang untuk pemindahan fisik aset, pelepasan penghapusan (disposal), pembatalan perintah kerja servis, dan serah terima penanggung jawab.'}
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
        </div>
      </div>

      {/* 2. 4 Squircle Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Pending Approvals */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Pending Approvals' : 'Menunggu Tindakan'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#D4A373]/20 text-[#7D562D] dark:text-amber-300 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#7D562D] dark:text-amber-300">{stats.pendingCount}</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Awaiting sign-off decision' : 'Menunggu keputusan atasan'}
            </span>
          </div>
        </div>

        {/* Card 2: Average Decision Time */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Average Decision Time' : 'Rata-rata Waktu Otorisasi'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#181F19] dark:text-stone-100">1.8 {isEn ? 'Hours' : 'Jam'}</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Rapid compliance turn-around' : 'Waktu respons peninjauan'}
            </span>
          </div>
        </div>

        {/* Card 3: Dual-Signoff Compliance */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Governance Compliance' : 'Kepatuhan Rantai Otorisasi'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#5E7A68] dark:text-emerald-400">100.0%</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Fully audited chain of custody' : 'Audit trail lengkap & tertib'}
            </span>
          </div>
        </div>

        {/* Card 4: Total Approved Volume */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Approved Volume YTD' : 'Volume Disetujui (YTD)'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#181F19] dark:text-stone-100">{stats.approvedCount}</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Transactions authorized' : 'Transaksi disetujui resmi'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Switcher & Filter Bar */}
      <div className="glass-panel squircle p-3 sm:p-4 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="flex items-center p-1 rounded-2xl bg-stone-200/60 dark:bg-stone-800/60 border border-stone-300/50 dark:border-stone-700/50">
          <button
            onClick={() => setActiveSubTab('QUEUE')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'QUEUE'
                ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Clock className="w-4 h-4 text-[#7D562D]" />
            <span>{isEn ? 'Active Sign-off Queue' : 'Antrean Otorisasi Aktif'}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#7D562D]/15 text-[#7D562D] dark:text-amber-400 text-[10px] font-mono font-bold">
              {stats.pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('LOGS')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'LOGS'
                ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <History className="w-4 h-4 text-[#5E7A68]" />
            <span>{isEn ? 'Sign-off Audit Logs' : 'Jejak Audit & Riwayat Otorisasi'}</span>
            <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-mono font-bold">
              {stats.approvedCount + stats.rejectedCount}
            </span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              placeholder={isEn ? 'Search asset, code, requester...' : 'Cari kode aset, nama, pengaju...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#7D562D] outline-hidden shadow-2xs"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {activeSubTab === 'LOGS' && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-hidden"
            >
              <option value="ALL">{isEn ? 'All Status' : 'Semua Status Riwayat'}</option>
              <option value="APPROVED">{isEn ? 'Approved' : 'Disetujui'}</option>
              <option value="REJECTED">{isEn ? 'Rejected' : 'Ditolak'}</option>
            </select>
          )}

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-hidden"
          >
            <option value="ALL">{isEn ? 'All Types' : 'Semua Tipe Permohonan'}</option>
            <option value="MOVEMENT">{isEn ? 'Movement' : 'Mutasi Aset'}</option>
            <option value="DISPOSAL">{isEn ? 'Disposal' : 'Penghapusan Aset'}</option>
            <option value="MAINTENANCE">{isEn ? 'Maintenance' : 'Tiket Servis'}</option>
          </select>
        </div>
      </div>

      {/* 4. Tactile Approval Action Cards Grid */}
      {filteredApprovals.length === 0 ? (
        <div className="glass-panel squircle p-16 text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-[#5E7A68]/15 text-[#5E7A68] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-serif-display text-base font-bold text-[#181F19] dark:text-stone-100">
            {isEn ? 'No Pending Approvals in Queue' : 'Semua Permohonan Telah Diproses'}
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            {isEn ? 'All operational change requests have been audited and signed off.' : 'Tidak ada permohonan yang tertunda dalam antrean saat ini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredApprovals.map((appr) => {
            const isPending = appr.status === 'PENDING';

            return (
              <div
                key={appr.id}
                className="glass-panel squircle p-6 sm:p-8 space-y-6 relative overflow-hidden group hover:scale-[1.005] transition-all"
              >
                {/* Top Row: Type Badge, Asset Code, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 dark:border-stone-800 pb-4">
                  <div className="flex items-center gap-3">
                    {getTypeBadge(appr.type)}
                    <span className="font-mono text-xs font-bold text-[#7D562D] dark:text-amber-400 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">
                      {appr.assetCode}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-center border ${
                      appr.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 animate-pulse'
                        : appr.status === 'APPROVED'
                        ? 'bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 border-[#5E7A68]/30'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200'
                    }`}
                  >
                    {appr.status}
                  </span>
                </div>

                {/* Main Content: Asset Title & Diff Box */}
                <div className="space-y-4">
                  <h2 className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100">
                    {appr.assetName}
                  </h2>

                  {/* Diff Visualization Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-3">
                    {/* Movement Diff */}
                    {appr.type === 'MOVEMENT' && appr.details.targetState && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3 rounded-xl bg-stone-100/70 dark:bg-stone-800/50 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-stone-400 block">
                            {isEn ? 'Current State (Origin):' : 'Kondisi Asal (Sebelum):'}
                          </span>
                          <p className="font-bold text-stone-800 dark:text-stone-200">
                            {appr.details.previousState?.locationName || 'Kantor Pusat'} ({appr.details.previousState?.department || 'General'})
                          </p>
                          <p className="text-[11px] text-stone-500">
                            PIC: {appr.details.previousState?.picName || '-'}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-[#5E7A68]/10 dark:bg-emerald-950/30 border border-[#5E7A68]/20 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-[#5E7A68] dark:text-emerald-400 block">
                            {isEn ? 'Target State (Destination):' : 'Kondisi Baru (Tujuan Mutasi):'}
                          </span>
                          <p className="font-bold text-[#181F19] dark:text-stone-100">
                            {appr.details.targetState?.locationName} ({appr.details.targetState?.department})
                          </p>
                          <p className="text-[11px] text-[#5E7A68] dark:text-emerald-400 font-bold">
                            PIC: {appr.details.targetState?.picName}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Disposal Details */}
                    {appr.type === 'DISPOSAL' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase text-stone-400 block">
                            {isEn ? 'Disposal Method & Reason:' : 'Metode & Alasan Pelepasan:'}
                          </span>
                          <p className="font-bold text-rose-600">
                            {appr.details.disposalMethod || 'SCRAP / WRITE-OFF'}
                          </p>
                        </div>

                        {appr.details.saleAmount !== undefined && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase text-stone-400 block">
                              {isEn ? 'Estimated Scrap / Sale Recovery:' : 'Estimasi Nilai Residu / Penjualan:'}
                            </span>
                            <p className="font-bold text-stone-900 dark:text-stone-100 font-mono">
                              {formatRupiah(appr.details.saleAmount)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reason Notes */}
                    <div className="pt-1 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      <strong>{isEn ? 'Submission Notes / Reason:' : 'Uraian Catatan Pengajuan:'}</strong>{' '}
                      {appr.details.reason}
                    </div>
                  </div>
                </div>

                {/* Footer: Requester info & Decision CTAs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-stone-200/60 dark:border-stone-800 text-xs">
                  <div className="space-y-0.5 text-stone-500">
                    <div>
                      {isEn ? 'Requested by:' : 'Diajukan oleh:'}{' '}
                      <strong className="text-stone-900 dark:text-stone-100">{appr.requesterName}</strong> ({appr.requesterRole}) • {appr.requestedAt}
                    </div>
                    {appr.approverName && (
                      <div className="text-[#5E7A68] dark:text-emerald-400 font-semibold">
                        {isEn ? 'Authorized by:' : 'Diverifikasi oleh:'}{' '}
                        <strong>{appr.approverName}</strong> • {appr.approvedAt}
                      </div>
                    )}
                    {appr.rejectionReason && (
                      <div className="text-rose-600 font-semibold">
                        {isEn ? 'Rejection Reason:' : 'Alasan Penolakan:'}{' '}
                        <strong>{appr.rejectionReason}</strong>
                      </div>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => setRejectionModalAppr(appr)}
                        disabled={!canApprove}
                        className="px-5 py-2.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        {isEn ? 'Reject' : 'Tolak'}
                      </button>

                      <button
                        onClick={() => handleApprove(appr)}
                        disabled={!canApprove}
                        className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#5E7A68]/20 transition-all cursor-pointer hover:scale-105 disabled:opacity-40"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isEn ? 'Authorize & Approve' : 'Setujui Sekarang'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModalAppr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
          <div className="spatial-canvas w-full max-w-md p-8 rounded-[36px] border border-white/60 dark:border-stone-700/60 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-2xl">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif-display text-base font-bold text-stone-900 dark:text-stone-100">
                  {isEn ? 'Confirm Request Rejection' : 'Konfirmasi Penolakan Pengajuan'}
                </h3>
                <p className="text-xs text-stone-500">{rejectionModalAppr.assetCode} - {rejectionModalAppr.assetName}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                {isEn ? 'Mandatory Rejection Reason *' : 'Alasan Penolakan Wajib *'}
              </label>
              <textarea
                rows={3}
                required
                placeholder={isEn ? 'e.g. Incomplete BAST handover document / Relocation not aligned with budget...' : 'Tuliskan alasan penolakan untuk pengaju...'}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 outline-hidden resize-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-200/80 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setRejectionModalAppr(null)}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 cursor-pointer"
              >
                {isEn ? 'Reject Request' : 'Tolak Pengajuan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
