# Enterprise Asset Management (EAM)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Framework: React 19](https://img.shields.io/badge/React-19.0-blue)](https://react.dev/)
[![Language: TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Bundler: Vite 6](https://img.shields.io/badge/Vite-6.1-purple)](https://vitejs.dev/)
[![Tailwind CSS: v4](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8)](https://tailwindcss.com/)
[![Security: Audited](https://img.shields.io/badge/Security-2FA%20%7C%20RBAC-emerald)](SECURITY.md)

> 🌐 **Language / Bahasa**: **English** | [Bahasa Indonesia](README.id.md)

**Enterprise Asset Management (EAM)** is an enterprise-grade physical asset, equipment, fleet, facility, and inventory lifecycle management platform built to industrial standards (**ISO 55001 & PSAK 16 / IFRS IAS 16**).

The application is engineered with an **Organic Spatial UI (Web-OS Style)** architecture, delivering a **Full-Width Fluid Responsive** experience across **Desktop, Laptop, Tablet, and Mobile** devices.

---

## Key Features

### 1. Complete Asset Lifecycle Management
- **Master Asset Registration**: Comprehensive metadata including unique asset code, manufacturer serial number (SN), specifications, acquisition cost, purchase date, useful life, category taxonomy, and physical image URLs.
- **Asset Movement & Relocation**: Physical transfer workflows across rooms/buildings or custodian PIC reassignment with automated transfer minutes.
- **Maintenance & Work Orders (WO)**: Scheduled preventive maintenance, corrective work orders, cost tracking, third-party vendor logs, and machine downtime monitoring.
- **Asset Disposal & Decommissioning**: Disposal proposals (sale/auction, scrap, donation, recycling, write-off) with multi-tier approval workflows.
- **Field Stocktake & Inventory Audit**: Fast physical sticker barcode/QR scanning via smartphone camera/scanner for real-time inventory reconciliation.

### 2. Batch Master Data CSV Import Studio
- **Spatial Batch Processing Studio**: Upload thousands of assets simultaneously from CSV spreadsheets (Microsoft Excel, Google Sheets, SAP/ERP exports).
- **Data Health Bento KPIs**: Automated detection of total detected rows, valid ready-to-import assets, partial warnings, and duplicate code/SN detection.
- **Flexible Duplicate Resolution**: Select between *Skip* or *Overwrite/Update*.
- **Official Standard Template**: Download international standard `.csv` templates including RFID, NFC, and image URL columns.

### 3. Digital Twin Authenticity Public Portal (*Ledger*)
- **SHA-256 Cryptographic Verification**: Every asset features a canonical SHA-256 cryptographic digest verified against physical hardware telemetry.
- **ISO 27001 & ISO 55001 Compliance Seals**: Publicly accessible authenticity certificate via smartphone camera scan without requiring user login.
- **Instant Field Incident Reporting**: Field personnel can report physical defects or operational breakdowns anonymously from the public certificate page.

### 4. Multi-Technology Smart Labeling (QR, RFID, NFC)
- **High-Resolution Print Studio**: Generate print-ready asset sticker label sheets with QR codes and Code-128 barcodes.
- **RFID EPC Gen2 (96-bit) & NFC UID Integration**: Radio-frequency identification and chip telemetry for rapid physical audits.

### 5. Automated Financial Depreciation (PSAK 16 / IFRS IAS 16)
- Automated calculation of asset book depreciation using **Straight-Line** and **Declining Balance** methods.
- Real-time summaries of Net Book Value (NBV) and estimated salvage/residual values.

### 6. Security Governance, RBAC & Multi-Factor Auth (2FA)
- **Role-Based Access Control (RBAC)**: Granular permission matrix per role (*Super Admin*, *Asset Manager*, *Auditor*, *Maintenance Technician*, *Viewer*).
- **Two-Factor Authentication (TOTP 2FA)**: RFC 6238 compliant (Google Authenticator, Microsoft Authenticator, Authy).
- **Identity Customization**: Authorized system configuration for organizational branding and asset code prefix formulas.

---

## Technology Stack

- **Frontend Framework**: React 19, TypeScript 5.7, Vite 6
- **Styling & Design System**: Tailwind CSS v4, Organic Spatial UI (*Warm Parchment* `#FBF9F4` & *Forest Charcoal* `#181F19`)
- **Iconography**: Lucide React (Stroke width 2px, 0% native text emoji)
- **Cryptography & Verification**: Web Crypto API (SHA-256 Hash Digest)
- **Export & Utilities**: QRCode Generator, CSV Stream Parser, Canvas Confetti

---

## Multi-Device Support (Desktop, Tablet, & Mobile)

Engineered under the **Universal Responsiveness** paradigm:

- **Desktop & Ultrawide Displays (Full-Width Fluid)**: Removes artificial max-width constraints (`no max-w-7xl`), fully utilizing 1080p, 2K, 4K, and Ultrawide monitors for high-density data tables and multi-column bento matrices.
- **Tablets & Field POS (iPad / Android POS)**: Balanced 2-column adaptive bento grid with ergonomic touch targets (min 44px) for warehouse stocktake audits.
- **Mobile Smartphones (iOS & Android)**: One-thumb bottom floating action dock, seamless vertical card stream, instant camera QR scanner, and responsive sheet modals.

---

## Local Development Guide

### 1. Prerequisites
- **Node.js**: Version `18.x` or later (`v20 LTS` recommended).
- **NPM**: Version `9.x` or later.

### 2. Installation & Running
```bash
# 1. Clone the repository from GitHub
git clone https://github.com/username/enterprise-asset-management.git
cd enterprise-asset-management

# 2. Install project dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Start local development server
npm run dev
```
Open your browser at: `http://localhost:5173`.

---

## Enterprise Production Deployment (DevOps)

**Enterprise Asset Management** supports 3 industry-standard production deployment strategies:

---

### Method 1: Cloudflare Named Tunnel (Recommended Production • 100% Free)

**Cloudflare Named Tunnel (Zero Trust)** is the most secure 24/7 tunnel architecture. Connect your local server or VPS to your **Official Custom Domain** without public static IPs and without opening router firewall ports (*Zero Inbound Ports*):

```bash
# 1. Authenticate Cloudflare account & create permanent Named Tunnel
cloudflared tunnel login
cloudflared tunnel create assetcorp-eam

# 2. Route official domain/subdomain DNS to Named Tunnel
cloudflared tunnel route dns assetcorp-eam eam.your-domain.com

# 3. Create config file /root/.cloudflared/config.yml:
# tunnel: <YOUR_TUNNEL_UUID>
# credentials-file: /root/.cloudflared/<YOUR_TUNNEL_UUID>.json
# ingress:
#   - hostname: eam.your-domain.com
#     service: http://localhost:5173
#   - service: http_status:404

# 4. Install and enable background systemd service (Auto-start on boot)
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

### Method 2: Nginx Reverse Proxy + Let's Encrypt SSL (Self-Hosted VPS)

For self-hosted Linux VPS deployments (Ubuntu 22.04/24.04 LTS / Debian):

#### 1. Compile Production Bundle
```bash
npm run build
```
*(Optimized static web assets will be generated in `/dist`)*

#### 2. Configure Nginx Web Server
Create configuration file `/etc/nginx/sites-available/eam.conf`:
```nginx
server {
    listen 80;
    server_name eam.your-domain.com;

    root /var/www/enterprise-asset-management/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # SPA Routing Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static Asset Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

#### 3. Enable Site & Obtain Free SSL Certificate
```bash
sudo ln -s /etc/nginx/sites-available/eam.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Let's Encrypt Certbot SSL Automation
sudo apt update && sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d eam.your-domain.com
```

---

### Method 3: Containerization (Docker Compose & Systemd)

#### A. Docker Compose Configuration (`docker-compose.yml`)
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
Run container:
```bash
docker compose up -d
```

#### B. Auto-Start Systemd Service (`/etc/systemd/system/eam.service`)
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
Enable service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable eam.service
sudo systemctl start eam.service
```

---

### Quick Sandbox Testing (Optional for Local Demos)
If you only need a temporary tunnel URL without domain setup:
```bash
npx cloudflared tunnel --url http://localhost:5173
```

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
| `VITE_DEV_PORT` | Local Development Port | `5173` |
| `VITE_DOCKER_PORT` | Docker Container Mapped Port | `8080` |

---

## Security Policy & Vulnerability Disclosure

Code security and data privacy are our highest priorities. For security architecture details and responsible disclosure procedures, please refer to [SECURITY.md](SECURITY.md).

- **Security Contact Email**: [`decepti0n13lack@gmail.com`](mailto:decepti0n13lack@gmail.com)
- **Subject Line**: `[SECURITY] Vulnerability Report - Enterprise Asset Management`

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
