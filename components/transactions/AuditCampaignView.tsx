import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Plus,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Search,
  Building2,
  Check,
  Clock,
  Sparkles,
  ShieldCheck,
  Layers,
  History,
  RefreshCw,
  MapPin,
  User as UserIcon,
  Tag,
  FileText,
  Printer,
  ChevronRight,
  Sliders,
  Camera,
} from 'lucide-react';
import { AuditCampaign, AuditItemRecord, Asset, AssetLocation, User as UserType } from '../../types';
import { StorageService } from '../../services/storageService';
import { logActivity } from '../../services/activityLogger';
import { hasPermission, getStatusBadgeClass } from '../../services/authService';
import { NotificationService } from '../../services/notificationService';
import { getI18n, AppLanguage } from '../../utils/i18n';

interface AuditCampaignViewProps {
  assets: Asset[];
  locations: AssetLocation[];
  currentUser: UserType;
  onOpenScanner: () => void;
  isReadOnlyMode: boolean;
}

export const AuditCampaignView: React.FC<AuditCampaignViewProps> = ({
  assets,
  locations,
  currentUser,
  onOpenScanner,
  isReadOnlyMode,
}) => {
  const currentLang: AppLanguage = currentUser?.language || StorageService.getLanguage() || 'id';
  const t = getI18n(currentLang);
  const isEn = currentLang === 'en';

  const [campaigns, setCampaigns] = useState<AuditCampaign[]>(StorageService.getAuditCampaigns());
  const [auditItems, setAuditItems] = useState<AuditItemRecord[]>(StorageService.getAuditItems());
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns[0]?.id || '');
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(isEn ? 'Incorrect audit target parameters' : 'Kesalahan pemilihan parameter / lokasi sasaran audit');

  // Sub-Tab Mode: 'LIVE_SHEET' | 'CAMPAIGNS'
  const [activeSubTab, setActiveSubTab] = useState<'LIVE_SHEET' | 'CAMPAIGNS'>('LIVE_SHEET');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // New campaign form state
  const [campaignTitle, setCampaignTitle] = useState(isEn ? 'Q3 2026 Fleet Physical Audit' : 'Audit Fisik & Stock Opname Aset Q3 2026');
  const [targetLocationId, setTargetLocationId] = useState(locations[0]?.id || '');

  const canManage = (hasPermission(currentUser, 'audits.manage') || hasPermission(currentUser, 'settings.manage')) && !isReadOnlyMode;

  const currentCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];
  const currentCampaignItems = auditItems.filter((item) => item.campaignId === currentCampaign?.id);

  // Expected assets for target location
  const expectedAssets = useMemo(() => {
    if (!currentCampaign) return [];
    if (!currentCampaign.targetLocationId || currentCampaign.targetLocationId === 'ALL') {
      return assets.filter((a) => a.status !== 'DISPOSED');
    }
    return assets.filter((a) => a.locationId === currentCampaign.targetLocationId && a.status !== 'DISPOSED');
  }, [assets, currentCampaign]);

  // KPI calculations
  const stats = useMemo(() => {
    const totalExpected = expectedAssets.length || currentCampaign?.totalExpected || 1;
    const auditedCount = currentCampaignItems.length;
    const progressRate = ((auditedCount / Math.max(totalExpected, 1)) * 100).toFixed(1);
    
    const matchedCount = currentCampaignItems.filter((i) => i.status === 'MATCHED').length;
    const missingCount = currentCampaignItems.filter((i) => i.status === 'MISSING').length;
    const damagedCount = currentCampaignItems.filter((i) => i.status === 'DAMAGED').length;
    const accuracyRate = auditedCount > 0 ? ((matchedCount / auditedCount) * 100).toFixed(1) : '96.4';

    return { totalExpected, auditedCount, progressRate, matchedCount, missingCount, damagedCount, accuracyRate };
  }, [expectedAssets, currentCampaign, currentCampaignItems]);

  const filteredAssetsToAudit = useMemo(() => {
    return expectedAssets.filter((asset) => {
      const record = currentCampaignItems.find((i) => i.assetId === asset.id);
      const itemStatus = record ? record.status : 'UNVERIFIED';

      if (statusFilter !== 'ALL' && itemStatus !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = asset.assetCode.toLowerCase().includes(q);
        const matchName = asset.name.toLowerCase().includes(q);
        const matchSerial = (asset.serialNumber || '').toLowerCase().includes(q);
        const matchPic = (asset.picName || '').toLowerCase().includes(q);
        const matchLoc = (asset.locationName || '').toLowerCase().includes(q);
        return matchCode || matchName || matchSerial || matchPic || matchLoc;
      }
      return true;
    });
  }, [expectedAssets, currentCampaignItems, statusFilter, searchTerm]);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnlyMode) {
      alert(isEn ? 'System in Read-Only mode.' : 'Sistem dalam mode Read-Only.');
      return;
    }

    const loc = locations.find((l) => l.id === targetLocationId);
    const expected = assets.filter((a) => a.locationId === targetLocationId && a.status !== 'DISPOSED').length;

    const newCamp: AuditCampaign = {
      id: `aud-cmp-${Date.now()}`,
      title: campaignTitle,
      targetLocationId,
      targetLocationName: loc?.name || (isEn ? 'All Locations' : 'Semua Lokasi'),
      startDate: new Date().toISOString().substring(0, 10),
      status: 'IN_PROGRESS',
      auditorName: currentUser.name,
      totalExpected: expected,
      totalAudited: 0,
      matchedCount: 0,
      missingCount: 0,
      damagedCount: 0,
      unexpectedCount: 0,
    };

    const updated = [newCamp, ...campaigns];
    setCampaigns(updated);
    StorageService.saveAuditCampaigns(updated);
    setSelectedCampaignId(newCamp.id);
    setShowNewCampaignModal(false);

    logActivity('AUDIT_CAMPAIGN_CREATED', 'AUDIT', `Membuat kampanye audit baru "${campaignTitle}" oleh ${currentUser.name}`);
  };

  const handleMarkItemStatus = (asset: Asset, status: 'MATCHED' | 'MISSING' | 'DAMAGED') => {
    if (!currentCampaign) return;
    if (isReadOnlyMode) {
      alert(isEn ? 'System in Read-Only mode.' : 'Sistem dalam mode Read-Only.');
      return;
    }

    const existingIdx = auditItems.findIndex(
      (item) => item.campaignId === currentCampaign.id && item.assetId === asset.id
    );

    const newItem: AuditItemRecord = {
      id: `aud-itm-${Date.now()}`,
      campaignId: currentCampaign.id,
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.name,
      expectedLocation: asset.locationName,
      scannedLocation: currentCampaign.targetLocationName || asset.locationName,
      status,
      scannedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      scannedBy: currentUser.name,
    };

    let updatedItems = [...auditItems];
    if (existingIdx >= 0) {
      updatedItems[existingIdx] = newItem;
    } else {
      updatedItems.unshift(newItem);
    }
    setAuditItems(updatedItems);
    StorageService.saveAuditItems(updatedItems);

    // Recalculate campaign stats
    const campaignItems = updatedItems.filter((i) => i.campaignId === currentCampaign.id);
    const matchedCount = campaignItems.filter((i) => i.status === 'MATCHED').length;
    const missingCount = campaignItems.filter((i) => i.status === 'MISSING').length;
    const damagedCount = campaignItems.filter((i) => i.status === 'DAMAGED').length;

    const updatedCampaigns = campaigns.map((c) => {
      if (c.id === currentCampaign.id) {
        return {
          ...c,
          totalAudited: campaignItems.length,
          matchedCount,
          missingCount,
          damagedCount,
        };
      }
      return c;
    });

    setCampaigns(updatedCampaigns);
    StorageService.saveAuditCampaigns(updatedCampaigns);

    if (status === 'MISSING' || status === 'DAMAGED') {
      const allAssets = StorageService.getAssets();
      const updatedAssets = allAssets.map((a) => {
        if (a.id === asset.id) {
          return {
            ...a,
            status: status === 'MISSING' ? ('MISSING' as const) : a.status,
            condition: status === 'DAMAGED' ? ('DAMAGED' as const) : a.condition,
          };
        }
        return a;
      });
      StorageService.saveAssets(updatedAssets);
    }

    logActivity('AUDIT_ITEM_VERIFIED', 'AUDIT', `Verifikasi fisik aset ${asset.assetCode} -> Status: ${status}`);
  };

  const handleFinalizeCampaign = () => {
    if (!currentCampaign) return;
    if (isReadOnlyMode) {
      alert(isEn ? 'System in Read-Only mode.' : 'Sistem dalam mode Read-Only.');
      return;
    }

    const updated = campaigns.map((c) => {
      if (c.id === currentCampaign.id) {
        return {
          ...c,
          status: 'COMPLETED' as const,
          endDate: new Date().toISOString().substring(0, 10),
        };
      }
      return c;
    });
    setCampaigns(updated);
    StorageService.saveAuditCampaigns(updated);

    logActivity('AUDIT_CAMPAIGN_FINALIZED', 'AUDIT', `Menyelesaikan kampanye audit "${currentCampaign.title}"`);
    alert(isEn ? `Audit "${currentCampaign.title}" finalized successfully.` : `Audit "${currentCampaign.title}" telah diselesaikan dan disimpan.`);
  };

  const handleCancelCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCampaign) return;
    if (isReadOnlyMode) {
      alert(isEn ? 'System in Read-Only mode.' : 'Sistem dalam mode Read-Only.');
      return;
    }

    const updated = campaigns.map((c) => {
      if (c.id === currentCampaign.id) {
        return {
          ...c,
          status: 'CANCELLED' as const,
          endDate: new Date().toISOString().substring(0, 10),
        };
      }
      return c;
    });
    setCampaigns(updated);
    StorageService.saveAuditCampaigns(updated);

    setShowCancelModal(false);
    alert(isEn ? `Campaign "${currentCampaign.title}" cancelled.` : `Kampanye audit "${currentCampaign.title}" berhasil dibatalkan.`);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* 1. Spatial Control & Command Header */}
      <div className="glass-panel squircle p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs uppercase tracking-widest text-[#5E7A68] dark:text-emerald-400 font-bold px-3 py-1 rounded-full bg-[#5E7A68]/10 dark:bg-emerald-950/40 border border-[#5E7A68]/20">
              {isEn ? 'Audit & Stocktake Hub' : 'Pusat Audit & Stock Opname'}
            </span>
            {currentCampaign && (
              <div className="px-3.5 py-1 rounded-full bg-white/70 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 shadow-2xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5E7A68] animate-pulse" />
                <span>{currentCampaign.title} • {stats.progressRate}% {isEn ? 'Reconciled' : 'Terekonsiliasi'}</span>
              </div>
            )}
          </div>

          <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
            {isEn ? 'Physical Asset Audit & Stocktake Center' : 'Pusat Stock Opname & Audit Fisik Aset'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            {isEn
              ? 'On-site physical reconciliation, QR/RFID discrepancy detection, custodian verification, and asset existence certification.'
              : 'Verifikasi keberadaan fisik unit di lapangan, rekonsiliasi data master dengan temuan aktual, deteksi selisih ruangan/PIC, dan penerbitan Berita Acara Audit.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-5 py-3 rounded-full border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title={isEn ? 'Launch Scanner' : 'Buka Pemindai Barcode'}
          >
            <QrCode className="w-4 h-4 text-[#5E7A68]" />
            <span>{isEn ? 'Scan QR / RFID' : 'Scan Cepat Barcode'}</span>
          </button>

          {canManage && (
            <button
              onClick={() => setShowNewCampaignModal(true)}
              className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-6 sm:px-7 py-3 rounded-full text-xs font-bold shadow-lg shadow-[#5E7A68]/25 transition-all cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>{isEn ? 'New Audit Schedule' : 'Buat Jadwal Audit Baru'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 4 Squircle Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Reconciliation Progress */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Physical Progress' : 'Progress Rekonsiliasi Fisik'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#5E7A68] dark:text-emerald-400">{stats.progressRate}%</p>
            <span className="text-xs font-medium text-stone-500">
              {stats.auditedCount} {isEn ? 'of' : 'dari'} {stats.totalExpected} {isEn ? 'units checked' : 'unit terverifikasi'}
            </span>
          </div>
        </div>

        {/* Card 2: Location & Master Match Accuracy */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Master Data Match' : 'Kesesuaian Lokasi & Data'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#181F19] dark:text-stone-100">{stats.accuracyRate}%</p>
            <span className="text-xs font-medium text-stone-500">
              {stats.matchedCount} {isEn ? 'units perfectly matched' : 'unit cocok dengan sistem'}
            </span>
          </div>
        </div>

        {/* Card 3: Discrepancies & Damaged */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Damaged / Discrepancy' : 'Temuan Rusak & Selisih'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#D4A373]/20 text-[#7D562D] dark:text-amber-300 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#7D562D] dark:text-amber-300">{stats.damagedCount}</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Units flagged for repair' : 'Unit butuh perbaikan fisik'}
            </span>
          </div>
        </div>

        {/* Card 4: Missing Assets */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isEn ? 'Unverified / Missing' : 'Aset Belum Ditemukan'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-rose-600 dark:text-rose-400">{stats.missingCount}</p>
            <span className="text-xs font-medium text-stone-500">
              {isEn ? 'Units pending search' : 'Unit hilang / belum terpindai'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Campaign Selector Banner & Navigation Tabs */}
      {currentCampaign && (
        <div className="glass-panel squircle p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-5">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-stone-500">
                  {isEn ? 'Active Audit Session:' : 'Sesi Audit Aktif:'}
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-[10px] font-bold ${
                    currentCampaign.status === 'COMPLETED'
                      ? 'bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-400 border border-[#5E7A68]/30'
                      : currentCampaign.status === 'CANCELLED'
                      ? 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 animate-pulse'
                  }`}
                >
                  {currentCampaign.status}
                </span>
              </div>

              <div className="w-full max-w-xl">
                <select
                  value={selectedCampaignId || ''}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full font-serif-display text-base font-bold text-[#181F19] dark:text-stone-100 bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 rounded-2xl px-4 py-2.5 outline-hidden focus:ring-2 focus:ring-[#5E7A68] cursor-pointer"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-stone-600 dark:text-stone-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>{isEn ? 'Target Facility:' : 'Sasaran:'} <strong>{currentCampaign.targetLocationName}</strong></span>
                <span>•</span>
                <span>{isEn ? 'Auditor:' : 'Pemeriksa:'} <strong>{currentCampaign.auditorName}</strong></span>
                <span>•</span>
                <span>{isEn ? 'Date:' : 'Mulai:'} <strong>{currentCampaign.startDate}</strong></span>
              </div>
            </div>

            {currentCampaign.status === 'IN_PROGRESS' && canManage && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                >
                  {isEn ? 'Cancel Session' : 'Batalkan Sesi'}
                </button>

                <button
                  type="button"
                  onClick={handleFinalizeCampaign}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold bg-[#5E7A68] hover:bg-[#4E6857] text-white shadow-md shadow-[#5E7A68]/20 transition-all cursor-pointer hover:scale-105"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEn ? 'Finalize & Lock Audit' : 'Selesaikan & Kunci Audit'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Sub-Tab Navigation & Filter */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
            <div className="flex items-center p-1 rounded-2xl bg-stone-200/60 dark:bg-stone-800/60 border border-stone-300/50 dark:border-stone-700/50">
              <button
                onClick={() => setActiveSubTab('LIVE_SHEET')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'LIVE_SHEET'
                    ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <ClipboardCheck className="w-4 h-4 text-[#5E7A68]" />
                <span>{isEn ? 'Live Reconciliation Sheet' : 'Meja Rekonsiliasi Audit Langsung'}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-400 text-[10px] font-mono font-bold">
                  {filteredAssetsToAudit.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSubTab('CAMPAIGNS')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'CAMPAIGNS'
                    ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <History className="w-4 h-4 text-[#7D562D]" />
                <span>{isEn ? 'Campaigns Archive' : 'Arsip & Berita Acara Kampanye'}</span>
                <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-mono font-bold">
                  {campaigns.length}
                </span>
              </button>
            </div>

            {/* Filter Chips & Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:w-72">
                <input
                  type="text"
                  placeholder={isEn ? 'Search tag, asset, serial, PIC...' : 'Cari kode aset, nama, serial, PIC...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#5E7A68] outline-hidden shadow-2xs"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-hidden"
              >
                <option value="ALL">{isEn ? 'All Status' : 'Semua Status Verifikasi'}</option>
                <option value="MATCHED">{isEn ? 'Matched (Valid)' : 'Cocok & Valid'}</option>
                <option value="DAMAGED">{isEn ? 'Damaged (Physical Issue)' : 'Rusak Fisik'}</option>
                <option value="MISSING">{isEn ? 'Missing / Unverified' : 'Hilang / Belum Ada'}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 4. High-Density Tactile Data Tables */}

      {/* VIEW 1: LIVE RECONCILIATION SHEET */}
      {activeSubTab === 'LIVE_SHEET' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Physical Asset Reconciliation Sheet' : 'Lembar Kerja Rekonsiliasi Aset di Lapangan'}
              </h2>
              <p className="text-xs text-stone-500">
                {isEn ? 'Compare recorded master values against physical on-site equipment.' : 'Cocokkan data master dengan kondisi fisik riil unit aset di gedung target.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-500 px-3 py-1 rounded-full bg-stone-200/60 dark:bg-stone-800">
              {filteredAssetsToAudit.length} {isEn ? 'Target Assets' : 'Unit Sasaran'}
            </span>
          </div>

          {filteredAssetsToAudit.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-[#5E7A68]/15 text-[#5E7A68] flex items-center justify-center mx-auto">
                <ClipboardCheck className="w-8 h-8" />
              </div>
              <h3 className="font-serif-display text-base font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'No Assets to Audit' : 'Tidak Ada Unit Aset yang Perlu Diaudit'}
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {isEn ? 'All assets for this target location have been verified or match your filter.' : 'Semua unit aset di lokasi sasaran telah terverifikasi atau tidak ada data yang cocok dengan filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-stone-800 text-stone-500 uppercase font-bold text-[11px] tracking-wider">
                    <th className="py-4 px-4">{isEn ? 'Asset Tag & Identity' : 'Tag & Identitas Unit'}</th>
                    <th className="py-4 px-4">{isEn ? 'Registered Location & PIC' : 'Lokasi & PIC Tercatat'}</th>
                    <th className="py-4 px-4">{isEn ? 'Physical Condition' : 'Kondisi Fisik Riil'}</th>
                    <th className="py-4 px-4">{isEn ? 'Audit Verification' : 'Status Verifikasi'}</th>
                    <th className="py-4 px-4 text-right">{isEn ? 'Audit Actions' : 'Aksi Verifikasi'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/60">
                  {filteredAssetsToAudit.map((ast) => {
                    const record = currentCampaignItems.find((i) => i.assetId === ast.id);
                    const isAudited = Boolean(record);

                    return (
                      <tr key={ast.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors group">
                        <td className="py-4 px-4">
                          <div className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#5E7A68] transition-colors">
                            {ast.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] text-[#5E7A68] font-bold">{ast.assetCode}</span>
                            {ast.serialNumber && (
                              <span className="font-mono text-[10px] text-stone-400">SN: {ast.serialNumber}</span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-stone-800 dark:text-stone-200 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-[#5E7A68] shrink-0" />
                            <span>{ast.locationName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                            <UserIcon className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{ast.picName || '-'}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            ast.condition === 'GOOD'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200'
                          }`}>
                            <span>{ast.condition || 'GOOD'}</span>
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          {isAudited ? (
                            record?.status === 'MATCHED' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 border border-[#5E7A68]/30">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isEn ? 'MATCHED' : 'COCOK'}</span>
                              </span>
                            ) : record?.status === 'DAMAGED' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D4A373]/20 text-[#7D562D] dark:text-amber-300 border border-[#D4A373]/40">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>{isEn ? 'DAMAGED' : 'RUSAK FISIK'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>{isEn ? 'MISSING' : 'HILANG'}</span>
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                              <span>{isEn ? 'UNVERIFIED' : 'BELUM DIPERIKSA'}</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleMarkItemStatus(ast, 'MATCHED')}
                              disabled={isReadOnlyMode}
                              className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#5E7A68]/15 hover:bg-[#5E7A68] text-[#5E7A68] hover:text-white transition-all cursor-pointer"
                              title={isEn ? 'Mark as Matched' : 'Tandai Cocok'}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleMarkItemStatus(ast, 'DAMAGED')}
                              disabled={isReadOnlyMode}
                              className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 hover:bg-amber-600 text-amber-800 hover:text-white transition-all cursor-pointer"
                              title={isEn ? 'Mark as Damaged' : 'Tandai Rusak'}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleMarkItemStatus(ast, 'MISSING')}
                              disabled={isReadOnlyMode}
                              className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 hover:bg-rose-600 text-rose-800 hover:text-white transition-all cursor-pointer"
                              title={isEn ? 'Mark as Missing' : 'Tandai Hilang'}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
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
      )}

      {/* VIEW 2: CAMPAIGNS ARCHIVE */}
      {activeSubTab === 'CAMPAIGNS' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                {isEn ? 'Historical Stocktake Campaigns Archive' : 'Buku Arsip & Berita Acara Kampanye Audit'}
              </h2>
              <p className="text-xs text-stone-500">
                {isEn ? 'Audit completion records, auditor sign-offs, and compliance logs.' : 'Rekapitulasi kampanye audit berkala yang telah selesai maupun dibatalkan.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-500 px-3 py-1 rounded-full bg-stone-200/60 dark:bg-stone-800">
              {campaigns.length} {isEn ? 'Sessions' : 'Sesi'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((camp) => (
              <div key={camp.id} className="p-6 rounded-3xl bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-4 shadow-2xs hover:scale-[1.02] transition-transform">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-[#181F19] dark:text-stone-100">{camp.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    camp.status === 'COMPLETED'
                      ? 'bg-[#5E7A68]/15 text-[#5E7A68]'
                      : camp.status === 'CANCELLED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {camp.status}
                  </span>
                </div>

                <div className="text-xs text-stone-500 space-y-1">
                  <div>{isEn ? 'Location:' : 'Lokasi:'} <strong className="text-stone-800 dark:text-stone-200">{camp.targetLocationName}</strong></div>
                  <div>{isEn ? 'Auditor:' : 'Auditor:'} <strong className="text-stone-800 dark:text-stone-200">{camp.auditorName}</strong></div>
                  <div>{isEn ? 'Date:' : 'Tanggal:'} <strong className="text-stone-800 dark:text-stone-200">{camp.startDate}</strong></div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-800 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 block">{isEn ? 'Target' : 'Sasaran'}</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{camp.totalExpected}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 block">{isEn ? 'Matched' : 'Cocok'}</span>
                    <span className="font-bold text-[#5E7A68]">{camp.matchedCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-600 block">{isEn ? 'Missing' : 'Hilang'}</span>
                    <span className="font-bold text-rose-600">{camp.missingCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
          <div className="spatial-canvas w-full max-w-lg p-8 rounded-[36px] border border-white/60 dark:border-stone-700/60 shadow-2xl space-y-6">
            <h3 className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100">
              {isEn ? 'Launch New Physical Audit Campaign' : 'Luncurkan Kampanye Audit Fisik Baru'}
            </h3>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  {isEn ? 'Campaign Title *' : 'Nama Kampanye Audit *'}
                </label>
                <input
                  type="text"
                  required
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  {isEn ? 'Target Facility Location *' : 'Lokasi Gedung Sasaran Stocktake *'}
                </label>
                <select
                  value={targetLocationId}
                  onChange={(e) => setTargetLocationId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200/80 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowNewCampaignModal(false)}
                  className="px-6 py-2.5 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-800 cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Batalkan'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#5E7A68] hover:bg-[#4E6857] text-white shadow-md shadow-[#5E7A68]/20 transition-all cursor-pointer"
                >
                  {isEn ? 'Start Campaign' : 'Mulai Kampanye'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Campaign Confirmation Modal */}
      {showCancelModal && currentCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
          <div className="spatial-canvas w-full max-w-md p-8 rounded-[36px] border border-white/60 dark:border-stone-700/60 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif-display text-base font-bold text-stone-900 dark:text-stone-100">
                  {isEn ? 'Cancel This Audit Session?' : 'Batalkan Sesi Audit Ini?'}
                </h3>
                <p className="text-xs text-stone-500">
                  {isEn ? 'The audit session will be stopped and marked as cancelled.' : 'Sesi audit akan dihentikan dan dicatat dalam audit stream.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleCancelCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  {isEn ? 'Cancellation Reason *' : 'Alasan Pembatalan *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 outline-hidden resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-6 py-2.5 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-800 cursor-pointer"
                >
                  {isEn ? 'Back' : 'Kembali'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  {isEn ? 'Confirm Cancellation' : 'Konfirmasi Batalkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
