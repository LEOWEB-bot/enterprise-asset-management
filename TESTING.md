# Quality Assurance & Testing Guidelines

This document outlines the testing procedures for **Enterprise Asset Management (EAM)** to guarantee functional stability, security hygiene, and cross-device responsiveness.

> 🌐 **Bahasa / Language**: **English** | [Bahasa Indonesia](#panduan-pengujian-versi-bahasa-indonesia)

---

## 1. Automated & Static Verification

Execute these commands before merging or deploying code:

### A. Strict TypeScript Typecheck
```bash
npx tsc --noEmit
```
*Pass Criteria: 0 errors and 0 ambiguous type warnings.*

### B. Production Bundle Compilation
```bash
npm run build
```
*Pass Criteria: All 1,600+ modules transform cleanly (Exit code: 0), `/dist` directory generated.*

### C. Security Vulnerability Audit
```bash
npm audit
```
*Pass Criteria: 0 High/Critical vulnerabilities.*

---

## 2. Functional Manual Test Matrices

### Scenario 1: Master Asset Lifecycle & Registration
- [ ] Register a new asset with all fields (Code, Name, Price, Useful Life, Category, Location, SN, RFID/NFC tags).
- [ ] Verify automatic code prefix formatting (`AST-YYYY-XXXXX`).
- [ ] Ensure non-numeric characters are rejected on financial inputs.
- [ ] Confirm no native emojis are accepted in form fields.

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

---

## 3. Tri-Form Factor Responsiveness Matrix

| Form Factor | Viewport Resolution | Verification Checkpoints |
| :--- | :--- | :--- |
| **Desktop / Ultrawide** | 1920×1080 (FHD) & 2560×1440 (2K) | - Full-width fluid layout without margin clipping.<br>- High-density multi-column table readability.<br>- 4-column bento analytics grid. |
| **Tablet / Field POS** | 768px (iPad Mini) & 1024px (iPad Pro) | - Balanced 2-column bento reflow in portrait/landscape.<br>- Touch target size min 44px.<br>- Modal forms display without clipping. |
| **Mobile Smartphone** | 375px (iPhone SE) & 412px (Android) | - Bottom Floating Action Dock within one-thumb reach.<br>- Instant camera QR scanner opens smoothly.<br>- Tables convert to scrollable vertical cards. |

---

## Panduan Pengujian (Versi Bahasa Indonesia)

- **Pengujian Statis**: Jalankan `npx tsc --noEmit` dan `npm run build` untuk memverifikasi tipe data dan kompilasi bundle produksi.
- **Pengujian Fungsional**: Meliputi manajemen master aset, impor CSV massal, RBAC & TOTP 2FA, sertifikat Digital Twin SHA-256, dan kalkulasi depresiasi PSAK 16.
- **Pengujian Responsif**: Verifikasi tampilan Desktop (Full-Width Fluid), Tablet (2-Kolom Touch), dan Mobile (Bottom Floating Dock).
