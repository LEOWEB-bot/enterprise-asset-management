# Changelog

All notable changes to the **Enterprise Asset Management (EAM)** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- **[1.0.0]**: Rilis produksi pertama Enterprise Asset Management yang mencakup siklus hidup aset lengkap, Studio Impor Massal CSV, Portal Publik Digital Twin SHA-256, Otomatisasi Depresiasi PSAK 16, Granular RBAC, TOTP 2FA, Arsitektur Tri-Form Factor Responsif, dan Konfigurasi DevOps Docker.
