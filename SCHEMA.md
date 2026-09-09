# Database & Entity Schema Documentation

This document describes the data dictionary, entity models, relational schema, financial depreciation algorithms, cryptographic verification mechanisms, and storage architecture in **Enterprise Asset Management (EAM)**.

> **Bahasa / Language**: **English** | [Bahasa Indonesia](#dokumentasi-skema-data-versi-bahasa-indonesia)

---

## 1. Entity Relationship Overview

```
+-------------------+           +----------------------+
|       User        | 1       * |      ActivityLog     |
| (RBAC & 2FA Auth) | --------> |  (Audit Trail Logs)  |
+-------------------+           +----------------------+
          | 1
          |
          | *
+-------------------+ 1       * +----------------------+
|       Asset       | --------> |    MovementRecord    |
| (Master Metadata) |           |  (Location Mutasi)   |
+-------------------+           +----------------------+
          | 1
          |-------------------> +----------------------+
          | 1                 * |  MaintenanceRecord   |
          |                     |   (Work Orders)      |
          |                     +----------------------+
          |
          |-------------------> +----------------------+
          | 1                 * |    DisposalRecord    |
          |                     |  (Pelepasan Aset)    |
          |                     +----------------------+
          |
          | *
+-------------------+ 1       * +----------------------+
|   AuditCampaign   | --------> |      AuditItem       |
| (Stocktake Field) |           |  (Scan Rekonsiliasi) |
+-------------------+           +----------------------+
```

---

## 2. Relational SQLite 3 Storage Architecture (`data/eam.db`)

The primary database engine uses Node.js native `node:sqlite` (`DatabaseSync`), operating directly against the transactional database file `data/eam.db`.

### Database Pragmas & Configuration
```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
```

### Relational Tables (16 Entities)

1. **`settings`**: System identity, branding, asset code prefix formulas, fiscal year parameters, depreciation preferences, RFID/NFC flags, and backup automation configuration.
2. **`users`**: Administrative and operational user accounts, bcrypt password hashes, and RFC 6238 TOTP 2FA configuration.
3. **`roles`**: Granular RBAC roles and permissions matrices (`superadmin`, `manager`, `auditor`, `technician`, `viewer`).
4. **`categories`**: Master asset categories, depreciation class mappings, and code taxonomy prefixes.
5. **`locations`**: Physical sites, buildings, floors, rooms, and GPS coordinates.
6. **`classes`**: Asset classification tiers, useful life parameters, and accounting codes.
7. **`assets`**: Master physical asset registry, financial values, serial numbers, IoT RFID/NFC chips, image URLs, and digital twin hash.
8. **`approvals`**: Multi-tier approval requests for asset mutations, disposals, and major maintenance budgets.
9. **`movements`**: Asset physical relocation history and custodian PIC chain of custody.
10. **`disposals`**: Asset decommissioning proposals, auction/scrap records, and realized gain/loss ledger.
11. **`maintenance`**: Preventive maintenance schedules, emergency corrective work orders, technician assignments, and repair costs.
12. **`audit_campaigns`**: Physical stocktake audit campaigns, date ranges, and audit status.
13. **`audit_items`**: Individual scanned asset reconciliation entries per audit campaign.
14. **`activity_logs`**: Immutable security audit trail recording all user actions, IP addresses, and state changes.
15. **`notifications`**: In-app system alerts, maintenance reminders, and approval notifications.
16. **`system_meta`**: Internal database versioning, migration tracking, and initialization telemetry.

### Strategic Relational Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_assets_code ON assets(code);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_movements_asset_id ON movements(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_asset_id ON maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_disposals_asset_id ON disposals(asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_items_campaign ON audit_items(campaign_id);
```

---

## 3. Dual Atomic Shadow Sync & Failover Protection

To preserve maximum backward compatibility and continuous failover recovery:

1. **Primary Transactional Commit**: Every create, update, or delete operation is executed against `data/eam.db` with SQLite transactions (`BEGIN IMMEDIATE ... COMMIT`).
2. **Atomic Shadow Sync (`data/database.json`)**: All state changes are serialized and written atomically to `data/database.json.tmp` before an instant OS file rename replaces `data/database.json`.
3. **Dual Snapshot Generation (`data/backups/`)**: Automated and manual backups generate both a complete `.json` state export and an identical raw binary `.db` copy in `data/backups/`.

---

## 4. Core Entity Data Dictionary

### A. Entity `Asset` (Master Asset Metadata)
Stores physical identity, technical specifications, financial values, taxonomy, and radio-frequency tracking.

| Field Name | Type | Description & Validation |
| :--- | :--- | :--- |
| `id` | `string` (UUID) | Unique Primary Key |
| `code` | `string` | Unique asset code (Format: `AST-YYYY-XXXXX`, Indexed) |
| `name` | `string` | Official item / machine / vehicle name |
| `category` | `AssetCategory` | Taxonomy category (Electronics, Machinery, Facilities, Vehicles, Furniture, IT) |
| `location` | `AssetLocation` | Physical location (Building, Room, Floor) |
| `status` | `AssetStatus` | Operational status (`ACTIVE`, `MAINTENANCE`, `REPAIR`, `DISPOSED`, `PENDING_DISPOSAL`, `LOST`) |
| `purchaseDate` | `string` (ISO 8601) | Acquisition date (`YYYY-MM-DD`) |
| `purchasePrice`| `number` | Initial acquisition cost (IDR / Foreign Currency) |
| `usefulLifeMonths` | `number` | Economic useful life in months (PSAK 16 / IFRS IAS 16) |
| `salvageValue` | `number` | Estimated salvage/residual value at end of useful life |
| `serialNumber` | `string` (Optional) | Manufacturer Serial Number (SN) |
| `model` | `string` (Optional) | Brand / Model number |
| `custodianPIC` | `string` (Optional) | Assigned person in charge |
| `imageUrl` | `string` (Optional) | Physical photo (data URL or external URL) |
| `rfidTag` | `string` (Optional) | RFID EPC Gen2 96-bit tag identifier |
| `nfcTag` | `string` (Optional) | NFC UID chip identifier (14/7-byte) |
| `qrPayload` | `string` (Optional) | Public digital twin ledger verification URL |
| `digitalTwinHash` | `string` (Optional)| Canonical SHA-256 hash digest |
| `customFields` | `Record<string, string>` | Flexible custom key-values (e.g., MAC Address, License Plate) |
| `createdAt` | `string` (ISO 8601) | Initial registration timestamp |
| `updatedAt` | `string` (ISO 8601) | Last modified timestamp |

---

### B. Entity `MovementRecord` (Asset Mutation & Relocation)
Maintains physical chain of custody and departmental transfers.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` (UUID) | Unique movement ID |
| `assetId` | `string` (Foreign Key) | References `Asset.id` |
| `assetCode` | `string` | Associated asset code |
| `assetName` | `string` | Associated asset name |
| `fromLocation` | `string` | Origin location |
| `toLocation` | `string` | Destination location |
| `fromCustodian` | `string` | Previous custodian PIC |
| `toCustodian` | `string` | New custodian PIC |
| `reason` | `string` | Justification for transfer |
| `approvalStatus`| `'PENDING' \| 'APPROVED' \| 'REJECTED'` | Authorization state |
| `approvedBy` | `string` (Optional) | Approver name |
| `date` | `string` (ISO 8601) | Execution timestamp |

---

### C. Entity `MaintenanceRecord` (Preventive & Corrective Work Orders)

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` (UUID) | Unique work order ID |
| `assetId` | `string` (Foreign Key) | References `Asset.id` |
| `assetCode` | `string` | Associated asset code |
| `type` | `'PREVENTIVE' \| 'CORRECTIVE'` | Service classification |
| `description` | `string` | Problem description or work scope |
| `cost` | `number` | Service & spare parts cost |
| `technicianName`| `string` | Internal technician name |
| `vendorName` | `string` (Optional) | Third-party vendor name |
| `scheduledDate`| `string` (ISO 8601) | Planned date |
| `completionDate`| `string` (Optional) | Actual completion date |
| `status` | `'SCHEDULED' \| 'IN_PROGRESS' \| 'COMPLETED' \| 'CANCELLED'` | Work order state |

---

### D. Entity `DisposalRecord` (Asset Decommissioning)

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` (UUID) | Unique disposal ID |
| `assetId` | `string` (Foreign Key) | References `Asset.id` |
| `assetCode` | `string` | Associated asset code |
| `assetName` | `string` | Associated asset name |
| `method` | `'SALE' \| 'SCRAP' \| 'DONATION' \| 'RECYCLE' \| 'WRITE_OFF'` | Disposal method |
| `bookValueAtDisposal` | `number` | Net book value at proposal |
| `saleAmount` | `number` (Optional) | Realized salvage/auction cash |
| `gainLoss` | `number` | Gain/loss on disposal (`saleAmount - bookValueAtDisposal`) |
| `reason` | `string` | Disposal justification |
| `status` | `'PROPOSED' \| 'APPROVED' \| 'COMPLETED' \| 'REJECTED'` | Authorization state |
| `createdAt` | `string` (ISO 8601) | Proposal timestamp |

---

### E. Entity `User` & `Role` (RBAC & 2FA Governance)

| User Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` (UUID) | Unique user ID |
| `name` | `string` | Full staff name |
| `email` | `string` | Official email address (Unique) |
| `roleId` | `string` (Foreign Key) | RBAC role (`superadmin`, `manager`, `auditor`, `technician`, `viewer`) |
| `twoFactorEnabled` | `boolean` | TOTP 2FA protection flag |
| `twoFactorSecret` | `string` (Encrypted) | Base32 RFC 6238 secret key |
| `isActive` | `boolean` | Account active state |

---

## 5. Financial Depreciation Algorithms (PSAK 16 / IFRS IAS 16)

### 1. Straight-Line Method
Constant periodic depreciation charge:
```
Monthly Depreciation = (Acquisition Cost - Salvage Value) / Useful Life (Months)
Current Net Book Value = Acquisition Cost - (Monthly Depreciation * Elapsed Months)
```

### 2. Declining Balance Method
Accelerated depreciation with fixed periodic rate:
```
Annual Rate (r) = 1 - (Salvage Value / Acquisition Cost) ^ (1 / Useful Life Years)
Depreciation Period t = Opening Book Value t * r
```

---

## 6. Digital Twin Cryptographic Verification (SHA-256)

Every asset entity computes a canonical SHA-256 hash digest via the Web Crypto API:
```
Canonical Payload = "CODE=" + code + "|SN=" + serialNumber + "|PRICE=" + purchasePrice + "|BUY_DATE=" + purchaseDate
SHA-256 Digest = crypto.subtle.digest('SHA-256', new TextEncoder().encode(Canonical Payload))
```

---

## 7. REST API Contract Specifications

The Node.js Express server exposes REST endpoints under `/api`:

| Method | Endpoint | Description | Request Payload / Params | Response Structure |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/status` | System health & setup state | None | `{ initialized: boolean, orgName: string, assetCount: number }` |
| `POST` | `/api/setup` | Initialize organization & superadmin | `{ settings, superadmin }` | `{ success: boolean, message: string }` |
| `POST` | `/api/auth/login` | User credential authentication | `{ email, password, otp? }` | `{ success: boolean, user: User, token?: string }` |
| `GET` | `/api/data` | Fetch entire persistent database | None (Auth header) | `{ settings, assets, users, movements, ... }` |
| `POST` | `/api/sync` | Save updated state to server | Full database state object | `{ success: boolean, savedAt: string }` |
| `GET` | `/api/assets` | Query registered master assets | Query filters (optional) | `Array<Asset>` |
| `POST` | `/api/assets` | Register new master asset | Asset entity payload | `{ success: boolean, asset: Asset }` |
| `PUT` | `/api/assets/:id` | Update master asset details | Partial/Full Asset object | `{ success: boolean, asset: Asset }` |
| `GET` | `/api/backup/list` | List local historical snapshots | None | `Array<{ filename: string, size: number, createdAt: string }>` |
| `POST` | `/api/backup/create` | Trigger immediate dual-backup | None | `{ success: boolean, filename: string, cloudUploaded: boolean }` |
| `GET` | `/api/backup/download/:filename` | Download backup archive file | `filename` URL parameter | Raw file attachment stream (`.json` or `.db`) |
| `DELETE`| `/api/backup/delete` | Delete single backup snapshot | `{ filename: string }` | `{ success: boolean, message: string }` |
| `DELETE`| `/api/backup/clear-all` | Bulk purge all backup archives | None | `{ success: boolean, count: number }` |
| `POST` | `/api/backup/restore` | Restore state from backup | Backup JSON data payload | `{ success: boolean, message: string }` |

---

## Dokumentasi Skema Data (Versi Bahasa Indonesia)

- **Mesin Relasional SQLite 3**: Persistensi data transaksional pada berkas `data/eam.db` menggunakan modul bawaan Node.js `node:sqlite` dengan mode Write-Ahead Logging (WAL) untuk akses baca konkuren berkecepatan tinggi.
- **16 Tabel Relasional**: `settings`, `users`, `roles`, `categories`, `locations`, `classes`, `assets`, `approvals`, `movements`, `disposals`, `maintenance`, `audit_campaigns`, `audit_items`, `activity_logs`, `notifications`, dan `system_meta`.
- **Indeks Kinerja**: Pengindeksan relasional pada kolom kode aset, kategori, lokasi, status, email pengguna, dan relasi kunci asing.
- **Sinkronisasi Bayangan Atomik (Dual Shadow Sync)**: Menulis berkas cadangan fallback `data/database.json` via penggantian berkas atomik (`.tmp` ke `.json`).
- **Pencadangan Berformat Ganda**: Menghasilkan arsip `.json` dan salinan biner mentah `.db` di `data/backups/` dengan retensi 15 snapshot dan opsi replikasi cloud S3/R2.
- **Standar Finansial PSAK 16**: Perhitungan penyusutan nilai buku aset dengan metode Garis Lurus (*Straight-Line*) dan Saldo Menurun (*Declining Balance*).
- **Integritas Digital Twin**: Validasi hash kriptografi SHA-256 pada sertifikat keaslian aset publik.
