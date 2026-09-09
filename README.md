# Enterprise Asset Management (EAM)

[![Version: 1.4.0](https://img.shields.io/badge/Version-1.4.0-emerald.svg)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Runtime: Node.js 22 LTS](https://img.shields.io/badge/Node.js-22%20LTS-green)](https://nodejs.org/)
[![Database: SQLite 3 WAL](https://img.shields.io/badge/Database-SQLite%203%20WAL-003B57)](https://www.sqlite.org/)
[![Framework: React 19](https://img.shields.io/badge/React-19.0-blue)](https://react.dev/)
[![Language: TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Bundler: Vite 6](https://img.shields.io/badge/Vite-6.1-purple)](https://vitejs.dev/)
[![Tailwind CSS: v4](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8)](https://tailwindcss.com/)
[![Security: Audited](https://img.shields.io/badge/Security-2FA%20%7C%20RBAC-emerald)](SECURITY.md)

> **Language / Bahasa**: **English** | [Bahasa Indonesia](README.id.md)

**Enterprise Asset Management (EAM)** is an enterprise-grade physical asset, equipment, fleet, facility, and inventory lifecycle management platform built to industrial standards (**ISO 55001 & PSAK 16 / IFRS IAS 16**).

The application is engineered with an **Organic Spatial UI (Web-OS Style)** architecture, delivering a **Full-Width Fluid Responsive** experience across **Desktop, Laptop, Tablet, and Mobile** devices, backed by a **Centralized Node.js Express REST API**, persistent **SQLite 3 Relational Engine with WAL Mode**, dual atomic shadow synchronization, and a **Dual-Layer Automated Backup Engine**.

---

## Key Features

### 1. Centralized Backend API & SQLite Relational Storage Engine
- **Native SQLite 3 Relational Engine**: High-performance transactional persistence powered by Node.js built-in `node:sqlite` (`DatabaseSync`), storing data in `data/eam.db`.
- **Write-Ahead Logging (WAL Mode)**: Enabled via `PRAGMA journal_mode = WAL;` and `PRAGMA synchronous = NORMAL;`, delivering concurrent reads and non-blocking writes.
- **Dual Atomic Shadow Sync**: Automatically synchronizes all state changes to `data/database.json` via atomic temporary file swapping (`.tmp` to `.json`), ensuring backward compatibility and failover resilience.
- **Seamless Multi-Device Routing**: Automatic server initialization detection (`/api/status`). After primary setup, any subsequent device or browser routes directly to the secure **Login Screen**.
- **Real-Time Cross-Platform Consistency**: Asset creation, mutations, maintenance work orders, and disposal approvals reflect instantaneously across all authorized client terminals.

### 2. Dual-Layer Automated Backup & Disaster Recovery Engine
- **Dual-Format Snapshots**: Generates synchronized `.json` state archives and `.db` SQLite raw binary snapshots in `data/backups/`.
- **In-App Internal Scheduler**: Background cron scheduler running every 24 hours with automatic FIFO rotation (retains up to 15 historical snapshots).
- **Offsite Cloud Storage Sync (S3 / Cloudflare R2)**: Asynchronous replication to AWS S3, Cloudflare R2, MinIO, or Google Cloud Storage via `@aws-sdk/client-s3`.
- **System Settings Backup Center**: Full web-based administrative console for manual snapshot creation, one-click archive download, single snapshot deletion, bulk purge, and direct JSON upload restore.

### 3. Organic Spatial UI Master Asset Registration (Web-OS Style)
- **4 Spatial Bento Cards**:
  1. *Core Physical Identity & Categorization*: Auto-generated sequential code formula (`AST-YYYY-XXXXX`), official name, category, brand/model, location, and operational status.
  2. *Financial Valuation & PSAK 16 Accounting*: Acquisition cost, purchase date, useful life in months, estimated salvage value, and depreciation method (Straight-Line or Declining Balance).
  3. *Custody, Verification & Smart Tagging*: Custodian PIC assignment, manufacturer serial number (SN), RFID EPC Gen2 (96-bit), and NFC UID chip telemetry.
  4. *Visual Documentation & Technical Specs*: Client-side HTML5 Canvas photo compression (max 1280px / 80% JPEG) and flexible custom attribute key-value pairs.
- **Live PSAK 16 Telemetry Bar**: Pinned calculation dock computing Net Book Value (NBV), Monthly Depreciation, and Total Accumulated Depreciation reactively as financial values change.
- **Pristine Clean Baseline**: Zero hardcoded dummy or mock values in registration forms; fields open empty and ready for genuine organizational data.

### 4. Complete Asset Lifecycle Management
- **Asset Movement & Relocation**: Physical transfer workflows across rooms/buildings or custodian PIC reassignment with automated transfer minutes.
- **Maintenance & Work Orders (WO)**: Scheduled preventive maintenance, corrective work orders, cost tracking, third-party vendor logs, and machine downtime monitoring.
- **Asset Disposal & Decommissioning**: Disposal proposals (sale/auction, scrap, donation, recycling, write-off) with multi-tier approval workflows.
- **Field Stocktake & Inventory Audit**: Fast physical sticker barcode/QR scanning via smartphone camera/scanner for real-time inventory reconciliation.

### 5. Batch Master Data CSV Import Studio
- **Spatial Batch Processing Studio**: Upload thousands of assets simultaneously from CSV spreadsheets (Microsoft Excel, Google Sheets, SAP/ERP exports).
- **Data Health Bento KPIs**: Automated detection of total detected rows, valid ready-to-import assets, partial warnings, and duplicate code/SN detection.
- **Flexible Duplicate Resolution**: Select between *Skip* or *Overwrite/Update*.
- **Official Standard Template**: Download international standard `.csv` templates including RFID, NFC, and image URL columns.

### 6. Digital Twin Authenticity Public Portal (*Ledger*)
- **SHA-256 Cryptographic Verification**: Every asset features a canonical SHA-256 cryptographic digest verified against physical hardware telemetry.
- **ISO 27001 & ISO 55001 Compliance Seals**: Publicly accessible authenticity certificate via smartphone camera scan without requiring user login.
- **Instant Field Incident Reporting**: Field personnel can report physical defects or operational breakdowns anonymously from the public certificate page.

### 7. Multi-Technology Smart Labeling (QR, RFID, NFC)
- **High-Resolution Print Studio**: Generate print-ready asset sticker label sheets with QR codes and Code-128 barcodes.
- **RFID EPC Gen2 (96-bit) & NFC UID Integration**: Radio-frequency identification and chip telemetry for rapid physical audits.

### 8. Security Governance, RBAC & Multi-Factor Auth (2FA)
- **Role-Based Access Control (RBAC)**: Granular permission matrix per role (*Super Admin*, *Asset Manager*, *Auditor*, *Maintenance Technician*, *Viewer*).
- **Two-Factor Authentication (TOTP 2FA)**: RFC 6238 compliant (Google Authenticator, Microsoft Authenticator, Authy).
- **Identity Customization**: Authorized system configuration for organizational branding and asset code prefix formulas.
- **VPS Fresh Install Mode**: Switch `VITE_FRESH_INSTALL=true` in `.env` to provision empty production environments without demo seed data.

---

## Technology Stack

- **Backend API Server**: Node.js (v22+ LTS), Express.js, TypeScript (`tsx`), CORS
- **Primary Database**: SQLite 3 with Write-Ahead Logging (`node:sqlite`, `data/eam.db`)
- **Secondary Shadow Fallback**: Atomic JSON file writes (`data/database.json`)
- **Cloud Replication**: `@aws-sdk/client-s3` (compatible with AWS S3, Cloudflare R2, MinIO)
- **Frontend Framework**: React 19, TypeScript 5.7, Vite 6
- **Styling & Design System**: Tailwind CSS v4, Organic Spatial UI (*Warm Parchment* `#FBF9F4` & *Forest Charcoal* `#181F19`)
- **Iconography**: Lucide React (Stroke width 2px, 0% native text emoji)
- **Cryptography & Verification**: Web Crypto API (SHA-256 Hash Digest)
- **Export & Utilities**: QRCode Generator, CSV Stream Parser, Canvas Confetti

---

## Installation & Running Guide

### 1. Prerequisites
- **Node.js**: Version `22.0.0` or higher (`v22 LTS` recommended) — required for native `node:sqlite` (`DatabaseSync`).
- **NPM**: Version `9.x` or higher.
- **Git**: Installed and available on system PATH.

Verify your installed versions:
```bash
node -v
# Output should be >= v22.0.0
npm -v
# Output should be >= 9.0.0
```

---

### 2. Local Development (Windows / macOS / Linux)

Follow these steps to run the full application on your local machine:

```bash
# 1. Clone the repository
git clone https://github.com/username/enterprise-asset-management.git
cd enterprise-asset-management

# 2. Install project dependencies
npm install

# 3. Configure environment file
cp .env.example .env

# 4. Launch full development stack (Backend Express + Frontend Vite concurrently)
npm run dev
```

The unified development command launches:
- **Express Backend API**: `http://localhost:3001`
- **Vite Frontend Client**: `http://localhost:5173`

You can also run them in separate terminal tabs if desired:
```bash
# Terminal 1: Backend API only
npm run dev:server

# Terminal 2: Frontend client only
npm run dev:client
```

---

### 3. Production Deployment via Docker Compose (Recommended)

The project includes a production-ready, multi-stage `Dockerfile` (based on `node:22-alpine`) and a `docker-compose.yml` with persistent storage mounting:

```bash
# 1. Clone repository and navigate to project folder
git clone https://github.com/username/enterprise-asset-management.git
cd enterprise-asset-management

# 2. Create your production environment file
cp .env.example .env
# Edit .env with your production domain and settings

# 3. Build and launch the container in detached mode
docker compose up -d --build
```

#### Container Architecture:
- **Exposed Host Port**: Container port `3001` is mapped to host port `8080` (customizable via `VITE_DOCKER_PORT` in `.env`).
- **Persistent Storage**: Host `./data` is mounted to `/app/data` inside the container. This guarantees that `data/eam.db`, `data/database.json`, and all snapshots in `data/backups/` persist across container restarts and image updates.
- **Static Asset Serving**: The Node.js Express server automatically serves compiled Vite assets from `/dist` while handling all `/api/*` endpoints.

Useful Docker operational commands:
```bash
# View live application logs
docker compose logs -f

# Check container status
docker compose ps

# Restart the service
docker compose restart

# Stop container gracefully
docker compose down
```

---

### 4. Linux VPS Self-Hosted Deployment (PM2 + Nginx Reverse Proxy + SSL)

For self-hosted Linux VPS deployments (Ubuntu 22.04 / 24.04 LTS or Debian 12):

#### Step 1: Install Node.js 22 LTS
```bash
# Install Node.js 22 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential

# Confirm Node version
node -v # Must show v22.x
```

#### Step 2: Clone and Build
```bash
# Clone into production directory
cd /var/www
git clone https://github.com/username/enterprise-asset-management.git eam
cd eam

# Install dependencies and build client bundle
npm install
cp .env.example .env
npm run build

# Ensure write permissions for database and backup storage
mkdir -p data/backups
chmod -R 775 data
```

#### Step 3: Run with PM2 Process Manager
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start production server
pm2 start "npm run start" --name "assetcorp-eam"

# Configure PM2 auto-start on system boot
pm2 startup
pm2 save
```

#### Step 4: Configure Nginx Reverse Proxy
Create configuration file `/etc/nginx/sites-available/eam.conf`:
```nginx
server {
    listen 80;
    server_name eam.your-domain.com;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Reverse Proxy to Node.js Backend (Port 3001)
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

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/eam.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 5: Obtain Free SSL Certificate (Certbot)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d eam.your-domain.com
```

---

### 5. Fresh Install Mode vs Initialized Mode

The application supports two setup operating modes governed by the `.env` variable `VITE_FRESH_INSTALL`:

- **Initialized Demo Mode (`VITE_FRESH_INSTALL=false`)**:
  - Seeds the database with standard master asset records, organizational categories, physical locations, and asset classes.
  - Ideal for evaluation, feature testing, and staging environments.
- **Pristine Fresh Install Mode (`VITE_FRESH_INSTALL=true`)**:
  - Provisions a clean, empty production environment.
  - Zero mock or dummy asset records.
  - Allows organizational administrators to configure custom asset code formulas, add specific departmental taxonomy, and import genuine inventory via the CSV Import Studio.

---

## Default Superadmin Credentials & Security Advisory

When deployed on a production server where the database is initialized, the platform automatically routes all incoming connections directly to the **Login Screen**. Default credentials are intentionally not displayed on the login interface for security purposes.

### 1. Initial Administrator Credentials
- **Email / Identifier**: `admin@assetcorp.id`
- **Initial Password**: `password123`

### 2. Mandatory Post-Installation Security Advisory
> [!IMPORTANT]
> Immediately after logging in for the first time on a production or VPS deployment, administrators are strongly advised to perform the following three hardening steps:
> 1. **Update Official Email**: Navigate to **System Settings > Profile & Identity** and update the administrator email address to your official institutional email.
> 2. **Change Password**: Update the default password to a strong, unique passphrase containing letters, numbers, and symbols.
> 3. **Enable Two-Factor Authentication (2FA)**: Activate RFC 6238 TOTP Two-Factor Authentication with Google Authenticator, Microsoft Authenticator, or Authy to protect administrative access against unauthorized intrusion.

---

## Environment Variables (.env)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_APP_ENV` | Environment mode | `production` / `development` |
| `VITE_APP_NAME` | Official Application / Organization Name | `"Enterprise Asset Management"` |
| `VITE_APP_DOMAIN` | Official Public Portal Domain | `"https://eam.your-domain.com"` |
| `VITE_DEFAULT_CODE_PREFIX` | Automatic Asset Code Prefix Formula | `"AST-"` / `"EAM-"` |
| `VITE_SECURITY_SESSION_TIMEOUT`| Inactivity Session Timeout (Minutes) | `30` |
| `VITE_ENABLE_AUDIT_LOG` | Enable Audit Trail Logging | `true` |
| `VITE_DEV_PORT` | Local Frontend Development Port | `5173` |
| `VITE_BACKEND_PORT` | Backend REST API Server Port | `3001` |
| `VITE_DOCKER_PORT` | Docker Container Mapped Host Port | `8080` |
| `VITE_FRESH_INSTALL` | VPS Fresh Install Mode (Clean Database) | `false` (Set `true` for empty DB) |
| `BACKUP_INTERVAL_HOURS` | In-App Auto Backup Interval (Hours) | `24` |
| `BACKUP_RETENTION_COUNT`| Maximum Local Historical Backups Retained | `15` |
| `BACKUP_CLOUD_ENABLED` | Enable S3/R2 Cloud Backup Replication | `false` (Set `true` to enable) |
| `BACKUP_CLOUD_ENDPOINT`| S3-Compatible Endpoint URL | `"https://<account_id>.r2.cloudflarestorage.com"` |
| `BACKUP_CLOUD_REGION` | Cloud Storage Region | `"auto"` / `"us-east-1"` |
| `BACKUP_CLOUD_BUCKET` | Cloud Bucket Name | `"eam-backups"` |
| `BACKUP_CLOUD_ACCESS_KEY_ID` | Cloud Access Key ID | `"your_access_key"` |
| `BACKUP_CLOUD_SECRET_ACCESS_KEY` | Cloud Secret Access Key | `"your_secret_key"` |

---

## Security Policy & Vulnerability Disclosure

Code security and data privacy are our highest priorities. For security architecture details and responsible disclosure procedures, please refer to [SECURITY.md](SECURITY.md).

- **Security Contact Email**: [`decepti0n13lack@gmail.com`](mailto:decepti0n13lack@gmail.com)
- **Subject Line**: `[SECURITY] Vulnerability Report - Enterprise Asset Management`

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

