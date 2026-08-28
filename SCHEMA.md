# Database & Entity Schema Documentation

This document describes the data dictionary, entity models, relationships, field validations, financial depreciation algorithms, and cryptographic verification mechanisms in **Enterprise Asset Management (EAM)**.

> 🌐 **Bahasa / Language**: **English** | [Bahasa Indonesia](#dokumentasi-skema-data-versi-bahasa-indonesia)

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

## 2. Core Entity Definitions

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
| `imageUrl` | `string` (Optional) | Physical photo URL |
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

## 3. Financial Depreciation Algorithms (PSAK 16 / IFRS IAS 16)

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

## 4. Digital Twin Cryptographic Verification (SHA-256)

Every asset entity computes a canonical SHA-256 hash digest via the Web Crypto API:
```
Canonical Payload = "CODE=" + code + "|SN=" + serialNumber + "|PRICE=" + purchasePrice + "|BUY_DATE=" + purchaseDate
SHA-256 Digest = crypto.subtle.digest('SHA-256', new TextEncoder().encode(Canonical Payload))
```

---

## Dokumentasi Skema Data (Versi Bahasa Indonesia)

- **Kamus Entitas Utama**: `Asset` (Master Aset), `MovementRecord` (Mutasi Lokasi/PIC), `MaintenanceRecord` (Servis & WO), `DisposalRecord` (Pelepasan & Laba/Rugi), `User` (RBAC & 2FA).
- **Standar Finansial**: Otomatisasi kalkulasi depresiasi nilai buku aktiva tetap sesuai standar **PSAK 16 / IFRS IAS 16** (Metode Garis Lurus & Saldo Menurun).
- **Integritas Kriptografi**: Sertifikat keaslian Digital Twin divalidasi dengan Web Crypto SHA-256 Digest.
