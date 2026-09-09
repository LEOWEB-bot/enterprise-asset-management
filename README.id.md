# Enterprise Asset Management (EAM)

[![Version: 1.4.0](https://img.shields.io/badge/Versi-1.4.0-emerald.svg)](package.json)
[![License: MIT](https://img.shields.io/badge/Lisensi-MIT-blue.svg)](LICENSE)
[![Runtime: Node.js 22 LTS](https://img.shields.io/badge/Node.js-22%20LTS-green)](https://nodejs.org/)
[![Database: SQLite 3 WAL](https://img.shields.io/badge/Database-SQLite%203%20WAL-003B57)](https://www.sqlite.org/)
[![Framework: React 19](https://img.shields.io/badge/React-19.0-blue)](https://react.dev/)
[![Language: TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Bundler: Vite 6](https://img.shields.io/badge/Vite-6.1-purple)](https://vitejs.dev/)
[![Tailwind CSS: v4](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8)](https://tailwindcss.com/)
[![Security: Audited](https://img.shields.io/badge/Keamanan-2FA%20%7C%20RBAC-emerald)](SECURITY.md)

> **Bahasa / Language**: [English](README.md) | **Bahasa Indonesia**

**Enterprise Asset Management (EAM)** adalah platform sistem informasi manajemen aset fisik, peralatan, armada, fasilitas, dan inventaris berskala enterprise berstandar industri (**ISO 55001 & PSAK 16 / IFRS IAS 16**). 

Aplikasi ini dibangun menggunakan arsitektur antarmuka modern **Organic Spatial UI (Web-OS Style)** yang responsif penuh (*Full-Width Fluid Responsive*) untuk perangkat **Desktop, Laptop, Tablet, dan Mobile**, ditenagai oleh **Backend REST API Node.js Express Terpusat**, mesin basis data relasional **SQLite 3 dengan Mode WAL**, sinkronisasi bayangan atomik (*atomic shadow sync*), dan **Mesin Pencadangan Otomatis Dual-Layer (Lokal & Cloud)**.

---

## Fitur Utama Platform

### 1. Backend REST API Terpusat & Mesin Penyimpanan Relasional SQLite 3
- **Mesin Relasional SQLite 3 Bawaan**: Persistensi data transaksional performa tinggi menggunakan modul bawaan Node.js `node:sqlite` (`DatabaseSync`), tersimpan pada berkas `data/eam.db`.
- **Mode Write-Ahead Logging (WAL)**: Diaktifkan melalui `PRAGMA journal_mode = WAL;` dan `PRAGMA synchronous = NORMAL;`, memungkinkan pembacaan data secara paralel bersamaan tanpa memblokir proses tulis.
- **Sinkronisasi Bayangan Atomik (Dual Atomic Shadow Sync)**: Secara otomatis menyinkronkan seluruh perubahan data ke `data/database.json` melalui teknik penggantian berkas temporer atomik (`.tmp` ke `.json`) demi ketahanan failover dan kompatibilitas jangka panjang.
- **Akses Multi-Device Langsung ke Login**: Deteksi inisialisasi server otomatis (`/api/status`). Setelah inisialisasi awal, seluruh perangkat dan browser lain langsung diarahkan ke layar **Login** tanpa mengulang Setup Wizard.
- **Konsistensi Real-Time Lintas Perangkat**: Penambahan aset baru, mutasi lokasi, tiket pemeliharaan, dan persetujuan disposal langsung tercermin secara instan di seluruh workstation staf, tablet lapangan, dan ponsel cerdas.

### 2. Mesin Pencadangan Otomatis Dual-Layer & Pemulihan Bencana
- **Snapshot Berkas Ganda**: Menghasilkan arsip data tersinkronisasi dalam format `.json` dan salinan biner mentah `.db` di direktori `data/backups/`.
- **Penjadwal Otomatis Internal**: Cron scheduler latar belakang berjalan setiap 24 jam dengan rotasi FIFO otomatis (menyimpan hingga 15 arsip snapshot riwayat).
- **Replikasi Cloud Offsite (S3 / Cloudflare R2)**: Sinkronisasi data cadangan secara asinkron ke AWS S3, Cloudflare R2, MinIO, atau Google Cloud Storage menggunakan `@aws-sdk/client-s3`.
- **Pusat Manajemen Cadangan di Web UI**: Konsol administrasi web lengkap untuk membuat snapshot manual sewaktu-waktu, unduh berkas arsip satu-klik, penghapusan cadangan per item, pembersihan massal, serta pemulihan langsung via unggah berkas JSON.

### 3. Pendaftaran Master Aset Baru Spatial Bento (Web-OS Style)
- **4 Kartu Bento Spasial**:
  1. *Identitas Fisik & Kategorisasi*: Formula kode aset otomatis berurutan (`AST-YYYY-XXXXX`), nama resmi aset, kategori taksonomi, merk/model, lokasi ruangan/lantai, dan status operasional.
  2. *Valuasi Finansial & Akuntansi PSAK 16*: Nilai perolehan, tanggal perolehan/pembelian, masa manfaat ekonomis (bulan), estimasi nilai sisa (salvage value), dan metode depresiasi (Garis Lurus / Saldo Menurun).
  3. *Hak Asuh, Verifikasi & Pelabelan Cerdas*: Penunjukan penanggung jawab (*Custodian PIC*), nomor seri pabrik (*Serial Number*), tag RFID EPC Gen2 (96-bit), dan chip NFC UID.
  4. *Dokumentasi Visual & Spesifikasi Teknis*: Kompresi foto cerdas langsung di peramban via HTML5 Canvas (maksimal 1280px / 80% JPEG) serta pasangan atribut spesifikasi teknis kustom dinamis.
- **Bilah Telemetri Depresiasi PSAK 16 Live**: Panel telemetri tersemat di bagian bawah formulir yang menghitung Nilai Buku Bersih (*Net Book Value*), Biaya Penyusutan Bulanan, dan Akumulasi Penyusutan secara otomatis seketika nilai finansial dimasukkan.
- **Baseline Form Bersih Tanpa Data Tiruan**: Seluruh kolom formulir pendaftaran terbuka kosong tanpa ada teks dummy atau nilai buatan yang tertinggal, siap menerima data aset riil perusahaan.

### 4. Manajemen Siklus Hidup Aset Penuh (*Asset Lifecycle Management*)
- **Mutasi & Relokasi Aset**: Alur pemindahan lokasi fisik antar ruangan/gedung atau penugasan ulang penanggung jawab (*Custodian PIC*) dengan berita acara serah terima otomatis.
- **Pemeliharaan & Work Order (WO)**: Penjadwalan servis berkala preventif, tiket perbaikan darurat korektif, estimasi biaya suku cadang, pencatatan vendor pihak ketiga, dan pelacakan downtime mesin.
- **Pelepasan & Penghapusan (Disposal)**: Pengajuan disposal (dijual/lelang, scrap/rusak berat, hibah, daur ulang, write-off) dengan alur persetujuan bertingkat (*Approval Workflow*).
- **Stocktake & Audit Fisik Lapangan**: Pemindaian cepat label stiker fisik via kamera smartphone/scanner untuk rekonsiliasi data inventaris secara *real-time*.

### 5. Studio Impor Massal Data Master Aset (Batch CSV Importer)
- **Studio Pemrosesan Massal Spasial**: Unggah ribuan aset sekaligus dari file tabel CSV (Microsoft Excel, Google Sheets, sistem SAP/ERP).
- **Indikator Kesehatan Kualitas Data (*Data Health Bento KPIs*)**: Deteksi otomatis jumlah aset siap impor valid, peringatan data parsial, dan deteksi duplikasi kode/SN.
- **Kebijakan Duplikasi Fleksibel**: Pilihan *Lewati (Skip)* atau *Timpa / Perbarui (Overwrite)*.
- **Template Resmi Standar**: Unduh format `.csv` berstandar internasional yang mencakup kolom RFID, NFC, dan link foto fisik.

### 6. Portal Publik Sertifikat Keaslian Digital Twin (*Digital Twin Ledger*)
- **Verifikasi Kriptografi SHA-256**: Setiap aset memiliki tanda tangan digital hash SHA-256 yang divalidasi dari telemetri perangkat keras fisik.
- **Stempel Segel Kepatuhan ISO 27001 & ISO 55001**: Tampilan sertifikat digital publik yang dapat diakses melalui pemindaian kamera HP biasa tanpa memerlukan login.
- **Lapor Insiden Lapangan Cepat Tanpa Login**: Personel lapangan dapat langsung melaporkan kendala fisik atau kerusakan aset secara instan dari halaman publik.

### 7. Pelabelan Cerdas Multi-Teknologi (QR, RFID, NFC)
- **Generator Label QR Code & Barcode**: Pembuatan lembar stiker aset siap cetak (*Print Studio*) dalam resolusi tinggi dengan QR code dan barcode Code-128.
- **Integrasi Tag RFID EPC Gen2 (96-bit)** & **NFC UID Chip**: Pemindaian dan identifikasi frekuensi radio untuk pelacakan aset berkecepatan tinggi.

### 8. Tata Kelola Keamanan, RBAC & Otentikasi Ganda (2FA)
- **Role-Based Access Control (RBAC)**: Matriks izin hak akses granular per peran (*Super Admin*, *Asset Manager*, *Auditor*, *Maintenance Technician*, *Viewer*).
- **Two-Factor Authentication (TOTP 2FA)**: Standar RFC 6238 yang kompatibel dengan Google Authenticator, Microsoft Authenticator, dan Authy.
- **Pengaturan Kustomisasi Identitas**: Izin eksklusif untuk mengubah nama instansi/aplikasi dan formula awalan kode aset (*Asset Code Prefix*).
- **Mode Fresh Install VPS**: Variabel lingkungan `VITE_FRESH_INSTALL=true` untuk administrator VPS yang menginginkan instalasi bersih tanpa aset demo tiruan.

---

## Arsitektur Teknologi

- **Server Backend API**: Node.js (v22+ LTS), Express.js, TypeScript (`tsx`), CORS
- **Database Utama**: SQLite 3 dengan Write-Ahead Logging (`node:sqlite`, `data/eam.db`)
- **Penyimpanan Bayangan Fallback**: Berkas JSON dengan transaksi tulis atomik (`data/database.json`)
- **Replikasi Cloud**: `@aws-sdk/client-s3` (kompatibel dengan AWS S3, Cloudflare R2, MinIO)
- **Frontend Framework**: React 19, TypeScript 5.7, Vite 6
- **Sistem Desain & Gaya**: Tailwind CSS v4, Organic Spatial UI (*Warm Parchment* `#FBF9F4` & *Forest Charcoal* `#181F19`)
- **Ikonografi**: Lucide React (Stroke width 2px, 0% emoji teks bawaan)
- **Kriptografi & Verifikasi**: Web Crypto API (SHA-256 Hash Digest)
- **Ekspor & Utilitas**: QRCode Generator, CSV Stream Parser, Canvas Confetti

---

## Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat Sistem
- **Node.js**: Versi `22.0.0` atau lebih baru (`v22 LTS` sangat direkomendasikan) — wajib untuk fitur bawaan `node:sqlite` (`DatabaseSync`).
- **NPM**: Versi `9.x` atau lebih baru.
- **Git**: Terpasang pada sistem operasi Anda.

Periksa versi yang terpasang di komputer/server Anda:
```bash
node -v
# Pastikan menampilkan versi >= v22.0.0
npm -v
# Pastikan menampilkan versi >= 9.0.0
```

---

### 2. Instalasi Lingkungan Lokal (Windows / macOS / Linux)

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di komputer lokal:

```bash
# 1. Unduh kode sumber dari GitHub
git clone https://github.com/username/enterprise-asset-management.git
cd enterprise-asset-management

# 2. Pasang dependensi proyek
npm install

# 3. Salin berkas konfigurasi lingkungan
cp .env.example .env

# 4. Jalankan seluruh stack (Express Backend + Vite Frontend secara bersamaan)
npm run dev
```

Perintah terpadu ini secara bersamaan menjalankan:
- **Express Backend API**: `http://localhost:3001`
- **Vite Frontend Client**: `http://localhost:5173`

Bila ingin menjalankannya pada terminal terpisah:
```bash
# Terminal 1: Server backend saja
npm run dev:server

# Terminal 2: Klien frontend saja
npm run dev:client
```

---

### 3. Deployment Produksi via Docker Compose (Sangat Direkomendasikan)

Aplikasi telah dilengkapi berkas `Dockerfile` multi-stage (berbasis `node:22-alpine`) dan `docker-compose.yml` siap pakai dengan volume penyimpanan persisten:

```bash
# 1. Clone repositori dan masuk ke direktori proyek
git clone https://github.com/username/enterprise-asset-management.git
cd enterprise-asset-management

# 2. Siapkan berkas variabel lingkungan produksi
cp .env.example .env
# Sesuaikan isi .env sesuai domain dan kebutuhan produksi Anda

# 3. Bangun dan jalankan kontainer di latar belakang
docker compose up -d --build
```

#### Arsitektur Kontainer:
- **Pemetaan Port**: Port internal `3001` diteruskan ke port host `8080` (dapat disesuaikan melalui `VITE_DOCKER_PORT` di `.env`).
- **Penyimpanan Persisten**: Direktori `./data` di komputer/server dihubungkan (*mounted*) ke `/app/data` di dalam kontainer. Hal ini memastikan berkas database `data/eam.db`, `data/database.json`, serta seluruh snapshot di `data/backups/` tidak akan hilang saat kontainer di-rebuild atau diperbarui.
- **Penyajian Aset Statis**: Backend Express secara otomatis menyajikan berkas build Vite dari direktori `/dist` sekaligus menangani rute `/api/*`.

Perintah operasional Docker:
```bash
# Melihat log aplikasi secara real-time
docker compose logs -f

# Memeriksa status kontainer
docker compose ps

# Memulai ulang kontainer
docker compose restart

# Menghentikan kontainer
docker compose down
```

---

### 4. Panduan Deployment Mandiri di Linux VPS (PM2 + Nginx Reverse Proxy + SSL)

Untuk deployment mandiri pada Linux VPS (Ubuntu 22.04 / 24.04 LTS atau Debian 12):

#### Langkah 1: Pasang Node.js 22 LTS
```bash
# Pasang Node.js 22 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential

# Pastikan versi terpasang
node -v # Harus v22.x
```

#### Langkah 2: Unduh dan Bangun Aplikasi
```bash
# Masuk ke direktori web server
cd /var/www
git clone https://github.com/username/enterprise-asset-management.git eam
cd eam

# Pasang dependensi dan kompilasi bundle frontend
npm install
cp .env.example .env
npm run build

# Buat direktori cadangan dan pastikan izin tulis diberikan
mkdir -p data/backups
chmod -R 775 data
```

#### Langkah 3: Jalankan Layanan dengan PM2
```bash
# Pasang PM2 secara global
sudo npm install -g pm2

# Jalankan server produksi
pm2 start "npm run start" --name "assetcorp-eam"

# Konfigurasikan auto-start saat VPS restart
pm2 startup
pm2 save
```

#### Langkah 4: Konfigurasi Nginx Reverse Proxy
Buat berkas konfigurasi `/etc/nginx/sites-available/eam.conf`:
```nginx
server {
    listen 80;
    server_name eam.domain-anda.com;

    # Kompresi Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Header Keamanan
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Reverse Proxy ke Backend Node.js (Port 3001)
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan konfigurasi dan muat ulang Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/eam.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Langkah 5: Pasang Sertifikat SSL Gratis (Let's Encrypt Certbot)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d eam.domain-anda.com
```

---

### 5. Mode Fresh Install vs Mode Inisialisasi Demo

Aplikasi memiliki dua opsi inisialisasi yang diatur melalui parameter `.env` `VITE_FRESH_INSTALL`:

- **Mode Demo Terinisialisasi (`VITE_FRESH_INSTALL=false`)**:
  - Mengisi basis data dengan data sampel aset, kategori organisasi, lokasi fisik, dan kelas aset bawaan.
  - Sangat cocok untuk keperluan presentasi, demo fitur, pengujian fungsional, dan lingkungan staging.
- **Mode Fresh Install Bersih (`VITE_FRESH_INSTALL=true`)**:
  - Menyiapkan basis data yang benar-benar bersih dan kosong untuk lingkungan produksi resmi.
  - Bebas 100% dari data aset dummy atau data tiruan.
  - Administrator dapat langsung menyusun master kategori khusus instansi dan mengimpor data riil melalui Studio Impor CSV.

---

## Kredensial Bawaan Superadmin & Panduan Keamanan Pasca-Instalasi

Saat aplikasi dijalankan pada server di mana basis data telah diinisialisasi, sistem akan otomatis mengarahkan seluruh pengguna langsung ke **Layar Login**. Kredensial bawaan sengaja tidak ditulis secara permanen di antarmuka login demi menjaga standar keamanan informasi.

### 1. Kredensial Administrator Bawaan
- **Email / ID Pengguna**: `admin@assetcorp.id`
- **Kata Sandi Awal**: `password123`

### 2. Panduan Keamanan Wajib Pasca-Instalasi
> [!IMPORTANT]
> Segera setelah berhasil masuk untuk pertama kali di server produksi atau VPS, administrator **SANGAT DISARANKAN** untuk segera melakukan 3 langkah pengerasan keamanan berikut:
> 1. **Perbarui Email Resmi**: Masuk ke menu **Pengaturan Sistem > Profil & Identitas** dan ganti email administrator ke alamat email dinas resmi instansi Anda.
> 2. **Ganti Kata Sandi**: Ubah kata sandi bawaan menjadi kata sandi baru yang kuat dan unik (kombinasi huruf besar-kecil, angka, dan simbol).
> 3. **Aktifkan Otentikasi Dua Faktor (2FA TOTP)**: Aktifkan proteksi 2FA menggunakan aplikasi seperti Google Authenticator, Microsoft Authenticator, atau Authy untuk memproteksi akun administrator dari peretasan dan akses tidak berizin.

---

## Variabel Lingkungan (.env)

| Variabel | Deskripsi | Nilai Bawaan / Contoh |
| :--- | :--- | :--- |
| `VITE_APP_ENV` | Mode lingkungan sistem | `production` / `development` |
| `VITE_APP_NAME` | Nama Resmi Aplikasi / Organisasi | `"Enterprise Asset Management"` |
| `VITE_APP_DOMAIN` | Domain Publik Portal Sertifikat | `"https://eam.domain-anda.com"` |
| `VITE_DEFAULT_CODE_PREFIX` | Formula Awalan Kode Aset Otomatis | `"AST-"` / `"EAM-"` |
| `VITE_SECURITY_SESSION_TIMEOUT`| Batas Waktu Sesi Tidak Aktif (Menit) | `30` |
| `VITE_ENABLE_AUDIT_LOG` | Aktifkan Pencatatan Jejak Audit Trail | `true` |
| `VITE_DEV_PORT` | Port Klien Vite Pengembangan Lokal | `5173` |
| `VITE_BACKEND_PORT` | Port Server REST API Backend | `3001` |
| `VITE_DOCKER_PORT` | Port Host Pemetaan Kontainer Docker | `8080` |
| `VITE_FRESH_INSTALL` | Mode Fresh Install VPS (Database Bersih) | `false` (Setel `true` untuk database kosong) |
| `BACKUP_INTERVAL_HOURS` | Interval Cadangan Otomatis Internal (Jam)| `24` |
| `BACKUP_RETENTION_COUNT`| Jumlah Maksimal Riwayat Cadangan Disimpan | `15` |
| `BACKUP_CLOUD_ENABLED` | Aktifkan Replikasi Cadangan ke Cloud S3/R2| `false` (Setel `true` untuk mengaktifkan) |
| `BACKUP_CLOUD_ENDPOINT`| URL Endpoint Kompatibel S3 | `"https://<account_id>.r2.cloudflarestorage.com"` |
| `BACKUP_CLOUD_REGION` | Wilayah Layanan Cloud Storage | `"auto"` / `"us-east-1"` |
| `BACKUP_CLOUD_BUCKET` | Nama Bucket Cloud Storage | `"eam-backups"` |
| `BACKUP_CLOUD_ACCESS_KEY_ID` | Access Key ID Cloud Storage | `"kunci_akses_anda"` |
| `BACKUP_CLOUD_SECRET_ACCESS_KEY` | Secret Access Key Cloud Storage | `"kunci_rahasia_anda"` |

---

## Kebijakan Keamanan & Pengungkapan Kerentanan

Keamanan kode dan privasi data adalah prioritas tertinggi kami. Untuk rincian arsitektur keamanan dan prosedur pelaporan tanggung jawab, silakan pelajari dokumen [SECURITY.md](SECURITY.md).

- **Email Kontak Keamanan**: [`decepti0n13lack@gmail.com`](mailto:decepti0n13lack@gmail.com)
- **Format Judul**: `[SECURITY] Vulnerability Report - Enterprise Asset Management`

---

## Lisensi

Proyek ini dilindungi di bawah lisensi terbuka **MIT License** - lihat berkas [LICENSE](LICENSE) untuk ketentuan hukum selengkapnya.
