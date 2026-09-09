import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  RefreshCw,
  Tag,
  Radio,
  Image as ImageIcon,
  DollarSign,
  Calendar,
  Building,
  Box,
  Upload,
  Camera,
  Trash2,
  Link as LinkIcon,
  MapPin,
  UserCheck,
  TrendingDown,
  Layers,
  ShieldCheck,
  Sparkles,
  Cpu,
  FileText,
  CheckCircle2,
  Info,
  QrCode,
  Sliders,
} from 'lucide-react';
import { Asset, AssetCategory, AssetLocation, AssetStatus, AssetCondition } from '../../types';
import { generateRfidHex, generateNfcUid, generateAssetQrPayload } from '../../services/qrService';
import { calculateStraightLineDepreciation, formatRupiah } from '../../services/depreciationService';
import { StorageService } from '../../services/storageService';
import { AppLanguage, getI18n } from '../../utils/i18n';

interface AssetFormModalProps {
  assetToEdit: Asset | null;
  categories: AssetCategory[];
  locations: AssetLocation[];
  onSave: (assetData: Partial<Asset>) => void;
  onClose: () => void;
  codePrefix?: string;
  language?: AppLanguage;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  assetToEdit,
  categories,
  locations,
  onSave,
  onClose,
  codePrefix,
  language,
}) => {
  const currentLang: AppLanguage = language || StorageService.getLanguage() || 'en';
  const isEn = currentLang === 'en';
  const t = getI18n(currentLang);

  const isEditing = Boolean(assetToEdit);
  const effectivePrefix = codePrefix || StorageService.getAssetCodePrefix() || 'AST-';

  // Generate sequential clean code: AST-YYYY-001 or next sequence based on existing inventory
  const generateNewAssetCode = () => {
    try {
      const existingAssets = StorageService.getAssets();
      const nextSeq = String(existingAssets.length + 1).padStart(3, '0');
      return `${effectivePrefix}${new Date().getFullYear()}-${nextSeq}`;
    } catch {
      return `${effectivePrefix}${new Date().getFullYear()}-001`;
    }
  };

  const initialCode = assetToEdit?.assetCode || generateNewAssetCode();

  const [assetCode, setAssetCode] = useState(initialCode);
  const [name, setName] = useState(assetToEdit?.name || '');
  const [serialNumber, setSerialNumber] = useState(assetToEdit?.serialNumber || '');
  const [categoryId, setCategoryId] = useState(assetToEdit?.categoryId || (categories[0]?.id || ''));
  const [locationId, setLocationId] = useState(assetToEdit?.locationId || (locations[0]?.id || ''));
  const [department, setDepartment] = useState(assetToEdit?.department || '');
  const [picName, setPicName] = useState(assetToEdit?.picName || '');
  const [picEmail, setPicEmail] = useState(assetToEdit?.picEmail || '');
  const [status, setStatus] = useState<AssetStatus>(assetToEdit?.status || 'ACTIVE');
  const [condition, setCondition] = useState<AssetCondition>(assetToEdit?.condition || 'EXCELLENT');
  const [purchaseDate, setPurchaseDate] = useState(
    assetToEdit?.purchaseDate || new Date().toISOString().substring(0, 10)
  );
  const [purchaseCost, setPurchaseCost] = useState<number | ''>(
    assetToEdit?.purchaseCost !== undefined ? assetToEdit.purchaseCost : ''
  );
  const [residualValue, setResidualValue] = useState<number | ''>(
    assetToEdit?.residualValue !== undefined ? assetToEdit.residualValue : ''
  );
  const [usefulLifeYears, setUsefulLifeYears] = useState<number>(
    assetToEdit?.usefulLifeYears ?? (categories[0]?.depreciationPeriodYears || 5)
  );
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState(assetToEdit?.warrantyExpiryDate || '');
  const [imageUrl, setImageUrl] = useState(assetToEdit?.imageUrl || '');
  const [rfidTag, setRfidTag] = useState(assetToEdit?.rfidTag || '');
  const [nfcTag, setNfcTag] = useState(assetToEdit?.nfcTag || '');
  const [notes, setNotes] = useState(assetToEdit?.notes || '');

  const [photoInputMode, setPhotoInputMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const numericCost = typeof purchaseCost === 'number' ? purchaseCost : 0;
  const numericResidual = typeof residualValue === 'number' ? residualValue : 0;

  // Auto calculate residual value as 10% when purchaseCost changes if not editing
  const handlePurchaseCostChange = (valStr: string) => {
    if (valStr === '') {
      setPurchaseCost('');
      if (!isEditing) setResidualValue('');
      return;
    }
    const cost = Math.max(0, Number(valStr));
    setPurchaseCost(cost);
    if (!isEditing) {
      setResidualValue(Math.round(cost * 0.1));
    }
  };

  // Compress & convert uploaded image to optimal base64
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(isEn ? 'Please select an image file (.jpg, .png, .webp)' : 'Mohon pilih berkas gambar (.jpg, .png, .webp)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImageUrl(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Calculate realtime book value according to PSAK 16 / IFRS
  const depCalc = calculateStraightLineDepreciation(
    numericCost,
    numericResidual,
    usefulLifeYears || 1,
    purchaseDate
  );

  const nbvPercentage =
    numericCost > 0
      ? Math.max(0, Math.min(100, Math.round((depCalc.currentBookValue / numericCost) * 100)))
      : 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !assetCode.trim()) {
      alert(isEn ? 'Asset Name and Asset Code are required.' : 'Nama dan Kode Aset wajib diisi!');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const selectedLoc = locations.find((l) => l.id === locationId);

    const assetId = assetToEdit?.id || `ast-${Date.now()}`;
    const qrPayload = generateAssetQrPayload(assetCode, assetId, 'PUBLIC_URL');

    onSave({
      id: assetId,
      assetCode,
      name: name.trim(),
      serialNumber: serialNumber.trim() || undefined,
      categoryId,
      categoryName: selectedCategory?.name || (isEn ? 'General' : 'Umum'),
      locationId,
      locationName: selectedLoc?.name || (isEn ? 'Headquarters' : 'Kantor Pusat'),
      department: department.trim() || undefined,
      picName: picName.trim() || undefined,
      picEmail: picEmail.trim() || undefined,
      status,
      condition,
      purchaseDate,
      purchaseCost: numericCost,
      residualValue: numericResidual,
      usefulLifeYears: usefulLifeYears || 1,
      currentBookValue: numericCost > 0 ? depCalc.currentBookValue : 0,
      warrantyExpiryDate: warrantyExpiryDate || undefined,
      imageUrl: imageUrl || undefined,
      rfidTag: rfidTag.trim() || undefined,
      nfcTag: nfcTag.trim() || undefined,
      qrPayload,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-md p-3 sm:p-6 md:p-8 flex justify-center animate-fadeIn">
      {/* Outer Spatial Canvas Window (Organic Spatial UI) */}
      <div className="spatial-canvas w-full max-w-5xl my-auto rounded-[32px] sm:rounded-[44px] p-6 sm:p-8 md:p-10 border border-white/70 dark:border-stone-700/60 shadow-2xl space-y-6 relative overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Ambient Decorative Lighting Glows */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#5E7A68]/15 dark:bg-emerald-950/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[#7D562D]/15 dark:bg-amber-950/20 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Spatial Hero Command Header */}
        <div className="glass-panel squircle p-5 sm:p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative shrink-0">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono tracking-wider bg-[#5E7A68]/15 text-[#3E5A48] dark:bg-[#5E7A68]/30 dark:text-[#A8C8B2] border border-[#5E7A68]/25">
                <Box className="w-3.5 h-3.5" />
                <span>{isEditing ? (isEn ? 'EDIT ASSET PROTOCOL' : 'PROTOKOL PERUBAHAN ASET') : (isEn ? 'NEW ASSET REGISTRATION' : 'REGISTRASI ASET BARU')}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                <ShieldCheck className="w-3 h-3 text-[#5E7A68]" />
                <span>PSAK 16 & ISO 55001</span>
              </span>
            </div>
            <h2 className="font-serif-display text-xl sm:text-2xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
              {isEditing
                ? (isEn ? `Modify Asset: ${assetToEdit?.assetCode}` : `Perbarui Aset: ${assetToEdit?.assetCode}`)
                : (isEn ? 'Register New Inventory Asset' : 'Registrasi Inventaris Aset Baru')}
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
              {isEn
                ? 'Register enterprise hardware and capital assets with automated depreciation schedules, smart RFID/NFC chips, and verifiable digital twin telemetry.'
                : 'Daftarkan aset kapital dan inventaris instansi lengkap dengan penjadwalan depresiasi otomatis, chip cerdas RFID/NFC, dan telemetri digital twin.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2.5 rounded-2xl bg-stone-200/60 hover:bg-stone-300/70 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-all cursor-pointer self-start sm:self-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Scrollable Spatial Bento Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
          
          {/* Bento Card 1: Core Identity & Specifications */}
          <div className="glass-panel squircle p-6 space-y-5 border-l-4 border-l-[#5E7A68]">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#5E7A68]/15 text-[#5E7A68] dark:bg-[#5E7A68]/25 dark:text-[#8EAE98]">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif-display text-sm sm:text-base font-bold text-[#181F19] dark:text-stone-100">
                    {isEn ? '1. Core Identity & Classification' : '1. Identitas Utama & Klasifikasi Aset'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {isEn ? 'Primary asset code, naming taxonomy, serial registry, and lifecycle status' : 'Kode unik aset, nomenklatur, nomor seri resmi, dan status siklus hidup'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Asset Code */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Asset Code *' : 'Kode Aset *'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs font-mono font-bold text-[#5E7A68] dark:text-[#8EAE98] focus:outline-hidden focus:ring-2 focus:ring-[#5E7A68]/30"
                  />
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setAssetCode(generateNewAssetCode())}
                      title={isEn ? 'Generate New Unique Code' : 'Generate Kode Baru'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-[#5E7A68] dark:hover:text-[#8EAE98] transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Asset Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Full Asset Nomenclature *' : 'Nama Aset Lengkap *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? 'e.g. Dell Latitude 7440 / Toyota Hilux 4x4' : 'Contoh: Dell Latitude 7440 / Toyota Hilux 4x4'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#5E7A68]/30"
                />
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Serial Number (Hardware S/N)' : 'Nomor Seri Perangkat (S/N)'}
                </label>
                <input
                  type="text"
                  placeholder={isEn ? 'Hardware serial number (optional)' : 'Nomor seri perangkat keras (opsional)'}
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs font-mono text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#5E7A68]/30"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Asset Category Taxonomy *' : 'Kategori Aset *'}
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    const cat = categories.find((c) => c.id === e.target.value);
                    if (cat?.depreciationPeriodYears && !isEditing) {
                      setUsefulLifeYears(cat.depreciationPeriodYears);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#5E7A68]/30"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.depreciationPeriodYears} {isEn ? 'yrs' : 'thn'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Operational Status' : 'Status Operasional'}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AssetStatus)}
                  className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#5E7A68]/30"
                >
                  <option value="ACTIVE">{isEn ? 'ACTIVE (Ready for Deployment)' : 'ACTIVE (Aktif Siap Pakai)'}</option>
                  <option value="IN_USE">{isEn ? 'IN_USE (Currently Deployed)' : 'IN_USE (Sedang Digunakan)'}</option>
                  <option value="MAINTENANCE">{isEn ? 'MAINTENANCE (In Repair / Service)' : 'MAINTENANCE (Dalam Perawatan)'}</option>
                  <option value="RESERVED">{isEn ? 'RESERVED (Staged Buffer)' : 'RESERVED (Dicadangkan)'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Physical Placement & Ownership */}
          <div className="glass-panel squircle p-6 space-y-5 border-l-4 border-l-[#7D562D]">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#7D562D]/15 text-[#7D562D] dark:bg-[#7D562D]/25 dark:text-[#D4A373]">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif-display text-sm sm:text-base font-bold text-[#181F19] dark:text-stone-100">
                    {isEn ? '2. Physical Placement & Custody (PIC)' : '2. Lokasi Fisik & Penanggung Jawab (PIC)'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {isEn ? 'Spatial facility mapping, operational department, physical condition grade, and verified custodian' : 'Pemetaan gedung/ruangan, departemen operasional, kondisi fisik, dan kontak penanggung jawab'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Facility / Building Location *' : 'Lokasi Gedung & Fasilitas *'}
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#7D562D]/30"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Operational Department' : 'Departemen / Divisi'}
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder={isEn ? 'e.g. IT, Operations, General Affairs' : 'Contoh: IT, Operasional, Umum'}
                  className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#7D562D]/30"
                />
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Physical Condition Grade' : 'Tingkat Kondisi Fisik'}
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as AssetCondition)}
                  className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#7D562D]/30"
                >
                  <option value="EXCELLENT">{isEn ? 'EXCELLENT (Like New / Mint)' : 'EXCELLENT (Sangat Baik / Seperti Baru)'}</option>
                  <option value="GOOD">{isEn ? 'GOOD (Normal Wear, Optimal)' : 'GOOD (Baik / Terawat)'}</option>
                  <option value="FAIR">{isEn ? 'FAIR (Functional, Scratches)' : 'FAIR (Cukup / Berfungsi Normal)'}</option>
                  <option value="POOR">{isEn ? 'POOR (Needs Service / Review)' : 'POOR (Kurang Baik / Perlu Servis)'}</option>
                  <option value="DAMAGED">{isEn ? 'DAMAGED (Defective / Non-Functional)' : 'DAMAGED (Rusak / Butuh Perbaikan)'}</option>
                </select>
              </div>

              {/* PIC Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Custodian PIC Name' : 'Nama PIC Penanggung Jawab'}
                </label>
                <input
                  type="text"
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder={isEn ? 'e.g. Custodian Full Name' : 'Contoh: Nama Lengkap Penanggung Jawab'}
                  className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#7D562D]/30"
                />
              </div>

              {/* PIC Email */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Official Custodian Email' : 'Email Resmi PIC'}
                </label>
                <input
                  type="email"
                  value={picEmail}
                  onChange={(e) => setPicEmail(e.target.value)}
                  placeholder="pic@assetcorp.id"
                  className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#7D562D]/30"
                />
              </div>
            </div>
          </div>

          {/* Bento Card 3: Financial Valuation & PSAK 16 Depreciation */}
          <div className="glass-panel squircle p-6 space-y-5 border-l-4 border-l-[#5E7A68]">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#5E7A68]/15 text-[#5E7A68] dark:bg-[#5E7A68]/25 dark:text-[#8EAE98]">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif-display text-sm sm:text-base font-bold text-[#181F19] dark:text-stone-100">
                    {isEn ? '3. Financial Valuation & PSAK 16 Depreciation' : '3. Valuasi Finansial & Depresiasi PSAK 16 / IFRS'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {isEn ? 'Acquisition cost, salvage value, useful life amortization, and realtime net book value telemetry' : 'Harga perolehan, nilai sisa, amortisasi masa manfaat, dan telemetri nilai buku aktual'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Purchase Date */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Purchase / Capitalization Date' : 'Tanggal Perolehan'}
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#5E7A68]/30"
                />
              </div>

              {/* Purchase Cost */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Acquisition Cost (Rp) *' : 'Harga Perolehan (Rp) *'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  placeholder="0"
                  value={purchaseCost}
                  onChange={(e) => handlePurchaseCostChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs font-mono font-bold text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#5E7A68]/30"
                />
              </div>

              {/* Residual / Salvage Value */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Residual / Salvage Value (Rp)' : 'Nilai Residu / Sisa (Rp)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  placeholder="0"
                  value={residualValue}
                  onChange={(e) => setResidualValue(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs font-mono text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#5E7A68]/30"
                />
              </div>

              {/* Useful Life */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Useful Life (Years)' : 'Masa Manfaat (Tahun)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={usefulLifeYears}
                  onChange={(e) => setUsefulLifeYears(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#5E7A68]/30"
                />
              </div>
            </div>

            {/* Live Real-Time Spatial Telemetry Capsule */}
            <div className="p-4 rounded-2xl bg-[#5E7A68]/10 dark:bg-[#5E7A68]/20 border border-[#5E7A68]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#5E7A68]/20 text-[#5E7A68] dark:text-[#A8C8B2] shrink-0">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-stone-500 dark:text-stone-400">
                    {isEn ? 'Current Estimated Net Book Value (NBV)' : 'Estimasi Nilai Buku Saat Ini (NBV)'}
                  </div>
                  <div className="font-mono text-base sm:text-lg font-bold text-[#181F19] dark:text-stone-100">
                    {numericCost > 0 ? formatRupiah(depCalc.currentBookValue) : 'Rp 0'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-stone-600 dark:text-stone-300">
                <div>
                  <span className="text-stone-400">{isEn ? 'Annual Depr.: ' : 'Penyusutan/Thn: '}</span>
                  <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                    {numericCost > 0 ? formatRupiah(depCalc.annualDepreciation) : 'Rp 0'}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400">{isEn ? 'Remaining Value: ' : 'Sisa Nilai: '}</span>
                  <span className="font-mono font-bold text-[#5E7A68] dark:text-[#8EAE98]">
                    {numericCost > 0 ? `${nbvPercentage}%` : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 4: Smart Hardware Telemetry & Visuals */}
          <div className="glass-panel squircle p-6 space-y-5 border-l-4 border-l-[#7D562D]">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#7D562D]/15 text-[#7D562D] dark:bg-[#7D562D]/25 dark:text-[#D4A373]">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif-display text-sm sm:text-base font-bold text-[#181F19] dark:text-stone-100">
                    {isEn ? '4. Smart Hardware Telemetry & Physical Visuals' : '4. Tag Cerdas RFID, NFC & Foto Fisik'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {isEn ? 'RFID EPC Gen2 96-bit chips, NFC UID tags, warranty window, and verified hardware photography' : 'Integrasi tag RFID UHF 96-bit, NFC UID chip, garansi pabrik, dan dokumentasi foto fisik'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* RFID UHF Tag */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'RFID EPC Gen2 Tag (Hex)' : 'Tag RFID UHF EPC Gen2 (Hex)'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={rfidTag}
                    onChange={(e) => setRfidTag(e.target.value)}
                    placeholder={isEn ? 'Optional / Click Auto' : 'Opsional / Klik Auto'}
                    className="w-full pl-3 pr-14 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs font-mono font-bold text-[#7D562D] dark:text-[#D4A373] placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#7D562D]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setRfidTag(generateRfidHex())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#7D562D]/10 hover:bg-[#7D562D]/20 text-[#7D562D] dark:text-[#D4A373] transition-colors cursor-pointer"
                  >
                    Auto
                  </button>
                </div>
              </div>

              {/* NFC Tag */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'NFC UID Chip Tag' : 'NFC UID Chip Tag'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nfcTag}
                    onChange={(e) => setNfcTag(e.target.value)}
                    placeholder={isEn ? 'Optional / Click Auto' : 'Opsional / Klik Auto'}
                    className="w-full pl-3 pr-14 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs font-mono font-bold text-[#7D562D] dark:text-[#D4A373] placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#7D562D]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setNfcTag(generateNfcUid())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#7D562D]/10 hover:bg-[#7D562D]/20 text-[#7D562D] dark:text-[#D4A373] transition-colors cursor-pointer"
                  >
                    Auto
                  </button>
                </div>
              </div>

              {/* Warranty Expiry */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Warranty Expiry Date' : 'Batas Akhir Garansi'}
                </label>
                <input
                  type="date"
                  value={warrantyExpiryDate}
                  onChange={(e) => setWarrantyExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#7D562D]/30"
                />
              </div>

              {/* Photo Upload Studio */}
              <div className="sm:col-span-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    {isEn ? 'Physical Asset Photography Studio' : 'Dokumentasi Foto Fisik Aset'}
                  </label>
                  <div className="flex items-center gap-1 bg-stone-200/70 dark:bg-stone-800 p-1 rounded-xl text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('upload')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        photoInputMode === 'upload'
                          ? 'bg-white dark:bg-stone-700 text-[#181F19] dark:text-stone-100 shadow-sm'
                          : 'text-stone-500 hover:text-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {isEn ? 'Upload / Camera' : 'Unggah / Kamera'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('url')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        photoInputMode === 'url'
                          ? 'bg-white dark:bg-stone-700 text-[#181F19] dark:text-stone-100 shadow-sm'
                          : 'text-stone-500 hover:text-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {isEn ? 'Web URL Link' : 'Tautan URL'}
                    </button>
                  </div>
                </div>

                {photoInputMode === 'upload' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageFile(f);
                      }}
                    />
                    <input
                      type="file"
                      ref={cameraInputRef}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageFile(f);
                      }}
                    />

                    {imageUrl ? (
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700">
                        <img
                          src={imageUrl}
                          alt="Asset Preview"
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 rounded-2xl object-cover border border-white/60 dark:border-stone-700 shadow-md"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="text-xs font-bold text-[#181F19] dark:text-stone-100 truncate">
                            {isEn ? 'Asset Photo Loaded & Optimized' : 'Foto Fisik Aset Siap Disimpan'}
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400">
                            {isEn ? 'Client-side compression active to ensure high resolution with minimal storage footprint.' : 'Kompresi otomatis aktif untuk resolusi optimal tanpa membebani basis data.'}
                          </div>
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-xs font-bold text-[#5E7A68] hover:underline cursor-pointer"
                            >
                              {isEn ? 'Change Photo' : 'Ganti Foto'}
                            </button>
                            <span className="text-stone-300 dark:text-stone-700">•</span>
                            <button
                              type="button"
                              onClick={() => setImageUrl('')}
                              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isEn ? 'Remove' : 'Hapus'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center gap-2.5 p-4 bg-stone-50/80 hover:bg-[#5E7A68]/10 dark:bg-stone-900/80 dark:hover:bg-[#5E7A68]/15 border border-dashed border-stone-300 dark:border-stone-700 hover:border-[#5E7A68] rounded-2xl text-xs font-bold text-stone-700 dark:text-stone-300 transition-all cursor-pointer shadow-xs"
                        >
                          <Upload className="w-4 h-4 text-[#5E7A68]" />
                          <span>{isEn ? 'Select Image from File / Gallery' : 'Pilih Berkas dari Galeri / File'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex items-center justify-center gap-2.5 p-4 bg-stone-50/80 hover:bg-[#7D562D]/10 dark:bg-stone-900/80 dark:hover:bg-[#7D562D]/15 border border-dashed border-stone-300 dark:border-stone-700 hover:border-[#7D562D] rounded-2xl text-xs font-bold text-stone-700 dark:text-stone-300 transition-all cursor-pointer shadow-xs"
                        >
                          <Camera className="w-4 h-4 text-[#7D562D]" />
                          <span>{isEn ? 'Snap Live Camera Photo' : 'Jepret Kamera Fisik Langsung'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... atau tautan CDN gambar resmi"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs font-mono text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#7D562D]/30"
                    />
                    {imageUrl && (
                      <div className="mt-3 flex items-center gap-3 p-3 rounded-2xl bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700">
                        <img
                          src={imageUrl}
                          alt="Preview URL"
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover border border-white/60 dark:border-stone-700"
                        />
                        <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                          {isEn ? 'Remote Image Preview Connected' : 'Pratinjau Foto Tautan Web Terhubung'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  {isEn ? 'Technical Specifications & Audit Notes' : 'Spesifikasi Teknis & Catatan Audit Tambahan'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isEn ? 'Include hardware configurations, power ratings, software licenses, or handling instructions...' : 'Tuliskan spesifikasi teknis, sertifikasi, lisensi perangkat, atau petunjuk penanganan khusus...'}
                  className="w-full px-3.5 py-2.5 bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-700 rounded-2xl text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#5E7A68]/30"
                />
              </div>
            </div>
          </div>

          {/* 3. Floating Spatial Action Dock */}
          <div className="p-3 sm:px-5 sm:py-3.5 rounded-2xl bg-[#FBF9F4]/95 dark:bg-[#181F19]/95 backdrop-blur-md border border-stone-200/80 dark:border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-10 shadow-md shadow-stone-900/5">
            <div className="hidden sm:flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#5E7A68]" />
              <span>{isEn ? 'Auto cryptographic SHA-256 ledger record created on save.' : 'Catatan ledger kriptografi SHA-256 dibuat otomatis saat disimpan.'}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-all cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-[#181F19] hover:bg-[#2D342E] dark:bg-[#5E7A68] dark:hover:bg-[#4E6857] text-white text-xs font-bold shadow-md shadow-[#181F19]/20 dark:shadow-[#5E7A68]/20 transition-all cursor-pointer active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? (isEn ? 'Save Changes' : 'Simpan Perubahan') : (isEn ? 'Register Inventory Asset' : 'Registrasikan Aset')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
