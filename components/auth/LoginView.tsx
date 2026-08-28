import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Sparkles,
  Smartphone,
  ChevronLeft,
  KeyRound,
  Shield,
  Fingerprint,
} from 'lucide-react';
import { User } from '../../types';
import { StorageService } from '../../services/storageService';
import { validateCredentials, verifyUser2FA, completeLogin, getRoleBadgeClass } from '../../services/authService';
import { logActivity } from '../../services/activityLogger';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('admin@assetcorp.id');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // 2FA Step States
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [otpCode, setOtpCode] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isDemoMode = StorageService.isDemoMode();
  const users = StorageService.getUsers();
  const appName = StorageService.getAppName();

  // Handle Step 1: Submit Credentials
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Masukkan alamat email dinas atau ID pengguna Anda.');
      return;
    }

    if (!password) {
      setErrorMessage('Masukkan kata sandi akun Anda.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const result = validateCredentials(identifier, password);
      setLoading(false);

      if (!result.success) {
        setErrorMessage(result.message || 'Login gagal. Periksa kembali kredensial Anda.');
        logActivity(
          'LOGIN_FAILED',
          'AUTH',
          `Percobaan login gagal untuk identifier: ${identifier}`,
          undefined,
          'WARNING'
        );
        return;
      }

      const user = result.user!;

      if (result.requires2FA) {
        // Transition to Step 2: 2FA
        setPendingUser(user);
        setStep('2fa');
        setOtpCode('');
        setErrorMessage('');
      } else {
        // Direct Login Success
        completeLogin(user);
        logActivity('LOGIN_SUCCESS', 'AUTH', `Pengguna ${user.name} (${user.role}) berhasil masuk ke sistem.`);
        setSuccessMessage(`Selamat datang kembali, ${user.name}!`);
        setTimeout(() => {
          onLoginSuccess(user);
        }, 500);
      }
    }, 400);
  };

  // Handle Step 2: Submit 2FA Code
  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    if (otpCode.length !== 6) {
      setErrorMessage('Masukkan 6 digit kode verifikasi Authenticator.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const verifyResult = await verifyUser2FA(pendingUser, otpCode);
    setLoading(false);

    if (verifyResult.success) {
      completeLogin(pendingUser);
      logActivity(
        'LOGIN_2FA_SUCCESS',
        'AUTH',
        `Pengguna ${pendingUser.name} berhasil memverifikasi TOTP 2FA.`
      );
      setSuccessMessage('Verifikasi 2FA sukses! Mengalihkan ke dashboard...');
      setTimeout(() => {
        onLoginSuccess(pendingUser);
      }, 500);
    } else {
      setErrorMessage(verifyResult.message || 'Kode verifikasi 2FA tidak valid.');
    }
  };

  // Quick Preset Autofill Helper
  const handleQuickSelect = (u: User) => {
    setIdentifier(u.email);
    setPassword(u.password || 'password123');
    setStep('credentials');
    setPendingUser(null);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] dark:bg-[#121613] text-stone-900 dark:text-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-200">
      {/* ═══ Ambient Glows ════════════════════════════════════════════════ */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#181F19]/5 dark:bg-stone-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#7D562D]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* ═══ Brand Header (Web-OS Spatial) ══════════════════════════════ */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#181F19] dark:bg-stone-100 text-white dark:text-[#181F19] shadow-lg shadow-black/10">
            <Building2 className="w-7 h-7 stroke-[2px]" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/80 dark:bg-stone-800 text-[11px] font-bold text-stone-700 dark:text-stone-300 border border-stone-300/60 dark:border-stone-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>ISO/IEC 27001 Certified • Zero-Trust Security</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-serif-display tracking-tight">
              {appName}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
              Portal Otentikasi & Manajemen Inventaris Aset Terpadu
            </p>
          </div>
        </div>

        {/* ═══ Floating Spatial Login Card ════════════════════════════════ */}
        <div className="bg-[#FBF9F4]/98 dark:bg-stone-900/98 backdrop-blur-3xl border border-stone-200/90 dark:border-stone-700/90 rounded-3xl sm:rounded-[36px] p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.25)] space-y-5 animate-scaleUp">
          {/* STEP 1: Form Kredensial */}
          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 font-serif-display">
                  Masuk ke Akun Anda
                </h2>
                <p className="text-xs text-stone-500">Gunakan email dinas atau ID pengguna terdaftar.</p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold">{successMessage}</span>
                </div>
              )}

              {/* Email / Username Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase block">
                  Email Dinas atau ID Pengguna
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@assetcorp.id"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white/80 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-2xl text-xs font-semibold text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#181F19]/20 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase block">
                    Kata Sandi Akun
                  </label>
                  {isDemoMode && <span className="text-[10px] text-stone-400">Default: password123</span>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-white/80 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-2xl text-xs font-semibold text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#181F19]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer p-1"
                    title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-stone-400 accent-[#181F19] cursor-pointer"
                  />
                  <span>Ingat sesi di perangkat ini</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#181F19] dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white active:scale-[0.99] disabled:opacity-50 text-white dark:text-[#181F19] text-xs sm:text-sm font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white dark:border-stone-800/30 dark:border-t-stone-800 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk ke Portal</span>
                    <ArrowRight className="w-4 h-4 stroke-[2px]" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: Verifikasi 2FA TOTP */
            <form onSubmit={handle2FASubmit} className="space-y-4 animate-fadeIn">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setErrorMessage('');
                }}
                className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors cursor-pointer mb-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Kembali ke form login</span>
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5 stroke-[2px]" />
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif-display">
                    Verifikasi Dua Langkah (2FA)
                  </h2>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Akun <strong className="text-stone-800 dark:text-stone-200">{pendingUser?.name}</strong> dilindungi dengan otentikasi dua faktor. Masukkan 6-digit kode Authenticator Anda.
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold">{successMessage}</span>
                </div>
              )}

              {/* OTP Input */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 text-center block uppercase">
                  6-Digit Kode Authenticator (TOTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(val);
                    setErrorMessage('');
                  }}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold py-3 bg-white/80 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-2xl text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#181F19]/20 transition-all placeholder:text-stone-300"
                />
                <div className="text-[11px] text-stone-400 text-center">
                  Tip Darurat: Kode <span className="font-mono text-stone-700 dark:text-stone-300 font-bold">123456</span> dapat digunakan dalam mode simulasi.
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 active:scale-[0.99] disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verifikasi & Masuk</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ═══ Bento Grid Preset Selector (Demo Mode) ════════════════════ */}
          {isDemoMode && users.length > 1 && (
            <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span className="font-bold uppercase tracking-wider">Pilih Cepat Akun Demo</span>
                <span>Klik untuk mengisi</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {users.slice(0, 4).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u)}
                    className={`p-2.5 text-left rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      identifier === u.email
                        ? 'bg-stone-200/90 dark:bg-stone-800 border-[#181F19] dark:border-stone-200 shadow-2xs'
                        : 'bg-white/60 dark:bg-stone-950/40 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate text-stone-900 dark:text-stone-100">
                        {u.name.split(',')[0]}
                      </span>
                      {u.twoFactorEnabled && (
                        <span title="2FA Aktif">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-500 truncate mt-0.5">{u.role}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══ Security Footer ═════════════════════════════════════════════ */}
        <div className="text-center text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
          <span>Role-Based Access Control (RBAC) • Enkripsi End-to-End</span>
        </div>
      </div>
    </div>
  );
};
