# Enterprise Asset Management (EAM)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Framework: React 19](https://img.shields.io/badge/React-19.0-blue)](https://react.dev/)
[![Language: TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Bundler: Vite 6](https://img.shields.io/badge/Vite-6.1-purple)](https://vitejs.dev/)
[![Tailwind CSS: v4](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8)](https://tailwindcss.com/)
[![Security: Audited](https://img.shields.io/badge/Security-2FA%20%7C%20RBAC-emerald)](SECURITY.md)

> 🌐 **Bahasa / Language**: [English](README.md) | **Bahasa Indonesia**

**Enterprise Asset Management (EAM)** adalah platform sistem informasi manajemen aset fisik, peralatan, armada, fasilitas, dan inventaris berskala enterprise berstandar industri (**ISO 55001 & PSAK 16**). 

Aplikasi ini dibangun menggunakan arsitektur antarmuka modern **Organic Spatial UI (Web-OS Style)** yang responsif penuh (*Full-Width Fluid Responsive*) untuk perangkat **Desktop, Laptop, Tablet, dan Mobile**.

---

## Fitur Utama Platform

### 1. Manajemen Siklus Hidup Aset Penuh (*Asset Lifecycle Management*)
- **Pendaftaran Master Aset**: Data menyeluruh mencakup kode aset unik, nomor seri pabrik (SN), spesifikasi, nilai perolehan, tanggal beli, masa manfaat, taksonomi kategori, dan tautan foto fisik.
- **Mutasi & Relokasi Aset**: Alur pemindahan lokasi fisik antar ruangan/gedung atau penugasan ulang penanggung jawab (*Custodian PIC*) dengan berita acara otomatis.
- **Pemeliharaan & Work Order (WO)**: Penjadwalan servis preventif berkala, tiket perbaikan darurat/korektif (*Corrective Work Orders*), estimasi biaya, pencatatan vendor, dan downtime mesin.
- **Pelepasan & Penghapusan (Disposal)**: Pengajuan disposal (dijual/lelang, scrap/rusak berat, hibah, daur ulang) dengan alur persetujuan bertingkat (*Approval Workflow*).
- **Stocktake & Audit Fisik Lapangan**: Pemindaian cepat label stiker fisik via kamera smartphone/scanner untuk rekonsiliasi data inventaris secara *real-time*.

### 2. Studio Impor Massal Data Master Aset (Batch CSV Importer)
- **Studio Pemrosesan Massal Spasial**: Unggah ribuan aset sekaligus dari file tabel CSV (Microsoft Excel, Google Sheets, sistem SAP/ERP).
- **Indikator Kesehatan Kualitas Data (*Data Health Bento KPIs*)**: Deteksi otomatis jumlah aset siap impor valid, peringatan data parsial, dan deteksi duplikasi kode/SN.
- **Kebijakan Duplikasi Fleksibel**: Pilihan *Lewati (Skip)* atau *Timpa / Perbarui (Overwrite)*.
- **Template Resmi Standar**: Unduh format `.csv` berstandar internasional yang mencakup kolom RFID, NFC, dan link foto fisik.

### 3. Portal Publik Sertifikat Keaslian Digital Twin (*Digital Twin Ledger*)
- **Verifikasi Kriptografi SHA-256**: Setiap aset memiliki tanda tangan digital hash SHA-256 yang divalidasi dari telemetri perangkat keras fisik.
- **Stempel Segel Kepatuhan ISO 27001 & ISO 55001**: Tampilan sertifikat digital publik yang dapat diakses melalui pemindaian kamera HP biasa tanpa memerlukan login.
- **Lapor Insiden Lapangan Cepat Tanpa Login**: Personel lapangan dapat langsung melaporkan kendala fisik atau kerusakan aset secara instan dari halaman publik.

### 4. Pelabelan Cerdas Multi-Teknologi (QR, RFID, NFC)
- **Generator Label QR Code & Barcode**: Pembuatan lembar stiker aset siap cetak (*Print Studio*) dalam resolusi tinggi.
- **Integrasi Tag RFID EPC Gen2 (96-bit)** & **NFC UID Chip**: Pemindaian dan identifikasi frekuensi radio untuk pelacakan aset berkecepatan tinggi.

### 5. Otomatisasi Finansial & Penyusutan Nilai Buku (PSAK 16)
- Kalkulasi otomatis penyusutan nilai buku aset menggunakan metode **Garis Lurus (*Straight-Line*)** dan **Saldo Menurun (*Declining Balance*)**.
- Rekapitulasi nilai buku wajar terkini (*Net Book Value*) dan proyeksi nilai sisa (*Salvage Value*).

### 6. Tata Kelola Keamanan, RBAC & Otentikasi Ganda (2FA)
- **Role-Based Access Control (RBAC)**: Matriks izin hak akses granular per peran (*Super Admin*, *Asset Manager*, *Auditor*, *Maintenance Technician*, *Viewer*).
- **Two-Factor Authentication (TOTP 2FA)**: Standar RFC 6238 yang kompatibel dengan Google Authenticator, Microsoft Authenticator, dan Authy.
- **Pengaturan Kustomisasi Identitas**: Izin eksklusif untuk mengubah nama instansi/aplikasi dan formula awalan kode aset (*Asset Code Prefix*).

---

## Arsitektur Teknologi

- **Frontend Framework**: React 19, TypeScript 5.7, Vite 6
- **Sistem Desain & Gaya**: Tailwind CSS v4, Organic Spatial UI (*Warm Parchment* `#FBF9F4` & *Forest Charcoal* `#181F19`)
- **Ikonografi**: Lucide React (Stroke width 2px, 0% emoji teks bawaan)
- **Kriptografi & Verifikasi**: Web Crypto API (SHA-256 Hash Digest)
- **Ekspor & Utilitas**: QRCode Generator, CSV Stream Parser, Canvas Confetti

---

## Dukungan Lintas Perangkat (Desktop, Tablet, & Mobile)

Platform ini dirancang dengan prinsip **Universal Responsiveness** untuk memberikan pengalaman tanpa hambatan di berbagai skenario kerja:

- **Desktop & Monitor Lebar (Full-Width Fluid Layout)**: Menghilangkan batasan lebar kaku (*no max-w-7xl*) sehingga seluruh layar monitor Full HD, 2K, 4K, dan Ultrawide termanfaatkan optimal untuk analisis tabel data densitas tinggi dan split-screen bento.
- **Tablet & Perangkat Lapangan (iPad / Android POS)**: Grid 2-kolom adaptif dengan target sentuh ergonomis (min 44px) yang memudahkan tim audit lapangan (*Stocktake*) memeriksa fisik aset dan memindai barcode/RFID.
- **Mobile Smartphone (iOS & Android)**: Navigasi satu tangan (*One-Thumb Bottom Floating Dock*), reflow kartu vertikal yang mulus, pemindai kamera QR instan langsung dari browser, dan modal formulir yang pas di layar HP.

---

## Panduan Menjalankan di Lingkungan Lokal (Local Development)

### 1. Prasyarat Sistem
- **Node.js**: Versi `18.x` atau lebih baru (`v20 LTS` direkomendasikan).
- **NPM**: Versi `9.x` atau lebih baru.

### 2. Instalasi & Menjalankan Aplikasi
```bash
# 1. Clone repositori dari GitHub
git clone https://github.com/username/enterprise-asset-management.git
cd enterprise-asset-management

# 2. Pasang dependensi proyek
npm install

# 3. Salin template variabel lingkungan
cp .env.example .env

# 4. Jalankan server pengembangan lokal
npm run dev
```
Akses aplikasi melalui peramban di: `http://localhost:5173`.

---

## Panduan Akses Jaringan & Deployment Produksi (Enterprise DevOps)

Platform **Enterprise Asset Management** mendukung 3 metode deployment berstandar industri sesuai arsitektur infrastruktur organisasi Anda:

---

### Metode 1: Cloudflare Named Tunnel (Rekomendasi Utama Produksi • 100% Gratis)

**Cloudflare Named Tunnel (Zero Trust)** adalah arsitektur terowongan produksi paling aman dan stabil 24/7. Anda dapat menghubungkan server lokal atau VPS ke **Domain Resmi Instansi** tanpa perlu menyewa IP publik statis dan tanpa perlu membuka port firewall router (*Zero Inbound Ports*):

```bash
# 1. Otentikasi akun Cloudflare & buat Named Tunnel permanen
cloudflared tunnel login
cloudflared tunnel create assetcorp-eam

# 2. Hubungkan DNS domain/subdomain resmi instansi ke Named Tunnel
cloudflared tunnel route dns assetcorp-eam aset.instansi-anda.com

# 3. Buat berkas konfigurasi /root/.cloudflared/config.yml:
# tunnel: <UUID_TUNNEL_ANDA>
# credentials-file: /root/.cloudflared/<UUID_TUNNEL_ANDA>.json
# ingress:
#   - hostname: aset.instansi-anda.com
#     service: http://localhost:5173
#   - service: http_status:404

# 4. Pasang sebagai systemd service latar belakang (Auto-Start 24/7 saat booting)
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

### Metode 2: Nginx Reverse Proxy + Let's Encrypt SSL (Produksi Mandiri Linux VPS)

Untuk deployment produksi mandiri (*self-hosted*) pada server VPS Linux (Ubuntu 22.04/24.04 LTS / Debian):

#### 1. Kompilasi Bundle Produksi
```bash
npm run build
```
*(Hasil kompilasi web teroptimasi akan tersimpan di folder `/dist`)*

#### 2. Konfigurasi Nginx Web Server
Buat berkas konfigurasi `/etc/nginx/sites-available/eam.conf`:
```nginx
server {
    listen 80;
    server_name aset.instansi-anda.com;

    root /var/www/enterprise-asset-management/dist;
    index index.html;

    # Optimasi kompresi Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Header Keamanan
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Penanganan SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Caching Aset Statis
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

#### 3. Aktifkan Situs & Pasang Sertifikat SSL HTTPS Gratis
```bash
sudo ln -s /etc/nginx/sites-available/eam.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Otomatisasi sertifikat SSL dengan Let's Encrypt Certbot
sudo apt update && sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d aset.instansi-anda.com
```

---

### Metode 3: Kontainerisasi Docker Compose & Layanan Systemd

#### A. Konfigurasi Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'
services:
  eam-app:
    image: nginx:alpine
    container_name: eam-enterprise-production
    restart: always
    ports:
      - "8080:80"
    volumes:
      - ./dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
```
Jalankan kontainer dengan perintah:
```bash
docker compose up -d
```

#### B. Konfigurasi Auto-Start Systemd Service (`/etc/systemd/system/eam.service`)
```ini
[Unit]
Description=Enterprise Asset Management Web App Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/enterprise-asset-management
ExecStart=/usr/bin/npm run preview -- --port 5173 --host 0.0.0.0
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```
Aktifkan service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable eam.service
sudo systemctl start eam.service
```

---

### Pengujian Sandbox Cepat (Opsional untuk Demo Lokal)
Jika hanya ingin menguji coba tautan sementara tanpa domain resmi:
```bash
npx cloudflared tunnel --url http://localhost:5173
```

---

## Variabel Lingkungan (.env)

| Variabel | Deskripsi | Default / Contoh |
| :--- | :--- | :--- |
| `VITE_APP_ENV` | Mode lingkungan sistem | `production` / `development` |
| `VITE_APP_NAME` | Nama instansi / aplikasi resmi | `"Enterprise Asset Management"` |
| `VITE_APP_DOMAIN` | Domain publik resmi portal | `"https://eam.instansi-anda.com"` |
| `VITE_DEFAULT_CODE_PREFIX` | Formula awalan penomoran aset | `"AST-"` / `"EAM-"` |
| `VITE_SECURITY_SESSION_TIMEOUT`| Batas waktu sesi tidak aktif (menit) | `30` |
| `VITE_ENABLE_AUDIT_LOG` | Mengaktifkan audit trail | `true` |
| `VITE_DEV_PORT` | Port server pengembangan lokal | `5173` |
| `VITE_DOCKER_PORT` | Port pemetaan kontainer Docker | `8080` |

---

## Kebijakan Keamanan & Kontak

Keamanan kode dan privasi data aset adalah prioritas utama kami. Untuk informasi arsitektur keamanan detail, prosedur audit, serta pelaporan celah kerentanan, silakan baca dokumen [SECURITY.md](SECURITY.md).

- **Email Tim Keamanan**: [`decepti0n13lack@gmail.com`](mailto:decepti0n13lack@gmail.com)
- **Subjek Laporan**: `[SECURITY] Temuan Kerentanan - Enterprise Asset Management`

---

## Lisensi

Proyek ini dilisensikan di bawah lisensi **MIT License** - lihat berkas [LICENSE](LICENSE) untuk ketentuan lengkap.
