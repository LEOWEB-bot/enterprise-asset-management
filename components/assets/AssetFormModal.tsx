import React, { useState, useEffect, useRef } from 'react';
import { X, Save, RefreshCw, Wand2, Tag, Radio, Image as ImageIcon, DollarSign, Calendar, Building, Box, Upload, Camera, Trash2, Link } from 'lucide-react';
import { Asset, AssetCategory, AssetLocation, AssetStatus, AssetCondition } from '../../types';
import { generateRfidHex, generateNfcUid, generateAssetQrPayload } from '../../services/qrService';
import { calculateStraightLineDepreciation, formatRupiah } from '../../services/depreciationService';
import { StorageService } from '../../services/storageService';

interface AssetFormModalProps {
  assetToEdit: Asset | null;
  categories: AssetCategory[];
  locations: AssetLocation[];
  onSave: (assetData: Partial<Asset>) => void;
  onClose: () => void;
  codePrefix?: string;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  assetToEdit,
  categories,
  locations,
  onSave,
  onClose,
  codePrefix,
}) => {
  const isEditing = Boolean(assetToEdit);
  const effectivePrefix = codePrefix || StorageService.getAssetCodePrefix();

  // Auto generated initial code
  const initialCode =
    assetToEdit?.assetCode ||
    `${effectivePrefix}${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const [assetCode, setAssetCode] = useState(initialCode);
  const [name, setName] = useState(assetToEdit?.name || '');
  const [serialNumber, setSerialNumber] = useState(assetToEdit?.serialNumber || '');
  const [categoryId, setCategoryId] = useState(assetToEdit?.categoryId || (categories[0]?.id || ''));
  const [locationId, setLocationId] = useState(assetToEdit?.locationId || (locations[0]?.id || ''));
  const [department, setDepartment] = useState(assetToEdit?.department || 'IT & Infrastructure');
  const [picName, setPicName] = useState(assetToEdit?.picName || 'Budi Santoso, S.Kom');
  const [picEmail, setPicEmail] = useState(assetToEdit?.picEmail || 'admin@assetcorp.id');
  const [status, setStatus] = useState<AssetStatus>(assetToEdit?.status || 'ACTIVE');
  const [condition, setCondition] = useState<AssetCondition>(assetToEdit?.condition || 'EXCELLENT');
  const [purchaseDate, setPurchaseDate] = useState(assetToEdit?.purchaseDate || new Date().toISOString().substring(0, 10));
  const [purchaseCost, setPurchaseCost] = useState<number>(assetToEdit?.purchaseCost || 15000000);
  const [residualValue, setResidualValue] = useState<number>(assetToEdit?.residualValue || 1500000);
  const [usefulLifeYears, setUsefulLifeYears] = useState<number>(assetToEdit?.usefulLifeYears || 4);
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState(assetToEdit?.warrantyExpiryDate || '');
  const [imageUrl, setImageUrl] = useState(assetToEdit?.imageUrl || '');
  const [rfidTag, setRfidTag] = useState(assetToEdit?.rfidTag || generateRfidHex());
  const [nfcTag, setNfcTag] = useState(assetToEdit?.nfcTag || generateNfcUid());
  const [notes, setNotes] = useState(assetToEdit?.notes || '');

  const [photoInputMode, setPhotoInputMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Compress & convert uploaded image to optimal base64
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (.jpg, .png, .webp)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
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

  // Calculate realtime book value
  const depCalc = calculateStraightLineDepreciation(purchaseCost, residualValue, usefulLifeYears, purchaseDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !assetCode.trim()) {
      alert('Nama dan Kode Aset wajib diisi!');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const selectedLoc = locations.find((l) => l.id === locationId);

    const assetId = assetToEdit?.id || `ast-${Date.now()}`;
    const qrPayload = generateAssetQrPayload(assetCode, assetId, 'PUBLIC_URL');

    onSave({
      id: assetId,
      assetCode,
      name,
      serialNumber: serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      categoryId,
      categoryName: selectedCategory?.name || 'Umum',
      locationId,
      locationName: selectedLoc?.name || 'Kantor Pusat',
      department,
      picName,
      picEmail,
      status,
      condition,
      purchaseDate,
      purchaseCost,
      residualValue,
      usefulLifeYears,
      currentBookValue: depCalc.currentBookValue,
      warrantyExpiryDate: warrantyExpiryDate || undefined,
      imageUrl: imageUrl || undefined,
      rfidTag,
      nfcTag,
      qrPayload,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <Box className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isEditing ? `Edit Data Aset: ${assetToEdit?.assetCode}` : 'Registrasi Inventaris Aset Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section 1: Basic Identity */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. Identitas Utama Aset</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kode Aset *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={assetCode || ''}
                    onChange={(e) => setAssetCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-blue-600 dark:text-blue-400 focus:outline-hidden"
                  />
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() =>
                        setAssetCode(
                          `${effectivePrefix}${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
                        )
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500"
                      title="Generate Kode Baru"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Aset Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MacBook Pro 16 M3 Max 36GB"
                  value={name || ''}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Seri (Serial Number)
                </label>
                <input
                  type="text"
                  placeholder="SN-9988124"
                  value={serialNumber || ''}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Aset *
                </label>
                <select
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.depreciationPeriodYears} thn)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Operasional
                </label>
                <select
                  value={status || 'ACTIVE'}
                  onChange={(e) => setStatus(e.target.value as AssetStatus)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="ACTIVE">ACTIVE (Aktif Siap Pakai)</option>
                  <option value="IN_USE">IN_USE (Sedang Digunakan)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Pemeliharaan)</option>
                  <option value="RESERVED">RESERVED (Dicadangkan)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Penempatan & PIC */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              2. Lokasi Fisik & Penanggung Jawab (PIC)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Lokasi Gedung</label>
                <select
                  value={locationId || ''}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Departemen</label>
                <input
                  type="text"
                  value={department || ''}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kondisi Fisik</label>
                <select
                  value={condition || 'EXCELLENT'}
                  onChange={(e) => setCondition(e.target.value as AssetCondition)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="EXCELLENT">EXCELLENT (Sangat Baik)</option>
                  <option value="GOOD">GOOD (Baik)</option>
                  <option value="FAIR">FAIR (Cukup)</option>
                  <option value="POOR">POOR (Kurang Baik)</option>
                  <option value="DAMAGED">DAMAGED (Rusak)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama PIC</label>
                <input
                  type="text"
                  value={picName || ''}
                  onChange={(e) => setPicName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email PIC Resmi</label>
                <input
                  type="email"
                  value={picEmail || ''}
                  onChange={(e) => setPicEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Keuangan & Depresiasi */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              3. Nilai Keuangan & Masa Manfaat
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Pembelian
                </label>
                <input
                  type="date"
                  value={purchaseDate || ''}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Harga Perolehan (Rp)
                </label>
                <input
                  type="number"
                  value={purchaseCost ?? 0}
                  onChange={(e) => setPurchaseCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nilai Sisa / Residu (Rp)
                </label>
                <input
                  type="number"
                  value={residualValue ?? 0}
                  onChange={(e) => setResidualValue(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Masa Manfaat (Tahun)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={usefulLifeYears ?? 4}
                  onChange={(e) => setUsefulLifeYears(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Live Calculation Preview Banner */}
            <div className="mt-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs flex items-center justify-between text-blue-900 dark:text-blue-200">
              <span>
                Estimasi Nilai Buku Saat Ini: <strong>{formatRupiah(depCalc.currentBookValue)}</strong>
              </span>
              <span>
                Beban Depresiasi: <strong>{formatRupiah(depCalc.annualDepreciation)}/thn</strong>
              </span>
            </div>
          </div>

          {/* Section 4: RFID, NFC & Gambar */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              4. Tag RFID, NFC & Foto Fisik
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  RFID UHF Tag Hex
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={rfidTag || ''}
                    onChange={(e) => setRfidTag(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-indigo-600 dark:text-indigo-400 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setRfidTag(generateRfidHex())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 text-[10px] font-semibold"
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">NFC UID Tag</label>
                <div className="relative">
                  <input
                    type="text"
                    value={nfcTag || ''}
                    onChange={(e) => setNfcTag(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-indigo-600 dark:text-indigo-400 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setNfcTag(generateNfcUid())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 text-[10px] font-semibold"
                  >
                    Auto
                  </button>
                </div>
              </div>

              {/* Photo Upload / Link Section */}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Foto Fisik Aset
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('upload')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                        photoInputMode === 'upload'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Unggah / Kamera
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('url')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                        photoInputMode === 'url'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Link URL
                    </button>
                  </div>
                </div>

                {photoInputMode === 'upload' ? (
                  <div>
                    {/* Hidden file inputs */}
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
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <img
                          src={imageUrl}
                          alt="Foto Aset"
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            Foto Aset Berhasil Dipasang
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Foto siap disimpan ke database aset
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              Ganti Foto
                            </button>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <button
                              type="button"
                              onClick={() => setImageUrl('')}
                              className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-blue-600" />
                          <span>Pilih dari Galeri / File</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-indigo-600" />
                          <span>Jepret Kamera Langsung</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... atau link CDN gambar"
                      value={imageUrl || ''}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                    />
                    {imageUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={imageUrl}
                          alt="Preview URL"
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <span className="text-[11px] text-slate-400">Pratinjau Foto URL</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan / Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Registrasikan Aset'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
