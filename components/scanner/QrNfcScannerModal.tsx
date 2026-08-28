import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  QrCode,
  Radio,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Box,
  Sliders,
  ShieldCheck,
  Zap,
  MapPin,
  UserCheck,
  Tag,
  Wrench,
  ArrowLeftRight,
  ExternalLink,
} from 'lucide-react';
import { Asset } from '../../types';
import { getStatusBadgeClass } from '../../services/authService';

interface QrNfcScannerModalProps {
  assets?: Asset[];
  onClose: () => void;
  onSelectAsset: (asset: Asset) => void;
  onOpenMovement: (asset: Asset) => void;
  onOpenMaintenance: (asset: Asset) => void;
}

export const QrNfcScannerModal: React.FC<QrNfcScannerModalProps> = ({
  assets = [],
  onClose,
  onSelectAsset,
  onOpenMovement,
  onOpenMaintenance,
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'rfid_simulator' | 'manual'>('camera');
  const [manualQuery, setManualQuery] = useState('');
  const [detectedAsset, setDetectedAsset] = useState<Asset | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState(false);

  // Inisialisasi video stream kamera
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    if (activeMode === 'camera') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          if (!isMounted) {
            s.getTracks().forEach((track) => track.stop());
            return;
          }
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.onloadedmetadata = () => {
              if (!isMounted || !videoRef.current) return;
              const playPromise = videoRef.current.play();
              if (playPromise !== undefined) {
                playPromise.catch((e) => {
                  console.debug('Video autoplay prevented:', e);
                });
              }
            };
            setStreamActive(true);
            setCameraError(null);
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          console.warn('Camera stream unavailable', err);
          setCameraError(
            'Kamera perangkat tidak dapat diakses langsung. Anda dapat menggunakan simulator sensor RFID atau pencarian manual di bawah.'
          );
          setActiveMode('rfid_simulator');
        });
    }

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [activeMode]);

  // Handler deteksi aset
  const handleDetect = (asset: Asset) => {
    setDetectedAsset(asset);
  };

  const handleManualSearch = () => {
    if (!manualQuery.trim()) return;
    const q = manualQuery.toLowerCase().trim();
    const found = assets.find(
      (a) =>
        a.assetCode.toLowerCase() === q ||
        a.serialNumber.toLowerCase() === q ||
        (a.rfidTag && a.rfidTag.toLowerCase() === q) ||
        (a.nfcTag && a.nfcTag.toLowerCase() === q) ||
        a.name.toLowerCase().includes(q)
    );
    if (found) {
      setDetectedAsset(found);
    } else {
      alert(`Aset dengan kata kunci "${manualQuery}" tidak ditemukan.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/75 backdrop-blur-md overflow-y-auto animate-fadeIn">
      {/* ═══ Web-OS Spatial Modal Window ═══════════════════════════════════ */}
      <div className="bg-[#FBF9F4]/98 dark:bg-stone-900/98 backdrop-blur-3xl border border-stone-200/90 dark:border-stone-700/90 rounded-3xl sm:rounded-[36px] w-full max-w-2xl shadow-[0_25px_80px_rgba(0,0,0,0.35)] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-scaleUp">
        {/* ─── Header Modal ──────────────────────────────────────────────── */}
        <div className="px-6 py-4.5 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between bg-stone-100/60 dark:bg-stone-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] flex items-center justify-center shadow-md">
              <QrCode className="w-5 h-5 stroke-[2px]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 font-serif-display leading-tight">
                  Scanner Identifikasi Aset Lapangan
                </h2>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Pindai QR Code optik, sensor tap RFID/NFC, atau input nomor seri
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Tutup Scanner"
          >
            <X className="w-5 h-5 stroke-[2px]" />
          </button>
        </div>

        {/* ─── Segmented Mode Switcher Capsule (Web-OS style) ────────────── */}
        <div className="p-3 bg-stone-100/70 dark:bg-stone-950/50 border-b border-stone-200/60 dark:border-stone-800/60">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-200/60 dark:bg-stone-800/60 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveMode('camera')}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMode === 'camera'
                  ? 'bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4 stroke-[2px]" />
              <span>Kamera QR Live</span>
            </button>

            <button
              onClick={() => setActiveMode('rfid_simulator')}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMode === 'rfid_simulator'
                  ? 'bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Radio className="w-4 h-4 stroke-[2px]" />
              <span>RFID UHF / NFC</span>
            </button>

            <button
              onClick={() => setActiveMode('manual')}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMode === 'manual'
                  ? 'bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-4 h-4 stroke-[2px]" />
              <span>Pencarian Seri</span>
            </button>
          </div>
        </div>

        {/* ─── Scanner Interactive Body ──────────────────────────────────── */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* MODE 1: Kamera QR Optik Live */}
          {activeMode === 'camera' && (
            <div className="space-y-4">
              <div className="relative aspect-video max-h-64 w-full bg-stone-950 rounded-3xl overflow-hidden flex items-center justify-center border-2 border-stone-700/60 shadow-inner">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

                {/* Spatial HUD Guide Overlay */}
                <div className="absolute inset-8 border-2 border-stone-400/50 rounded-3xl pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-pulse" />
                  <div className="absolute -top-3 left-4 px-2 py-0.5 bg-stone-900/90 text-[9px] font-mono font-bold text-stone-300 rounded-md border border-stone-700">
                    TARGET HUD ALIGNMENT
                  </div>
                </div>

                <div className="absolute bottom-3 px-3.5 py-1 bg-stone-900/85 backdrop-blur-md rounded-full text-[11px] text-stone-200 border border-stone-700/80 shadow-md">
                  Arahkan kamera ke stiker QR Code fisik aset
                </div>
              </div>

              {/* Quick Simulated trigger chips */}
              <div className="space-y-2 text-center">
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">
                  Atau uji coba pemindaian instan aset terdekat di bawah:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {assets.slice(0, 5).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleDetect(a)}
                      className="px-3 py-1.5 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-mono font-bold rounded-xl border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 transition-all cursor-pointer shadow-2xs hover:scale-103"
                    >
                      {a.assetCode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: RFID UHF & NFC Sensor Studio */}
          {activeMode === 'rfid_simulator' && (
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-tr from-stone-900 to-[#181F19] text-white rounded-3xl border border-stone-700/80 text-center space-y-2 shadow-md">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 text-stone-200 flex items-center justify-center border border-white/20">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-sm font-bold font-serif-display text-white">
                  Sensor Antena RFID UHF & NFC Receiver
                </h3>
                <p className="text-xs text-stone-300 max-w-md mx-auto leading-relaxed">
                  Protokol ISO/IEC 18000-6C aktif. Klik tombol <span className="font-bold underline">Tap Sensor</span> pada daftar tag nirkabel di bawah untuk simulasi pembacaan instan:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {assets.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => handleDetect(a)}
                    className="p-3.5 bg-white/80 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80 rounded-2xl cursor-pointer transition-all text-xs flex items-center justify-between group shadow-2xs hover:shadow-sm hover:border-stone-400"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="font-mono font-bold text-stone-900 dark:text-stone-100 block">
                        {a.assetCode}
                      </span>
                      <span className="font-semibold text-stone-700 dark:text-stone-300 truncate block">
                        {a.name}
                      </span>
                      <span className="text-[10px] text-[#7D562D] dark:text-amber-400 font-mono block mt-0.5">
                        EPC: {a.rfidTag ? a.rfidTag.substring(0, 16) : 'NFC-TAG-ACTIVE'}...
                      </span>
                    </div>
                    <button className="px-2.5 py-1.5 bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] rounded-xl text-[10px] font-bold group-hover:scale-105 transition-transform shrink-0">
                      Tap Sensor
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODE 3: Pencarian Forensik Manual */}
          {activeMode === 'manual' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Ketik Kode Aset, Serial Number hardware, atau Tag RFID..."
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#181F19]/20"
                  />
                </div>
                <button
                  onClick={handleManualSearch}
                  className="px-5 py-2.5 bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] rounded-2xl text-xs font-bold transition-transform hover:scale-102 cursor-pointer shadow-xs"
                >
                  Cari
                </button>
              </div>

              <div className="text-xs text-stone-500 dark:text-stone-400 bg-stone-100/60 dark:bg-stone-800/40 p-3 rounded-2xl border border-stone-200/60 dark:border-stone-700/60">
                Tip Pencarian: Anda dapat memasukkan kode aset seperti <strong>AST-2024-001</strong> atau nomor seri pabrikan seperti <strong>SN-DELL-9921</strong>.
              </div>
            </div>
          )}

          {/* ─── RESULT HUD: IDENTIFIED ASSET DOSSIER CARD ─────────────────── */}
          {detectedAsset && (
            <div className="p-4.5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-3xl animate-scaleUp space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                    Aset Berhasil Teridentifikasi
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                    detectedAsset.status
                  )}`}
                >
                  {detectedAsset.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/70 dark:bg-stone-900/70 p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50">
                <div className="space-y-1">
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Kode & Nama Unit:</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100 font-mono text-sm block">
                    {detectedAsset.assetCode}
                  </span>
                  <span className="text-stone-700 dark:text-stone-300 font-semibold block">
                    {detectedAsset.name}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Lokasi & Penanggung Jawab:</span>
                  <div className="flex items-center gap-1 text-stone-800 dark:text-stone-200 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span className="truncate">{detectedAsset.locationName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-stone-600 dark:text-stone-400 text-[11px]">
                    <UserCheck className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span>PIC: {detectedAsset.picName}</span>
                  </div>
                </div>
              </div>

              {/* 3 Quick Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={() => {
                    onSelectAsset(detectedAsset);
                    onClose();
                  }}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka Berkas Aset</span>
                </button>

                <button
                  onClick={() => {
                    onOpenMovement(detectedAsset);
                    onClose();
                  }}
                  className="w-full sm:w-auto py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-xs"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Ajukan Mutasi</span>
                </button>

                <button
                  onClick={() => {
                    onOpenMaintenance(detectedAsset);
                    onClose();
                  }}
                  className="w-full sm:w-auto py-2.5 px-4 bg-amber-700 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-xs"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Tiket Servis</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
