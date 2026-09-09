# Contributing Guidelines

Thank you for your interest in contributing to **Enterprise Asset Management (EAM)**. To maintain code security, data privacy, and clean architecture standards, please follow these guidelines.

> **Bahasa / Language**: **English** | [Bahasa Indonesia](#panduan-kontribusi-versi-bahasa-indonesia)

---

## 1. Absolute Code of Conduct & Rules

1. **Security & Privacy**:
   - **Never commit real API keys, cloud secrets (S3/R2), tokens, passwords, or credentials** to the repository.
   - All secret variables must reside in your local `.env` (registered in `.gitignore`).
2. **Zero Emoji Rule on UI Components & Docs**:
   - Do not use native OS text emojis anywhere in UI components, source code, or documentation files.
   - All iconography must strictly use the **`lucide-react`** SVG vector library (`stroke-width: 2px`).
3. **Design System & Responsiveness**:
   - Adhere to the *Organic Spatial UI* design tokens and *Tri-Form Factor* responsiveness (Desktop Full-Width, Tablet 2-Column Bento, Mobile Bottom Dock) detailed in [DESIGN.md](DESIGN.md).
4. **Data Persistence Hygiene**:
   - Never commit local database files (`data/eam.db`, `data/eam.db-wal`, `data/eam.db-shm`, `data/database.json`) or snapshot archives (`data/backups/*`). These paths are strictly excluded via `.gitignore`.
5. **Runtime Compatibility**:
   - All backend code must remain compatible with Node.js 22 LTS native `node:sqlite` (`DatabaseSync`).

---

## 2. Development Workflow

### A. Local Setup
```bash
# 1. Verify Node.js 22 LTS prerequisite
node -v # Must be >= v22.0.0

# 2. Clone repository
git clone https://github.com/username/enterprise-asset-management.git
cd enterprise-asset-management

# 3. Install dependencies
npm install

# 4. Copy environment template
cp .env.example .env

# 5. Start concurrent development servers (Express port 3001 & Vite port 5173)
npm run dev
```

### B. Git Branch Naming
- `feature/feature-name` (e.g., `feature/sqlite-wal-engine`)
- `fix/issue-description` (e.g., `fix/bento-modal-telemetry`)
- `refactor/target-module` (e.g., `refactor/depreciation-calc`)
- `security/vulnerability-patch` (e.g., `security/sanitize-formula-import`)

### C. Conventional Commit Messages
- `feat: Integrate native SQLite 3 relational storage engine with WAL mode`
- `fix: Correct sequential asset code counter generation in registration modal`
- `docs: Update SQLite WAL architecture and multi-platform installation guides`
- `style: Adjust Bento card padding on tablet breakpoint`
- `refactor: Optimize dual atomic shadow sync routine`
- `test: Add scenario for multi-device setup bypassing and direct login`

---

## 3. Pre-Pull Request (PR) Checklist

Before submitting a *Pull Request*, verify all checks pass:

```bash
# 1. Verify strict TypeScript compliance
npx tsc --noEmit

# 2. Verify production bundle build
npm run build

# 3. Verify security dependencies
npm audit
```

- [ ] Clean compilation with zero TypeScript errors (`npx tsc --noEmit` and `npm run build` succeed).
- [ ] Zero high/critical dependency vulnerabilities (`npm audit`).
- [ ] Zero hardcoded credentials, secret keys, or test tokens in code.
- [ ] Zero text emojis in UI components, notifications, or markdown documentation (100% `lucide-react`).
- [ ] No `data/*.db`, `data/*.json`, or backup snapshot archives committed.
- [ ] UI tested across **Desktop, Tablet, and Mobile** viewports.
- [ ] Changes documented in [CHANGELOG.md](CHANGELOG.md).

---

## 4. Reporting Issues & Vulnerabilities

- For **General Bugs / Feature Proposals**: Open a *GitHub Issue*.
- For **Security Vulnerabilities**: **DO NOT** open a public issue. Report privately to [`decepti0n13lack@gmail.com`](mailto:decepti0n13lack@gmail.com) following [SECURITY.md](SECURITY.md).

---

## Panduan Kontribusi (Versi Bahasa Indonesia)

- **Aturan Mutlak**: Dilarang keras melakukan commit kredensial/API key rahasia ke repositori; Dilarang menggunakan teks emoji bawaan sistem operasi di antarmuka atau dokumentasi (100% menggunakan SVG `lucide-react`); Wajib mematuhi sistem desain *Organic Spatial UI* dan tata letak responsif *Tri-Form Factor*; Jangan pernah meng-commit berkas basis data lokal (`data/eam.db`, `data/database.json`) atau arsip snapshot di `data/backups/`.
- **Persyaratan Runtime**: Kode backend harus kompatibel penuh dengan runtime Node.js 22 LTS bawaan `node:sqlite`.
- **Alur Kerja**: Jalankan `npm run dev` untuk server Express (port 3001) dan Vite (port 5173), gunakan format branch deskriptif (`feature/*`, `fix/*`), ikuti konvensi pesan commit, serta pastikan `npx tsc --noEmit` dan `npm run build` lolos tanpa peringatan atau kesalahan tipe sebelum mengajukan Pull Request.
