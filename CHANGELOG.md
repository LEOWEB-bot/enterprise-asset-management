# Changelog

All notable changes to the **Enterprise Asset Management (EAM)** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-09-09

### Added
- **Organic Spatial UI (Web-OS Style) Asset Registration Redesign**:
  - Completely re-architected the Asset Inventory Registration and Modification modal ([AssetFormModal.tsx](file:///e:/trial%20projek/aset%20management/enterprise-asset-management/components/assets/AssetFormModal.tsx)) to conform strictly with the [DESIGN.md](file:///e:/trial%20projek/aset%20management/enterprise-asset-management/DESIGN.md) spatial guidelines.
  - Implemented the signature Warm Parchment (`#FBF9F4`) spatial canvas with microdot texture, ambient chromatic glows (`#5E7A68/15` Sage Green and `#7D562D/15` Warm Clay), and deep `rounded-[32px] sm:rounded-[44px]` squircle borders.
  - Divided registration fields into 4 distinct spatial Bento cards:
    - **Bento 1 (Core Identity & Classification)**: Asset code with sequential auto-generator (`AST-YYYY-001`), full nomenclature, hardware serial number, category taxonomy with useful lifetime preview, and operational status selector.
    - **Bento 2 (Physical Placement & Custody / PIC)**: Facility location selector, department mapping, physical condition grade, and verified custodian PIC credentials (Name & official email).
    - **Bento 3 (Financial Valuation & PSAK 16 Depreciation)**: Acquisition date, cost, salvage/residual value, useful life years, and real-time live PSAK 16 telemetry bar computing instantaneous Net Book Value (NBV), annual straight-line depreciation, and remaining asset percentage.
    - **Bento 4 (Smart Hardware Telemetry & Physical Visuals)**: UHF RFID EPC Gen2 96-bit hex tag with auto-generation, NFC UID chip tag with auto-generation, factory warranty expiration, dual-mode photo studio (upload & camera capture with client-side canvas compression down to 900x900 JPEG to preserve lightweight database storage), and technical specifications audit notes.
  - **Floating Frosted Spatial Action Dock**: Anchored frosted spatial pill (`backdrop-blur-md`, subtle border, shadow) at the bottom of the modal displaying SHA-256 cryptographic ledger metadata, cancel, and save triggers with zero background text bleed.
  - **Complete Dummy Data Purge from Registration Modal**:
    - Eliminated hardcoded mock financial values (`15,000,000` acquisition cost and `1,500,000` salvage value); form now defaults to clean `0` / empty state with live `Rp 0` standby telemetry.
    - Removed pre-filled mock custodian values (`"Super Admin"`, `"admin@assetcorp.id"`, `"IT & Infrastructure"`); fields now present clean, guidance-focused placeholders.
    - Removed auto-populated fake RFID hex and NFC UID strings; tags now default to empty with on-demand `Auto` generator buttons.
    - Removed random fake serial number generator (`SN-XXXXXX`) on save; unentered serial numbers are cleanly omitted without polluting database records.
  - **Zero Emoji Rule & Universal Multi-Device Parity**: 100% SVG vector iconography via `lucide-react`, touch-friendly 44px hitboxes for field tablets and smartphones, and seamless bilingual (EN/ID) support.

---

## [1.3.0] - 2026-09-09

### Added
- **Cross-Platform SQLite Storage Adapter Engine (Option 3)**:
  - Implemented `server/sqliteDb.ts` utilizing Node.js built-in `node:sqlite` (`DatabaseSync`) for native embedded SQL execution.
  - Configured high-performance Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) and foreign key constraints for transactional data integrity.
  - Seamless cross-platform compatibility: runs natively without external C++ compilers on Windows (Node 24) and Linux VPS (Node 22-alpine Docker).
  - Implemented auto-migration logic: automatically imports existing `data/database.json` into SQLite tables on startup.
  - Implemented dual-engine resilience: updates SQLite tables while maintaining an atomic shadow file in `data/database.json` for fallback safety.
  - Enhanced snapshot engine: produces human-readable `.json` exports alongside SQLite `.db` binary snapshots in `data/backups/`.
- **Complete Dummy Data Purge for Default Super Admin**:
  - Cleared all residual mock and demo records from transaction tables: `movements: []`, `maintenance: []`, `auditCampaigns: []`, `auditItems: []`, `activityLogs: []`.
  - Ensured only 1 official Super Admin account (`admin@assetcorp.id`) is initialized with pristine empty-state tables across work orders, stocktake audits, and asset mutation logs.
  - Updated `getDefaultSeedData()` in `server/db.ts` to ensure future database resets or fresh installs retain an immaculate clean baseline.
- **Upgraded Production Container Runtime**:
  - Upgraded `Dockerfile` builder and runner stages from `node:20-alpine` to `node:22-alpine` for out-of-the-box native `node:sqlite` execution in Docker and VPS.

---

## [1.2.0] - 2026-09-09

### Added
- **Manual Internal Backup Scheduler Control (In-App Scheduler)**:
  - Added manual toggle capability (Activate / Deactivate) for the automated internal cron backup scheduler directly from the Backup & Disaster Recovery Center interface.
  - Implemented server-side functions `stopInAppBackupScheduler()` and `setInAppBackupSchedulerState(enable: boolean)` in `server/backupService.ts`.
  - Added REST API endpoint `POST /api/backup/scheduler` to manage scheduler runtime state dynamically without requiring a server reboot.
  - Dynamic status indicator in Card 1 showing live status badge (*Active Cron* vs *Disabled*) and real-time toggle button guarded by `backup.manage` RBAC permission.
- **Server Snapshot Archive Deletion & Management**:
  - Added per-file snapshot deletion capability in the server archives table with instant confirmation prompt and audit toast notification.
  - Added bulk snapshot purge action (*Clear All*) in the archive table header for fast database maintenance and disk cleanup.
  - Implemented `deleteLocalBackup(filename: string)` and `deleteAllLocalBackups()` in `server/db.ts` with `path.basename` path traversal safeguards.
  - Added REST API endpoints `DELETE /api/backup/:filename`, `POST /api/backup/delete`, and `POST /api/backup/clear-all`.
  - Integrated `deleteBackup` and `clearAllBackups` in `services/apiService.ts`.

---

## [1.1.0] - 2026-09-08

### Added
- **Centralized REST API & Backend Architecture**:
  - Built high-performance Node.js Express API server on port `3001` with TypeScript execution (`tsx`).
  - Added centralized database persistence to `data/database.json` with safe atomic transaction writes (temporary `.tmp` buffer followed by atomic rename).
  - Added REST endpoints: `/api/status`, `/api/setup`, `/api/auth/login`, `/api/data`, `/api/sync`, `/api/assets`, `/api/backup/list`, `/api/backup/create`, `/api/backup/download/:filename`, and `/api/backup/restore`.
- **Multi-Device Seamless Access & Setup Bypassing**:
  - Implemented initial server initialization handshake via `apiService.checkServerStatus()`.
  - Automatically bypasses the initial setup wizard on all subsequent devices once the organization and superadmin account are created, routing staff directly to the **Login Screen**.
  - Enabled synchronized live state across concurrent devices on local networks and the internet.
- **Dual-Layer Automated Backup & Disaster Recovery Engine**:
  - *Layer 1 (Internal In-App Scheduler)*: Automated background backup process running every 24 hours with a 15-snapshot FIFO rotation policy (`data/backups/`).
  - *Layer 2 (Offsite Cloud Replication)*: Integrated S3-compatible cloud replication (`@aws-sdk/client-s3`) supporting Cloudflare R2, AWS S3, MinIO, and Google Cloud Storage.
  - *Web UI Management Studio*: Added manual backup trigger, one-click backup download, and instant archive upload restore in System Settings.
- **VPS Fresh Install Mode**:
  - Added `VITE_FRESH_INSTALL=true` environment configuration for production VPS administrators to initialize clean database instances without demo assets.
- **English as Primary Default Language**:
  - Configured English (`en`) as the default language system-wide for initial loads, unauthenticated visits, and default user profiles.
  - Implemented dynamic language switcher on the Login view with real-time session language propagation.
  - Exported `AppLanguage` in `types/index.ts` to ensure consistent typing across modules.
- **Dedicated Backup & Recovery Module & Granular RBAC Permissions**:
  - Separated disaster recovery into a standalone workspace (`BackupCenter.tsx`) accessible directly via Sidebar and Web-OS App Launcher.
  - Added granular RBAC permissions: `backup.view` (monitor automated scheduler, cloud sync status, and snapshot list) and `backup.manage` (trigger manual snapshots, download archives, restore database, and delete files).
  - Assigned both backup permissions to the `super-admin` role by default across seed matrices.
  - Streamlined `SystemSettings.tsx` to focus cleanly on Branding, User Profile, and 2FA Security, with quick jump link to Backup Center.
- **Unified Production Containerization (Docker Compose)**:
  - Multi-stage `Dockerfile` with Node 20 LTS alpine image compiling Vite frontend and executing the unified Express production server.
  - `docker-compose.yml` configured with persistent volume `./data:/app/data` and port mapping `8080:3001`.

### Changed
- Standardized default administrative account naming from "Administrator Bawaan" to **"Super Admin"** across all schemas, wizards, and database seeds.
- Updated `npm run dev` to use `concurrently` running both backend server (`:3001`) and Vite client (`:5173`) in parallel.
- Refactored `storageService.ts` and `apiService.ts` to seamlessly hydrate local cache with server data and synchronize transactions.
- Unified production serving so the Express backend serves pre-compiled `/dist` static assets alongside REST endpoints.

### Security
- Added atomic file write protections to prevent corrupted states during unexpected system crashes or power losses.
- Enforced server-side isolation for S3 cloud storage credentials via `.env`, eliminating client-side exposure.
- Enforced strict Zero Emoji policy across all project markdown documents and codebase.

---

## [1.0.0] - 2026-08-28

### Added
- **Full Asset Lifecycle Management**: Master asset registration, physical mutation/relocation with transfer minutes, preventive & corrective work orders, multi-tier disposal workflows, and physical stocktake audit campaigns.
- **Batch Master Data CSV Import Studio**:
  - Spatial Web-OS interface to batch process thousands of assets from spreadsheet CSVs.
  - Data Health Bento KPIs (*Total Detected, Valid Ready to Import, Partial Warnings, Duplicate Detection*).
  - Flexible duplicate resolution (*Skip* or *Overwrite/Update*).
  - High-density preview table with image thumbnails, category taxonomy, and radio-frequency tags.
- **Public Digital Twin Authenticity Portal (*Ledger*)**:
  - SHA-256 cryptographic digest verification via Web Crypto API from hardware telemetry.
  - Public authenticity certificate displaying official ISO 27001 & ISO 55001 compliance seals.
  - Fast field incident reporting without requiring login.
- **Smart Multi-Technology Labeling**:
  - High-resolution print studio for QR Code and Barcode sticker labels.
  - RFID EPC Gen2 96-bit tag and NFC UID chip integration.
- **Automated Financial Depreciation (PSAK 16 / IFRS IAS 16)**:
  - Real-time calculations for Straight-Line and Declining Balance depreciation methods.
  - Live Net Book Value (NBV) and salvage value projections.
- **Security & User Governance (Granular RBAC & 2FA)**:
  - Role-based permissions (*Super Admin, Asset Manager, Auditor, Technician, Viewer*).
  - RFC 6238 compliant Two-Factor Authentication (TOTP 2FA).
  - Inactivity session timeout and immutable audit trail logging.
- **Enterprise DevOps & Networking**:
  - Cloudflare Named Tunnel (Zero Trust) for secure domain routing without port-forwarding.
  - Self-hosted Nginx Reverse Proxy with automated Let's Encrypt Certbot SSL.
  - Multi-stage production Docker containerization and auto-restart systemd services.
- **Tri-Form Factor Responsive UI**:
  - Desktop: Full-Width Fluid Canvas (`w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12`).
  - Tablet: Adaptive 2-column bento layout with 44px touch targets.
  - Mobile: Single-column vertical stream with one-thumb Bottom Spatial Floating Dock.

### Changed
- Removed legacy fixed `max-w-7xl` container constraints across layout components, providing an expansive full-width spatial canvas on ultrawide monitors.
- Implemented the *Organic Spatial UI* design system with *Warm Parchment* (`#FBF9F4`), *Forest Charcoal* (`#181F19`), *Sage Green* (`#5E7A68`), and *Muted Warm Clay* (`#7D562D`).
- Standardized typography with *Source Serif 4* for headings and *Work Sans* / *JetBrains Mono* for data tables.

### Security
- Enforced strict **Zero Emoji** policy across all UI components (100% `lucide-react` SVG vector icons).
- Added CSV formula injection defense (`=`, `+`, `-`, `@` sanitization).
- Guaranteed *Zero Hardcoded Secrets* with strict `.env` environment isolation.

---

## Catatan Perubahan (Versi Bahasa Indonesia)

- **[1.1.0] - 2026-09-08**: Penambahan Server REST API Node.js Express terpusat (`port 3001`), database transaksi persisten atomik (`data/database.json`), deteksi inisialisasi sistem otomatis untuk mem-bypass Setup Wizard dan mengarahkan seluruh perangkat berikutnya langsung ke layar Login, penetapan Bahasa Inggris sebagai bahasa utama (*primary default*) sistem secara menyeluruh dengan fitur *toggle* bilingual dan perbaikan tipe `AppLanguage`, standardisasi penamaan akun awal menjadi "Super Admin", Mesin Pencadangan Otomatis Dual-Layer (internal in-app cron 24 jam dengan rotasi 15 berkas + replikasi cloud S3/R2), antarmuka Web UI download dan restore backup di System Settings, opsi VPS Fresh Install (`VITE_FRESH_INSTALL=true`), dan kontainerisasi multi-stage Docker Compose dengan volume data persisten `./data:/app/data`.
- **[1.0.0] - 2026-08-28**: Rilis produksi pertama Enterprise Asset Management yang mencakup siklus hidup aset lengkap, Studio Impor Massal CSV, Portal Publik Digital Twin SHA-256, Otomatisasi Depresiasi PSAK 16, Granular RBAC, TOTP 2FA, Arsitektur Tri-Form Factor Responsif, dan Konfigurasi DevOps Docker.
