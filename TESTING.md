# Quality Assurance & Testing Guidelines

This document outlines the testing procedures for **Enterprise Asset Management (EAM)** to guarantee functional stability, security hygiene, relational persistence integrity, and cross-device responsiveness.

> **Bahasa / Language**: **English** | [Bahasa Indonesia](#panduan-pengujian-versi-bahasa-indonesia)

---

## 1. Automated & Static Verification

Execute these commands before merging or deploying code:

### A. Backend API Healthcheck
```bash
# Verify API server responsiveness, database type, and initialization status
curl -i http://localhost:3001/api/status
```
*Pass Criteria: HTTP 200 OK with valid JSON response `{ "initialized": true/false, "orgName": "...", "assetCount": N }`.*

### B. Strict TypeScript Typecheck
```bash
npx tsc --noEmit
```
*Pass Criteria: 0 errors and 0 ambiguous type warnings.*

### C. Production Bundle Compilation
```bash
npm run build
```
*Pass Criteria: All modules transform cleanly (Exit code: 0), `/dist` directory generated.*

### D. Security Vulnerability Audit
```bash
npm audit
```
*Pass Criteria: 0 High/Critical vulnerabilities.*

---

## 2. Functional Manual Test Matrices

### Scenario 1: Master Asset Registration Spatial Bento Modal
- [ ] Open **Assets > Register New Asset** modal (`AssetFormModal.tsx`).
- [ ] Verify that all 4 Bento Cards load smoothly with zero visual clipping:
  - *Card 1*: Identity & Categorization
  - *Card 2*: Financial Valuation & PSAK 16
  - *Card 3*: Custody, Verification & Smart Tagging
  - *Card 4*: Visual Documentation & Technical Spec Sheets
- [ ] Verify the auto-generated sequential code formula (`AST-YYYY-XXXXX`).
- [ ] Verify form baseline is pristine: no pre-filled fake serial numbers, mock prices, or dummy custodians.
- [ ] Enter acquisition price (e.g. `12000000`) and useful life (e.g. `48` months); verify the pinned **Live PSAK 16 Telemetry Bar** immediately computes Net Book Value (NBV), Monthly Depreciation, and Accumulated Depreciation.
- [ ] Upload a high-resolution photo; confirm client-side canvas compression resizes photo without browser freeze.
- [ ] Submit form; verify the new asset appears instantaneously in the asset data table.

### Scenario 2: Batch Master Data CSV Import Studio
- [ ] Download official `.csv` template from modal.
- [ ] Upload a 100-row valid CSV file and verify *Data Health Bento KPIs*.
- [ ] Test duplicate resolution: upload duplicate asset codes and verify **Skip** vs **Overwrite** behavior.
- [ ] Test formula injection defense: ensure cells prefixed with `=`, `+`, `-`, or `@` are stripped safely.

### Scenario 3: Multi-Factor Authentication & Granular RBAC
- [ ] Login as *Super Admin* and verify full operational access.
- [ ] Login as *Viewer* / *Technician* and verify action buttons are restricted according to permission matrix.
- [ ] Enable 2FA TOTP: scan QR code with Google Authenticator / Authy, enter 6-digit OTP, and confirm success.
- [ ] Attempt invalid/expired OTP: ensure system rejects with safe error message.

### Scenario 4: Digital Twin Authenticity & Public Verification
- [ ] Open asset QR link in incognito browser without logging in.
- [ ] Verify SHA-256 cryptographic digest validation and ISO 55001 seal.
- [ ] Test **Report Field Incident** button: submit defect report and verify ticket creation.

### Scenario 5: Financial Depreciation (PSAK 16 / IFRS IAS 16)
- [ ] Verify Straight-Line: `Net Book Value = Cost - (Monthly Depreciation * Elapsed Months)`.
- [ ] Verify Declining Balance: annual percentage applied correctly against opening book value.

### Scenario 6: Multi-Device Setup Bypassing & Direct Login
- [ ] Complete initial setup wizard on primary Device A.
- [ ] Open a separate incognito browser window or secondary Device B to `http://localhost:5173`.
- [ ] Verify that the setup wizard is automatically bypassed and the user lands on the **Login Screen**.
- [ ] Login using the superadmin credentials created on Device A and confirm identical organizational configuration.

### Scenario 7: Centralized Real-Time Data Sync Across Devices
- [ ] Create or mutate an asset on Device A.
- [ ] Open or refresh Device B and verify the asset record appears immediately with identical timestamp and SHA-256 hash.

### Scenario 8: SQLite 3 Relational Engine & WAL Persistence
- [ ] Create or update several assets, locations, and categories.
- [ ] Verify that `data/eam.db` reflects the changes and `data/eam.db-wal` coordinates write-ahead operations.
- [ ] Confirm shadow sync updates `data/database.json` simultaneously.
- [ ] Kill and restart the backend server process (`npm run dev:server`); verify all created entities persist without data loss.

### Scenario 9: Dual-Layer Backup Engine & Disaster Recovery
- [ ] Navigate to **System Settings > Backup & Data Restore**.
- [ ] Click **Create Manual Backup**; verify generation of both `.json` state archive and `.db` binary copy in `data/backups/`.
- [ ] Download latest backup file and verify valid archive format.
- [ ] Test single snapshot deletion via the delete action button; verify item is safely removed.
- [ ] Test bulk purge modal (**Clear All Backups**); confirm all snapshots are cleared.
- [ ] Click **Restore Database**, select a valid backup JSON file, and confirm system state re-hydrates accurately.

### Scenario 10: VPS Fresh Install Mode
- [ ] Set `VITE_FRESH_INSTALL=true` in `.env` and clear database files.
- [ ] Run `npm run dev` and complete the initial setup.
- [ ] Verify the system starts with 0 assets (clean production database without demo mock items).

---

## 3. Tri-Form Factor Responsiveness Matrix

| Form Factor | Viewport Resolution | Verification Checkpoints |
| :--- | :--- | :--- |
| **Desktop / Ultrawide** | 1920×1080 (FHD) & 2560×1440 (2K) | - Full-width fluid layout without margin clipping.<br>- High-density multi-column table readability.<br>- 4-column bento analytics grid.<br>- 4-card registration bento modal fits comfortably. |
| **Tablet / Field POS** | 768px (iPad Mini) & 1024px (iPad Pro) | - Balanced 2-column bento reflow in portrait/landscape.<br>- Touch target size min 44px.<br>- Modal forms display without clipping.<br>- Barcode/RFID field audits ergonomically accessible. |
| **Mobile Smartphone** | 375px (iPhone SE) & 412px (Android) | - Bottom Floating Action Dock within one-thumb reach.<br>- Instant camera QR scanner opens smoothly.<br>- Tables convert to scrollable vertical cards.<br>- Full-screen sheet modal with sticky footer. |

---

## Panduan Pengujian (Versi Bahasa Indonesia)

- **Pengujian Statis & API**: Jalankan pemeriksaan kesehatan API `curl http://localhost:3001/api/status`, pemeriksaan tipe data `npx tsc --noEmit`, kompilasi bundle produksi `npm run build`, dan audit keamanan dependensi `npm audit`.
- **Pengujian Fungsional**:
  - Modal registrasi aset spasial bento (`AssetFormModal.tsx`): 4 kartu bento, formula kode aset otomatis (`AST-YYYY-XXXXX`), bilah telemetri PSAK 16 live, kompresi foto kanvas, dan formulir bersih tanpa data dummy.
  - Impor CSV massal dengan deteksi duplikasi dan proteksi injeksi formula.
  - Hak akses RBAC dan otentikasi ganda TOTP 2FA.
  - Sertifikat keaslian Digital Twin SHA-256 dan pelaporan insiden publik.
  - Perhitungan penyusutan akuntansi PSAK 16.
  - Akses multi-perangkat langsung ke login dan sinkronisasi data real-time.
  - Integritas persistensi mesin relasional SQLite 3 dengan mode WAL (`data/eam.db`) dan sinkronisasi bayangan atomik (`data/database.json`).
  - Mesin pencadangan ganda (`.json` dan `.db`), unduh berkas, hapus satuan, pembersihan massal, serta pemulihan (*restore*).
  - Mode instalasi bersih VPS (*Fresh Install Mode*).
- **Pengujian Responsif Lintas Perangkat**: Verifikasi tata letak Desktop Full-Width Fluid, Tablet 2-Kolom Touch, dan Mobile Bottom Floating Dock 1-Tangan.
