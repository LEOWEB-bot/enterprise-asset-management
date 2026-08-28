import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  X,
  KeyRound,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { buildOtpAuthUri, generateBase32Secret, generateTOTP, verifyTOTP } from '../../utils/totp';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountEmail: string;
  accountName: string;
  appName?: string;
  initialSecret?: string;
  onConfirmEnable: (secret: string) => void;
}

export const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({
  isOpen,
  onClose,
  accountEmail,
  accountName,
  appName = 'AssetCorp Enterprise',
  initialSecret,
  onConfirmEnable,
}) => {
  const [secret, setSecret] = useState<string>(initialSecret || 'JBSWY3DPEHPK3PXP');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [liveCurrentOtp, setLiveCurrentOtp] = useState<string>('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const [showLiveSimulator, setShowLiveSimulator] = useState<boolean>(false);

  // Inisialisasi Kunci Rahasia dan QR Code
  useEffect(() => {
    if (!isOpen) return;

    const currentSecret = initialSecret && initialSecret.length >= 16 ? initialSecret : generateBase32Secret(16);
    setSecret(currentSecret);
    setVerificationCode('');
    setVerifyStatus('idle');
    setErrorMessage('');

    const otpUri = buildOtpAuthUri(appName, accountEmail || accountName || 'admin', currentSecret);
    QRCode.toDataURL(otpUri, {
      width: 220,
      margin: 1.5,
      color: {
        dark: '#181F19',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR Code:', err));
  }, [isOpen, initialSecret, appName, accountEmail, accountName]);

  // Live countdown timer untuk simulator
  useEffect(() => {
    if (!isOpen || !secret) return;

    let isMounted = true;
    const updateLiveOtp = async () => {
      const { token, remainingSeconds: rem } = await generateTOTP(secret);
      if (isMounted) {
        setLiveCurrentOtp(token);
        setRemainingSeconds(rem);
      }
    };

    updateLiveOtp();
    const interval = setInterval(updateLiveOtp, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, secret]);

  if (!isOpen) return null;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateSecret = () => {
    const newSecret = generateBase32Secret(16);
    setSecret(newSecret);
    setVerificationCode('');
    setVerifyStatus('idle');
    setErrorMessage('');

    const otpUri = buildOtpAuthUri(appName, accountEmail || accountName || 'admin', newSecret);
    QRCode.toDataURL(otpUri, {
      width: 220,
      margin: 1.5,
      color: {
        dark: '#181F19',
        light: '#ffffff',
      },
    }).then((url) => setQrDataUrl(url));
  };

  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setVerifyStatus('error');
      setErrorMessage('Masukkan 6 digit angka dari aplikasi Authenticator.');
      return;
    }

    const isValid = await verifyTOTP(verificationCode, secret);
    if (isValid) {
      setVerifyStatus('success');
      setErrorMessage('');
      setTimeout(() => {
        onConfirmEnable(secret);
        onClose();
      }, 1000);
    } else {
      setVerifyStatus('error');
      setErrorMessage('Kode verifikasi salah atau kedaluwarsa. Periksa waktu ponsel Anda.');
    }
  };

  const handleQuickFill = () => {
    if (liveCurrentOtp) {
      setVerificationCode(liveCurrentOtp);
      setVerifyStatus('idle');
      setErrorMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* ═══ Web-OS Spatial Modal Window ═══════════════════════════════════ */}
      <div className="bg-[#FBF9F4] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-3xl sm:rounded-[36px] shadow-2xl w-full max-w-lg overflow-hidden text-stone-900 dark:text-stone-100 flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Header */}
        <div className="p-5 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between bg-stone-100/60 dark:bg-stone-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5 stroke-[2px]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-serif-display leading-tight">
                Aktivasi Autentikasi Ganda (2FA)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Pindai QR Code dengan Google Authenticator atau Authy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2px]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Step 1: Pindai Barcode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between font-bold text-stone-800 dark:text-stone-200">
              <span className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] text-[10px]">
                  1
                </span>
                Pindai QR Code di Ponsel
              </span>
              <button
                type="button"
                onClick={handleRegenerateSecret}
                className="text-[11px] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                title="Buat kunci rahasia baru"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Kunci Baru</span>
              </button>
            </div>

            {/* QR Card */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-3xl bg-stone-100/70 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
              <div className="p-2 bg-white rounded-2xl shadow-sm shrink-0 border border-stone-200">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="2FA QR Code" className="w-32 h-32 rounded-lg" />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-stone-600" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-xs">
                  Buka aplikasi Authenticator (Google / Microsoft / Authy) di HP Anda, lalu pilih opsi <strong>Pindai QR</strong>.
                </p>
                <div className="pt-1">
                  <div className="text-[10px] text-stone-400 font-bold uppercase mb-1">
                    Atau masukkan Kunci Rahasia Manual:
                  </div>
                  <div className="flex items-center gap-1.5 bg-white dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700 font-mono text-[11px] text-stone-800 dark:text-stone-200">
                    <span className="flex-1 truncate select-all">{secret}</span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="p-1 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Salin Kunci Rahasia"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Masukkan Kode Verifikasi */}
          <div className="space-y-3 pt-3 border-t border-stone-200/80 dark:border-stone-800">
            <div className="flex items-center justify-between font-bold text-stone-800 dark:text-stone-200">
              <span className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] text-[10px]">
                  2
                </span>
                Masukkan 6-Digit Kode Verifikasi
              </span>
              <button
                type="button"
                onClick={() => setShowLiveSimulator(!showLiveSimulator)}
                className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
              >
                <Clock className="w-3 h-3" />
                <span>{showLiveSimulator ? 'Sembunyikan' : 'Monitor Live'}</span>
              </button>
            </div>

            {/* Optional Live Monitor Simulator */}
            {showLiveSimulator && (
              <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">
                    Kode TOTP Siklus Berjalan (30s)
                  </div>
                  <div className="text-base font-mono font-bold tracking-widest text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {liveCurrentOtp}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    Sisa waktu siklus: <span className="font-bold text-stone-700 dark:text-stone-200">{remainingSeconds}s</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="px-3 py-1.5 text-[10px] font-bold bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  Gunakan Kode Ini
                </button>
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-3">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(val);
                    setVerifyStatus('idle');
                    setErrorMessage('');
                  }}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold py-3 bg-white/80 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-2xl text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#181F19]/20 transition-all placeholder:text-stone-300"
                />
              </div>

              {/* Status Alerts */}
              {verifyStatus === 'error' && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {verifyStatus === 'success' && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs animate-fadeIn">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Verifikasi berhasil! 2FA siap digunakan dan akun Anda terproteksi.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={verificationCode.length !== 6 || verifyStatus === 'success'}
                  className="px-6 py-2.5 rounded-2xl bg-[#181F19] dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-[#181F19] text-xs font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verifikasi & Aktifkan 2FA</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
