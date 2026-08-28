import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Check,
  Tag,
  QrCode,
  Sliders,
  Layers,
  FileText,
  Smartphone,
  Eye,
  CheckCircle2,
  Sparkles,
  Building2,
  User,
  MapPin,
  Barcode,
} from 'lucide-react';
import { Asset } from '../../types';
import { generateQrDataUrl, generateAssetQrPayload } from '../../services/qrService';
import { StorageService } from '../../services/storageService';

interface AssetQrSheetModalProps {
  assets: Asset[];
  onClose: () => void;
}

export const AssetQrSheetModal: React.FC<AssetQrSheetModalProps> = ({ assets, onClose }) => {
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'a4' | 'thermal' | 'mini'>('a4');
  
  // Customization Toggles
  const [showBrand, setShowBrand] = useState(true);
  const [showSerial, setShowSerial] = useState(true);
  const [showPic, setShowPic] = useState(true);
  const [showLocation, setShowLocation] = useState(true);

  const appName = StorageService.getAppName() || 'AssetCorp EAM';

  useEffect(() => {
    async function generateAll() {
      setIsGenerating(true);
      const map: Record<string, string> = {};
      for (const asset of assets) {
        const payload = generateAssetQrPayload(asset.assetCode, asset.id, 'PUBLIC_URL');
        const url = await generateQrDataUrl(payload, 240);
        map[asset.id] = url;
      }
      setQrMap(map);
      setIsGenerating(false);
    }
    generateAll();
  }, [assets]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/75 backdrop-blur-md overflow-y-auto animate-fadeIn">
      {/* Modal Container */}
      <div className="spatial-canvas w-full max-w-6xl rounded-[36px] border border-white/60 dark:border-stone-700/60 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* 1. Spatial Control Header (Hidden when printing) */}
        <div className="p-6 sm:p-8 border-b border-stone-200/80 dark:border-stone-800/80 flex flex-col gap-6 bg-white/70 dark:bg-stone-900/80 backdrop-blur-xl print:hidden">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs uppercase tracking-widest text-[#5E7A68] dark:text-emerald-400 font-bold px-3 py-1 rounded-full bg-[#5E7A68]/10 dark:bg-emerald-950/40 border border-[#5E7A68]/20">
                  Label Studio
                </span>
                <div className="px-3 py-1 rounded-full bg-white/70 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 shadow-2xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#5E7A68] animate-pulse" />
                  <span>{assets.length} Label Siap Cetak • Standar ISO/IEC 18004 QR</span>
                </div>
              </div>

              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
                Lembar Cetak Stiker Label QR Code Aset
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                Pilih format layout kertas stiker dan sesuaikan metadata label sebelum dikirimkan ke mesin printer.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handlePrint}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-6 sm:px-7 py-3 rounded-full text-xs font-bold shadow-lg shadow-[#5E7A68]/25 transition-all cursor-pointer hover:scale-105 disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Sekarang (Print)</span>
              </button>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-stone-200/80 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Controls Bar: Layout selector & Metadata toggles */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-200/60 dark:border-stone-800/60 text-xs">
            {/* Format Layout Selector */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-500 uppercase text-[11px]">Format Kertas:</span>
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-stone-200/70 dark:bg-stone-800">
                <button
                  type="button"
                  onClick={() => setLayoutMode('a4')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    layoutMode === 'a4'
                      ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Sheet A4 (Grid 3×4)
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('thermal')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    layoutMode === 'thermal'
                      ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Thermal Roll (50×30 mm)
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('mini')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    layoutMode === 'mini'
                      ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Mini Tag (40×20 mm)
                </button>
              </div>
            </div>

            {/* Field Toggles */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={showBrand}
                  onChange={(e) => setShowBrand(e.target.checked)}
                  className="w-3.5 h-3.5 text-[#5E7A68] rounded cursor-pointer"
                />
                <span>Brand Header</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={showSerial}
                  onChange={(e) => setShowSerial(e.target.checked)}
                  className="w-3.5 h-3.5 text-[#5E7A68] rounded cursor-pointer"
                />
                <span>Serial Number</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={showPic}
                  onChange={(e) => setShowPic(e.target.checked)}
                  className="w-3.5 h-3.5 text-[#5E7A68] rounded cursor-pointer"
                />
                <span>PIC Aset</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={showLocation}
                  onChange={(e) => setShowLocation(e.target.checked)}
                  className="w-3.5 h-3.5 text-[#5E7A68] rounded cursor-pointer"
                />
                <span>Lokasi</span>
              </label>
            </div>
          </div>
        </div>

        {/* 2. Printable Canvas Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#F5F3EE] dark:bg-stone-950 print:p-0 print:bg-white print:overflow-visible">
          {isGenerating ? (
            <div className="p-16 text-center space-y-3">
              <QrCode className="w-10 h-10 mx-auto text-[#5E7A68] animate-pulse" />
              <p className="text-xs font-semibold text-stone-500">
                Memproses dan meng-generate {assets.length} QR Code beresolusi tinggi...
              </p>
            </div>
          ) : (
            <div
              className={`grid gap-4 sm:gap-6 ${
                layoutMode === 'a4'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : layoutMode === 'thermal'
                  ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
                  : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              }`}
            >
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white text-stone-900 border-2 border-dashed border-stone-300 rounded-[24px] p-5 shadow-xs flex flex-col justify-between break-inside-avoid relative group hover:border-[#5E7A68] transition-colors"
                >
                  {/* Company Top Brand */}
                  {showBrand && (
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2.5 mb-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Building2 className="w-3.5 h-3.5 text-[#5E7A68] shrink-0" />
                        <span className="font-bold text-[11px] uppercase tracking-wider text-stone-800 truncate">
                          {appName}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-stone-500 px-2 py-0.5 bg-stone-100 rounded-md shrink-0">
                        MILIK INSTANSI
                      </span>
                    </div>
                  )}

                  {/* QR Image & Core Identifiers */}
                  <div className="flex items-center gap-4">
                    {/* QR Frame */}
                    <div className="w-24 h-24 p-1.5 bg-white border border-stone-300 rounded-xl shrink-0 flex items-center justify-center shadow-2xs">
                      {qrMap[asset.id] ? (
                        <img
                          src={qrMap[asset.id]}
                          alt={asset.assetCode}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-stone-100 rounded-lg animate-pulse" />
                      )}
                    </div>

                    {/* Metadata Specs */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="font-mono font-bold text-xs sm:text-sm text-[#181F19] tracking-tight bg-[#5E7A68]/10 text-[#5E7A68] px-2.5 py-0.5 rounded-lg inline-block">
                        {asset.assetCode}
                      </div>

                      {showSerial && asset.serialNumber && (
                        <div className="text-[10px] font-mono text-stone-500 truncate flex items-center gap-1">
                          <Barcode className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>SN: {asset.serialNumber}</span>
                        </div>
                      )}

                      <div className="font-bold text-xs text-stone-900 line-clamp-2 leading-snug pt-0.5">
                        {asset.name}
                      </div>

                      {showLocation && asset.locationName && (
                        <div className="text-[10px] text-stone-600 truncate flex items-center gap-1 pt-0.5">
                          <MapPin className="w-3 h-3 text-[#5E7A68] shrink-0" />
                          <span>{asset.locationName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Verification Strip */}
                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500">
                    {showPic && asset.picName ? (
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <User className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">PIC: {asset.picName}</span>
                      </span>
                    ) : (
                      <span className="text-[9px] text-stone-400">EAM VERIFIED</span>
                    )}

                    <span className="font-mono font-bold text-[9px] text-[#5E7A68] bg-[#5E7A68]/10 px-2 py-0.5 rounded-full shrink-0">
                      {asset.rfidTag ? 'RFID/NFC' : 'QR SCANNABLE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
