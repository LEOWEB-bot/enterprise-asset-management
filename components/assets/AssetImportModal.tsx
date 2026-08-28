import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  ArrowRight,
  Database,
  Layers,
  Image as ImageIcon,
  Check,
  RefreshCw,
  FileText,
  Minus,
  Sparkles,
  Search,
  Filter,
  SlidersHorizontal,
  Info,
  Radio,
  Cpu,
  MapPin,
  Tag,
  Building,
  User,
} from 'lucide-react';
import { Asset, AssetCategory, AssetLocation, AssetStatus, AssetCondition } from '../../types';
import { calculateStraightLineDepreciation, formatRupiah } from '../../services/depreciationService';
import { generateAssetQrPayload } from '../../services/qrService';
import { StorageService } from '../../services/storageService';
import { getI18n, AppLanguage } from '../../utils/i18n';

interface AssetImportModalProps {
  existingAssets: Asset[];
  categories: AssetCategory[];
  locations: AssetLocation[];
  onClose: () => void;
  onImportComplete: (importedAssets: Asset[], mode: 'skip' | 'overwrite') => void;
}

interface ParsedRow {
  rowNumber: number;
  raw: Record<string, string>;
  asset: Asset;
  status: 'valid' | 'warning' | 'error';
  isDuplicate: boolean;
  messages: string[];
}

export const AssetImportModal: React.FC<AssetImportModalProps> = ({
  existingAssets,
  categories,
  locations,
  onClose,
  onImportComplete,
}) => {
  const currentLang: AppLanguage = StorageService.getLanguage() || 'id';
  const isEn = currentLang === 'en';

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [duplicatePolicy, setDuplicatePolicy] = useState<'skip' | 'overwrite'>('skip');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'preview'>('upload');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'valid' | 'warning' | 'duplicate'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template CSV content
  const downloadTemplate = () => {
    const headers = [
      'Kode Aset',
      'Nama Aset',
      'Kategori',
      'Lokasi',
      'Nomor Seri',
      'Tanggal Beli (YYYY-MM-DD)',
      'Harga Perolehan',
      'Masa Manfaat (Tahun)',
      'Nilai Residu',
      'PIC',
      'Email PIC',
      'Status',
      'Kondisi',
      'URL Foto Aset',
      'Tag RFID',
      'Tag NFC',
      'Catatan',
    ];

    const sampleRows = [
      [
        'AST-2026-091',
        'MacBook Pro 16 M3 Max',
        categories[0]?.name || 'IT Hardware & Perangkat Lunak',
        locations[0]?.name || 'Kantor Pusat Jakarta',
        'C02G12345ABC',
        '2026-01-15',
        '42000000',
        '4',
        '1000000',
        'Budi Santoso',
        'budi@assetcorp.id',
        'ACTIVE',
        'EXCELLENT',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80',
        'E2801160600002047814ABCD',
        '04:A2:3B:4C:5D:6E:7F',
        'Laptop operasional Tim Lead Developer',
      ],
      [
        'AST-2026-092',
        'Toyota Hilux 4x4 Double Cabin',
        categories[2]?.name || 'Kendaraan Operasional',
        locations[1]?.name || 'Gudang Logistik & Pool',
        'MHF231G56984210',
        '2025-06-10',
        '485000000',
        '8',
        '50000000',
        'Hendra Pratama',
        'hendra@assetcorp.id',
        'IN_USE',
        'GOOD',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&auto=format&fit=crop&q=80',
        'E28011606000020478149999',
        '04:F1:2C:3D:4E:5F:80',
        'Unit armada survei lapangan wilayah Jawa Barat',
      ],
      [
        'AST-2026-093',
        'Komatsu PC200-8M0 Hydraulic Excavator',
        categories[1]?.name || 'Mesin & Peralatan Berat',
        locations[2]?.name || 'Site Proyek Cikarang',
        'KMTPC200X89104',
        '2024-03-20',
        '1650000000',
        '10',
        '150000000',
        'Agus Setiawan',
        'agus.s@assetcorp.id',
        'ACTIVE',
        'GOOD',
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
        'E28011606000020478148888',
        '04:88:1A:2B:3C:4D:5E',
        'Excavator operasional tambang & earthmoving',
      ],
    ];

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...sampleRows.map((row) =>
          row.map((val) => `"${(val || '').toString().replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Template_Import_Master_Aset_AssetCorp.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV Parsing
  const parseCSVText = (text: string) => {
    try {
      const lines: string[] = [];
      let currentLine = '';
      let insideQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
          insideQuotes = !insideQuotes;
          currentLine += char;
        } else if ((char === '\n' || char === '\r') && !insideQuotes) {
          if (currentLine.trim()) {
            lines.push(currentLine);
          }
          currentLine = '';
          if (char === '\r' && text[i + 1] === '\n') {
            i++;
          }
        } else {
          currentLine += char;
        }
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }

      if (lines.length < 2) {
        throw new Error(isEn ? 'CSV file is empty or has no data rows.' : 'File CSV kosong atau tidak memiliki baris data.');
      }

      // Parse headers
      const parseRowValues = (rowStr: string): string[] => {
        const values: string[] = [];
        let curVal = '';
        let inQ = false;
        for (let i = 0; i < rowStr.length; i++) {
          const c = rowStr[i];
          if (c === '"') {
            if (inQ && rowStr[i + 1] === '"') {
              curVal += '"';
              i++;
            } else {
              inQ = !inQ;
            }
          } else if (c === ',' && !inQ) {
            values.push(curVal.trim());
            curVal = '';
          } else {
            curVal += c;
          }
        }
        values.push(curVal.trim());
        return values;
      };

      const headerCols = parseRowValues(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const parsed: ParsedRow[] = [];

      for (let r = 1; r < lines.length; r++) {
        const rawVals = parseRowValues(lines[r]);
        if (rawVals.every((v) => !v)) continue; // skip empty rows

        const getVal = (possibleHeaders: string[]): string => {
          for (const ph of possibleHeaders) {
            const idx = headerCols.findIndex((hc) => hc.includes(ph));
            if (idx !== -1 && rawVals[idx]) {
              return rawVals[idx];
            }
          }
          return '';
        };

        const assetCode = getVal(['kode', 'code', 'assetcode']) || `AST-IMP-${Math.floor(1000 + Math.random() * 9000)}`;
        const name = getVal(['nama', 'name', 'deskripsi', 'description']) || `Aset Baru #${r}`;
        const catName = getVal(['kategori', 'category']);
        const locName = getVal(['lokasi', 'location']);
        const serialNo = getVal(['serial', 'nomorseri', 'sn']);
        const purchaseDateStr = getVal(['tanggal', 'tgl', 'purchasedate', 'date']) || new Date().toISOString().slice(0, 10);
        const costStr = (getVal(['harga', 'cost', 'perolehan', 'price', 'nilaibeli']) || '').replace(/[^0-9]/g, '');
        const cost = Number(costStr) || 0;
        const usefulLifeStr = (getVal(['manfaat', 'usefullife', 'tahun', 'years']) || '').replace(/[^0-9]/g, '');
        const usefulLife = Number(usefulLifeStr) || 4;
        const residualStr = (getVal(['residu', 'residual', 'salvage', 'sisa']) || '').replace(/[^0-9]/g, '');
        const residual = Number(residualStr) || 0;
        const pic = getVal(['pic', 'penanggung', 'user', 'pemegang']) || 'PIC Lapangan';
        const picEmail = getVal(['email']) || `${(pic || '').toLowerCase().replace(/\s+/g, '')}@assetcorp.id`;
        const statusRaw = getVal(['status']).toUpperCase();
        const conditionRaw = getVal(['kondisi', 'condition']).toUpperCase();
        const imageUrl = getVal(['url', 'foto', 'image', 'photo', 'gambar']);
        const rfid = getVal(['rfid']) || '';
        const nfc = getVal(['nfc']) || '';
        const notes = getVal(['catatan', 'notes', 'keterangan']) || '';

        // Match Category
        const matchedCat = categories.find(
          (c) => c.name.toLowerCase() === catName.toLowerCase() || c.code.toLowerCase() === catName.toLowerCase()
        ) || categories[0] || { id: 'cat-gen-01', name: 'Umum & Operasional', code: 'GEN', depreciationPeriodYears: 4 };

        // Match Location
        const matchedLoc = locations.find(
          (l) => l.name.toLowerCase() === locName.toLowerCase() || l.code.toLowerCase() === locName.toLowerCase()
        ) || locations[0] || { id: 'loc-hq-01', name: 'Kantor Pusat Jakarta', code: 'HQ', city: 'Jakarta' };

        // Normalize status & condition
        const validStatuses: AssetStatus[] = ['ACTIVE', 'IN_USE', 'MAINTENANCE', 'DISPOSED', 'MISSING', 'RESERVED'];
        const status: AssetStatus = validStatuses.includes(statusRaw as AssetStatus)
          ? (statusRaw as AssetStatus)
          : 'ACTIVE';

        const validConditions: AssetCondition[] = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'];
        const condition: AssetCondition = validConditions.includes(conditionRaw as AssetCondition)
          ? (conditionRaw as AssetCondition)
          : 'GOOD';

        // Deprecations & Book Value
        const dep = calculateStraightLineDepreciation(cost, residual, usefulLife, purchaseDateStr);

        const isDuplicate = existingAssets.some(
          (ea) => ea.assetCode.toLowerCase() === assetCode.toLowerCase() || (serialNo && ea.serialNumber && ea.serialNumber.toLowerCase() === serialNo.toLowerCase())
        );

        const messages: string[] = [];
        let rowStatus: 'valid' | 'warning' | 'error' = 'valid';

        if (!name || name.startsWith('Aset Baru #')) {
          messages.push(isEn ? 'Using default fallback asset name' : 'Nama aset menggunakan nama standar bawaan');
          rowStatus = 'warning';
        }
        if (cost <= 0) {
          messages.push(isEn ? 'Acquisition cost is 0' : 'Harga perolehan bernilai 0');
          rowStatus = 'warning';
        }
        if (isDuplicate) {
          messages.push(isEn ? 'Asset Code / Serial Number already exists in database' : 'Kode Aset / Nomor Seri sudah ada di database');
          rowStatus = 'warning';
        }
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:image')) {
          messages.push(isEn ? 'Image URL format is invalid (use http/https)' : 'Format URL Foto tidak valid (gunakan awalan http/https)');
          rowStatus = 'warning';
        }

        const newAssetId = `ast-imp-${Date.now()}-${r}`;
        const newAsset: Asset = {
          id: newAssetId,
          assetCode,
          name,
          categoryId: matchedCat.id,
          categoryName: matchedCat.name,
          locationId: matchedLoc.id,
          locationName: matchedLoc.name,
          department: matchedLoc.building || 'Operasional',
          serialNumber: serialNo || `SN-${assetCode}`,
          purchaseDate: purchaseDateStr,
          purchaseCost: cost,
          residualValue: residual,
          usefulLifeYears: usefulLife,
          currentBookValue: dep.currentBookValue,
          picName: pic,
          picEmail: picEmail,
          status,
          condition,
          imageUrl: imageUrl || '',
          rfidTag: rfid,
          nfcTag: nfc,
          qrPayload: generateAssetQrPayload(assetCode, newAssetId, 'PUBLIC_URL'),
          notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        parsed.push({
          rowNumber: r,
          raw: {},
          asset: newAsset,
          status: rowStatus,
          isDuplicate,
          messages,
        });
      }

      setParsedRows(parsed);
      setParseError(null);
      setActiveStep('preview');
    } catch (err: any) {
      setParseError(err.message || (isEn ? 'Failed to parse CSV format.' : 'Gagal membaca format file CSV.'));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        parseCSVText(text);
      }
    };
    reader.readAsText(uploadedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          parseCSVText(text);
        }
      };
      reader.readAsText(droppedFile);
    } else {
      setParseError(isEn ? 'Please upload a valid .csv file' : 'Mohon unggah file dengan format .csv');
    }
  };

  const handleExecuteImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      let finalAssetsToImport = parsedRows.map((pr) => pr.asset);
      if (duplicatePolicy === 'skip') {
        finalAssetsToImport = parsedRows.filter((pr) => !pr.isDuplicate).map((pr) => pr.asset);
      }
      onImportComplete(finalAssetsToImport, duplicatePolicy);
      setIsProcessing(false);
      onClose();
    }, 700);
  };

  const validCount = parsedRows.filter((r) => !r.isDuplicate && r.status !== 'error').length;
  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;
  const warningCount = parsedRows.filter((r) => r.status === 'warning' && !r.isDuplicate).length;

  const filteredRows = parsedRows.filter((pr) => {
    if (activeFilterTab === 'valid') return !pr.isDuplicate && pr.status !== 'error';
    if (activeFilterTab === 'warning') return pr.status === 'warning' && !pr.isDuplicate;
    if (activeFilterTab === 'duplicate') return pr.isDuplicate;
    return true;
  }).filter((pr) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      pr.asset.assetCode.toLowerCase().includes(q) ||
      pr.asset.name.toLowerCase().includes(q) ||
      pr.asset.categoryName.toLowerCase().includes(q) ||
      pr.asset.locationName.toLowerCase().includes(q) ||
      pr.asset.picName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      {/* Spatial Web-OS Window Container */}
      <div className="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-[32px] sm:rounded-[36px] bg-[#FBF9F4]/98 dark:bg-stone-900/98 border border-stone-200/90 dark:border-stone-800 shadow-2xl backdrop-blur-3xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* 1. Spatial Window Header */}
        <div className="px-6 py-4.5 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between bg-white/60 dark:bg-stone-900/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 border border-[#5E7A68]/30 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center shadow-inner shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif-display text-base sm:text-lg font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
                  {isEn ? 'Batch CSV Asset Importer Studio' : 'Studio Impor Massal Data Aset'}
                </h2>
                {/* Step Pill */}
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-[10px] font-bold text-stone-700 dark:text-stone-300 font-mono">
                  <SlidersHorizontal className="w-3 h-3 text-[#7D562D]" />
                  <span>
                    {activeStep === 'upload'
                      ? isEn
                        ? 'Step 1: Upload & Mapping'
                        : 'Langkah 1: Unggah & Pemetaan Kolom'
                      : isEn
                      ? 'Step 2: Preview & Health Validation'
                      : 'Langkah 2: Pratinjau & Validasi Kualitas Data'}
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                {isEn
                  ? 'Bulk onboard thousands of assets with categories, financial specs, and physical photo links.'
                  : 'Unggah ribuan data master aset sekaligus lengkap dengan taksonomi, valuasi biaya, dan foto fisik.'}
              </p>
            </div>
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-200/60 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
              title={isEn ? 'Close Window' : 'Tutup Jendela'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Top Action Bar & Duplicate Policy (Inside Window) */}
        <div className="px-6 py-3 border-b border-stone-200/60 dark:border-stone-800 bg-[#F5F3EE]/60 dark:bg-stone-900/40 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          {/* Template Download Button */}
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-bold hover:bg-stone-100 dark:hover:bg-stone-700/80 transition-all cursor-pointer shadow-2xs text-[11px]"
          >
            <Download className="w-3.5 h-3.5 text-[#5E7A68]" />
            <span>{isEn ? 'Download Standard CSV Template' : 'Unduh Format Template CSV'}</span>
          </button>

          {/* Duplicate Handling Policy Capsule */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-stone-500 font-medium">
              {isEn ? 'Duplicate Policy:' : 'Kebijakan Duplikasi:'}
            </span>
            <div className="p-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 flex items-center gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setDuplicatePolicy('skip')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  duplicatePolicy === 'skip'
                    ? 'bg-[#181F19] text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                {isEn ? 'Skip' : 'Lewati'}
              </button>
              <button
                type="button"
                onClick={() => setDuplicatePolicy('overwrite')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  duplicatePolicy === 'overwrite'
                    ? 'bg-[#181F19] text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                {isEn ? 'Overwrite / Update' : 'Timpa / Update'}
              </button>
            </div>
          </div>
        </div>

        {/* 3. Content Body (Step 1 Upload or Step 2 Preview) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeStep === 'upload' ? (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Drag-and-Drop Spatial Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#5E7A68]/40 dark:border-stone-700 hover:border-[#5E7A68] dark:hover:border-emerald-400 bg-white/60 dark:bg-stone-800/40 hover:bg-[#5E7A68]/5 dark:hover:bg-emerald-950/20 rounded-3xl p-10 sm:p-14 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group shadow-sm"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-3xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-serif-display text-base sm:text-lg font-bold text-[#181F19] dark:text-stone-100">
                    {isEn
                      ? 'Click to Select CSV File or Drag & Drop Here'
                      : 'Klik untuk Memilih File CSV atau Seret & Lepaskan di Sini'}
                  </p>
                  <p className="text-xs text-stone-500">
                    {isEn
                      ? 'Supports UTF-8 CSV exports from Excel, Google Sheets, SAP, or legacy EAM databases.'
                      : 'Mendukung ekspor tabel CSV UTF-8 dari Microsoft Excel, Google Sheets, atau database ERP.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded-lg bg-stone-200/70 dark:bg-stone-800 text-[10px] font-mono font-bold text-stone-700 dark:text-stone-300">
                    .CSV (UTF-8)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-stone-200/70 dark:bg-stone-800 text-[10px] font-mono font-bold text-stone-700 dark:text-stone-300">
                    Max 50MB
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-stone-200/70 dark:bg-stone-800 text-[10px] font-mono font-bold text-stone-700 dark:text-stone-300">
                    Up to 10,000 Rows
                  </span>
                </div>

                <button
                  type="button"
                  className="mt-2 px-6 py-2.5 rounded-full bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] text-xs font-bold shadow-md group-hover:shadow-lg transition-all"
                >
                  {isEn ? 'Select File from Computer' : 'Pilih Berkas dari Komputer'}
                </button>
              </div>

              {parseError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
                  <XCircle className="w-5 h-5 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Guide Bento Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#5E7A68] dark:text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <span>{isEn ? 'Automatic Field Matching' : 'Pemetaan Otomatis'}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Sistem mendeteksi sinonim kolom seperti Kode, Nama, Kategori, Harga Beli, Serial Number secara cerdas.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#7D562D] dark:text-amber-400">
                    <ImageIcon className="w-4 h-4" />
                    <span>{isEn ? 'Physical Photo URLs' : 'Link Foto Fisik Aset'}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Masukkan URL gambar langsung pada kolom CSV, atau kosongkan untuk unggah via kamera ponsel nanti.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200">
                    <Radio className="w-4 h-4" />
                    <span>{isEn ? 'RFID & NFC Tagging' : 'Tag RFID & NFC'}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Dapat mengimpor data chip EPC RFID dan NFC UID untuk aset yang telah dipasang stiker sensor fisik.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 4 Data Health Bento KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {/* Total */}
                <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-700/80 space-y-1 shadow-2xs">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    {isEn ? 'Total Detected' : 'Total Terdeteksi'}
                  </div>
                  <div className="font-serif-display text-xl font-bold text-stone-900 dark:text-stone-100">
                    {parsedRows.length} {isEn ? 'Assets' : 'Aset'}
                  </div>
                </div>

                {/* Valid */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-1 shadow-2xs">
                  <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Ready to Import' : 'Siap Diimpor Valid'}</span>
                  </div>
                  <div className="font-serif-display text-xl font-bold text-emerald-900 dark:text-emerald-300">
                    {validCount} {isEn ? 'Assets' : 'Aset'}
                  </div>
                </div>

                {/* Warnings */}
                <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 space-y-1 shadow-2xs">
                  <div className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Warnings / Partial' : 'Peringatan / Data Parsial'}</span>
                  </div>
                  <div className="font-serif-display text-xl font-bold text-amber-900 dark:text-amber-300">
                    {warningCount} {isEn ? 'Assets' : 'Aset'}
                  </div>
                </div>

                {/* Duplicates */}
                <div className="p-4 rounded-2xl bg-stone-200/60 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 space-y-1 shadow-2xs">
                  <div className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Duplicates Found' : 'Duplikat Terdeteksi'}</span>
                  </div>
                  <div className="font-serif-display text-xl font-bold text-stone-900 dark:text-stone-100">
                    {duplicateCount} {isEn ? 'Assets' : 'Aset'}
                  </div>
                </div>
              </div>

              {/* Filter Tabs & Search Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-2xl bg-stone-200/60 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                  <button
                    type="button"
                    onClick={() => setActiveFilterTab('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      activeFilterTab === 'all'
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    {isEn ? 'All' : 'Semua'} ({parsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilterTab('valid')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      activeFilterTab === 'valid'
                        ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    {isEn ? 'Valid Only' : 'Valid Saja'} ({validCount})
                  </button>
                  {warningCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveFilterTab('warning')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        activeFilterTab === 'warning'
                          ? 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-300 shadow-2xs'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                      }`}
                    >
                      {isEn ? 'Warnings' : 'Peringatan'} ({warningCount})
                    </button>
                  )}
                  {duplicateCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveFilterTab('duplicate')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        activeFilterTab === 'duplicate'
                          ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                      }`}
                    >
                      {isEn ? 'Duplicates' : 'Duplikat'} ({duplicateCount})
                    </button>
                  )}
                </div>

                {/* Search in Preview */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={isEn ? 'Filter preview table...' : 'Cari di pratinjau...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-[#5E7A68]"
                  />
                </div>
              </div>

              {/* Granular High-Density Preview Grid */}
              <div className="border border-stone-200/90 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs bg-white dark:bg-stone-900">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F5F3EE] dark:bg-stone-800/90 sticky top-0 z-10 text-stone-700 dark:text-stone-300 font-bold border-b border-stone-200 dark:border-stone-700">
                      <tr>
                        <th className="px-3.5 py-3">Status</th>
                        <th className="px-3.5 py-3">Foto</th>
                        <th className="px-3.5 py-3">{isEn ? 'Asset Code' : 'Kode Aset'}</th>
                        <th className="px-3.5 py-3">{isEn ? 'Asset Name' : 'Nama Aset'}</th>
                        <th className="px-3.5 py-3">{isEn ? 'Category' : 'Kategori'}</th>
                        <th className="px-3.5 py-3">{isEn ? 'Location' : 'Lokasi'}</th>
                        <th className="px-3.5 py-3">{isEn ? 'Cost' : 'Harga Perolehan'}</th>
                        <th className="px-3.5 py-3">{isEn ? 'Useful Life' : 'Masa Manfaat'}</th>
                        <th className="px-3.5 py-3">RFID / NFC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                      {filteredRows.map((pr) => (
                        <tr
                          key={pr.rowNumber}
                          className={`hover:bg-[#FBF9F4] dark:hover:bg-stone-800/50 transition-colors ${
                            pr.isDuplicate ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="px-3.5 py-2.5 shrink-0">
                            {pr.isDuplicate ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                {isEn ? 'Duplicate' : 'Duplikat'}
                              </span>
                            ) : pr.status === 'valid' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{isEn ? 'Valid' : 'Siap Impor'}</span>
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                title={pr.messages.join(', ')}
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span>{isEn ? 'Warning' : 'Peringatan'}</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5">
                            {pr.asset.imageUrl ? (
                              <img
                                src={pr.asset.imageUrl}
                                alt={pr.asset.name}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-xl object-cover border border-stone-200 dark:border-stone-700 shadow-2xs"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-xs">
                              {pr.asset.assetCode}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="font-bold text-stone-900 dark:text-stone-100 truncate max-w-[220px]">
                              {pr.asset.name}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono truncate">
                              SN: {pr.asset.serialNumber}
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 text-stone-700 dark:text-stone-300">
                            {pr.asset.categoryName}
                          </td>
                          <td className="px-3.5 py-2.5 text-stone-700 dark:text-stone-300">
                            {pr.asset.locationName}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono font-bold text-stone-900 dark:text-stone-100">
                            {formatRupiah(pr.asset.purchaseCost)}
                          </td>
                          <td className="px-3.5 py-2.5 text-stone-600 dark:text-stone-400">
                            {pr.asset.usefulLifeYears} {isEn ? 'Years' : 'Tahun'}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-[11px] text-stone-500">
                            {pr.asset.rfidTag ? (
                              <span className="text-[#5E7A68] dark:text-emerald-400 font-semibold truncate block max-w-[120px]">
                                {pr.asset.rfidTag}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Bottom Spatial Action Dock */}
        <div className="px-6 py-4 border-t border-stone-200/80 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {activeStep === 'preview' ? (
            <button
              type="button"
              onClick={() => {
                setActiveStep('upload');
                setParsedRows([]);
                setFile(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isEn ? 'Re-upload Another CSV' : 'Unggah Ulang Berkas CSV'}</span>
            </button>
          ) : (
            <div className="text-[11px] text-stone-400">
              *Format yang didukung: UTF-8 CSV Standar Excel & Sheets
            </div>
          )}

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Batal'}
            </button>

            {activeStep === 'preview' && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isProcessing || (duplicatePolicy === 'skip' && validCount === 0)}
                className="flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#181F19] hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-[#181F19] text-xs font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isEn ? 'Writing to Master Database...' : 'Menyimpan ke Database Master...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      {isEn ? 'Execute Mass Import' : 'Eksekusi Impor Massal'} ({duplicatePolicy === 'skip' ? validCount : parsedRows.length} {isEn ? 'Assets' : 'Aset'})
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

