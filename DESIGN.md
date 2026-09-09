---
name: Organic Spatial UI (Web-OS Style)
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#444844'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#747873'
  outline-variant: '#c4c7c2'
  surface-tint: '#596059'
  primary: '#181f19'
  on-primary: '#ffffff'
  primary-container: '#2d342e'
  on-primary-container: '#959c94'
  inverse-primary: '#c1c8c0'
  secondary: '#7d562d'
  on-secondary: '#ffffff'
  secondary-container: '#ffca98'
  on-secondary-container: '#7a532a'
  tertiary: '#5e7a68'
  on-tertiary: '#ffffff'
  tertiary-container: '#2f3426'
  on-tertiary-container: '#979c8a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde4db'
  primary-fixed-dim: '#c1c8c0'
  on-primary-fixed: '#161d18'
  on-primary-fixed-variant: '#414942'
  secondary-fixed: '#ffdcbd'
  secondary-fixed-dim: '#f0bd8b'
  on-secondary-fixed: '#2c1600'
  on-secondary-fixed-variant: '#623f18'
  tertiary-fixed: '#e0e5d0'
  tertiary-fixed-dim: '#c4c9b5'
  on-tertiary-fixed: '#191d11'
  on-tertiary-fixed-variant: '#44493a'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
  display-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 0.75rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  '2xl': 2.5rem
  full: 9999px
spacing:
  unit: 8px
  card-padding: 32px
---

# Design System Guidelines

The **Enterprise Asset Management (EAM)** design system adheres to the **Organic Spatial UI (Web-OS Style)** architecture, harmonizing *Tactile Modernism*, subtle glassmorphism (*Ambient Backdrop Blur*), full-width fluid responsive layouts, spatial bento grid telemetry, and high-density operational ergonomics.

> **Bahasa / Language**: **English** | [Bahasa Indonesia](#pedoman-sistem-desain-versi-bahasa-indonesia)

---

## 1. Brand Philosophy & Visual Character

- **Core Concept**: *Organic Spatial Web-OS*.
- **Experience Objective**: Deliver digital calm, high operational workspace density, and refined tactile interactions reminiscent of premium physical media.
- **Absolute Iconography Rule (Zero Emoji Rule)**:
  - **NEVER USE NATIVE TEXT EMOJIS** anywhere in UI components, notifications, tooltips, or documentation.
  - All iconography must strictly utilize **`lucide-react`** SVG vector icons with standard `stroke-width: 2px`.

---

## 2. Signature Color Palette

Built on organic earthy neutrals (*Warm Parchment & Forest Charcoal*) to eliminate eye-strain during extended enterprise usage:

- **Surface & Background (`#FBF9F4`)**: *Warm Parchment* — Eye-friendly foundation with natural warmth.
- **Primary Text & High Contrast Elements (`#181F19` / `#2D342E`)**: *Forest Charcoal* — Sharp contrast for headings, primary buttons, and key boundaries.
- **Tertiary Accent (`#5E7A68`)**: *Sage Green* — Verified indicators, active badges, data health metrics, and positive actions.
- **Secondary Accent (`#7D562D`)**: *Muted Warm Clay* — Focus accents, RFID/NFC chips, code prefixes, and cautionary status.
- **Surface Elevation Layers (`#F5F3EE` / `#EAE8E3`)**: Modal containers, bento cards, and data table rows.

---

## 3. Typography Architecture

1. **Headings & Brand Entity**:
   - **Font**: *Source Serif 4*
   - Inspires institutional authority, confidence, and editorial refinement.
2. **Functional UI, Financials, & Data Tables**:
   - **Font**: *Work Sans* & *JetBrains Mono* (for Asset Codes, Serial Numbers, SHA-256 Hashes, RFID Tags, NFC UIDs).
   - Maximizes readability across high-density data matrices and forms.

---

## 4. Tri-Form Factor Responsive Architecture (Desktop, Tablet, & Mobile)

Engineered from the ground up for **Universal Multi-Device Parity**:

### A. Desktop & Ultrawide Displays (1080p, 2K, 4K, Ultrawide)
- **Full-Width Fluid Canvas**: Uses `w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12` without artificial width caps (`max-w-7xl` removed), eliminating wasted side space.
- **High-Density Data Grid**: Displays comprehensive multi-column tables with live status badges, thumbnails, and PIC assignments in a single unified view.
- **4-Column Bento Matrix**: Dashboard analytics and status capsules flow proportionally.

### B. Tablet & Field Terminals (iPad, Android Tablet, POS)
- **Adaptive 2-Column Bento**: Intelligently balances layout in both landscape and portrait orientations.
- **Touch Ergonomics**: Button hitboxes and inputs strictly adhere to minimum 44px touch targets.
- **Field Audit Portability**: Ideal for warehouse stocktake teams conducting barcode/RFID audits on-the-go.

### C. Mobile Smartphones (iOS & Android)
- **One-Thumb Navigation**: Permanent bottom floating dock (*Bottom Spatial Floating Dock*) lets staff switch modules and open camera scanners effortlessly with one hand.
- **Vertical Stream Reflow**: Tables and bento grids seamlessly convert into scrollable vertical cards.
- **Direct Camera QR Scanner**: Scans physical asset label stickers directly from the mobile browser without native app downloads.
- **Full-Screen Sheet Modals**: Transaction and detail dialogs scale smoothly to smaller touch screens.

---

## 5. Master Asset Registration Spatial Bento Modal (`AssetFormModal.tsx`)

The asset registration modal embodies the purest expression of the Organic Spatial UI (Web-OS Style):

### A. 4 Spatial Bento Cards Layout
1. **Card 1: Core Physical Identity & Categorization**:
   - Sequential Asset Code Generator Formula (`AST-YYYY-XXXXX`) with one-click refresh button.
   - Official Asset Name, Category Taxonomy selector, Brand / Model specification, Physical Room/Floor Location, and Operational Status badge.
2. **Card 2: Financial Valuation & PSAK 16 Accounting**:
   - Initial Acquisition Cost input with currency formatting.
   - Purchase Date picker, Economic Useful Life slider/input (Months), and Estimated Salvage/Residual Value.
   - Accounting Depreciation Method toggle: *Straight-Line (Garis Lurus)* or *Declining Balance (Saldo Menurun)*.
3. **Card 3: Custody, Verification & Smart Tagging**:
   - Custodian PIC assignment with direct user lookup.
   - Manufacturer Serial Number (SN).
   - Radio-Frequency IoT telemetry: RFID EPC Gen2 96-bit tag identifier and NFC UID chip tag identifier with quick-generate actions.
4. **Card 4: Visual Documentation & Technical Specs**:
   - Client-side HTML5 Canvas photo compressor: automatically resizes uploaded camera photos to max 1280px at 80% JPEG quality, keeping payloads lightweight.
   - Custom Key-Value Technical Attribute Pairs: dynamically add specifications (e.g., Processor, RAM, Voltage, License Plate, IMEI).

### B. Live PSAK 16 Telemetry Sticky Bar
Pinned dynamically at the modal footer above the action buttons:
- **Net Book Value (NBV)**: Real-time book value calculated from cost, useful life, and acquisition date.
- **Monthly Depreciation**: Exact monthly financial charge amortized according to selected method.
- **Total Accumulated Depreciation**: Total written-off depreciation to date.

### C. Pristine Dummy-Free Baseline
All fields initialize clean and empty without pre-filled mock costs, fake serial numbers, or hardcoded dummy custodians, guaranteeing that newly registered assets represent genuine enterprise inventory.

---

## 6. Core Spatial Components

1. **Floating Spatial Modals**: Rounded corners `rounded-[32px]` to `rounded-[36px]`, backdrop blur `backdrop-blur-3xl`, subtle `1px border-stone-200/90`, and deep `shadow-2xl`.
2. **Bento KPI Widgets**: Metric capsules with progress bars and contextual telemetry.
3. **Bottom Spatial Action Dock**: Floating quick-launcher for camera scanner, approvals, and app switcher.
4. **Storage & Backup Telemetry Cards**: Bento cards displaying SQLite WAL status (`data/eam.db`), dual-layer backup status (Local cron + Cloud S3/R2), storage capacity gauges, live rotation badges (`15 Snapshots Max`), and subtle state indicator pills (`Ready`, `Syncing`, `Offsite Replicated`).

---

## Pedoman Sistem Desain (Versi Bahasa Indonesia)

- **Konsep Arsitektur**: *Organic Spatial UI (Web-OS Style)*.
- **Palet Warna Organik**: *Warm Parchment* (`#FBF9F4`), *Forest Charcoal* (`#181F19`), *Sage Green* (`#5E7A68`), *Muted Warm Clay* (`#7D562D`).
- **Aturan Mutlak Tanpa Emoji**: Dilarang keras menggunakan teks emoji bawaan sistem operasi di antarmuka web (100% menggunakan SVG `lucide-react`, stroke-width: 2px).
- **Responsivitas Tri-Form Factor**: Desktop Full-Width Fluid (tanpa batasan lebar kaku), Tablet 2-Kolom Touch (target sentuh min 44px), Mobile Bottom Floating Dock 1-Tangan.
- **Modal Pendaftaran Aset Spasial Bento (`AssetFormModal.tsx`)**:
  - 4 Kartu Bento: Identitas Fisik, Valuasi Finansial & Akuntansi PSAK 16, Hak Asuh & Tagging RFID/NFC, serta Dokumentasi Foto Kanvas & Spesifikasi Kustom.
  - Bilah Telemetri Depresiasi PSAK 16 langsung menghitung Nilai Buku Bersih, Beban Depresiasi Bulanan, dan Akumulasi Penyusutan secara reaktif.
  - Keadaan awal bersih (*pristine clean*) tanpa sisa data tiruan atau dummy.
- **Komponen Telemetri Database & Cadangan**: Kartu bento pemantauan SQLite WAL (`data/eam.db`), sinkronisasi atomik bayangan, dan pencadangan ganda internal/cloud dengan badge rotasi 15 snapshot.
