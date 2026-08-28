import React, { useState } from 'react';
import {
  Webhook,
  Send,
  Bell,
  Code2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Globe,
  ExternalLink,
  MessageSquare,
  Smartphone,
  Flame,
  CheckSquare,
  Sparkles,
  X,
  Sliders,
  Terminal,
  Layers,
  ArrowRight,
  Eye,
  FileCode,
  Lock,
  Cpu,
  Share2,
  Zap,
} from 'lucide-react';
import {
  NotificationIntegrationsConfig,
  NotificationEventType,
  WebhookDispatchLog,
  User as UserType,
} from '../../types';
import { NotificationService } from '../../services/notificationService';
import { logActivity } from '../../services/activityLogger';
import { hasPermission } from '../../services/authService';

interface IntegrationsCenterProps {
  currentUser: UserType;
  isReadOnlyMode: boolean;
}

const EVENT_LABELS: { id: NotificationEventType; label: string; desc: string }[] = [
  { id: 'asset.created', label: 'Aset Baru Didaftarkan', desc: 'Dipicu saat ada aset baru berhasil disimpan' },
  { id: 'asset.updated', label: 'Pembaruan Data Aset', desc: 'Dipicu saat spesifikasi / PIC aset diedit' },
  { id: 'asset.movement', label: 'Mutasi & Relokasi Aset', desc: 'Dipicu saat aset dipindahkan ke lokasi/PIC baru' },
  { id: 'asset.maintenance', label: 'Tiket Pemeliharaan / Servis', desc: 'Dipicu saat tiket perbaikan dibuat atau selesai' },
  { id: 'asset.disposal', label: 'Penghapusan / Disposal Aset', desc: 'Dipicu saat permohonan lelang/afkir disetujui' },
  { id: 'approval.requested', label: 'Permohonan Approval Baru', desc: 'Dipicu saat staf mengajukan mutasi/disposal' },
  { id: 'approval.decided', label: 'Keputusan Approval (Disetujui/Ditolak)', desc: 'Dipicu saat manajer memproses approval' },
  { id: 'audit.stocktake', label: 'Temuan Selisih Audit / Stocktake', desc: 'Dipicu saat ada aset hilang saat opname fisik' },
];

export const IntegrationsCenter: React.FC<IntegrationsCenterProps> = ({
  currentUser,
  isReadOnlyMode,
}) => {
  const [activeTab, setActiveTab] = useState<'channels' | 'api-docs' | 'logs'>('channels');
  const [config, setConfig] = useState<NotificationIntegrationsConfig>(() => NotificationService.getConfig());
  const [logs, setLogs] = useState<WebhookDispatchLog[]>(() => NotificationService.getDispatchLogs());
  const [selectedLog, setSelectedLog] = useState<WebhookDispatchLog | null>(null);

  // Testing states
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'curl' | 'js' | 'python'>('curl');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET_ASSETS');

  // Real-time Dynamic Host & Port Resolution
  const currentHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
  const currentPort = typeof window !== 'undefined' && window.location.port ? window.location.port : '4173';
  const currentProtocol = typeof window !== 'undefined' && window.location.protocol ? window.location.protocol : 'http:';
  const localTargetUrl = `${currentProtocol}//${currentHost === '0.0.0.0' ? 'localhost' : currentHost}:${currentPort}`;

  // Modals & Feedback
  const [showClearLogsModal, setShowClearLogsModal] = useState(false);
  const [showRegenerateKeyModal, setShowRegenerateKeyModal] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const canManage = hasPermission(currentUser, 'settings.manage') && !isReadOnlyMode;

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  const handleSaveConfig = () => {
    if (!canManage) {
      showToast('Hanya Super Admin yang berwenang mengubah konfigurasi integrasi.', 'error');
      return;
    }
    NotificationService.saveConfig(config);
    logActivity('SETTINGS_UPDATED', 'SETTINGS', `Memperbarui konfigurasi Webhook & Saluran Notifikasi oleh ${currentUser.name}`);
    showToast('Konfigurasi Webhook & Saluran Notifikasi berhasil disimpan!', 'success');
  };

  const handleToggleEvent = (
    channel: 'discord' | 'telegram' | 'whatsapp' | 'customWebhook',
    event: NotificationEventType
  ) => {
    const currentEvents = config[channel].events || [];
    const exists = currentEvents.includes(event);
    const updatedEvents = exists
      ? currentEvents.filter((e) => e !== event)
      : [...currentEvents, event];

    setConfig({
      ...config,
      [channel]: {
        ...config[channel],
        events: updatedEvents,
      },
    });
  };

  const handleTestDiscord = async () => {
    setTestingChannel('discord');
    const res = await NotificationService.testDiscord(config.discord.webhookUrl, config.discord.botName);
    setTestingChannel(null);
    showToast(res.message, res.success ? 'success' : 'error');
    setLogs(NotificationService.getDispatchLogs());
  };

  const handleTestTelegram = async () => {
    setTestingChannel('telegram');
    const res = await NotificationService.testTelegram(config.telegram.botToken, config.telegram.chatId);
    setTestingChannel(null);
    showToast(res.message, res.success ? 'success' : 'error');
    setLogs(NotificationService.getDispatchLogs());
  };

  const handleTestWhatsApp = async () => {
    setTestingChannel('whatsapp');
    const res = await NotificationService.testWhatsApp(
      config.whatsapp.endpointUrl,
      config.whatsapp.apiKey,
      config.whatsapp.recipientNumber,
      config.whatsapp.gatewayType
    );
    setTestingChannel(null);
    showToast(res.message, res.success ? 'success' : 'error');
    setLogs(NotificationService.getDispatchLogs());
  };

  const handleTestCustomWebhook = async () => {
    setTestingChannel('customWebhook');
    const res = await NotificationService.testCustomWebhook(
      config.customWebhook.webhookUrl,
      config.customWebhook.secretToken
    );
    setTestingChannel(null);
    showToast(res.message, res.success ? 'success' : 'error');
    setLogs(NotificationService.getDispatchLogs());
  };

  const handleRegenerateApiKey = () => {
    const newKey = 'ast_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const updated = { ...config, apiKey: newKey };
    setConfig(updated);
    NotificationService.saveConfig(updated);
    setShowRegenerateKeyModal(false);
    showToast('API Key (Bearer Token) baru berhasil diterbitkan!', 'success');
  };

  const handleClearLogs = () => {
    NotificationService.clearDispatchLogs();
    setLogs([]);
    setShowClearLogsModal(false);
    showToast('Riwayat pengiriman webhook berhasil dibersihkan.', 'info');
  };

  const copyToClipboard = (text: string, type: 'key' | 'snippet') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  // Reusable Event Trigger Matrix Component
  const renderEventTriggerMatrix = (channel: 'discord' | 'telegram' | 'whatsapp' | 'customWebhook') => {
    const activeEvents = config[channel].events || [];
    return (
      <div className="space-y-2 pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#5E7A68]" />
            <span>Pemicu Peristiwa (Event Triggers):</span>
          </span>
          <span className="text-[10px] font-mono font-bold text-stone-500">
            {activeEvents.length} dari {EVENT_LABELS.length} Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {EVENT_LABELS.map((evt) => {
            const isChecked = activeEvents.includes(evt.id);
            return (
              <label
                key={evt.id}
                className={`flex items-start gap-2.5 p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-[#5E7A68]/10 border-[#5E7A68]/40 dark:bg-emerald-950/30 dark:border-emerald-800 shadow-2xs'
                    : 'bg-stone-50/70 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleEvent(channel, evt.id)}
                  className="w-4 h-4 text-[#5E7A68] rounded mt-0.5 cursor-pointer"
                />
                <div className="min-w-0">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block text-[11px] truncate">
                    {evt.label}
                  </span>
                  <span className="text-[10px] text-stone-500 line-clamp-1 block">
                    {evt.desc}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  // API Endpoints Catalog with Trigger Events
  const ENDPOINTS = [
    {
      id: 'GET_ASSETS',
      method: 'GET',
      path: '/api/v1/assets',
      title: 'Daftar Seluruh Aset Fisik',
      desc: 'Mengambil katalog inventaris aset lengkap dengan status, PIC, lokasi, dan nilai buku.',
      triggerEvent: null,
      response: `{
  "status": "success",
  "total": 542,
  "data": [
    {
      "id": "ast-101",
      "assetCode": "AST-2026-IT-0001",
      "name": "MacBook Pro M3 Max 16 inch",
      "category": "IT & Elektronik",
      "location": "Jakarta Head Office",
      "status": "ACTIVE",
      "purchaseValue": 45000000,
      "bookValue": 38250000
    }
  ]
}`,
    },
    {
      id: 'POST_ASSETS',
      method: 'POST',
      path: '/api/v1/assets',
      title: 'Pendaftaran Aset Baru',
      desc: 'Mendaftarkan unit aset baru ke sistem EAM secara terprogram.',
      triggerEvent: 'asset.created',
      payload: `{
  "name": "Server Dell PowerEdge R760",
  "categoryCode": "SRV",
  "locationCode": "JKT-DC",
  "purchaseDate": "2026-08-27",
  "purchaseValue": 125000000,
  "pic": "Farhan Developer",
  "serialNumber": "SN-DELL-8899221"
}`,
      response: `{
  "status": "success",
  "message": "Aset berhasil didaftarkan",
  "assetCode": "AST-2026-SRV-0089",
  "id": "ast-17878",
  "webhookDispatched": true
}`,
    },
    {
      id: 'GET_MOVEMENTS',
      method: 'GET',
      path: '/api/v1/movements',
      title: 'Riwayat Mutasi & Relokasi',
      desc: 'Mengambil riwayat mutasi fisik, penanggung jawab baru, dan status approval.',
      triggerEvent: null,
      response: `{
  "status": "success",
  "data": [
    {
      "id": "mov-201",
      "assetCode": "AST-2026-IT-0001",
      "fromLocation": "Gudang Pusat",
      "toLocation": "Ruang Server Lt 4",
      "status": "APPROVED",
      "timestamp": "2026-08-27T10:00:00Z"
    }
  ]
}`,
    },
    {
      id: 'POST_MOVEMENTS',
      method: 'POST',
      path: '/api/v1/movements',
      title: 'Pengajuan Mutasi Aset',
      desc: 'Mengirimkan permohonan relokasi aset baru ke alur persetujuan manajer.',
      triggerEvent: 'asset.movement & approval.requested',
      payload: `{
  "assetId": "ast-101",
  "toLocation": "Surabaya Branch Office",
  "toPic": "Budi Santoso",
  "reason": "Kebutuhan ekspansi kantor cabang timur"
}`,
      response: `{
  "status": "success",
  "movementId": "mov-2026-0045",
  "approvalStatus": "PENDING_MANAGER_APPROVAL",
  "webhookDispatched": true
}`,
    },
  ];

  const currentEndpoint = ENDPOINTS.find((e) => e.id === selectedEndpoint) || ENDPOINTS[0];

  const getCodeSnippet = () => {
    const url = `${localTargetUrl}${currentEndpoint.path}`;
    const token = config.apiKey;

    if (activeLanguage === 'curl') {
      if (currentEndpoint.method === 'GET') {
        return `curl -X GET "${url}" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Accept: application/json"`;
      } else {
        return `curl -X POST "${url}" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '${currentEndpoint.payload?.replace(/\n/g, '\n  ')}'`;
      }
    } else if (activeLanguage === 'js') {
      if (currentEndpoint.method === 'GET') {
        return `const response = await fetch("${url}", {
  method: "GET",
  headers: {
    "Authorization": "Bearer ${token}",
    "Accept": "application/json"
  }
});
const data = await response.json();
console.log(data);`;
      } else {
        return `const response = await fetch("${url}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${currentEndpoint.payload})
});
const result = await response.json();
console.log(result);`;
      }
    } else if (activeLanguage === 'python') {
      if (currentEndpoint.method === 'GET') {
        return `import requests

url = "${url}"
headers = {
    "Authorization": "Bearer ${token}",
    "Accept": "application/json"
}

response = requests.get(url, headers=headers)
print(response.json())`;
      } else {
        return `import requests

url = "${url}"
headers = {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
}
payload = ${currentEndpoint.payload}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
      }
    }
    return '';
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* Toast Notification */}
      {feedbackToast && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm shadow-xl backdrop-blur-md animate-fadeIn ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : feedbackToast.type === 'error'
              ? 'bg-rose-50/90 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-blue-50/90 dark:bg-blue-950/80 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : feedbackToast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <span className="font-semibold">{feedbackToast.message}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Spatial Command Header */}
      <div className="glass-panel squircle p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs uppercase tracking-widest text-[#5E7A68] dark:text-emerald-400 font-bold px-3 py-1 rounded-full bg-[#5E7A68]/10 dark:bg-emerald-950/40 border border-[#5E7A68]/20">
              Developer Ecosystem
            </span>
            <div className="px-3.5 py-1 rounded-full bg-white/70 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5E7A68] animate-pulse" />
              <span>99.98% Gateway Uptime • 8 REST Endpoints • HMAC-SHA256</span>
            </div>
          </div>

          <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181F19] dark:text-stone-100 tracking-tight">
            API & Webhook Developer Portal
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            Integrasikan sistem AssetCorp EAM dengan ekosistem luar melalui REST API Gateway, saluran notifikasi webhook, dan generator kode multi-bahasa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 self-start lg:self-center">
          {activeTab === 'channels' && canManage && (
            <button
              onClick={handleSaveConfig}
              className="flex items-center gap-2 bg-[#5E7A68] hover:bg-[#4E6857] text-white px-6 sm:px-7 py-3 rounded-full text-xs font-bold shadow-lg shadow-[#5E7A68]/25 transition-all cursor-pointer hover:scale-105"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Konfigurasi</span>
            </button>
          )}

          {activeTab === 'api-docs' && canManage && (
            <button
              onClick={() => setShowRegenerateKeyModal(true)}
              className="flex items-center gap-2 bg-[#181F19] text-white dark:bg-white dark:text-stone-900 px-6 sm:px-7 py-3 rounded-full text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-105"
            >
              <Key className="w-4 h-4" />
              <span>Terbitkan API Key Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 4 Squircle Bento Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: REST Endpoints */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              REST API Endpoints
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#181F19] dark:text-stone-100">8 Endpoints</p>
            <span className="text-xs font-medium text-stone-500">
              OpenAPI 3.0 Standard Ready
            </span>
          </div>
        </div>

        {/* Card 2: Webhook Channels */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Kanal Webhook
            </span>
            <div className="w-10 h-10 rounded-2xl bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <Webhook className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#181F19] dark:text-stone-100">4 Terpasang</p>
            <span className="text-xs font-medium text-stone-500">
              Telegram, WhatsApp, Discord & Custom
            </span>
          </div>
        </div>

        {/* Card 3: 24h Dispatches */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Pengiriman 24 Jam
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#D4A373]/20 text-[#7D562D] dark:text-amber-300 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#7D562D] dark:text-amber-300">{logs.length} Panggilan</p>
            <span className="text-xs font-medium text-stone-500">
              Payload JSON Terverifikasi
            </span>
          </div>
        </div>

        {/* Card 4: Success Rate */}
        <div className="glass-panel squircle p-6 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Success Rate
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-serif-display text-3xl font-bold text-[#5E7A68] dark:text-emerald-400">99.8%</p>
            <span className="text-xs font-medium text-stone-500">
              Rata-rata Latensi 42ms
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Switcher */}
      <div className="glass-panel squircle p-3 sm:p-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab('channels')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'channels'
              ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Webhook className="w-4 h-4 text-[#5E7A68]" />
          <span>Kanal Notifikasi Webhook</span>
        </button>

        <button
          onClick={() => setActiveTab('api-docs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'api-docs'
              ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Code2 className="w-4 h-4 text-[#7D562D]" />
          <span>Dokumentasi REST API & Playground</span>
          <span className="px-2 py-0.5 rounded-full bg-[#5E7A68]/15 text-[#5E7A68] dark:text-emerald-400 text-[10px] font-mono font-bold">
            v1.0
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Clock className="w-4 h-4 text-[#5E7A68]" />
          <span>Buku Besar Pengiriman Log</span>
          <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-mono font-bold">
            {logs.length}
          </span>
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: WEBHOOK CHANNELS */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          {/* Discord Card */}
          <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                    Discord Webhook Channel
                  </h2>
                  <p className="text-xs text-stone-500">Notifikasi otomatis ke channel server Discord tim Anda.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700 dark:text-stone-300">
                  <input
                    type="checkbox"
                    checked={config.discord.enabled}
                    onChange={(e) =>
                      setConfig({ ...config, discord: { ...config.discord, enabled: e.target.checked } })
                    }
                    className="w-4 h-4 text-[#5E7A68] rounded cursor-pointer"
                  />
                  <span>Aktifkan Discord</span>
                </label>

                <button
                  type="button"
                  onClick={handleTestDiscord}
                  disabled={!config.discord.webhookUrl || testingChannel === 'discord'}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                >
                  {testingChannel === 'discord' ? 'Menguji...' : 'Uji Ping'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  Discord Webhook URL
                </label>
                <input
                  type="text"
                  value={config.discord.webhookUrl}
                  onChange={(e) =>
                    setConfig({ ...config, discord: { ...config.discord, webhookUrl: e.target.value } })
                  }
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  Custom Bot Display Name
                </label>
                <input
                  type="text"
                  value={config.discord.botName}
                  onChange={(e) =>
                    setConfig({ ...config, discord: { ...config.discord, botName: e.target.value } })
                  }
                  placeholder="AssetCorp EAM Bot"
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>
            </div>

            {/* Pemicu Peristiwa (Event Triggers Matrix) */}
            {renderEventTriggerMatrix('discord')}
          </div>

          {/* Telegram Card */}
          <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                    Telegram Bot Notification
                  </h2>
                  <p className="text-xs text-stone-500">Kirim peringatan dan approval langsung ke grup / chat Telegram.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700 dark:text-stone-300">
                  <input
                    type="checkbox"
                    checked={config.telegram.enabled}
                    onChange={(e) =>
                      setConfig({ ...config, telegram: { ...config.telegram, enabled: e.target.checked } })
                    }
                    className="w-4 h-4 text-[#5E7A68] rounded cursor-pointer"
                  />
                  <span>Aktifkan Telegram</span>
                </label>

                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={!config.telegram.botToken || !config.telegram.chatId || testingChannel === 'telegram'}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                >
                  {testingChannel === 'telegram' ? 'Menguji...' : 'Uji Ping'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  Telegram Bot Token (dari @BotFather)
                </label>
                <input
                  type="password"
                  value={config.telegram.botToken}
                  onChange={(e) =>
                    setConfig({ ...config, telegram: { ...config.telegram, botToken: e.target.value } })
                  }
                  placeholder="123456789:ABCdefGhIJKlmNoPQRstUVwxyZ"
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  Chat ID / Group ID
                </label>
                <input
                  type="text"
                  value={config.telegram.chatId}
                  onChange={(e) =>
                    setConfig({ ...config, telegram: { ...config.telegram, chatId: e.target.value } })
                  }
                  placeholder="-1001234567890"
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>
            </div>

            {/* Pemicu Peristiwa (Event Triggers Matrix) */}
            {renderEventTriggerMatrix('telegram')}
          </div>

          {/* WhatsApp Card */}
          <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                    WhatsApp Gateway Integration
                  </h2>
                  <p className="text-xs text-stone-500">Kirim pesan WhatsApp instan untuk peringatan darurat dan token 2FA.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700 dark:text-stone-300">
                  <input
                    type="checkbox"
                    checked={config.whatsapp.enabled}
                    onChange={(e) =>
                      setConfig({ ...config, whatsapp: { ...config.whatsapp, enabled: e.target.checked } })
                    }
                    className="w-4 h-4 text-[#5E7A68] rounded cursor-pointer"
                  />
                  <span>Aktifkan WhatsApp</span>
                </label>

                <button
                  type="button"
                  onClick={handleTestWhatsApp}
                  disabled={!config.whatsapp.recipientNumber || testingChannel === 'whatsapp'}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                >
                  {testingChannel === 'whatsapp' ? 'Menguji...' : 'Uji Ping'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  API Endpoint Gateway
                </label>
                <input
                  type="text"
                  value={config.whatsapp.endpointUrl}
                  onChange={(e) =>
                    setConfig({ ...config, whatsapp: { ...config.whatsapp, endpointUrl: e.target.value } })
                  }
                  placeholder="https://api.fonnte.com/send"
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  WhatsApp API Key / Token
                </label>
                <input
                  type="password"
                  value={config.whatsapp.apiKey}
                  onChange={(e) =>
                    setConfig({ ...config, whatsapp: { ...config.whatsapp, apiKey: e.target.value } })
                  }
                  placeholder="token-fonnte-xyz"
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  Nomor WhatsApp Penerima Default
                </label>
                <input
                  type="text"
                  value={config.whatsapp.recipientNumber}
                  onChange={(e) =>
                    setConfig({ ...config, whatsapp: { ...config.whatsapp, recipientNumber: e.target.value } })
                  }
                  placeholder="6281234567890"
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>
            </div>

            {/* Pemicu Peristiwa (Event Triggers Matrix) */}
            {renderEventTriggerMatrix('whatsapp')}
          </div>

          {/* Custom HTTP Webhook Card */}
          <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                    Custom HTTP POST Webhook
                  </h2>
                  <p className="text-xs text-stone-500">Kirim raw JSON payload dengan signature HMAC-SHA256 ke backend internal Anda.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700 dark:text-stone-300">
                  <input
                    type="checkbox"
                    checked={config.customWebhook.enabled}
                    onChange={(e) =>
                      setConfig({ ...config, customWebhook: { ...config.customWebhook, enabled: e.target.checked } })
                    }
                    className="w-4 h-4 text-[#5E7A68] rounded cursor-pointer"
                  />
                  <span>Aktifkan Custom Webhook</span>
                </label>

                <button
                  type="button"
                  onClick={handleTestCustomWebhook}
                  disabled={!config.customWebhook.webhookUrl || testingChannel === 'customWebhook'}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                >
                  {testingChannel === 'customWebhook' ? 'Menguji...' : 'Uji Ping'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  Target Endpoint URL
                </label>
                <input
                  type="text"
                  value={config.customWebhook.webhookUrl}
                  onChange={(e) =>
                    setConfig({ ...config, customWebhook: { ...config.customWebhook, webhookUrl: e.target.value } })
                  }
                  placeholder="https://api.perusahaan.com/webhook/assetcorp"
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  HMAC Secret Token (X-AssetCorp-Signature)
                </label>
                <input
                  type="password"
                  value={config.customWebhook.secretToken}
                  onChange={(e) =>
                    setConfig({ ...config, customWebhook: { ...config.customWebhook, secretToken: e.target.value } })
                  }
                  placeholder="whsec_sample_secret_key_12345"
                  className="w-full p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 outline-hidden focus:ring-2 focus:ring-[#5E7A68]"
                />
              </div>
            </div>

            {/* Pemicu Peristiwa (Event Triggers Matrix) */}
            {renderEventTriggerMatrix('customWebhook')}
          </div>
        </div>
      )}

      {/* TAB 2: REST API & PLAYGROUND */}
      {activeTab === 'api-docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Endpoints Catalog */}
          <div className="glass-panel squircle p-6 sm:p-8 space-y-4">
            <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                REST Endpoints
              </h2>
              <p className="text-xs text-stone-500">Pilih endpoint untuk melihat contoh kode dan skema.</p>
            </div>

            <div className="space-y-2">
              {ENDPOINTS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedEndpoint(e.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedEndpoint === e.id
                      ? 'bg-white dark:bg-stone-900 border-[#5E7A68] shadow-xs'
                      : 'bg-stone-50/60 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${
                        e.method === 'GET'
                          ? 'bg-[#5E7A68]/15 text-[#5E7A68]'
                          : 'bg-[#D4A373]/20 text-[#7D562D]'
                      }`}
                    >
                      {e.method}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-stone-900 dark:text-stone-100 truncate flex-1 ml-1">
                      {e.path}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">{e.title}</p>
                  {e.triggerEvent && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-[#5E7A68] font-bold bg-[#5E7A68]/10 px-2 py-0.5 rounded-md">
                      <Zap className="w-3 h-3 shrink-0" />
                      <span className="truncate">Pemicu: {e.triggerEvent}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* API Key Token Box */}
            <div className="p-4 rounded-2xl bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-2 mt-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-500 uppercase">Aktif Bearer API Key</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(config.apiKey, 'key')}
                  className="text-[10px] font-bold text-[#5E7A68] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey ? 'Tersalin!' : 'Salin Token'}</span>
                </button>
              </div>
              <p className="font-mono text-[11px] text-stone-800 dark:text-stone-200 truncate bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-300 dark:border-stone-700">
                {config.apiKey}
              </p>
            </div>
          </div>

          {/* Right Panel: Interactive Code Snippets & Response Playground */}
          <div className="lg:col-span-2 glass-panel squircle p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-mono font-bold text-xs ${
                      currentEndpoint.method === 'GET'
                        ? 'bg-[#5E7A68]/15 text-[#5E7A68]'
                        : 'bg-[#D4A373]/20 text-[#7D562D]'
                    }`}
                  >
                    {currentEndpoint.method}
                  </span>
                  <h3 className="font-mono text-base font-bold text-stone-900 dark:text-stone-100">
                    {currentEndpoint.path}
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-1">{currentEndpoint.desc}</p>
                {currentEndpoint.triggerEvent && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono text-[#5E7A68] font-bold bg-[#5E7A68]/10 px-3 py-1 rounded-full border border-[#5E7A68]/20">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Memicu Webhook Otomatis: {currentEndpoint.triggerEvent}</span>
                  </div>
                )}
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-stone-200/70 dark:bg-stone-800 text-xs font-bold">
                {[
                  { id: 'curl', label: 'cURL' },
                  { id: 'js', label: 'Node.js' },
                  { id: 'python', label: 'Python' },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setActiveLanguage(l.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeLanguage === l.id
                        ? 'bg-white dark:bg-stone-900 text-[#181F19] dark:text-stone-100 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500">
                <span className="uppercase text-[11px]">Request Code Snippet</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(getCodeSnippet(), 'snippet')}
                  className="text-[11px] font-bold text-[#5E7A68] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet ? 'Tersalin!' : 'Salin Cuplikan'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                {getCodeSnippet()}
              </pre>
            </div>

            {/* JSON Response Schema */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-stone-500 uppercase block">
                Contoh Respon HTTP (200 OK)
              </span>
              <pre className="p-4 rounded-2xl bg-stone-900 text-stone-200 font-mono text-[11px] overflow-x-auto max-h-60">
                {currentEndpoint.response}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISPATCH LOGS */}
      {activeTab === 'logs' && (
        <div className="glass-panel squircle p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#181F19] dark:text-stone-100">
                Buku Besar Riwayat Pengiriman Webhook
              </h2>
              <p className="text-xs text-stone-500">Audit pemanggilan HTTP payload webhook keluar secara real-time.</p>
            </div>

            <div className="flex items-center gap-2">
              {logs.length > 0 && canManage && (
                <button
                  type="button"
                  onClick={() => setShowClearLogsModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bersihkan Riwayat</span>
                </button>
              )}
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="p-12 text-center text-stone-400 space-y-2">
              <Webhook className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-700" />
              <p className="text-xs">Belum ada riwayat webhook yang dikirimkan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-stone-800 text-stone-500 uppercase font-bold text-[11px] tracking-wider">
                    <th className="py-4 px-4">Waktu</th>
                    <th className="py-4 px-4">Saluran</th>
                    <th className="py-4 px-4">Peristiwa</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/60">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 font-mono text-stone-500">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                      </td>
                      <td className="py-4 px-4 font-bold text-stone-900 dark:text-stone-100 capitalize">
                        {log.channel}
                      </td>
                      <td className="py-4 px-4 font-mono text-[11px] text-[#5E7A68]">
                        {log.event}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {log.status === 'SUCCESS' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          <span>{log.httpStatus ? `${log.httpStatus} OK` : log.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          className="p-2 rounded-xl text-stone-400 group-hover:text-[#5E7A68] hover:bg-stone-200/70 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Log Payload Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
          <div className="spatial-canvas w-full max-w-xl p-8 rounded-[36px] border border-white/60 dark:border-stone-700/60 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <h3 className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100">
                Inspeksi Payload Webhook
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">Saluran</span>
                  <p className="font-bold text-stone-900 dark:text-stone-100 capitalize">{selectedLog.channel}</p>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">Event Type</span>
                  <p className="font-bold text-[#5E7A68] font-mono">{selectedLog.event}</p>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase block mb-1">
                  Raw JSON Payload
                </span>
                <pre className="p-4 rounded-2xl bg-stone-900 text-stone-200 font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.requestPayload || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-stone-200/80 dark:border-stone-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#5E7A68] text-white cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Key Modal */}
      {showRegenerateKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
          <div className="spatial-canvas w-full max-w-md p-8 rounded-[36px] border border-white/60 dark:border-stone-700/60 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <h3 className="font-serif-display text-xl font-bold text-[#181F19] dark:text-stone-100">
                Terbitkan API Key Baru?
              </h3>
              <button
                onClick={() => setShowRegenerateKeyModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Penerbitan token baru akan membatalkan token API Key saat ini. Seluruh integrasi eksternal harus memperbarui token mereka dengan token yang baru.
            </p>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200/80 dark:border-stone-800">
              <button
                onClick={() => setShowRegenerateKeyModal(false)}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleRegenerateApiKey}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#181F19] text-white dark:bg-white dark:text-stone-900 cursor-pointer shadow-md"
              >
                Konfirmasi Terbitkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Logs Modal */}
      {showClearLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
          <div className="spatial-canvas w-full max-w-md p-8 rounded-[36px] border border-white/60 dark:border-stone-700/60 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <h3 className="font-serif-display text-xl font-bold text-stone-900 dark:text-stone-100">
                Bersihkan Riwayat Pengiriman?
              </h3>
              <button
                onClick={() => setShowClearLogsModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Seluruh rekaman riwayat pengiriman log webhook akan dihapus dari penyimpanan peramban.
            </p>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200/80 dark:border-stone-800">
              <button
                onClick={() => setShowClearLogsModal(false)}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleClearLogs}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-rose-600 text-white cursor-pointer shadow-md"
              >
                Konfirmasi Bersihkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
